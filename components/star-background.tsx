'use client'

import { useMemo } from 'react'

export function StarBackground() {
  const stars = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 56,
        size: Math.random() * 1.6 + 0.6,
        dur: 3.5 + Math.random() * 4,
        delay: Math.random() * 6,
        opacity: 0.18 + Math.random() * 0.38,
      })),
    []
  )

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

      {stars.map((s) => (
        <span
          key={s.id}
          className="star-bg-dot"
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
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

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 90,
          height: 120,
          background:
            'linear-gradient(180deg, transparent 0%, rgba(8,12,18,0.12) 45%, rgba(4,7,12,0.28) 100%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: '100%',
        }}
      >
        <svg
          viewBox="0 0 390 150"
          preserveAspectRatio="none"
          style={{ width: '100%', height: 150, display: 'block' }}
        >
          <path
            d="M0 98 Q40 76 88 86 Q140 60 198 82 Q250 56 310 74 Q350 62 390 66 L390 150 L0 150 Z"
            fill="rgba(5,9,15,0.88)"
          />
          <path
            d="M0 116 Q58 96 120 106 Q178 90 236 104 Q298 90 390 96 L390 150 L0 150 Z"
            fill="rgba(3,6,10,0.96)"
          />
          <path
            d="M0 132 Q80 118 150 126 Q220 114 300 124 Q345 118 390 120 L390 150 L0 150 Z"
            fill="#02050a"
          />
          <line
            x1="55"
            y1="150"
            x2="55"
            y2="92"
            stroke="rgba(201,168,76,0.20)"
            strokeWidth="2"
          />
          <ellipse
            cx="55"
            cy="84"
            rx="18"
            ry="10"
            fill="rgba(201,168,76,0.10)"
          />
          <line
            x1="318"
            y1="150"
            x2="318"
            y2="84"
            stroke="rgba(201,168,76,0.16)"
            strokeWidth="1.8"
          />
          <ellipse
            cx="318"
            cy="76"
            rx="15"
            ry="8"
            fill="rgba(201,168,76,0.08)"
          />
          <line
            x1="184"
            y1="150"
            x2="184"
            y2="110"
            stroke="rgba(201,168,76,0.10)"
            strokeWidth="1.2"
          />
          <ellipse
            cx="184"
            cy="104"
            rx="10"
            ry="6"
            fill="rgba(201,168,76,0.06)"
          />
        </svg>
      </div>

      <style jsx global>{`
        @keyframes starTwinkle {
          0%,
          100% {
            opacity: 0.22;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.14);
          }
        }
      `}</style>
    </div>
  )
}