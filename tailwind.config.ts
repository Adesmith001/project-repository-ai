import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        slate: {
          25: '#f8fafc',
        },
      },
      boxShadow: {
        panel: '0 12px 30px rgba(15, 23, 42, 0.07)',
      },
    },
  },
  plugins: [],
} satisfies Config
