import { motion } from 'framer-motion'
import logo from '../../assets/logo.png'

export default function SplashScreen() {
  return (
    <motion.div
      key="splash"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink"
      exit={{ opacity: 0, filter: 'blur(6px)' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* pure black + subtle radial gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 55% at 50% 50%, rgba(242,49,122,0.10) 0%, rgba(124,77,255,0.06) 45%, rgba(0,0,0,0) 78%)',
        }}
      />

      <div className="relative flex flex-col items-center">
        {/* soft glow behind the logo */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 340,
            height: 340,
            background:
              'radial-gradient(circle, rgba(255,138,92,0.30) 0%, rgba(242,49,122,0.20) 35%, rgba(61,111,255,0.0) 70%)',
            filter: 'blur(40px)',
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0, 0.9, 0.7], scale: [0.6, 1.15, 1] }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        />

        <motion.img
          src={logo}
          alt="Curator"
          className="relative w-28 h-28 sm:w-32 sm:h-32 drop-shadow-2xl"
          initial={{ opacity: 0, scale: 0.7, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
          transition={{
            opacity: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
            scale: { duration: 1, ease: [0.22, 1, 0.36, 1] },
            y: { duration: 2.6, ease: 'easeInOut', repeat: Infinity, repeatType: 'loop', delay: 1 },
          }}
        />

        <motion.p
          className="mt-6 font-display text-sm tracking-[0.35em] uppercase text-white/50"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          Curator
        </motion.p>
      </div>
    </motion.div>
  )
}
