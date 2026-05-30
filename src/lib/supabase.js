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
    const { data, error } = await supabase
      .from('profiles')
      .insert({ id: user.id, display_name, avatar_url })
      .select()
      .single()
    if (error) throw error
    return data
  }

  // ئەگەر بەکارهێنەر پرۆفایلەکەی خۆی دەستکاری کردبێت، دەستکاری گووگڵ ناگۆڕینەوە
  const patch = {}
  if (!existing.custom_profile) {
    if (existing.display_name !== display_name) patch.display_name = display_name
    if (existing.avatar_url !== avatar_url) patch.avatar_url = avatar_url
  }
  // دڵنیابوون لە بوونی کۆدی هاوڕێیەتی (یەدەگ ئەگەر default کارینەکرد)
  if (!existing.friend_code) patch.friend_code = genCode() + genCode().slice(0, 1)
  if (Object.keys(patch).length) {
    await supabase.from('profiles').update(patch).eq('id', user.id)
  }
  return { ...existing, ...patch }
}

// نوێکردنەوەی پرۆفایلی خۆم (ناو/وێنە) — custom_profile چالاک دەکات
export async function updateMyProfile(userId, patch) {
  need()
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...patch, custom_profile: true })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

// بارکردنی وێنەی پرۆفایل بۆ Storage و گەڕاندنەوەی URL ـی گشتی
export async function uploadAvatar(userId, file) {
  need()
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase()
  const path = `${userId}/avatar-${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, cacheControl: '3600' })
  if (error) throw error
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  // ?v= بۆ بەزاندنی کاشی وێنەگر/CDN تاکو وێنە نوێیەکە یەکسەر دەربکەوێت
  return `${data.publicUrl}?v=${Date.now()}`
}

// نوێکردنەوەی کاتی دواین بینین (حزووری ئۆنلاین)
export async function touchLastSeen() {
  if (!supabase) return
  await supabase.rpc('touch_last_seen')
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

async function joinRoomRow(roomId, user, profile, isHost, isSpectator = false) {
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
      can_speak: isHost,        // خانەخوێ ڕاستەوخۆ دەتوانێت قسە بکات
      mic_requested: false,
      is_spectator: isSpectator, // بینەر: یاری ناکات، تەنها سەیر دەکات
    },
    { onConflict: 'room_id,user_id' }
  )
}

export async function joinRoom(code, user, profile) {
  const room = await findRoomByCode(code)
  if (!room) throw new Error('ژوور نەدۆزرایەوە')
  // ئەگەر یاری دەستی پێکردبێت و ئەم کەسە خانەخوێ نەبێت → وەک بینەر دەچێتە ژوورەوە
  const isSpectator = room.status !== 'lobby' && room.host_id !== user.id
  await joinRoomRow(room.id, user, profile, room.host_id === user.id, isSpectator)
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

// تۆمارکردنی ئەنجامی یاری (خاڵ + مێژوو) — جێگرەوەی addPoints
// ئەگەر record_result نەبوو (migration جێبەجێ نەکراوە)، دەگەڕێتەوە سەر add_points
export async function recordResult(userId, points, won, role, categoryId, word) {
  need()
  const { error } = await supabase.rpc('record_result', {
    uid: userId,
    pts: points,
    won,
    p_role: role || 'crew',
    p_category: categoryId || null,
    p_word: word || null,
  })
  if (error) {
    // یەدەگ: تەنها خاڵ زیاد بکە (بەبێ مێژوو)
    await supabase.rpc('add_points', { uid: userId, pts: points, won })
  }
}

// ═══════════════ مێژوو + مۆسم + پاداشتی ڕۆژانە ═══════════════
// مێژووی دواین یارییەکانی بەکارهێنەرێک
export async function fetchMatchHistory(userId, limit = 10) {
  need()
  if (!userId) return []
  const { data } = await supabase
    .from('game_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data || []
}

// ژمارەی یارییەکانی ئەمڕۆ (بۆ مەرجی ڕۆژانە)
export async function todayGameCount(userId) {
  need()
  if (!userId) return 0
  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)
  const { count } = await supabase
    .from('game_results')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', start.toISOString())
  return count || 0
}

// وەرگرتنی پاداشتی چوونەژوورەوەی ڕۆژانە
export async function claimDaily() {
  need()
  const { data, error } = await supabase.rpc('claim_daily')
  if (error) throw error
  return data
}

// وەرگرتنی پاداشتی مەرجی ڕۆژانە
export async function claimDailyQuest() {
  need()
  const { data, error } = await supabase.rpc('claim_daily_quest')
  if (error) throw error
  return data
}

// لیدەربۆردی مۆسم (هەفتانە/مانگانە) — since: ISO string
export async function getSeasonLeaderboard(since, limit = 20) {
  if (!supabase) return []
  const { data } = await supabase.rpc('season_leaderboard', { since, lim: limit })
  return data || []
}

// ═══════════════ بلۆککردن ═══════════════
export async function blockUser(blockerId, blockedId) {
  need()
  await supabase.from('blocks').upsert(
    { blocker_id: blockerId, blocked_id: blockedId },
    { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true }
  )
}

export async function unblockUser(blockerId, blockedId) {
  need()
  await supabase.from('blocks').delete().eq('blocker_id', blockerId).eq('blocked_id', blockedId)
}

// idـی هەموو ئەو کەسانەی بلۆکم کردوون
export async function fetchBlockedIds(userId) {
  need()
  if (!userId) return []
  const { data } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', userId)
  return (data || []).map((b) => b.blocked_id)
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

// ═══════════════ کاردانەوەی خێرا (ئیمۆجی هەڵفڕیو) ═══════════════
// بەکارهێنانی broadcast ـی ڕاستەوخۆ — ئیمۆجییەکان پاشەکەوت ناکرێن (ephemeral)
export function joinReactionChannel(roomId, onReaction) {
  if (!supabase || !roomId) return { send: () => {}, close: () => {} }
  const channel = supabase.channel(`reactions:${roomId}`, {
    config: { broadcast: { self: true } },
  })
  channel
    .on('broadcast', { event: 'reaction' }, ({ payload }) => onReaction?.(payload))
    .subscribe()
  return {
    send: (emoji, name) =>
      channel.send({
        type: 'broadcast',
        event: 'reaction',
        payload: { emoji, name, id: Math.random().toString(36).slice(2) },
      }),
    close: () => supabase.removeChannel(channel),
  }
}

// ═══════════════ هاوڕێیان ═══════════════
// دۆزینەوەی پرۆفایل بە کۆدی هاوڕێیەتی
export async function findProfileByCode(code) {
  need()
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, friend_code, total_points, last_seen')
    .eq('friend_code', code.trim().toUpperCase())
    .maybeSingle()
  return data
}

// ناردنی داواکاری هاوڕێیەتی
export async function sendFriendRequest(requesterId, addresseeId) {
  need()
  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: requesterId, addressee_id: addresseeId, status: 'pending' })
  if (error) throw error
}

// وەڵامدانەوەی داواکاری: قبووڵ (accept) یان ڕەتکردنەوە (delete)
export async function respondFriendRequest(friendshipId, accept) {
  need()
  if (accept) {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
  } else {
    await supabase.from('friendships').delete().eq('id', friendshipId)
  }
}

// سڕینەوەی هاوڕێ یان هەڵوەشاندنەوەی داواکاری
export async function removeFriendship(friendshipId) {
  need()
  await supabase.from('friendships').delete().eq('id', friendshipId)
}

// هێنانی هەموو پەیوەندییەکانی هاوڕێیەتی (هاوڕێی پەیوەستکراو + داواکارییەکان)
export async function fetchFriendships(userId) {
  need()
  const { data } = await supabase
    .from('friendships')
    .select('*')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
  return data || []
}

// هێنانی پرۆفایلی چەند بەکارهێنەرێک بە id
export async function fetchProfilesByIds(ids) {
  need()
  if (!ids.length) return []
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, friend_code, total_points, last_seen')
    .in('id', ids)
  return data || []
}

// هێنانی پرۆفایلی گشتیی تەواوی یەک بەکارهێنەر (بۆ پیشاندانی ئاست/ئامار)
export async function fetchPublicProfile(userId) {
  need()
  if (!userId) return null
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, friend_code, total_points, games_played, wins, last_seen')
    .eq('id', userId)
    .maybeSingle()
  return data
}

// گوێگرتن لە گۆڕانکاری هاوڕێیەتی (داواکاری نوێ/قبووڵکردن)
export function subscribeFriendships(userId, onChange) {
  need()
  const channel = supabase
    .channel(`friends:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'friendships', filter: `addressee_id=eq.${userId}` },
      () => onChange?.()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'friendships', filter: `requester_id=eq.${userId}` },
      () => onChange?.()
    )
    .subscribe()
  return () => supabase.removeChannel(channel)
}

