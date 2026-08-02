/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#050505',
        panel: '#0a0a0d',
        line: 'rgba(255,255,255,0.08)',
        ember: {
          50: '#fff4ed',
          400: '#ff8a5c',
          500: '#ff6a3d',
          600: '#f0472b',
        },
        signal: {
          400: '#ff5f8f',
          500: '#f2317a',
          600: '#c81f6b',
        },
        drift: {
          400: '#a76bff',
          500: '#7c4dff',
          600: '#5a34e0',
        },
        cove: {
          400: '#5b9bff',
          500: '#3d6fff',
          600: '#2c4fe0',
        },
        amber: {
          300: '#ffcf7a',
          400: '#ffb84d',
          500: '#f6a01c',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 120px -20px rgba(242, 49, 122, 0.35)',
        card: '0 30px 80px -30px rgba(0,0,0,0.9)',
      },
      backgroundImage: {
        'curator-spectrum':
          'linear-gradient(135deg, #ff6a3d 0%, #f2317a 35%, #7c4dff 65%, #3d6fff 100%)',
        'orb-gradient':
          'radial-gradient(circle at 32% 28%, #ffcf7a 0%, #ff6a3d 22%, #f2317a 52%, #7c4dff 78%, #3d6fff 100%)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-16px) rotate(1.5deg)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(2%, -3%) scale(1.05)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.55 },
          '50%': { opacity: 0.9 },
        },
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        floatSlow: 'floatSlow 8s ease-in-out infinite',
        drift: 'drift 14s ease-in-out infinite',
        pulseGlow: 'pulseGlow 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
