'use client'

import { useEffect } from 'react'

interface ParticleBurstProps {
  x: number
  y: number
  trigger: boolean
  onComplete?: () => void
}

export function ParticleBurst({ x, y, trigger, onComplete }: ParticleBurstProps) {
  useEffect(() => {
    if (!trigger) return

    const particles: HTMLDivElement[] = []

    /* 12개 파티클 생성 */
    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div')
      particle.className = 'particle'
      particle.innerHTML = '<div class="particle-inner">✨</div>'

      const angle = (i / 12) * Math.PI * 2
      const distance = 60 + Math.random() * 40
      const tx = Math.cos(angle) * distance
      const ty = Math.sin(angle) * distance

      const duration = 0.8 + Math.random() * 0.4

      Object.assign(particle.style, {
        left: `${x}px`,
        top: `${y}px`,
        '--tx': `${tx}px`,
        '--ty': `${ty}px`,
        '--duration': `${duration}s`,
      } as any)

      document.body.appendChild(particle)
      particles.push(particle)
    }

    /* 애니메이션 완료 후 제거 */
    const timer = setTimeout(() => {
      particles.forEach((p) => p.remove())
      onComplete?.()
    }, 1200)

    return () => {
      clearTimeout(timer)
      particles.forEach((p) => p.remove())
    }
  }, [trigger, x, y, onComplete])

  return null
}
