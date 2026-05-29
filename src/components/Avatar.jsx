// ئەڤاتاری یاریزان — وێنەی پرۆفایل یان یەکەم پیتی ناو
export default function Avatar({ url, name, size = 40, ring = false, ringColor = 'crew' }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  const ringCls = ring
    ? ringColor === 'impostor'
      ? 'ring-2 ring-impostor'
      : 'ring-2 ring-crew'
    : ''
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-full bg-surface ${ringCls}`}
      style={{ width: size, height: size }}
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-crew/20 font-bold text-crew"
          style={{ fontSize: size * 0.4 }}
        >
          {initial}
        </div>
      )}
    </div>
  )
}
