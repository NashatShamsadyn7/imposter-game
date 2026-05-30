// ═══════════════════════════════════════════════════════════
//  Supabase Edge Function: send-push
//  ئاگادارکردنەوەی Web Push دەنێرێت کاتێک نامەی تایبەت/داواکاری دروست دەبێت.
//
//  نموونەی داواکاری (لە Database Webhook / Trigger):
//    { "table": "direct_messages", "record": { ...row... } }
//
//  ناردن (Deploy):
//    supabase functions deploy send-push --no-verify-jwt
//  Secrets:
//    supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@mail.com
// ═══════════════════════════════════════════════════════════

import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@example.com'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

// دروستکردنی ناوەڕۆکی ئاگادارکردنەوە بەپێی جۆری ڕیکۆرد
async function buildPayload(table: string, record: Record<string, unknown>) {
  if (table === 'direct_messages') {
    const senderId = record.sender_id as string
    const { data: sender } = await admin
      .from('profiles')
      .select('display_name')
      .eq('id', senderId)
      .maybeSingle()
    const name = sender?.display_name || 'یاریزانێک'
    const isInvite = record.kind === 'invite'
    return {
      targetUserId: record.recipient_id as string,
      title: isInvite ? 'بانگهێشت بۆ ژوور 🎮' : name,
      body: isInvite ? `${name} بانگهێشتی کردیت — کۆد: ${record.content}` : (record.content as string),
      tag: isInvite ? 'invite' : 'dm',
    }
  }
  if (table === 'friendships' && record.status === 'pending') {
    const requesterId = record.requester_id as string
    const { data: requester } = await admin
      .from('profiles')
      .select('display_name')
      .eq('id', requesterId)
      .maybeSingle()
    return {
      targetUserId: record.addressee_id as string,
      title: 'داواکاری هاوڕێیەتی 👤',
      body: `${requester?.display_name || 'یاریزانێک'} دەیەوێت ببێتە هاوڕێت`,
      tag: 'friend',
    }
  }
  return null
}

Deno.serve(async (req) => {
  try {
    const { table, record } = await req.json()
    const payload = await buildPayload(table, record || {})
    if (!payload) return new Response('skip', { status: 200 })

    // هێنانی هەموو ئەندامبوونەکانی وەرگر
    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', payload.targetUserId)

    const notif = JSON.stringify({
      title: payload.title,
      body: payload.body,
      tag: payload.tag,
      url: '/',
    })

    await Promise.all(
      (subs || []).map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            notif
          )
        } catch (err) {
          // ئەندامبوونی بەسەرچوو (410/404) بسڕەوە
          const code = (err as { statusCode?: number }).statusCode
          if (code === 410 || code === 404) {
            await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
          }
        }
      })
    )

    return new Response('ok', { status: 200 })
  } catch (e) {
    return new Response(`error: ${(e as Error).message}`, { status: 500 })
  }
})
