import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'

// GET - List all API keys for the user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for impersonation
    const cookieStore = await cookies()
    const impersonateUserId = cookieStore.get('impersonate_user_id')?.value
    const userId = impersonateUserId || session.user.id

    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('id, name, key, created_at, last_used_at, expires_at, is_active')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching API keys:', error)
      return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
    }

    // Mask the API keys (show only first 8 and last 4 characters)
    const maskedKeys = apiKeys?.map(key => ({
      ...key,
      key: key.key.length > 12
        ? `${key.key.substring(0, 8)}...${key.key.substring(key.key.length - 4)}`
        : key.key
    }))

    return NextResponse.json({ apiKeys: maskedKeys })

  } catch (error) {
    console.error('API Keys GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new API key
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for impersonation
    const cookieStore = await cookies()
    const impersonateUserId = cookieStore.get('impersonate_user_id')?.value
    const userId = impersonateUserId || session.user.id

    const body = await request.json()
    const { name, expiresInDays } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'API key name is required' }, { status: 400 })
    }

    // Generate a secure random API key
    const apiKey = `bbk_${randomBytes(32).toString('hex')}`

    // Calculate expiration date if provided
    let expiresAt = null
    if (expiresInDays && expiresInDays > 0) {
      const expireDate = new Date()
      expireDate.setDate(expireDate.getDate() + expiresInDays)
      expiresAt = expireDate.toISOString()
    }

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name: name.trim(),
        key: apiKey,
        expires_at: expiresAt,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating API key:', error)
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      apiKey: data,
      message: 'API key created successfully. Make sure to copy it now - you won\'t be able to see it again!'
    })

  } catch (error) {
    console.error('API Keys POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Revoke an API key
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for impersonation
    const cookieStore = await cookies()
    const impersonateUserId = cookieStore.get('impersonate_user_id')?.value
    const userId = impersonateUserId || session.user.id

    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get('id')

    if (!keyId) {
      return NextResponse.json({ error: 'API key ID is required' }, { status: 400 })
    }

    // Verify the key belongs to the user before deleting
    const { data: existingKey } = await supabase
      .from('api_keys')
      .select('id')
      .eq('id', keyId)
      .eq('user_id', userId)
      .single()

    if (!existingKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting API key:', error)
      return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully'
    })

  } catch (error) {
    console.error('API Keys DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update API key (toggle active status)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for impersonation
    const cookieStore = await cookies()
    const impersonateUserId = cookieStore.get('impersonate_user_id')?.value
    const userId = impersonateUserId || session.user.id

    const body = await request.json()
    const { id, is_active } = body

    if (!id) {
      return NextResponse.json({ error: 'API key ID is required' }, { status: 400 })
    }

    // Verify the key belongs to the user before updating
    const { data: existingKey } = await supabase
      .from('api_keys')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (!existingKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('api_keys')
      .update({ is_active })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating API key:', error)
      return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `API key ${is_active ? 'activated' : 'deactivated'} successfully`
    })

  } catch (error) {
    console.error('API Keys PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
