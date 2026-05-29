// ═══════════════════════════════════════════════════════════
//  Supabase — چوونەژوورەوە + ژوور + چات + دەنگ + ڕاستەوخۆ
// ═══════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

export const supabase = isSupabaseEnabled
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null

function need() {
  if (!supabase) throw new Error('Supabase ڕێکنەخراوە — کلیلەکان لە .env دابنێ')
}

// ═══════════════ چوونەژوورەوە ═══════════════
export async function signInWithGoogle() {
  need()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
  if (error) throw error
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

// ═══════════════ پرۆفایل ═══════════════
export async function ensureProfile(user) {
  need()
  const meta = user.user_metadata || {}
  const display_name = meta.full_name || meta.name || user.email?.split('@')[0] || 'یاریزان'
  const avatar_url = meta.avatar_url || meta.picture || null

  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (!existing) {
    const { data } = await supabase
      .from('profiles')
      .insert({ id: user.id, display_name, avatar_url })
      .select()
      .single()
    return data
  }
  // نوێکردنەوەی ناو/وێنە ئەگەر گۆڕابن
  if (existing.avatar_url !== avatar_url || existing.display_name !== display_name) {
    await supabase.from('profiles').update({ display_name, avatar_url }).eq('id', user.id)
  }
  return { ...existing, display_name, avatar_url }
}

export async function getProfile(userId) {
  need()
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  return data
}

export async function getLeaderboard(limit = 10) {
  if (!supabase) return []
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, total_points, wins, games_played')
    .order('total_points', { ascending: false })
    .limit(limit)
  return data || []
}

// ═══════════════ ژوور ═══════════════
function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function createRoom(user, profile, settings) {
  need()
  let code
  let room
  // هەوڵ بدە کۆدێکی بێهاوتا بدۆزیتەوە
  for (let i = 0; i < 5; i++) {
    code = genCode()
    const { data, error } = await supabase
      .from('rooms')
      .insert({
        code,
        host_id: user.id,
        status: 'lobby',
        category_id: settings?.categoryId || 'kurdish',
        impostor_count: settings?.impostorCount || 1,
        discussion_seconds: settings?.discussionSeconds || 120,
        multiplier: settings?.multiplier || 1,
      })
      .select()
      .single()
    if (!error) {
      room = data
      break
    }
  }
  if (!room) throw new Error('نەتوانرا ژوور دروست بکرێت')
  await joinRoomRow(room.id, user, profile, true)
  return room
}

export async function findRoomByCode(code) {
  need()
  const { data } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .maybeSingle()
  return data
}

async function joinRoomRow(roomId, user, profile, isHost) {
  const { count } = await supabase
    .from('room_players')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', roomId)
  await supabase.from('room_players').upsert(
    {
      room_id: roomId,
      user_id: user.id,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      is_host: isHost,
      order_index: count || 0,
      role: null,
      ejected: false,
      points_this_game: 0,
    },
    { onConflict: 'room_id,user_id' }
  )
}

export async function joinRoom(code, user, profile) {
  const room = await findRoomByCode(code)
  if (!room) throw new Error('ژوور نەدۆزرایەوە')
  await joinRoomRow(room.id, user, profile, room.host_id === user.id)
  return room
}

export async function leaveRoom(roomId, userId) {
  if (!supabase) return
  await supabase.from('room_players').delete().eq('room_id', roomId).eq('user_id', userId)
}

export async function updateRoom(roomId, patch) {
  need()
  await supabase.from('rooms').update(patch).eq('id', roomId)
}

export async function fetchRoom(roomId) {
  need()
  const { data } = await supabase.from('rooms').select('*').eq('id', roomId).maybeSingle()
  return data
}

export async function fetchPlayers(roomId) {
  need()
  const { data } = await supabase
    .from('room_players')
    .select('*')
    .eq('room_id', roomId)
    .order('order_index', { ascending: true })
  return data || []
}

export async function updatePlayer(roomId, userId, patch) {
  need()
  await supabase.from('room_players').update(patch).eq('room_id', roomId).eq('user_id', userId)
}

export async function reorderPlayers(orderedIds, roomId) {
  need()
  await Promise.all(
    orderedIds.map((uid, idx) =>
      supabase
        .from('room_players')
        .update({ order_index: idx })
        .eq('room_id', roomId)
        .eq('user_id', uid)
    )
  )
}

// ═══════════════ چات ═══════════════
export async function sendMessage(roomId, user, profile, content, kind = 'chat') {
  need()
  await supabase.from('messages').insert({
    room_id: roomId,
    user_id: user.id,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    content,
    kind,
  })
}

export async function fetchMessages(roomId) {
  need()
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .limit(200)
  return data || []
}

// ═══════════════ دەنگ ═══════════════
export async function clearVotes(roomId) {
  need()
  await supabase.from('votes').delete().eq('room_id', roomId)
}

export async function castVotes(roomId, voterId, targetIds) {
  need()
  // یەکەم سڕینەوەی دەنگەکانی پێشووی هەمان دەنگدەر
  await supabase.from('votes').delete().eq('room_id', roomId).eq('voter_id', voterId)
  if (!targetIds.length) return
  await supabase.from('votes').insert(
    targetIds.map((t) => ({ room_id: roomId, voter_id: voterId, target_id: t }))
  )
}

export async function fetchVotes(roomId) {
  need()
  const { data } = await supabase.from('votes').select('*').eq('room_id', roomId)
  return data || []
}

// زیادکردنی خاڵ بۆ پرۆفایل (لە کۆتایی یاری)
export async function addPoints(userId, points, won) {
  need()
  await supabase.rpc('add_points', { uid: userId, pts: points, won })
}

// ═══════════════ ڕاستەوخۆ (Realtime) ═══════════════
// گوێگرتن لە گۆڕانکاری ژوور + یاریزانان + نامە + دەنگ بە یەک کەناڵ
export function subscribeRoom(roomId, handlers) {
  need()
  const channel = supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
      (payload) => handlers.onRoom?.(payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
      (payload) => handlers.onPlayers?.(payload)
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
      (payload) => handlers.onMessage?.(payload.new)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` },
      (payload) => handlers.onVote?.(payload)
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}
