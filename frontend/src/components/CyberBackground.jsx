import { useEffect, useRef } from 'react'

export default function CyberBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let animationFrameId
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)
    let mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 }

    // Multi-colored Aurora plasma waves
    const auroraOrbs = [
      { x: width * 0.15, y: height * 0.2, vx: 0.25, vy: 0.18, radius: 360, color: 'rgba(6, 182, 212, 0.16)' },
      { x: width * 0.85, y: height * 0.25, vx: -0.2, vy: 0.22, radius: 420, color: 'rgba(99, 102, 241, 0.18)' },
      { x: width * 0.5, y: height * 0.7, vx: 0.15, vy: -0.2, radius: 460, color: 'rgba(236, 72, 153, 0.14)' },
      { x: width * 0.25, y: height * 0.85, vx: 0.22, vy: -0.15, radius: 380, color: 'rgba(16, 185, 129, 0.15)' },
      { x: width * 0.75, y: height * 0.8, vx: -0.18, vy: -0.25, radius: 390, color: 'rgba(168, 85, 247, 0.16)' },
    ]

    // Crystalline starlight particles
    const particleCount = Math.min(Math.floor((width * height) / 18000), 75)
    const particles = []
    const colors = [
      'rgba(56, 189, 248, ',
      'rgba(16, 185, 129, ',
      'rgba(244, 114, 182, ',
      'rgba(168, 85, 247, ',
      'rgba(251, 191, 36, ',
    ]

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2.2 + 1,
        color: colors[i % colors.length],
        baseAlpha: Math.random() * 0.4 + 0.2,
        pulseSpeed: Math.random() * 0.02 + 0.015,
        pulseOffset: Math.random() * Math.PI * 2,
      })
    }

    function handleResize() {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    function handleMouseMove(e) {
      mouse.targetX = e.clientX
      mouse.targetY = e.clientY
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    let tick = 0

    function render() {
      tick++
      mouse.x += (mouse.targetX - mouse.x) * 0.04
      mouse.y += (mouse.targetY - mouse.y) * 0.04

      ctx.clearRect(0, 0, width, height)

      // 1. Draw Organic Aurora Glow Clouds
      auroraOrbs.forEach((orb) => {
        orb.x += orb.vx
        orb.y += orb.vy
        if (orb.x < -orb.radius) orb.x = width + orb.radius
        if (orb.x > width + orb.radius) orb.x = -orb.radius
        if (orb.y < -orb.radius) orb.y = height + orb.radius
        if (orb.y > height + orb.radius) orb.y = -orb.radius

        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius)
        grad.addColorStop(0, orb.color)
        grad.addColorStop(0.6, orb.color.replace(/[\d\.]+\)$/, '0.04)'))
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // 2. Draw Soft Perspective Wave Grid
      const horizonY = height * 0.55
      const gridSpacing = 42
      const scrollOffset = (tick * 0.5) % gridSpacing

      ctx.save()
      for (let y = horizonY; y < height; y += gridSpacing) {
        const factor = (y - horizonY) / (height - horizonY)
        const wave = Math.sin(tick * 0.015 + factor * 4) * 6 * factor
        const currentY = horizonY + Math.pow(factor, 1.4) * (height - horizonY) + (scrollOffset * factor * 0.3) + wave
        if (currentY <= height) {
          ctx.strokeStyle = 'rgba(56, 189, 248, ' + (0.02 + factor * 0.06) + ')'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(0, currentY)
          ctx.lineTo(width, currentY)
          ctx.stroke()
        }
      }

      // Vanishing perspective rays with gentle parallax
      const vanishingX = width * 0.5 + (mouse.x - width * 0.5) * 0.08
      const rayCount = 18
      for (let i = -rayCount; i <= rayCount; i++) {
        const bottomX = width * 0.5 + (i * width) / rayCount * 1.5
        ctx.strokeStyle = 'rgba(99, 102, 241, ' + Math.max(0, 0.07 - Math.abs(i) * 0.003) + ')'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(vanishingX, horizonY)
        ctx.lineTo(bottomX, height)
        ctx.stroke()
      }
      ctx.restore()

      // 3. Draw Crystalline Constellation Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const distToMouse = Math.sqrt(dx * dx + dy * dy)
        let alphaBoost = 0
        if (distToMouse < 220) {
          alphaBoost = (1 - distToMouse / 220) * 0.45
        }

        const alpha = Math.min(1, p.baseAlpha + Math.sin(tick * p.pulseSpeed + p.pulseOffset) * 0.2 + alphaBoost)

        ctx.fillStyle = p.color + alpha + ')'
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius + (alphaBoost > 0 ? 1 : 0), 0, Math.PI * 2)
        ctx.fill()

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const distX = p.x - p2.x
          const distY = p.y - p2.y
          const dist = Math.sqrt(distX * distX + distY * distY)

          if (dist < 120) {
            const linkAlpha = (1 - dist / 120) * 0.16 * alpha
            ctx.strokeStyle = 'rgba(125, 211, 252, ' + linkAlpha + ')'
            ctx.lineWidth = 0.8
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <div className="cyber-bg-wrapper" aria-hidden="true">
      <canvas ref={canvasRef} className="cyber-canvas" />
      <div className="cyber-aurora-glow" />
      <div className="cyber-grid-overlay" />
      <div className="cyber-vignette" />
    </div>
  )
}


