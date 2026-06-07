// ═══════════════════════════════════════════════════════════
//  Skeleton — هیکلی بارکردنی شِمَری (لە جیاتی سپینەری دەوّار)
//  Skeleton: بلۆکێکی تاک · SkeletonRow: ڕیزی لیست (ئەڤاتار + دوو هێڵ)
// ═══════════════════════════════════════════════════════════

export default function Skeleton({ className = '', style }) {
  return <div className={`skeleton ${className}`} style={style} />
}

// ڕیزێکی لیست — ئەڤاتار + دوو هێڵی دەق
export function SkeletonRow({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl bg-ink/5 px-3 py-2.5 ${className}`}>
      <Skeleton className="h-10 w-10 !rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-2.5 w-1/3" />
      </div>
      <Skeleton className="h-4 w-10" />
    </div>
  )
}

// چەند ڕیز پێکەوە
export function SkeletonList({ rows = 6, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  )
}
