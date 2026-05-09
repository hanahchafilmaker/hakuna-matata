'use client'

const STARS = [
  { id: 0, x: 8, y: 8, size: 1.1, dur: 4.2, delay: 0.2, opacity: 0.42 },
  { id: 1, x: 18, y: 20, size: 0.8, dur: 5.6, delay: 1.1, opacity: 0.32 },
  { id: 2, x: 28, y: 7, size: 1.4, dur: 6.2, delay: 2.3, opacity: 0.48 },
  { id: 3, x: 42, y: 18, size: 0.9, dur: 4.8, delay: 1.7, opacity: 0.36 },
  { id: 4, x: 55, y: 10, size: 1.2, dur: 5.4, delay: 3.1, opacity: 0.44 },
  { id: 5, x: 66, y: 5, size: 1.5, dur: 6.8, delay: 0.9, opacity: 0.4 },
  { id: 6, x: 76, y: 16, size: 0.9, dur: 4.6, delay: 2.7, opacity: 0.35 },
  { id: 7, x: 86, y: 9, size: 1.1, dur: 5.8, delay: 1.4, opacity: 0.46 },
  { id: 8, x: 94, y: 24, size: 0.8, dur: 6.4, delay: 3.6, opacity: 0.33 },
  { id: 9, x: 14, y: 38, size: 1.0, dur: 5.1, delay: 2.2, opacity: 0.3 },
  { id: 10, x: 34, y: 32, size: 1.3, dur: 7.1, delay: 0.5, opacity: 0.38 },
  { id: 11, x: 49, y: 44, size: 0.9, dur: 4.9, delay: 4.1, opacity: 0.34 },
  { id: 12, x: 62, y: 34, size: 1.1, dur: 6.5, delay: 1.8, opacity: 0.42 },
  { id: 13, x: 78, y: 40, size: 0.8, dur: 5.7, delay: 3.3, opacity: 0.31 },
  { id: 14, x: 90, y: 36, size: 1.4, dur: 6.9, delay: 2.5, opacity: 0.39 },
]

export function StarBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 100% 62% at 50% 0%, #10233f 0%, #081220 42%, #040810 72%, #02050b 100%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 10%, rgba(201,168,76,0.05) 0%, rgba(201,168,76,0.015) 28%, transparent 58%)',
        }}
      />

      {STARS.map((s) => (
        <span
          key={s.id}
          className="star-bg-dot"
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            borderRadius: '50%',
            background: 'rgba(255,245,210,0.95)',
            opacity: s.opacity,
            boxShadow: '0 0 6px rgba(255,244,200,0.18)',
            animation: `starTwinkle ${s.dur}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '2.8%',
          transform: 'translateX(-50%)',
          width: 82,
          height: 82,
          opacity: 0.86,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '50% auto auto 50%',
            transform: 'translate(-50%, -50%)',
            width: 140,
            height: 140,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255,248,210,0.12) 0%, rgba(212,175,55,0.04) 42%, transparent 76%)',
            filter: 'blur(16px)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 62,
            height: 62,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 35% 30%, #fffdf4 0%, #f7e7b3 34%, #d6b56d 72%, #9a6e25 100%)',
            boxShadow:
              '0 0 18px rgba(240,220,150,0.16), 0 0 34px rgba(201,168,76,0.06)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: '57%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: 'rgba(90, 62, 18, 0.14)',
            filter: 'blur(1px)',
          }}
        />
      </div>
    </div>
  )
}