import type { Config } from 'tailwindcss'
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg:      '#0D0D0F',
          surface: '#141417',
          card:    '#1A1A1F',
          border:  '#27272A',
          hover:   '#222228',
        },
        orel: {
          purple: '#8B5CF6',
          'purple-dim': '#7C3AED',
        }
      },
    },
  },
  plugins: [],
}
export default config
