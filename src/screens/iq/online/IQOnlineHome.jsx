import { useState } from 'react'
import { Brain, ArrowRight, Plus, LogIn } from 'lucide-react'
import { Button, Panel } from '../../../components/ui'
import { useT } from '../../../lib/i18n'
import { sfx } from '../../../lib/sound'
import { useIQRoom } from '../../../state/IQRoomContext'
import { IQ_CATEGORIES } from '../../../data/iq'

const COUNT_OPTIONS = [10, 20, 30]
const TIME_OPTIONS = [10, 15, 20]

// شاشەی دەستپێک بۆ IQ ئۆنلاین: دروستکردن یان بەشداربوون بە کۆد
export default function IQOnlineHome({ onExit }) {
  const t = useT()
  const { createRoom, joinRoom, busy, error } = useIQRoom()
  const [catId, setCatId] = useState('mix')
  const [count, setCount] = useState(10)
  const [secondsPerQ, setSecondsPerQ] = useState(15)
  const [code, setCode] = useState('')

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      <button onClick={() => { sfx.tap(); onExit() }} className="btn-press mb-6 flex items-center gap-1 self-start text-sm text-muted hover:text-ink">
        <ArrowRight className="h-4 w-4" />{t('گەڕانەوە')}
      </button>

      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-amber-400 to-crew shadow-soft">
          <Brain className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-black text-ink">IQ {t('ئۆنلاین')}</h1>
        <p className="mt-1 text-sm text-muted">{t('خێراترین وەڵامی ڕاست دەباتەوە')}</p>
      </div>

      {error && <p className="mb-3 rounded-xl bg-impostor/10 p-2 text-center text-sm text-impostor">{error}</p>}

      {/* دروستکردنی ژوور */}
      <Panel className="mb-5">
        <p className="mb-3 font-bold text-ink">{t('دروستکردنی ژووری نوێ')}</p>

        <p className="mb-2 text-xs font-bold text-muted">{t('هاوپۆڵ')}</p>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {IQ_CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => { sfx.tap(); setCatId(c.id) }}
              className={`btn-press flex items-center gap-2 rounded-xl border p-2.5 text-right text-sm transition ${catId === c.id ? 'border-crew bg-crew/10' : 'border-line bg-surface'}`}>
              <span>{c.icon}</span><span className="font-bold text-ink">{t(c.name)}</span>
            </button>
          ))}
        </div>

        <p className="mb-2 text-xs font-bold text-muted">{t('ژمارەی پرسیار')}</p>
        <div className="mb-4 flex gap-2">
          {COUNT_OPTIONS.map((n) => (
            <button key={n} onClick={() => { sfx.tap(); setCount(n) }}
              className={`btn-press flex-1 rounded-xl border py-2 font-bold transition ${count === n ? 'border-crew bg-crew/10 text-crew' : 'border-line bg-surface text-ink'}`}>{n}</button>
          ))}
        </div>

        <p className="mb-2 text-xs font-bold text-muted">{t('چرکە بۆ هەر پرسیار')}</p>
        <div className="mb-4 flex gap-2">
          {TIME_OPTIONS.map((s) => (
            <button key={s} onClick={() => { sfx.tap(); setSecondsPerQ(s) }}
              className={`btn-press flex-1 rounded-xl border py-2 font-bold transition ${secondsPerQ === s ? 'border-crew bg-crew/10 text-crew' : 'border-line bg-surface text-ink'}`}>{s}s</button>
          ))}
        </div>

        <Button disabled={busy} onClick={() => createRoom({ categoryId: catId, questionCount: count, secondsPerQ })} className="w-full">
          <Plus className="h-4 w-4" />{t('دروستکردن')}
        </Button>
      </Panel>

      {/* بەشداربوون بە کۆد */}
      <Panel>
        <p className="mb-3 font-bold text-ink">{t('بەشداربوون بە کۆد')}</p>
        <div className="flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={5}
            placeholder={t('کۆدی ژوور')}
            className="flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-center text-lg font-black tracking-widest text-ink outline-none focus:border-crew" />
          <Button variant="outline" disabled={busy || code.length < 4} onClick={() => joinRoom(code)}>
            <LogIn className="h-4 w-4" />{t('بەشداری')}
          </Button>
        </div>
      </Panel>
    </div>
  )
}
