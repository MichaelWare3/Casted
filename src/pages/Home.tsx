import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import TrendingRow from '../components/home/TrendingRow'
import ForYouRow from '../components/home/ForYouRow'
import DustParticles from '../components/home/DustParticles'
import { useDocTitle } from '../hooks/useDocTitle'

export default function Home() {
  useDocTitle('CASTED — Find Yourself in Film')
  return (
    <div className="relative min-h-screen bg-casted-black">
      <Navbar />

      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-casted-black px-6 pb-[60px] text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[5%] z-[1] w-[55%] max-w-[600px] -translate-x-1/2"
        >
          <motion.img
            src="/images/hero-face.png"
            alt=""
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 3.5, ease: 'easeOut', delay: 0.5 }}
            className="block w-full select-none"
            style={{
              filter: 'grayscale(25%) brightness(0.38) contrast(1.6) sepia(30%)',
              mixBlendMode: 'luminosity',
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              borderRadius: 0,
              WebkitMaskImage:
                'radial-gradient(ellipse 55% 60% at 50% 40%, black 20%, rgba(0,0,0,0.8) 40%, transparent 70%)',
              maskImage:
                'radial-gradient(ellipse 55% 60% at 50% 40%, black 20%, rgba(0,0,0,0.8) 40%, transparent 70%)',
            }}
          />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 z-[2] w-[55%] max-w-[600px] -translate-x-1/2"
          style={{
            top: '58%',
            height: '20%',
            background:
              'radial-gradient(ellipse 30% 60% at 50% 50%, rgba(180, 120, 20, 0.15) 0%, transparent 70%)',
          }}
        />

        <DustParticles />

        <div className="relative z-10 flex flex-col items-center">

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.9, ease: 'easeOut' }}
          className="relative font-display text-7xl italic leading-[0.9] tracking-[0.04em] text-casted-cream sm:text-9xl md:text-[10rem] lg:text-[13rem]"
        >
          CASTED
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.9, ease: 'easeOut' }}
          className="relative mt-12 font-display text-2xl italic text-[#F2ECD8] sm:text-3xl md:text-4xl"
        >
          Find yourself in film.
        </motion.p>

        <div
          className="relative flex flex-col items-center gap-7"
          style={{ marginTop: '80px' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.9, ease: 'easeOut' }}
          >
            <Link
              to="/cast-me"
              className="group relative inline-block px-10 py-4 transition-transform duration-[250ms] ease-out hover:scale-[1.06]"
            >
              <span
                aria-hidden="true"
                className="cta-breath pointer-events-none absolute inset-0 -mx-12 -my-10"
                style={{
                  background:
                    'radial-gradient(ellipse at center, rgba(184,149,42,0.35) 0%, transparent 65%)',
                }}
              />
              <span className="relative inline-block">
                <span className="font-display text-5xl italic text-casted-cream transition-colors duration-300 group-hover:text-[#B8952A] sm:text-6xl">
                  CAST ME
                </span>
                <span
                  aria-hidden="true"
                  className="cta-shimmer pointer-events-none absolute inset-0 font-display text-5xl italic sm:text-6xl"
                >
                  CAST ME
                </span>
                <span className="cta-underline absolute -bottom-2 left-0 h-px w-full bg-[#B8952A] transition-colors duration-300 group-hover:bg-[#D4A843]" />
              </span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.9, ease: 'easeOut' }}
          >
            <Link to="/drop" className="group inline-block px-4 py-1">
              <span className="font-body text-sm uppercase tracking-widest text-[#4A4A55] transition-colors duration-300 group-hover:text-[#6B6B7A]">
                Just Pick Something
              </span>
            </Link>
          </motion.div>
        </div>
        </div>
      </section>

      <ForYouRow />
      <TrendingRow />
    </div>
  )
}
