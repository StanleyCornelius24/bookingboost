import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSelectedHotel } from '@/lib/get-selected-hotel'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const websiteUrl = searchParams.get('url')
    const forceRefresh = searchParams.get('refresh') === 'true'
    const selectedHotelId = searchParams.get('hotelId')

    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the hotel (selected or fallback to primary)
    const { hotel, error: hotelError, status } = await getSelectedHotel(selectedHotelId, 'id, website')

    if (hotelError || !hotel) {
      return NextResponse.json({ error: hotelError || 'Hotel not found' }, { status })
    }

    const hotelRecord = hotel as unknown as { id: string; website?: string }

    // Get hotel website URL if not provided
    let targetUrl = websiteUrl
    if (!targetUrl) {
      if (!hotelRecord?.website) {
        return NextResponse.json({ error: 'Website URL not configured' }, { status: 400 })
      }

      targetUrl = hotelRecord.website
    }

    // Check if we have a recent cached audit (and not forcing refresh)
    if (!forceRefresh) {
      const { data: cachedAudit } = await supabase
        .from('seo_audits')
        .select('*')
        .eq('hotel_id', hotelRecord.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cachedAudit) {
        console.log('Returning cached SEO audit from:', cachedAudit.timestamp)
        return NextResponse.json({
          url: cachedAudit.url,
          timestamp: cachedAudit.timestamp,
          overallScore: cachedAudit.overall_score,
          checks: cachedAudit.checks,
          fromCache: true
        })
      }
    }

    // This should never happen due to checks above, but TypeScript needs explicit null check
    if (!targetUrl) {
      return NextResponse.json({ error: 'Website URL not found' }, { status: 400 })
    }

    // Ensure URL has protocol
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`
    }

    const urlObj = new URL(targetUrl)
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`

    const auditResults: any = {
      url: targetUrl,
      timestamp: new Date().toISOString(),
      checks: {}
    }

    // 1. Check HTTPS
    auditResults.checks.https = {
      status: targetUrl.startsWith('https://') ? 'pass' : 'fail',
      message: targetUrl.startsWith('https://') ? 'Site uses HTTPS' : 'Site does not use HTTPS'
    }

    // 2. Fetch homepage HTML
    let homepageHtml = ''
    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BookingFocus-SEO-Checker/1.0)'
        }
      })
      homepageHtml = await response.text()
    } catch (error) {
      console.error('Failed to fetch homepage:', error)
    }

    // 3. Check Title Tag
    const titleMatch = homepageHtml.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : null
    auditResults.checks.title = {
      status: title ? 'pass' : 'fail',
      value: title,
      length: title?.length || 0,
      message: title
        ? (title.length >= 30 && title.length <= 60
          ? 'Title length is optimal (30-60 characters)'
          : title.length < 30
            ? 'Title is too short (recommended 30-60 characters)'
            : 'Title is too long (recommended 30-60 characters)')
        : 'No title tag found'
    }

    // 4. Check Meta Description
    const metaDescMatch = homepageHtml.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
    const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : null
    auditResults.checks.metaDescription = {
      status: metaDescription ? 'pass' : 'fail',
      value: metaDescription,
      length: metaDescription?.length || 0,
      message: metaDescription
        ? (metaDescription.length >= 120 && metaDescription.length <= 160
          ? 'Meta description length is optimal (120-160 characters)'
          : metaDescription.length < 120
            ? 'Meta description is too short (recommended 120-160 characters)'
            : 'Meta description is too long (recommended 120-160 characters)')
        : 'No meta description found'
    }

    // 5. Check H1 Tag
    const h1Match = homepageHtml.match(/<h1[^>]*>([^<]+)<\/h1>/i)
    const h1Count = (homepageHtml.match(/<h1[^>]*>/gi) || []).length
    auditResults.checks.h1 = {
      status: h1Count === 1 ? 'pass' : h1Count > 1 ? 'warning' : 'fail',
      value: h1Match ? h1Match[1].trim() : null,
      count: h1Count,
      message: h1Count === 1
        ? 'Page has exactly one H1 tag'
        : h1Count > 1
          ? `Page has ${h1Count} H1 tags (recommended: 1)`
          : 'No H1 tag found'
    }

    // 6. Check Canonical URL
    const canonicalMatch = homepageHtml.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)
    const canonical = canonicalMatch ? canonicalMatch[1] : null
    auditResults.checks.canonical = {
      status: canonical ? 'pass' : 'warning',
      value: canonical,
      message: canonical ? 'Canonical URL is set' : 'No canonical URL found'
    }

    // 7. Check Meta Robots
    const metaRobotsMatch = homepageHtml.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i)
    const metaRobots = metaRobotsMatch ? metaRobotsMatch[1].toLowerCase() : null
    const isNoIndex = metaRobots?.includes('noindex')
    auditResults.checks.metaRobots = {
      status: isNoIndex ? 'fail' : 'pass',
      value: metaRobots || 'Not set (allows indexing)',
      message: isNoIndex
        ? 'Page is set to NOINDEX - will not be indexed by search engines'
        : 'Page allows indexing'
    }

    // 8. Check Open Graph Tags
    const ogTitleMatch = homepageHtml.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)
    const ogDescMatch = homepageHtml.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)
    const ogImageMatch = homepageHtml.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
    const hasOgTags = !!(ogTitleMatch || ogDescMatch || ogImageMatch)
    auditResults.checks.openGraph = {
      status: hasOgTags ? 'pass' : 'warning',
      ogTitle: ogTitleMatch ? ogTitleMatch[1] : null,
      ogDescription: ogDescMatch ? ogDescMatch[1] : null,
      ogImage: ogImageMatch ? ogImageMatch[1] : null,
      message: hasOgTags ? 'Open Graph tags found' : 'No Open Graph tags found (recommended for social sharing)'
    }

    // 9. Check Favicon
    let faviconExists = false
    const faviconUrlsToCheck = [
      `${baseUrl}/favicon.ico`,
      `${baseUrl}/favicon.png`,
      `${baseUrl}/favicon.svg`
    ]

    // Also check for favicon link in HTML
    const faviconLinkMatch = homepageHtml.match(/<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i)
    if (faviconLinkMatch) {
      const faviconHref = faviconLinkMatch[1]
      const faviconUrl = faviconHref.startsWith('http') ? faviconHref : `${baseUrl}${faviconHref.startsWith('/') ? '' : '/'}${faviconHref}`
      faviconUrlsToCheck.unshift(faviconUrl)
    }

    for (const faviconUrl of faviconUrlsToCheck) {
      try {
        const response = await fetch(faviconUrl, { method: 'HEAD' })
        if (response.ok) {
          faviconExists = true
          auditResults.checks.favicon = {
            status: 'pass',
            url: faviconUrl,
            message: 'Favicon found'
          }
          break
        }
      } catch (error) {
        // Continue checking other URLs
      }
    }

    if (!faviconExists) {
      auditResults.checks.favicon = {
        status: 'warning',
        url: null,
        message: 'No favicon found'
      }
    }

    // 10. Check robots.txt
    try {
      const robotsResponse = await fetch(`${baseUrl}/robots.txt`)
      if (robotsResponse.ok) {
        const robotsContent = await robotsResponse.text()
        auditResults.checks.robotsTxt = {
          status: 'pass',
          exists: true,
          content: robotsContent,
          message: 'robots.txt file found'
        }
      } else {
        auditResults.checks.robotsTxt = {
          status: 'warning',
          exists: false,
          message: 'robots.txt file not found'
        }
      }
    } catch (error) {
      auditResults.checks.robotsTxt = {
        status: 'warning',
        exists: false,
        message: 'robots.txt file not found'
      }
    }

    // 11. Check XML Sitemap
    const sitemapUrls = [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap_index.xml`,
      `${baseUrl}/sitemap1.xml`
    ]

    let sitemapFound = false
    for (const sitemapUrl of sitemapUrls) {
      try {
        const sitemapResponse = await fetch(sitemapUrl)
        if (sitemapResponse.ok) {
          const sitemapContent = await sitemapResponse.text()
          const isValidXml = sitemapContent.includes('<?xml') &&
                            (sitemapContent.includes('<urlset') || sitemapContent.includes('<sitemapindex'))

          if (isValidXml) {
            sitemapFound = true
            auditResults.checks.xmlSitemap = {
              status: 'pass',
              exists: true,
              url: sitemapUrl,
              message: 'XML Sitemap found'
            }
            break
          }
        }
      } catch (error) {
        // Continue checking other URLs
      }
    }

    if (!sitemapFound) {
      auditResults.checks.xmlSitemap = {
        status: 'warning',
        exists: false,
        message: 'XML Sitemap not found'
      }
    }

    // 12. Check Structured Data (Schema.org)
    const hasJsonLd = homepageHtml.includes('application/ld+json')
    const hasMicrodata = homepageHtml.includes('itemscope') || homepageHtml.includes('itemtype')
    const hasStructuredData = hasJsonLd || hasMicrodata

    let structuredDataType = null
    if (hasJsonLd) {
      const jsonLdMatch = homepageHtml.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/i)
      if (jsonLdMatch) {
        try {
          const jsonLd = JSON.parse(jsonLdMatch[1])
          structuredDataType = jsonLd['@type'] || 'Unknown'
        } catch (e) {
          structuredDataType = 'Invalid JSON-LD'
        }
      }
    }

    auditResults.checks.structuredData = {
      status: hasStructuredData ? 'pass' : 'warning',
      hasJsonLd,
      hasMicrodata,
      type: structuredDataType,
      message: hasStructuredData
        ? `Structured data found${structuredDataType ? ` (${structuredDataType})` : ''}`
        : 'No structured data found (recommended for rich snippets)'
    }

    // 13. Check Mobile-Friendly Meta Tag
    const viewportMatch = homepageHtml.match(/<meta\s+name=["']viewport["']\s+content=["']([^"']+)["']/i)
    const viewport = viewportMatch ? viewportMatch[1] : null
    const isMobileFriendly = viewport?.includes('width=device-width')
    auditResults.checks.mobileFriendly = {
      status: isMobileFriendly ? 'pass' : 'fail',
      viewport: viewport,
      message: isMobileFriendly
        ? 'Mobile-friendly viewport tag found'
        : 'Mobile-friendly viewport tag not found or incorrect'
    }

    // 14. Get PageSpeed Insights (if API key is available)
    console.log('PageSpeed API Key present:', !!process.env.GOOGLE_PAGESPEED_API_KEY)
    if (process.env.GOOGLE_PAGESPEED_API_KEY) {
      console.log('Fetching PageSpeed data for:', targetUrl)
      try {
        // Mobile score
        const mobileResponse = await fetch(
          `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=mobile&key=${process.env.GOOGLE_PAGESPEED_API_KEY}`
        )
        console.log('Mobile PageSpeed response status:', mobileResponse.status)
        const mobileData = await mobileResponse.json()
        console.log('Mobile PageSpeed data received:', !!mobileData.lighthouseResult)

        // Desktop score
        const desktopResponse = await fetch(
          `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=desktop&key=${process.env.GOOGLE_PAGESPEED_API_KEY}`
        )
        console.log('Desktop PageSpeed response status:', desktopResponse.status)
        const desktopData = await desktopResponse.json()
        console.log('Desktop PageSpeed data received:', !!desktopData.lighthouseResult)

        if (mobileData.error || desktopData.error) {
          console.error('PageSpeed API returned error:', mobileData.error || desktopData.error)
          throw new Error('PageSpeed API returned an error')
        }

        auditResults.checks.pageSpeed = {
          status: 'pass',
          mobile: {
            score: Math.round((mobileData.lighthouseResult?.categories?.performance?.score || 0) * 100),
            lcp: mobileData.lighthouseResult?.audits?.['largest-contentful-paint']?.displayValue,
            fid: mobileData.lighthouseResult?.audits?.['max-potential-fid']?.displayValue,
            cls: mobileData.lighthouseResult?.audits?.['cumulative-layout-shift']?.displayValue
          },
          desktop: {
            score: Math.round((desktopData.lighthouseResult?.categories?.performance?.score || 0) * 100),
            lcp: desktopData.lighthouseResult?.audits?.['largest-contentful-paint']?.displayValue,
            fid: desktopData.lighthouseResult?.audits?.['max-potential-fid']?.displayValue,
            cls: desktopData.lighthouseResult?.audits?.['cumulative-layout-shift']?.displayValue
          },
          message: 'PageSpeed data retrieved'
        }
      } catch (error) {
        console.error('PageSpeed API error:', error)
        auditResults.checks.pageSpeed = {
          status: 'error',
          message: 'Failed to retrieve PageSpeed data'
        }
      }
    } else {
      auditResults.checks.pageSpeed = {
        status: 'info',
        message: 'PageSpeed API key not configured. Add GOOGLE_PAGESPEED_API_KEY to environment variables.'
      }
    }

    // Calculate overall score
    const checks = Object.values(auditResults.checks)
    const passCount = checks.filter((check: any) => check.status === 'pass').length
    const totalChecks = checks.filter((check: any) => check.status !== 'info').length
    auditResults.overallScore = Math.round((passCount / totalChecks) * 100)

    // Save audit results to database
    const { error: saveError } = await supabase
      .from('seo_audits')
      .insert({
        hotel_id: hotelRecord.id,
        url: targetUrl,
        timestamp: auditResults.timestamp,
        overall_score: auditResults.overallScore,
        checks: auditResults.checks
      })

    if (saveError) {
      console.error('Failed to save SEO audit to database:', saveError)
      // Don't fail the request, just log the error
    } else {
      console.log('SEO audit saved to database for hotel:', hotelRecord.id)
    }

    return NextResponse.json(auditResults)

  } catch (error) {
    console.error('SEO Audit API error:', error)
    return NextResponse.json(
      { error: 'Failed to perform SEO audit' },
      { status: 500 }
    )
  }
}
