export default function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden bg-ink">
      {/* Base radial vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% -10%, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 55%)',
        }}
      />

      {/* Blob 1 — ember/signal, upper left */}
      <div
        className="absolute -left-[15%] -top-[15%] h-[55vw] w-[55vw] max-h-[720px] max-w-[720px] rounded-full animate-drift"
        style={{
          background:
            'radial-gradient(circle, rgba(255,106,61,0.14) 0%, rgba(242,49,122,0.09) 45%, rgba(0,0,0,0) 72%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Blob 2 — drift/cove, lower right */}
      <div
        className="absolute -right-[10%] bottom-[-20%] h-[60vw] w-[60vw] max-h-[760px] max-w-[760px] rounded-full animate-drift"
        style={{
          background:
            'radial-gradient(circle, rgba(124,77,255,0.14) 0%, rgba(61,111,255,0.08) 45%, rgba(0,0,0,0) 72%)',
          filter: 'blur(70px)',
          animationDelay: '-7s',
        }}
      />

      {/* Fine grain to keep pure black from banding */}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  )
}
