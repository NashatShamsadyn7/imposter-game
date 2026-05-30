// ═══════════════════════════════════════════════════════════
//  Supabase Edge Function: livekit-token
//  تۆکنێکی LiveKit دروست دەکات بۆ بەشداربوون لە دەنگی ژوور.
//
//  داواکاری (لە کلاینتەوە بە supabase.functions.invoke):
//    { "room": "<roomId>", "identity": "<userId>", "name": "<displayName>" }
//  وەڵام:
//    { "token": "...", "url": "wss://...livekit.cloud" }
//
//  ناردن (Deploy):
//    supabase functions deploy livekit-token
//  Secrets:
//    supabase secrets set LIVEKIT_API_KEY=... LIVEKIT_API_SECRET=... LIVEKIT_URL=wss://...livekit.cloud
// ═══════════════════════════════════════════════════════════

import { AccessToken } from 'npm:livekit-server-sdk@2.9.7'

const API_KEY = Deno.env.get('LIVEKIT_API_KEY')!
const API_SECRET = Deno.env.get('LIVEKIT_API_SECRET')!
const LIVEKIT_URL = Deno.env.get('LIVEKIT_URL')!

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    if (!API_KEY || !API_SECRET || !LIVEKIT_URL) {
      return new Response(
        JSON.stringify({ error: 'LiveKit secrets not configured' }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    const { room, identity, name } = await req.json()
    if (!room || !identity) {
      return new Response(
        JSON.stringify({ error: 'room and identity are required' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    const at = new AccessToken(API_KEY, API_SECRET, {
      identity: String(identity),
      name: name ? String(name) : undefined,
      ttl: '6h',
    })
    at.addGrant({
      roomJoin: true,
      room: String(room),
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })

    const token = await at.toJwt()

    return new Response(
      JSON.stringify({ token, url: LIVEKIT_URL }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  }
})
