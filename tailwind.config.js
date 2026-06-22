module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './data/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography')],
};
