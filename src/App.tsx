import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import FilmGrainOverlay from './components/layout/FilmGrainOverlay'
import Home from './pages/Home'
import AlterEgo from './pages/AlterEgo'
import Director from './pages/Director'
import Drop from './pages/Drop'
import Theater from './pages/Theater'
import Browse from './pages/Browse'

const transition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.4, ease: 'easeInOut' as const },
}

function PageWrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={transition.initial}
      animate={transition.animate}
      exit={transition.exit}
      transition={transition.transition}
    >
      {children}
    </motion.div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrap><Home /></PageWrap>} />
        <Route path="/cast-me" element={<PageWrap><AlterEgo /></PageWrap>} />
        <Route path="/alter-ego" element={<Navigate to="/cast-me" replace />} />
        <Route path="/director" element={<PageWrap><Director /></PageWrap>} />
        <Route path="/drop" element={<PageWrap><Drop /></PageWrap>} />
        <Route path="/theater" element={<PageWrap><Theater /></PageWrap>} />
        <Route path="/browse" element={<PageWrap><Browse /></PageWrap>} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <FilmGrainOverlay />
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
