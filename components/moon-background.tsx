"use client"

export function MoonBackground() {
  return (
    <>
      {/* 밤하늘 그라디언트 */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 130% 60% at 50% 110%, rgba(20,45,90,.55) 0%, transparent 68%),
            linear-gradient(180deg, #040810 0%, #07111e 42%, #0d1c30 78%, #040810 100%)
          `
        }}
      />
      
      {/* 별빛 */}
      <div 
        className="fixed inset-0 z-[1] pointer-events-none animate-[starTwinkle_6s_ease-in-out_infinite]"
        style={{
          opacity: 0.52,
          backgroundImage: `
            radial-gradient(1px 1px at  7%  8%, rgba(255,255,255,.88), transparent),
            radial-gradient(1px 1px at 14% 22%, rgba(255,255,255,.72), transparent),
            radial-gradient(1.5px 1.5px at 27%  6%, rgba(220,215,170,.92), transparent),
            radial-gradient(1px 1px at 38% 18%, rgba(255,255,255,.66), transparent),
            radial-gradient(1px 1px at 52% 11%, rgba(255,255,255,.77), transparent),
            radial-gradient(1.5px 1.5px at 63%  4%, rgba(220,215,170,.86), transparent),
            radial-gradient(1px 1px at 74% 15%, rgba(255,255,255,.70), transparent),
            radial-gradient(1px 1px at 83%  9%, rgba(255,255,255,.82), transparent),
            radial-gradient(1px 1px at 91% 24%, rgba(255,255,255,.66), transparent),
            radial-gradient(1px 1px at 19% 42%, rgba(255,255,255,.56), transparent),
            radial-gradient(1px 1px at 46% 35%, rgba(255,255,255,.62), transparent),
            radial-gradient(1px 1px at 78% 38%, rgba(255,255,255,.56), transparent)
          `,
          backgroundSize: '400px 280px'
        }}
      />
      
      {/* 달 */}
      <div 
        className="fixed z-[1] pointer-events-none rounded-full animate-[moonFloat_32s_ease-in-out_infinite] overflow-hidden"
        style={{
          width: 'clamp(200px, 38vw, 360px)',
          height: 'clamp(200px, 38vw, 360px)',
          top: '-6%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: `
            radial-gradient(circle at 36% 34%,
              rgba(255,255,255,.96) 0%,
              rgba(210,230,255,.82) 28%,
              rgba(155,195,248,.55) 52%,
              transparent 70%)
          `,
          boxShadow: `
            0 0  55px  38px rgba(180,210,255,.09),
            0 0 110px  72px rgba(160,200,255,.05),
            0 0 190px 110px rgba(140,185,240,.03)
          `
        }}
      >
        {/* 달 표면 질감 */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              radial-gradient(circle at 28% 30%, rgba(255,255,255,.15) 0%, transparent 30%),
              radial-gradient(circle at 64% 18%, rgba(255,255,255,.09) 0%, transparent 15%),
              radial-gradient(circle at 68% 66%, rgba(0,0,0,.07) 0%, transparent 20%),
              radial-gradient(circle at 38% 72%, rgba(0,0,0,.05) 0%, transparent 15%)
            `
          }}
        />
        {/* 글로우 링 */}
        <div 
          className="absolute rounded-full animate-[moonPulse_9s_ease-in-out_infinite]"
          style={{
            inset: '-45%',
            background: 'radial-gradient(circle, rgba(190,220,255,.07) 0%, transparent 70%)'
          }}
        />
      </div>
    </>
  )
}
