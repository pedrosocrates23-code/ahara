/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,ts,jsx,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        linen:         '#f4e7da',
        'brand-purple': '#6654ca',
        'brand-red':    '#d40800',   // WCAG AA: 5.02:1 com texto branco
        'brand-yellow': '#ffd800',
        'brand-green':  '#0f8a4c',   // WCAG AA: 5.14:1 com texto branco
        'brand-pink':   '#e84aaf',   // levemente escurecido para contraste
        'brand-orange': '#ff5130',
      },
      fontFamily: {
        display: ['"Best Curry"', '"Fredoka"', 'sans-serif'],
        body:    ['"Maxima Nouva"', '"DM Sans"', 'sans-serif'],
        script:  ['"Vagodha"', '"Dancing Script"', 'cursive'],
        impact:  ['"Abolition"', '"Anton"', 'sans-serif'],
      },
      boxShadow: {
        brutal:          '4px 4px 0 0 #000',
        'brutal-lg':     '6px 6px 0 0 #000',
        'brutal-purple': '4px 4px 0 0 #6654ca',
        'brutal-yellow': '4px 4px 0 0 #ffd800',
        'brutal-red':    '4px 4px 0 0 #ff0800',
        'brutal-green':  '4px 4px 0 0 #14b664',
      },
    },
  },
  plugins: [],
};
