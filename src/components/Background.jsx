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
          background: '#e15b57',
          opacity: 0.14,
          animationDelay: '3s',
        }}
      />
      <div
        className="blob animate-float"
        style={{
          top: '40%',
          left: '55%',
          width: '30vw',
          height: '30vw',
          maxWidth: 320,
          maxHeight: 320,
          background: '#6384dc',
          opacity: 0.12,
          animationDelay: '5s',
        }}
      />
    </div>
  )
}
