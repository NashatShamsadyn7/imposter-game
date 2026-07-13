import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BadgeDollarSign, Bot, Crown, Dices, Landmark, Plus, Shield, Sparkles, Trophy, Users, X } from 'lucide-react'
import { buildDraftPool, formatMoney, LEAGUES, PLAYER_COUNT, shuffle } from '../data/footballCatalog'
import { getMatchCommentary } from '../lib/footballAI'
import { runWorldCup, teamPower } from '../lib/football'
import { Button, Panel } from '../components/ui'
import { sfx } from '../lib/sound'

const BUDGETS = [50, 100, 200, 350, 500]
const defaultManagers = ['مدرب ١', 'مدرب ٢', 'مدرب ٣', 'مدرب ٤'].map((name, index) => ({ id: `manager-${index + 1}`, name }))

function PlayerCard({ player }) {
  if (!player) return null
  const positionColor = { GK: 'bg-amber-400/15 text-amber-600', DEF: 'bg-sky-400/15 text-sky-600', MID: 'bg-crew/15 text-crew', FWD: 'bg-impostor/12 text-impostor' }
  return (
    <div className="overflow-hidden rounded-3xl border border-amber-400/35 bg-gradient-to-br from-amber-300/15 via-surface to-crew/10 p-4 shadow-card">
      <div className="mb-3 flex items-start justify-between">
        <span className={`rounded-full px-3 py-1 text-xs font-black ${positionColor[player.position]}`}>{player.position}</span>
        <span className="text-4xl font-black text-amber-500">{player.rating}</span>
      </div>
      <div className="mb-3 overflow-hidden rounded-2xl bg-ink/5">
        <img src={player.image_url} alt="" className="h-40 w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none' }} />
      </div>
      <p className="text-xl font-black text-ink">{player.name}</p>
      <p className="mt-1 text-sm text-muted">{player.club} · {player.leagueName}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-surface2 p-2"><p className="text-[10px] text-muted">خێرایی</p><p className="font-black text-ink">{player.pace}</p></div>
        <div className="rounded-xl bg-surface2 p-2"><p className="text-[10px] text-muted">تەکنیک</p><p className="font-black text-ink">{player.skill}</p></div>
        <div className="rounded-xl bg-surface2 p-2"><p className="text-[10px] text-muted">هێز</p><p className="font-black text-ink">{player.power}</p></div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-surface2 p-2"><p className="text-[10px] text-muted">باڵا</p><p className="font-black text-ink">{player.heightCm}cm</p></div>
        <div className="rounded-xl bg-surface2 p-2"><p className="text-[10px] text-muted">کێش</p><p className="font-black text-ink">{player.weightKg}kg</p></div>
        <div className="rounded-xl bg-surface2 p-2"><p className="text-[10px] text-muted">بازدان</p><p className="font-black text-ink">{player.jump}</p></div>
      </div>
      <p className="mt-3 rounded-xl bg-ink/5 px-3 py-2 text-center text-xs font-bold text-muted">✨ {player.trait}</p>
      <p className="mt-3 text-center text-sm font-black text-amber-600">سعر البداية: {formatMoney(player.price)}</p>
    </div>
  )
}

function TeamLine({ team, squadSize }) {
  return (
    <div className="rounded-2xl border border-line bg-surface2 p-3">
      <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-crew" /><span className="min-w-0 flex-1 truncate font-black text-ink">{team.name}</span><span className="font-black text-amber-600">{formatMoney(team.budget)}</span></div>
      <p className="mt-1 text-xs text-muted">{team.players.length}/{squadSize} یاریزان · هێز: {team.players.length ? teamPower(team) : '—'}</p>
    </div>
  )
}

