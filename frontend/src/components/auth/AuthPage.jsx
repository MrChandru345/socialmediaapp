import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import BrandPanel from './BrandPanel'
import AuthCard from './AuthCard'
import SplashScreen from './SplashScreen'
import AmbientBackground from './AmbientBackground'

const SPLASH_DURATION = 1800

export default function AuthPage({ initialTab = 'signin' }) {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false)
      }, SPLASH_DURATION)
      return () => clearTimeout(timer)
    }
  }, [showSplash])

  return (
    <div className="relative min-h-screen w-full overflow-y-auto lg:h-full lg:overflow-hidden">
      <AmbientBackground />
      <AnimatePresence mode="wait">
        {showSplash ? (
          <SplashScreen key="splash" />
        ) : (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex min-h-screen w-full flex-col lg:flex-row lg:h-full lg:overflow-hidden"
          >
            <div className="hidden lg:block w-full lg:h-full lg:w-[55%] xl:w-[56%]">
              <BrandPanel />
            </div>

            <div className="w-full min-h-screen flex items-center justify-center py-6 px-2 sm:px-4 lg:py-0 lg:px-0 lg:min-h-full lg:h-full lg:w-[45%] xl:w-[44%]">
              <AuthCard initialTab={initialTab} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
