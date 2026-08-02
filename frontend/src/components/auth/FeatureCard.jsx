import { motion } from 'framer-motion'

export default function FeatureCard({ icon: Icon, title, description, delay = 0, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.55 + delay * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* inner element owns the continuous CSS float; hover pauses the float
          and applies a CSS lift instead, so the two transforms never fight */}
      <div
        className="group relative -translate-y-0 overflow-hidden rounded-2xl glass p-4 lg:p-3.5 animate-float
          transition-transform duration-300 will-change-transform
          hover:-translate-y-1 hover:[animation-play-state:paused]"
        style={{ animationDelay: `${delay}s` }}
      >
        {/* gradient hover wash */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: accent }}
        />

        <div className="relative flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] border border-white/10 text-[18px]">
            <Icon size={18} strokeWidth={1.75} className="text-white/85" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-[14px] font-semibold text-white/95">{title}</h3>
            <p className="mt-0.5 text-[12px] leading-relaxed text-white/45">{description}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
