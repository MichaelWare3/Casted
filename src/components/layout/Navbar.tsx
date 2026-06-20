import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import ModeToggle from './ModeToggle'
import { useTheater } from '../../hooks/useTheater'

const navItems = [
  { to: '/cast-me', label: 'Cast Me' },
  { to: '/director', label: 'Director' },
  { to: '/browse', label: 'Browse' },
  { to: '/drop', label: 'Daily Drop' },
  { to: '/theater', label: 'Theater' },
  { to: '/you', label: 'You' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { theater } = useTheater()
  const theaterCount = theater.length

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [menuOpen])

  return (
    <header className="fixed inset-x-0 top-0" style={{ zIndex: 50 }}>
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: scrolled ? 'rgba(10,10,11,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
          transition: 'background 0.3s ease, backdrop-filter 0.3s ease',
        }}
      />
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link
          to="/"
          aria-label="CASTED — home"
          className="font-display text-xl italic tracking-[0.25em] text-casted-cream transition-colors duration-300 hover:text-casted-gold sm:text-2xl"
        >
          CASTED
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `font-body text-[10px] uppercase tracking-[0.35em] transition-colors duration-300 ${
                    isActive ? 'text-casted-gold' : 'text-casted-cream/60 hover:text-casted-cream'
                  }`
                }
                style={({ isActive }) => ({
                  paddingBottom: '4px',
                  borderBottom: isActive ? '1px solid #B8952A' : '1px solid transparent',
                })}
              >
                {item.label}
                {item.to === '/theater' && theaterCount > 0 && (
                  <span
                    aria-label={`${theaterCount} saved`}
                    className="ml-2 inline-flex items-center justify-center font-body text-[9px] tracking-normal"
                    style={{
                      minWidth: '16px',
                      height: '16px',
                      padding: '0 5px',
                      borderRadius: '9999px',
                      background: '#B8952A',
                      color: '#0A0A0B',
                      verticalAlign: 'middle',
                    }}
                  >
                    {theaterCount}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          <ModeToggle />
        </div>

        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className="md:hidden text-casted-cream"
          style={{ padding: '8px' }}
        >
          <Menu size={22} strokeWidth={1.5} />
        </button>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 flex flex-col items-center justify-center md:hidden"
            style={{
              background: 'rgba(10,10,11,0.97)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              zIndex: 60,
            }}
          >
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="absolute text-casted-cream"
              style={{ top: '20px', right: '20px', padding: '8px' }}
            >
              <X size={22} strokeWidth={1.5} />
            </button>

            <ul className="flex flex-col items-center" style={{ gap: '28px' }}>
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `font-display italic transition-colors ${
                        isActive ? 'text-casted-gold' : 'text-casted-cream'
                      }`
                    }
                    style={{ fontSize: '1.75rem' }}
                  >
                    {item.label}
                    {item.to === '/theater' && theaterCount > 0 && (
                      <span
                        aria-label={`${theaterCount} saved`}
                        className="ml-2 inline-flex items-center justify-center font-body text-[11px] not-italic"
                        style={{
                          minWidth: '22px',
                          height: '22px',
                          padding: '0 7px',
                          borderRadius: '9999px',
                          background: '#B8952A',
                          color: '#0A0A0B',
                          verticalAlign: 'middle',
                        }}
                      >
                        {theaterCount}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div style={{ marginTop: '40px' }}>
              <ModeToggle />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
