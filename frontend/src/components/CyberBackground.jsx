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

    // Particle nodes for cyber mesh
    const particleCount = Math.min(Math.floor((width * height) / 20000), 70)
    const particles = []

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        colorPrefix: i % 3 === 0 ? 'rgba(56, 189, 248, ' : i % 3 === 1 ? 'rgba(16, 185, 129, ' : 'rgba(168, 85, 247, ',
        baseAlpha: Math.random() * 0.35 + 0.15,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulseOffset: Math.random() * Math.PI * 2,
      })
    }

    // Floating liquid plasma orbs
    const plasmaOrbs = [
      { x: width * 0.2, y: height * 0.25, vx: 0.2, vy: 0.15, radius: 280, color: 'rgba(56, 189, 248, 0.09)' },
      { x: width * 0.8, y: height * 0.35, vx: -0.15, vy: 0.2, radius: 320, color: 'rgba(168, 85, 247, 0.08)' },
      { x: width * 0.5, y: height * 0.75, vx: 0.1, vy: -0.18, radius: 360, color: 'rgba(16, 185, 129, 0.07)' },
      { x: width * 0.15, y: height * 0.8, vx: 0.18, vy: -0.12, radius: 260, color: 'rgba(6, 182, 212, 0.08)' },
    ]

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
      mouse.x += (mouse.targetX - mouse.x) * 0.05
      mouse.y += (mouse.targetY - mouse.y) * 0.05

      ctx.clearRect(0, 0, width, height)

      // 1. Draw Liquid Plasma Blobs with radial glow
      plasmaOrbs.forEach((orb) => {
        orb.x += orb.vx
        orb.y += orb.vy
        if (orb.x < -orb.radius) orb.x = width + orb.radius
        if (orb.x > width + orb.radius) orb.x = -orb.radius
        if (orb.y < -orb.radius) orb.y = height + orb.radius
        if (orb.y > height + orb.radius) orb.y = -orb.radius

        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius)
        grad.addColorStop(0, orb.color)
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // 2. Draw Perspective Cyber Horizon Grid
      const horizonY = height * 0.58
      const gridSpacing = 44
      const scrollOffset = (tick * 0.7) % gridSpacing

      ctx.save()
      // Horizontal perspective grid lines
      for (let y = horizonY; y < height; y += gridSpacing) {
        const factor = (y - horizonY) / (height - horizonY)
        const currentY = horizonY + Math.pow(factor, 1.5) * (height - horizonY) + (scrollOffset * factor * 0.4)
        if (currentY <= height) {
          ctx.strokeStyle = 'rgba(56, 189, 248, ' + (0.02 + factor * 0.07) + ')'
          ctx.beginPath()
          ctx.moveTo(0, currentY)
          ctx.lineTo(width, currentY)
          ctx.stroke()
        }
      }

      // Vanishing perspective rays
      const vanishingX = width * 0.5 + (mouse.x - width * 0.5) * 0.1
      const rayCount = 20
      for (let i = -rayCount; i <= rayCount; i++) {
        const bottomX = width * 0.5 + (i * width) / rayCount * 1.6
        ctx.strokeStyle = 'rgba(168, 85, 247, ' + Math.max(0, 0.08 - Math.abs(i) * 0.0035) + ')'
        ctx.beginPath()
        ctx.moveTo(vanishingX, horizonY)
        ctx.lineTo(bottomX, height)
        ctx.stroke()
      }
      ctx.restore()

      // 3. Draw Connecting Cyber Particles & Constellation Links
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
        if (distToMouse < 200) {
          alphaBoost = (1 - distToMouse / 200) * 0.5
        }

        const alpha = Math.min(1, p.baseAlpha + Math.sin(tick * p.pulseSpeed + p.pulseOffset) * 0.15 + alphaBoost)

        ctx.fillStyle = p.colorPrefix + alpha + ')'
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius + (alphaBoost > 0 ? 1 : 0), 0, Math.PI * 2)
        ctx.fill()

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const distX = p.x - p2.x
          const distY = p.y - p2.y
          const dist = Math.sqrt(distX * distX + distY * distY)

          if (dist < 115) {
            const linkAlpha = (1 - dist / 115) * 0.18 * alpha
            ctx.strokeStyle = 'rgba(56, 189, 248, ' + linkAlpha + ')'
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
      <div className="cyber-grid-overlay" />
      <div className="cyber-scanline" />
      <div className="cyber-vignette" />
    </div>
  )
}