export default function FootballMarket({ onBack }) {
  const [managers, setManagers] = useState(defaultManagers)
  const [newManager, setNewManager] = useState('')
  const [squadSize, setSquadSize] = useState(5)
  const [budgetChoice, setBudgetChoice] = useState('random')
  const [phase, setPhase] = useState('setup') // setup | preview | handoff | bid | reveal | tournament
  const [teams, setTeams] = useState([])
  const [deck, setDeck] = useState([])
  const [round, setRound] = useState(0)
  const [bidderIndex, setBidderIndex] = useState(0)
  const [bid, setBid] = useState(0)
  const [bids, setBids] = useState({})
  const [auctionResult, setAuctionResult] = useState(null)
  const [tournament, setTournament] = useState(null)
  const [commentary, setCommentary] = useState('')

  const player = deck[round]
  const currentBidder = teams[bidderIndex]
  const filledTeams = useMemo(() => teams.filter((team) => team.players.length >= squadSize).length, [teams, squadSize])

  useEffect(() => {
    if (!tournament?.final) return
    let active = true
    getMatchCommentary(tournament.final).then((text) => { if (active) setCommentary(text) })
    return () => { active = false }
  }, [tournament])

  const addManager = () => {
    const name = newManager.trim()
    if (!name || managers.length >= 8) return
    setManagers((items) => [...items, { id: `manager-${Date.now()}-${items.length}`, name }])
    setNewManager('')
  }

  const startMarket = () => {
    const activeManagers = managers.map((manager) => ({ ...manager, name: manager.name.trim() })).filter((manager) => manager.name)
    if (activeManagers.length < 2) return
    const budget = budgetChoice === 'random' ? BUDGETS[Math.floor(Math.random() * BUDGETS.length)] : Number(budgetChoice)
    setTeams(activeManagers.map((manager) => ({ id: manager.id, name: `نادی ${manager.name}`, manager: manager.name, budget, players: [] })))
    setDeck(shuffle(buildDraftPool(activeManagers.length, squadSize)))
    setRound(0)
    setBids({})
    setAuctionResult(null)
    setPhase('preview')
    sfx.reveal()
  }

  const beginBids = () => {
    setBidderIndex(0)
    setBids({})
    setAuctionResult(null)
    setPhase('handoff')
  }

  const openBid = () => {
    const maximum = currentBidder.players.length >= squadSize ? 0 : currentBidder.budget
    setBid(Math.min(player.price, maximum))
    setPhase('bid')
  }

  const submitBid = () => {
    const amount = Math.max(0, Math.min(Number(bid) || 0, currentBidder.budget))
    const nextBids = { ...bids, [currentBidder.id]: currentBidder.players.length >= squadSize ? 0 : amount }
    setBids(nextBids)
    if (bidderIndex < teams.length - 1) {
      setBidderIndex((index) => index + 1)
      setPhase('handoff')
      return
    }
    const highest = Math.max(...Object.values(nextBids))
    const contenders = highest > 0 ? teams.filter((team) => nextBids[team.id] === highest && team.players.length < squadSize) : []
    const winner = contenders.length ? contenders[Math.floor(Math.random() * contenders.length)] : null
    setAuctionResult({ winnerId: winner?.id || null, amount: highest })
    setPhase('reveal')
    sfx.vote()
  }

  const continueMarket = () => {
    const updated = teams.map((team) => team.id === auctionResult?.winnerId
      ? { ...team, budget: team.budget - auctionResult.amount, players: [...team.players, player] }
      : team)
    setTeams(updated)
    const done = updated.every((team) => team.players.length >= squadSize) || round + 1 >= deck.length
    if (done) {
      const used = new Set(updated.flatMap((team) => team.players.map((item) => item.id)))
      const spare = shuffle(deck.filter((item) => !used.has(item.id)))
      let spareIndex = 0
      const completed = updated.map((team) => ({ ...team, players: [...team.players, ...spare.slice(spareIndex, spareIndex += Math.max(0, squadSize - team.players.length))] }))
      setTeams(completed)
      setTournament(runWorldCup(completed, squadSize))
      setPhase('tournament')
      sfx.win()
      return
    }
    setRound((index) => index + 1)
    setBids({})
    setAuctionResult(null)
    setPhase('preview')
    sfx.click()
  }

  if (phase === 'setup') return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      <header className="mb-6 flex items-center justify-between"><button onClick={onBack} className="btn-press flex items-center gap-1 rounded-xl bg-surface px-3 py-2 text-sm text-muted shadow-card"><ArrowRight className="h-4 w-4" /> گەڕانەوە</button><div className="text-center"><h1 className="text-xl font-black text-ink">مزادی ئەستێرەکان</h1><p className="text-xs text-muted">بازاڕ + کاسی جیهانی</p></div><Landmark className="h-7 w-7 text-amber-500" /></header>
      <Panel className="mb-4 border-amber-400/30 !p-4"><p className="text-center text-sm font-bold text-ink">{PLAYER_COUNT.toLocaleString()} یاریزان · {LEAGUES.length} لیگ · {LEAGUES.reduce((total, league) => total + league.teams.length, 0)} یانە</p><div className="mt-3 flex flex-wrap justify-center gap-1.5">{LEAGUES.map((league) => <span key={league.id} className="rounded-full bg-ink/5 px-2 py-1 text-xs text-muted">{league.icon} {league.name_ku}</span>)}</div></Panel>
      <Panel className="mb-4 !p-4"><div className="mb-3 flex items-center gap-2"><Users className="h-5 w-5 text-crew" /><h2 className="font-bold text-ink">مدیرەکان ({managers.length}/8)</h2></div><div className="space-y-2">{managers.map((manager, index) => <div key={manager.id} className="flex items-center gap-2 rounded-xl bg-surface2 px-3 py-2"><span className="w-5 text-center text-xs font-black text-muted">{index + 1}</span><input value={manager.name} onChange={(event) => setManagers((items) => items.map((item) => item.id === manager.id ? { ...item, name: event.target.value } : item))} className="min-w-0 flex-1 bg-transparent font-bold text-ink outline-none" maxLength={18} /><button onClick={() => setManagers((items) => items.filter((item) => item.id !== manager.id))} disabled={managers.length <= 2} className="p-1 text-impostor disabled:opacity-30"><X className="h-4 w-4" /></button></div>)}</div><div className="mt-3 flex gap-2"><input value={newManager} onChange={(event) => setNewManager(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && addManager()} placeholder="ناوی مدیر" maxLength={18} className="min-w-0 flex-1 rounded-xl border border-line bg-surface2 px-3 py-2 text-ink outline-none" /><Button onClick={addManager} disabled={managers.length >= 8} className="!px-3"><Plus className="h-5 w-5" /></Button></div></Panel>
      <Panel className="mb-5 space-y-5 !p-4"><div><p className="mb-2 font-bold text-ink">شێوازی تیم</p><div className="grid grid-cols-2 gap-2">{[5, 11].map((count) => <button key={count} onClick={() => setSquadSize(count)} className={`btn-press rounded-2xl border p-3 text-right ${squadSize === count ? 'border-crew bg-crew/12 text-crew' : 'border-line bg-surface2 text-muted'}`}><p className="text-lg font-black">{count} یاریزان</p><p className="text-xs opacity-75">{count === 5 ? 'خێرا و خۆش' : 'تیمی تەواو'}</p></button>)}</div></div><div><p className="mb-2 flex items-center gap-2 font-bold text-ink"><BadgeDollarSign className="h-4 w-4 text-amber-500" /> بودجەی هەمووان</p><div className="flex flex-wrap gap-2">{['random', ...BUDGETS].map((value) => <button key={value} onClick={() => setBudgetChoice(value)} className={`btn-press rounded-xl px-3 py-2 text-sm font-black ${budgetChoice === value ? 'bg-amber-400 text-amber-950' : 'bg-surface2 text-muted'}`}>{value === 'random' ? '🎲 هەڕەمەکی' : formatMoney(value)}</button>)}</div></div></Panel>
      <Button onClick={startMarket} disabled={managers.length < 2} className="w-full !py-4 !text-lg"><Landmark className="h-6 w-6" /> دەستپێکردنی مزاد</Button>
    </div>
  )

  if (phase === 'tournament') return <WorldCup tournament={tournament} commentary={commentary} onBack={onBack} />

  const resultWinner = teams.find((team) => team.id === auctionResult?.winnerId)
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6 pb-24">
      <div className="mb-4 flex items-center justify-between"><span className="rounded-full bg-amber-400/15 px-3 py-1 text-sm font-black text-amber-600">مزاد {Math.min(round + 1, deck.length)}/{deck.length}</span><span className="text-sm text-muted">{filledTeams}/{teams.length} تیم تەواو</span></div>
      <PlayerCard player={player} />
      <div className="my-4 grid grid-cols-2 gap-2">{teams.map((team) => <TeamLine key={team.id} team={team} squadSize={squadSize} />)}</div>
      {phase === 'preview' && <Button onClick={beginBids} className="w-full !py-4 !text-lg"><Users className="h-6 w-6" /> دەستپێکردنی نرخبەستنە نهێنییەکان</Button>}
      {phase === 'handoff' && <Panel className="mt-auto text-center"><p className="text-sm text-muted">مۆبایل بدە بە</p><p className="my-2 text-2xl font-black text-ink">{currentBidder.manager}</p><p className="mb-4 text-xs text-muted">کەسێک نابێت نرخەکەت ببینێت.</p><Button onClick={openBid} className="w-full"><Sparkles className="h-5 w-5" /> ئامادەم بۆ نرخ</Button></Panel>}
      {phase === 'bid' && <Panel className="mt-auto"><p className="mb-3 text-center font-black text-ink">نرخی {currentBidder.manager}</p><input type="range" min="0" max={currentBidder.players.length >= squadSize ? 0 : currentBidder.budget} step="1" value={bid} onChange={(event) => setBid(Number(event.target.value))} className="w-full accent-amber-500" /><div className="my-4 flex items-center justify-between"><span className="text-sm text-muted">ماوە: {formatMoney(currentBidder.budget)}</span><span className="text-3xl font-black text-amber-600">{formatMoney(bid)}</span></div><Button onClick={submitBid} className="w-full">پاشەکەوتی نرخ</Button></Panel>}
      {phase === 'reveal' && <Panel className="mt-auto text-center">{resultWinner ? <><Crown className="mx-auto mb-2 h-10 w-10 text-amber-500" /><p className="text-sm text-muted">یاریزانەکە دەچێت بۆ</p><p className="my-1 text-2xl font-black text-ink">{resultWinner.name}</p><p className="mb-4 font-black text-amber-600">{formatMoney(auctionResult.amount)}</p></> : <><Bot className="mx-auto mb-2 h-10 w-10 text-muted" /><p className="mb-4 font-bold text-muted">هیچ نرخێکی بەهێز نەبوو — کۆمپیوتەر یاریزانەکەی برد.</p></>}<Button onClick={continueMarket} className="w-full">{round + 1 >= deck.length ? 'دەستپێکردنی کاسی جیهانی' : 'یاریزانی دواتر'}</Button></Panel>}
    </div>
  )
}

