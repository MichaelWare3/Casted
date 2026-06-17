const PARTICLES = [
  { left: '12%', top: '18%', size: 2, duration: 9,  delay: 0 },
  { left: '28%', top: '64%', size: 1, duration: 12, delay: 1.5 },
  { left: '41%', top: '32%', size: 2, duration: 7,  delay: 0.8 },
  { left: '55%', top: '78%', size: 1, duration: 10, delay: 2.2 },
  { left: '68%', top: '22%', size: 2, duration: 8,  delay: 0.4 },
  { left: '76%', top: '54%', size: 1, duration: 11, delay: 1.1 },
  { left: '88%', top: '40%', size: 2, duration: 6,  delay: 2.7 },
  { left: '34%', top: '88%', size: 1, duration: 9,  delay: 3.0 },
]

export default function DustParticles() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[4]"
    >
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="dust-float absolute rounded-full bg-white"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: 0.15,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
