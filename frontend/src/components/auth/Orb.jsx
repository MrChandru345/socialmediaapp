import { motion } from 'framer-motion'

/**
 * The Orb is Curator's signature element — a distilled echo of the little
 * glowing sphere nested inside the wordmark's "C". It reappears across the
 * experience (splash glow, ambient background, tab indicator) so the brand
 * feels like one continuous idea rather than a stock login screen.
 */
export default function Orb({ size = 120, floating = true, className = '' }) {
  const content = (
    <div
      className={`relative rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 34% 30%, #ffe1b8 0%, #ff8a5c 20%, #f2317a 48%, #7c4dff 76%, #3d6fff 100%)',
          boxShadow: `0 0 ${size * 0.8}px ${size * 0.12}px rgba(242, 49, 122, 0.35)`,
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          top: '14%',
          left: '20%',
          width: '30%',
          height: '22%',
          background: 'rgba(255,255,255,0.75)',
          filter: 'blur(2px)',
        }}
      />
    </div>
  )

  if (!floating) return content

  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {content}
    </motion.div>
  )
}
