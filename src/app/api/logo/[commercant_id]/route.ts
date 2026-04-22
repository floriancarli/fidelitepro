import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ commercant_id: string }> }
) {
  const { commercant_id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data } = await supabase
    .from('commercants')
    .select('logo_url')
    .eq('id', commercant_id)
    .single()

  if (!data?.logo_url) {
    return new NextResponse(null, { status: 404 })
  }

  const upstream = await fetch(data.logo_url)
  if (!upstream.ok) {
    return new NextResponse(null, { status: 502 })
  }

  const contentType = upstream.headers.get('content-type') ?? 'image/png'
  const body = await upstream.arrayBuffer()

  return new NextResponse(body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  })
}
