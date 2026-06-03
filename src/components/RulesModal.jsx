import { X, Users, Eye, MessageSquare, Vote, Trophy } from 'lucide-react'
import { Button } from './ui'
import { useT } from '../lib/i18n'

// مۆداڵی «چۆنیەتی یاری کردن»
export default function RulesModal({ onClose }) {
  const t = useT()
  const rules = [
    {
      icon: Users,
      title: t('دەستەی کەشتی و ساختەکار'),
      text: t('هەموو یاریزانان دەستەی کەشتین جگە لە چەند ساختەکارێک. دەستەی کەشتی وشە نهێنیەکە دەزانن، بەڵام ساختەکارەکان نا!'),
    },
    {
      icon: Eye,
      title: t('ئاشکراکردنی ڕۆڵ'),
      text: t('ئامێرەکە بەسەر یاریزاناندا بگێڕە. هەر یاریزانێک بە نهێنی ڕۆڵ و وشەی خۆی دەبینێت.'),
    },
    {
      icon: MessageSquare,
      title: t('گفتوگۆ'),
      text: t('هەر یاریزانێک ئاماژەیەک دەربارەی وشەکە دەدات بەبێ ئەوەی ڕاستەوخۆ بیڵێت. ساختەکارەکان هەوڵ دەدەن خۆیان بشارنەوە!'),
    },
    {
      icon: Vote,
      title: t('دەنگدانی نهێنی'),
      text: t('بە نۆرە دەنگ دەدەن بۆ ئەو کەسەی گومانی لێ دەکەن ساختەکارە، یان دەنگدان تێدەپەڕێنن.'),
    },
    {
      icon: Trophy,
      title: t('سەرکەوتن'),
      text: t('دەستەی کەشتی سەردەکەون ئەگەر هەموو ساختەکارەکان دەربکرێن. ساختەکارەکان سەردەکەون ئەگەر ژمارەیان یەکسان بێت بە دەستەی کەشتی.'),
    },
  ]

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="panel panel-glow max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-crew neon-text">{t('چۆنیەتی یاری کردن')}</h2>
          <button
            onClick={onClose}
            className="btn-press rounded-full p-2 bg-ink/5 hover:bg-ink/10 text-ink/70"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {rules.map((r, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="shrink-0 rounded-xl bg-crew/15 p-2.5">
                <r.icon className="w-5 h-5 text-crew" />
              </div>
              <div>
                <h3 className="font-bold text-ink">{r.title}</h3>
                <p className="text-sm text-ink/60 leading-relaxed mt-1">{r.text}</p>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={onClose} className="w-full mt-6">
          {t('تێگەیشتم، با دەست پێ بکەین!')}
        </Button>
      </div>
    </div>
  )
}
