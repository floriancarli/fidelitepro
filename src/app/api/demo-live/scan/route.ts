import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const scanKey = process.env.DEMO_LIVE_SCAN_KEY
  if (!scanKey) {
    console.error('[api/demo-live/scan] DEMO_LIVE_SCAN_KEY not configured')
    return new NextResponse('Configuration manquante', { status: 500 })
  }
  const key = req.nextUrl.searchParams.get('key')
  if (key !== scanKey) {
    return new NextResponse('Accès refusé', { status: 403 })
  }

  // Broadcast scan event via Supabase Realtime (no DB write needed)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const channel = supabase.channel('demo-live')
  await new Promise<void>((resolve) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'scan',
          payload: { ts: Date.now() },
        }).then(() => resolve())
      }
    })
  })
  await supabase.removeChannel(channel)

  return new NextResponse(
    `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scan enregistré ✓</title>
  <style>
    body { margin:0; min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#2D4A8A; font-family:system-ui,sans-serif; color:white; text-align:center; padding:2rem; }
    .icon { font-size:4rem; margin-bottom:1rem; animation: pop 0.4s ease; }
    h1 { font-size:1.5rem; font-weight:700; margin:0 0 0.5rem; }
    p { color:rgba(255,255,255,0.7); margin:0; }
    @keyframes pop { from { transform:scale(0.5); opacity:0; } to { transform:scale(1); opacity:1; } }
  </style>
</head>
<body>
  <div class="icon">✅</div>
  <h1>Point ajouté !</h1>
  <p>La démonstration a bien été mise à jour.</p>
</body>
</html>`,
    {
      headers: { 'Content-Type': 'text/html' },
    }
  )
}