function WorldCup({ tournament, commentary, onBack }) {
  const final = tournament.final
  return (
    <div className="mx-auto max-w-md px-4 py-7 pb-24 text-center"><Crown className="mx-auto mb-3 h-14 w-14 text-amber-500" /><h1 className="text-3xl font-black text-ink">کاسی جیهانیی یانەکان</h1><p className="mt-2 text-muted">{tournament.champion.name} بەرزترین کاسەی بردەوە</p>
      <Panel className="my-5 !p-4"><p className="text-xs font-bold text-muted">کۆتایی</p><div className="my-2 flex items-center justify-center gap-3 text-lg font-black text-ink"><span>{final.home.name}</span><span className="rounded-xl bg-amber-400/15 px-3 py-1 text-amber-600">{final.homeGoals} – {final.awayGoals}</span><span>{final.away.name}</span></div>{final.penalties && <p className="text-xs text-muted">پێنالتی: {final.penalties.home} – {final.penalties.away}</p>}<p className="mt-3 rounded-xl bg-crew/8 p-3 text-right text-sm leading-6 text-ink">✨ {commentary || 'AI ڕاپۆرتی یاریی کۆتایی ئامادە دەکات…'}</p></Panel>
      <div className="space-y-3 text-right">{tournament.groups.map((group, index) => <Panel key={index} className="!p-3"><p className="mb-2 font-black text-ink">گرووپی {index === 0 ? 'A' : 'B'}</p>{group.table.map((row, rowIndex) => <div key={row.team.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${rowIndex < 2 ? 'bg-crew/8' : ''}`}><span className="w-5 font-black text-muted">{rowIndex + 1}</span><span className="flex-1 font-bold text-ink">{row.team.name}</span><span className="font-black text-crew">{row.points} pts</span></div>)}</Panel>)}</div>
      <Button onClick={onBack} variant="ghost" className="mt-5 w-full">گەڕانەوە بۆ مێنیو</Button>
    </div>
  )
}
