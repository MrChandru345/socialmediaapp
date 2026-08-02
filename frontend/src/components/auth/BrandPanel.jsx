import { motion } from 'framer-motion'
import { Camera, Clapperboard, MessagesSquare } from 'lucide-react'
import logo from '../../assets/logo.png'
import FeatureCard from './FeatureCard'

const features = [
  {
    icon: Camera,
    title: 'Share beautiful moments',
    description: 'Post in full resolution, no compression compromises.',
    accent: 'linear-gradient(135deg, rgba(255,138,92,0.14), rgba(242,49,122,0.08))',
  },
  {
    icon: Clapperboard,
    title: 'Create Stories & Reels',
    description: 'Cinematic tools for motion, sound, and pace.',
    accent: 'linear-gradient(135deg, rgba(242,49,122,0.14), rgba(124,77,255,0.08))',
  },
  {
    icon: MessagesSquare,
    title: 'Connect with your community',
    description: 'Threads and spaces built for real conversation.',
    accent: 'linear-gradient(135deg, rgba(124,77,255,0.14), rgba(61,111,255,0.09))',
  },
]

export default function BrandPanel() {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center px-6 py-4 lg:py-[clamp(1rem,2.5vh,2rem)] text-center sm:px-12 lg:items-start lg:px-20 lg:text-left xl:px-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center gap-3"
      >
        <img src={logo} alt="Curator" className="h-9 w-9 lg:h-8 lg:w-8" />
        <span className="font-display text-base font-semibold tracking-tight text-white/90">
          Curator
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4 lg:mt-[clamp(0.5rem,1.5vh,1.5rem)] font-display text-[2rem] font-semibold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-4xl xl:text-[2.75rem]"
      >
        Curate your world.
        <br />
        <span className="bg-curator-spectrum bg-clip-text text-transparent">
          Share what matters.
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mt-3 lg:mt-[clamp(0.5rem,1vh,1rem)] max-w-[32rem] text-[13px] leading-relaxed text-white/45"
      >
        Curator is a next-generation social platform where creativity meets connection.
        Discover inspiring people, share unforgettable moments, create stories, publish
        reels, and build meaningful communities — all in one beautiful experience.
      </motion.p>

      <div className="mt-6 lg:mt-[clamp(0.75rem,1.5vh,1.5rem)] grid w-full max-w-[32rem] gap-2.5 text-left sm:grid-cols-1">
        {features.map((f, i) => (
          <FeatureCard key={f.title} delay={i * 0.6} {...f} />
        ))}
      </div>
    </div>
  )
}
