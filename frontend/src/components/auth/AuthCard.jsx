import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SignInForm from './SignInForm'
import SignUpForm from './SignUpForm'
import Orb from './Orb'
import logo from '../../assets/logo.png'

const TABS = [
  { id: 'signin', label: 'Sign In' },
  { id: 'signup', label: 'Sign Up' },
]

export default function AuthCard({ initialTab = 'signin' }) {
  const [tab, setTab] = useState(initialTab)

  return (
    <div className="relative flex min-h-full items-center justify-center px-6 py-4 lg:py-[clamp(1rem,2.5vh,2rem)] sm:px-10 lg:px-12">
      {/* ambient orb glow, echoes the wordmark's sphere */}
      <div className="pointer-events-none absolute -right-10 -top-10 opacity-70 blur-[2px]">
        <Orb size={90} />
      </div>
      <div className="pointer-events-none absolute -left-16 bottom-10 opacity-30 blur-[3px]">
        <Orb size={130} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.85, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong relative w-full max-w-[380px] overflow-hidden rounded-[24px] p-5 shadow-card sm:p-6"
      >
        {/* faint top sheen */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-60"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 100%)',
          }}
        />

        {/* mobile logo header */}
        <div className="relative mb-4 flex items-center justify-center gap-2.5 lg:hidden">
          <img src={logo} alt="Curator" className="h-8 w-8" />
          <span className="font-display text-lg font-semibold tracking-tight text-white/90">
            Curator
          </span>
        </div>

        <div className="relative mb-4 flex rounded-xl bg-white/[0.03] p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="relative flex-1 rounded-lg py-2 text-[13px] font-semibold transition-colors"
            >
              {tab === t.id && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-lg bg-curator-spectrum"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className={`relative z-10 ${tab === t.id ? 'text-white' : 'text-white/45'}`}>
                {t.label}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'signin' ? (
            <div key="signin-head">
              <HeadingBlock
                title="Welcome Back"
                subtitle="Sign in to continue your journey."
              />
            </div>
          ) : (
            <div key="signup-head">
              <HeadingBlock title="Create Your Account" subtitle="Join Curator in under a minute." />
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {tab === 'signin' ? (
            <SignInForm key="signin" onSwitch={() => setTab('signup')} />
          ) : (
            <SignUpForm key="signup" onSwitch={() => setTab('signin')} />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function HeadingBlock({ title, subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.35 }}
      className="mb-4"
    >
      <h2 className="font-display text-[22px] font-semibold tracking-tight text-white">
        {title}
      </h2>
      <p className="mt-1 text-[12.5px] text-white/40">{subtitle}</p>
    </motion.div>
  )
}