// ═══════════════ نامەی تایبەت (DM) ═══════════════
// هێنانی گفتوگۆ لەگەڵ هاوڕێیەک
export async function fetchDirectMessages(meId, otherId) {
  need()
  const { data } = await supabase
    .from('direct_messages')
    .select('*')
    .or(
      `and(sender_id.eq.${meId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${meId})`
    )
    .order('created_at', { ascending: true })
    .limit(200)
  return data || []
}

// ناردنی نامەی تایبەت (text یان invite)
export async function sendDirectMessage(senderId, recipientId, content, kind = 'text') {
  need()
  const { data, error } = await supabase
    .from('direct_messages')
    .insert({ sender_id: senderId, recipient_id: recipientId, content, kind })
    .select()
    .single()
  if (error) throw error
  return data
}

// نیشانکردنی نامەکانی هاتوو وەک خوێندراوە
export async function markMessagesRead(meId, otherId) {
  need()
  await supabase
    .from('direct_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', meId)
    .eq('sender_id', otherId)
    .is('read_at', null)
}

// ژمارەی نامە نەخوێندراوەکان (بۆ هەموو هاوڕێیان)
export async function fetchUnreadCounts(meId) {
  need()
  const { data } = await supabase
    .from('direct_messages')
    .select('sender_id')
    .eq('recipient_id', meId)
    .is('read_at', null)
  const counts = {}
  ;(data || []).forEach((m) => (counts[m.sender_id] = (counts[m.sender_id] || 0) + 1))
  return counts
}

