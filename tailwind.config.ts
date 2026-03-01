import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#E8A000',
          'orange-hover': '#D49000',
          'orange-light': '#F5D580',
          dark: '#1A1A1A',
          'dark-card': '#222222',
          'dark-border': '#333333',
          light: '#F0EFEB',
          'light-border': '#E0DED8',
        }
      },
      fontFamily: {
        heading: ['var(--font-heading)'],
        body: ['var(--font-body)'],
      },
    },
  },
  plugins: [],
};
export default config;
