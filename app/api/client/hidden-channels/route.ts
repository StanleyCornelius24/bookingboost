import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSelectedHotel } from '@/lib/get-selected-hotel'

// Get all hidden channels for a hotel
export async function GET(request: NextRequest) {
  const supabase = await createServerClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const selectedHotelId = searchParams.get('hotelId')

    // Get the hotel
    const { hotel, error: hotelError, status } = await getSelectedHotel(selectedHotelId, 'id')

    if (hotelError || !hotel) {
      return NextResponse.json({ error: hotelError || 'Hotel not found' }, { status })
    }

    const hotelRecord = hotel as unknown as { id: string }

    // Fetch hidden channels
    const { data: hiddenChannels, error } = await supabase
      .from('hidden_channels')
      .select('channel_name')
      .eq('hotel_id', hotelRecord.id)

    if (error) {
      console.error('Error fetching hidden channels:', error)
      // If table doesn't exist yet, return empty array
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ hiddenChannels: [] })
      }
      return NextResponse.json({ error: 'Failed to fetch hidden channels' }, { status: 500 })
    }

    return NextResponse.json({ hiddenChannels: hiddenChannels?.map(hc => hc.channel_name) || [] })
  } catch (error) {
    console.error('Error in hidden channels GET:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch hidden channels' },
      { status: 500 }
    )
  }
}

// Hide a channel
export async function POST(request: NextRequest) {
  const supabase = await createServerClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { hotelId, channelName } = body

    if (!channelName) {
      return NextResponse.json({ error: 'Channel name is required' }, { status: 400 })
    }

    // Get the hotel
    const { hotel, error: hotelError, status } = await getSelectedHotel(hotelId, 'id')

    if (hotelError || !hotel) {
      return NextResponse.json({ error: hotelError || 'Hotel not found' }, { status })
    }

    const hotelRecord = hotel as unknown as { id: string }

    // Insert hidden channel (ignore if already exists)
    const { error } = await supabase
      .from('hidden_channels')
      .insert({
        hotel_id: hotelRecord.id,
        channel_name: channelName
      })
      .select()

    if (error) {
      // If it's a unique constraint violation, it's already hidden - that's fine
      if (error.code === '23505') {
        return NextResponse.json({ success: true, message: 'Channel already hidden' })
      }
      console.error('Error hiding channel:', error)
      return NextResponse.json({ error: 'Failed to hide channel' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in hidden channels POST:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to hide channel' },
      { status: 500 }
    )
  }
}

// Unhide a channel
export async function DELETE(request: NextRequest) {
  const supabase = await createServerClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const selectedHotelId = searchParams.get('hotelId')
    const channelName = searchParams.get('channelName')

    if (!channelName) {
      return NextResponse.json({ error: 'Channel name is required' }, { status: 400 })
    }

    // Get the hotel
    const { hotel, error: hotelError, status } = await getSelectedHotel(selectedHotelId, 'id')

    if (hotelError || !hotel) {
      return NextResponse.json({ error: hotelError || 'Hotel not found' }, { status })
    }

    const hotelRecord = hotel as unknown as { id: string }

    // Delete hidden channel
    const { error } = await supabase
      .from('hidden_channels')
      .delete()
      .eq('hotel_id', hotelRecord.id)
      .eq('channel_name', channelName)

    if (error) {
      console.error('Error unhiding channel:', error)
      return NextResponse.json({ error: 'Failed to unhide channel' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in hidden channels DELETE:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to unhide channel' },
      { status: 500 }
    )
  }
}