// گوێگرتن لە نامە تایبەتە هاتووەکان (هەرکوێ بم)
// ناوی کەناڵ بێهاوتایە تاکو لەگەڵ کەناڵەکانی تر تێکەڵ نەبێت
export function subscribeDirectMessages(userId, onMessage) {
  need()
  const channel = supabase
    .channel(`dm:${userId}:${Math.random().toString(36).slice(2, 9)}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `recipient_id=eq.${userId}` },
      (payload) => onMessage?.(payload.new)
    )
    .subscribe()
  return () => supabase.removeChannel(channel)
}

// ═══════════════ گرووپەکان (Groups) ═══════════════
// دروستکردنی گرووپ — دروستکەر دەبێتە owner
export async function createGroup(user, profile, name) {
  need()
  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name: name.trim().slice(0, 40), owner_id: user.id })
    .select()
    .single()
  if (error) throw error
  await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'owner' })
  return group
}

// دۆزینەوەی گرووپ بە کۆد
export async function findGroupByCode(code) {
  need()
  const { data } = await supabase
    .from('groups')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .maybeSingle()
  return data
}

// بەشداربوون لە گرووپ بە کۆد
export async function joinGroupByCode(code, user) {
  need()
  const group = await findGroupByCode(code)
  if (!group) throw new Error('گرووپ نەدۆزرایەوە')
  const { error } = await supabase
    .from('group_members')
    .upsert(
      { group_id: group.id, user_id: user.id, role: 'member' },
      { onConflict: 'group_id,user_id', ignoreDuplicates: true }
    )
  if (error) throw error
  return group
}

// دەرچوون لە گرووپ
export async function leaveGroup(groupId, userId) {
  need()
  await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId)
}

// سڕینەوەی گرووپ (تەنها owner)
export async function deleteGroup(groupId) {
  need()
  await supabase.from('groups').delete().eq('id', groupId)
}

// هێنانی گرووپەکانی من
export async function fetchMyGroups(userId) {
  need()
  const { data: mems } = await supabase
    .from('group_members')
    .select('group_id, role')
    .eq('user_id', userId)
  const ids = (mems || []).map((m) => m.group_id)
  if (!ids.length) return []
  const { data: groups } = await supabase.from('groups').select('*').in('id', ids)
  const roleMap = Object.fromEntries((mems || []).map((m) => [m.group_id, m.role]))
  return (groups || [])
    .map((g) => ({ ...g, myRole: roleMap[g.id] }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

// هێنانی یەک گرووپ
export async function fetchGroup(groupId) {
  need()
  const { data } = await supabase.from('groups').select('*').eq('id', groupId).maybeSingle()
  return data
}

// هێنانی ئەندامانی گرووپ (لەگەڵ پرۆفایل)
export async function fetchGroupMembers(groupId) {
  need()
  const { data: mems } = await supabase
    .from('group_members')
    .select('user_id, role, joined_at')
    .eq('group_id', groupId)
  const ids = (mems || []).map((m) => m.user_id)
  const profs = await fetchProfilesByIds(ids)
  const pMap = Object.fromEntries(profs.map((p) => [p.id, p]))
  return (mems || []).map((m) => ({
    ...m,
    profile: pMap[m.user_id] || null,
  }))
}

// نامەکانی گرووپ
export async function fetchGroupMessages(groupId) {
  need()
  const { data } = await supabase
    .from('group_messages')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })
    .limit(200)
  return data || []
}

// ناردنی نامەی گرووپ
export async function sendGroupMessage(groupId, user, profile, content, kind = 'text') {
  need()
  const { data, error } = await supabase
    .from('group_messages')
    .insert({
      group_id: groupId,
      sender_id: user.id,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      content,
      kind,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// گوێگرتن لە یەک گرووپ (نامە + ئەندامان)
export function subscribeGroup(groupId, { onMessage, onMembers } = {}) {
  need()
  const channel = supabase
    .channel(`group:${groupId}:${Math.random().toString(36).slice(2, 9)}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` },
      (payload) => onMessage?.(payload.new)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${groupId}` },
      () => onMembers?.()
    )
    .subscribe()
  return () => supabase.removeChannel(channel)
}

// گوێگرتن لە ئەندامبوونەکانی من (بۆ نوێکردنەوەی لیستی گرووپەکان)
export function subscribeMyGroupMemberships(userId, onChange) {
  need()
  const channel = supabase
    .channel(`mygroups:${userId}:${Math.random().toString(36).slice(2, 9)}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'group_members', filter: `user_id=eq.${userId}` },
      () => onChange?.()
    )
    .subscribe()
  return () => supabase.removeChannel(channel)
}
