import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are a friendly data analyst assistant for a hotel booking management system. You help hotel managers understand their booking data by analyzing their database.

Available tables and schema:
- bookings: id, hotel_id, guest_name, guest_email, check_in, check_out, total_amount, booking_source, status, created_at, nights, guest_count
- hotels: id, name, email, currency, user_id
- marketing_metrics: hotel_id, date, source, metric_type, value

Your task is to:
1. Understand the user's question about their booking data
2. Generate a safe, read-only SQL query to answer the question
3. Provide a clear, conversational explanation in natural language (NOT JSON)

IMPORTANT RULES:
- ONLY generate SELECT queries (no INSERT, UPDATE, DELETE, DROP, etc.)
- Always filter by hotel_id to ensure users only see their own data
- Use proper date functions and aggregations
- Return results in a format that's easy to understand
- If a question is unclear, ask for clarification

Respond ONLY with a JSON object (no markdown, no code blocks):
{
  "sql": "SELECT ... FROM bookings WHERE hotel_id = $1",
  "explanation": "I'm analyzing your bookings to find...",
  "needsHotelId": true
}

The "explanation" field must be plain conversational text, not JSON or formatted data.

If you cannot generate a safe query, respond with:
{
  "error": "I cannot answer that question because...",
  "suggestion": "Try asking..."
}`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check auth
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's hotel
    const { data: hotel } = await supabase
      .from('hotels')
      .select('id, name, currency')
      .eq('user_id', session.user.id)
      .single()

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    const { question } = await request.json()

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    // Use Claude to generate SQL query
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Hotel: ${hotel.name}\nCurrency: ${hotel.currency}\n\nQuestion: ${question}`
        }
      ]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse Claude's response (strip markdown code fences if present)
    let aiResponse
    try {
      // Remove markdown code fences if present
      const cleanedText = responseText
        .replace(/^```json\n/, '')
        .replace(/^```\n/, '')
        .replace(/\n```$/, '')
        .trim()

      aiResponse = JSON.parse(cleanedText)
    } catch (e) {
      console.error('Failed to parse AI response:', e)
      console.error('Response text:', responseText)
      return NextResponse.json({
        answer: "I had trouble understanding the data format. Please try asking your question in a different way.",
        data: null
      })
    }

    console.log('Parsed AI response:', JSON.stringify(aiResponse, null, 2))

    // If there's an error from Claude
    if (aiResponse.error) {
      return NextResponse.json({
        answer: `${aiResponse.error}\n\n${aiResponse.suggestion || ''}`,
        data: null
      })
    }

    // Validate the SQL query
    const sql = aiResponse.sql
    if (!sql || !sql.toUpperCase().startsWith('SELECT')) {
      return NextResponse.json({
        answer: "I can only answer questions that require reading data. Please ask a question about your bookings, guests, or performance metrics.",
        data: null
      })
    }

    // Execute the query safely
    console.log('Executing query:', sql)
    try {
      const { data: queryResult, error } = await supabase.rpc('execute_safe_query', {
        query_text: sql,
        hotel_id_param: hotel.id
      })

      console.log('Query result:', queryResult)
      console.log('Query error:', error)

      if (error) {
        console.error('Query execution error:', error)
        return NextResponse.json({
          answer: "I encountered an error analyzing your data. Please try rephrasing your question.\n\nError: " + error.message,
          data: null
        })
      }

      // Parse the JSON result from the function
      const data = queryResult ? (typeof queryResult === 'string' ? JSON.parse(queryResult) : queryResult) : []

      // Format the answer with the data
      let answer = aiResponse.explanation

      if (data && data.length > 0) {
        answer += `\n\n📊 Here's what I found:\n`

        // Format results based on data structure
        if (data.length === 1 && Object.keys(data[0]).length === 1) {
          // Single value result
          const key = Object.keys(data[0])[0]
          const value = data[0][key]
          answer += `**${formatValue(value, key, hotel.currency)}**`
        } else if (data.length <= 5) {
          // Few rows - show as list
          data.forEach((row: any, index: number) => {
            answer += `\n${index + 1}. `
            Object.entries(row).forEach(([key, value], i) => {
              if (i > 0) answer += ', '
              answer += `${formatKey(key)}: ${formatValue(value as any, key, hotel.currency)}`
            })
          })
        } else {
          // Many rows - show summary
          answer += `Found ${data.length} results. Here are the top 5:\n`
          data.slice(0, 5).forEach((row: any, index: number) => {
            answer += `\n${index + 1}. `
            const mainKey = Object.keys(row)[0]
            const mainValue = row[mainKey]
            answer += `${formatKey(mainKey)}: ${formatValue(mainValue, mainKey, hotel.currency)}`
          })
        }
      } else {
        answer += "\n\nNo data found for this query. This might mean there are no bookings matching your criteria yet."
      }

      return NextResponse.json({
        answer,
        data
      })

    } catch (queryError) {
      console.error('Query execution failed:', queryError)
      return NextResponse.json({
        answer: "I had trouble analyzing your data. Please try asking in a different way.",
        data: null
      })
    }

  } catch (error) {
    console.error('AI analyze error:', error)
    return NextResponse.json(
      {
        answer: "I encountered an unexpected error. Please try again.",
        data: null
      },
      { status: 500 }
    )
  }
}


function formatKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

function formatValue(value: any, key: string, currency: string): string {
  if (value === null || value === undefined) return 'N/A'

  // Format currency
  if (key.includes('amount') || key.includes('total') || key.includes('revenue')) {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Format percentages
  if (key.includes('rate') || key.includes('percent')) {
    return `${(value * 100).toFixed(1)}%`
  }

  // Format dates
  if (key.includes('date') || key.includes('_at')) {
    return new Date(value).toLocaleDateString('en-ZA')
  }

  // Format numbers
  if (typeof value === 'number') {
    return new Intl.NumberFormat('en-ZA').format(value)
  }

  return String(value)
}
