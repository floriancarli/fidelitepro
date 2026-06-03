import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:noreply@getorlyo.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
}

type PushPayload = {
  title: string
  body: string
  icon?: string
  url?: string
  tag?: string
}

export async function sendPushToClient(clientEmail: string, payload: PushPayload) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return

  const supabase = createAdminClient()
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, keys')
    .eq('client_email', clientEmail)

  if (!subs || subs.length === 0) return

  await Promise.allSettled(
    subs.map((sub) =>
      webpush
        .sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys as { p256dh: string; auth: string },
          },
          JSON.stringify(payload),
        )
        .catch(async (err: { statusCode?: number }) => {
          // Abonnement expiré ou révoqué → nettoyer
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          }
        }),
    ),
  )
}
