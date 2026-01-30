import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or supaadmin
    const { data: hotel } = await supabase
      .from('hotels')
      .select('user_role')
      .eq('user_id', session.user.id)
      .single()

    if (!hotel || (hotel.user_role !== 'admin' && hotel.user_role !== 'supaadmin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const adminSupabase = createAdminClient()

    // Get all hotels with website URLs
    const { data: hotels, error: hotelsError } = await adminSupabase
      .from('hotels')
      .select('id, name, website')
      .not('website', 'is', null)

    if (hotelsError) {
      console.error('Error fetching hotels:', hotelsError)
      return NextResponse.json({ error: 'Failed to fetch hotels' }, { status: 500 })
    }

    const results = {
      success: [] as string[],
      errors: [] as string[],
      skipped: [] as string[]
    }

    // Process each hotel
    for (const hotel of hotels || []) {
      if (!hotel.website) {
        results.skipped.push(`${hotel.name}: No website URL configured`)
        continue
      }

      try {
        // Trigger SEO audit by calling the audit endpoint
        let targetUrl = hotel.website
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

        // Run basic SEO checks (simplified version without PageSpeed for bulk processing)

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
            },
            signal: AbortSignal.timeout(10000) // 10 second timeout
          })
          homepageHtml = await response.text()
        } catch (error) {
          throw new Error('Failed to fetch website')
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

        // 6. Check Mobile-Friendly Meta Tag
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

        // Calculate overall score
        const checks = Object.values(auditResults.checks)
        const passCount = checks.filter((check: any) => check.status === 'pass').length
        const totalChecks = checks.filter((check: any) => check.status !== 'info').length
        auditResults.overallScore = Math.round((passCount / totalChecks) * 100)

        // Save audit results to database
        const { error: saveError } = await adminSupabase
          .from('seo_audits')
          .insert({
            hotel_id: hotel.id,
            url: targetUrl,
            timestamp: auditResults.timestamp,
            overall_score: auditResults.overallScore,
            checks: auditResults.checks
          })

        if (saveError) {
          throw new Error(`Database error: ${saveError.message}`)
        }

        results.success.push(`${hotel.name} (Score: ${auditResults.overallScore}%)`)
      } catch (error) {
        results.errors.push(`${hotel.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Bulk SEO audit error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
