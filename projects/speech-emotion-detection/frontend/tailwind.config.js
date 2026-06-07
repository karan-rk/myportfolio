// tailwind.config.js
module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'], // For Tailwind v2
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'], // For Tailwind v3
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        // Custom color palette
        primary: '#1D4ED8',
        secondary: '#9333EA',
        accent: '#10B981',
      },
      animation: {
        'pulse-slow': 'pulse 3s linear infinite',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
