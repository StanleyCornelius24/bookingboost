import { NextRequest, NextResponse } from 'next/server'

/**
 * Debug endpoint to see what Gravity Forms is sending
 *
 * POST /api/integrations/gravity-forms/webhook-debug
 */
export async function POST(request: NextRequest) {
  try {
    const headers = Object.fromEntries(request.headers.entries())
    const body = await request.text()

    console.log('=== GRAVITY FORMS DEBUG ===')
    console.log('Headers:', JSON.stringify(headers, null, 2))
    console.log('Body:', body)
    console.log('=========================')

    return NextResponse.json({
      success: true,
      message: 'Logged successfully',
      receivedHeaders: headers,
      receivedBody: body,
      bodyLength: body.length
    })
  } catch (error: any) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Debug endpoint active. Use POST to test.',
    debugUrl: '/api/integrations/gravity-forms/webhook-debug'
  })
}
