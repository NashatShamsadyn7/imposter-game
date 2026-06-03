// پاشبنەیەکی نەرمی ڕووناک — بلۆبی ڕەنگاوڕەنگی مات کە بەنەرمی دەجوڵێن
export default function Background() {
  return (
    <div className="aurora">
      <div
        className="blob animate-float"
        style={{
          top: '-6%',
          right: '-4%',
          width: '40vw',
          height: '40vw',
          maxWidth: 420,
          maxHeight: 420,
          background: '#0e9c8e',
          opacity: 0.16,
        }}
      />
      <div
        className="blob animate-float"
        style={{
          bottom: '-8%',
          left: '-6%',
          width: '45vw',
          height: '45vw',
          maxWidth: 460,
          maxHeight: 460,
          background: '#be64f5',
          opacity: 0.16,
          animationDelay: '3s',
        }}
      />
      <div
        className="blob animate-float"
        style={{
          top: '40%',
          left: '55%',
          width: '32vw',
          height: '32vw',
          maxWidth: 340,
          maxHeight: 340,
          background: '#608cfa',
          opacity: 0.14,
          animationDelay: '5s',
        }}
      />
    </div>
  )
}
