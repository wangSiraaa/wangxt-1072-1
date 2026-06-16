/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fefdf8',
          100: '#fef9e7',
          200: '#fdf0c4',
          300: '#fbe49c',
          400: '#f7d060',
          500: '#f4c143',
          600: '#e6a92d',
          700: '#c98920',
          800: '#a56c1e',
          900: '#87581c',
        },
        burgundy: {
          50: '#fdf2f4',
          100: '#fbe6eb',
          200: '#f7cdd7',
          300: '#f0a4b5',
          400: '#e7728b',
          500: '#da4a6a',
          600: '#c52e53',
          700: '#a52344',
          800: '#8a1f3c',
          900: '#761d37',
        },
      },
    },
  },
  plugins: [],
}
