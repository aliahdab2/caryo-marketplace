import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class", // or 'media'
  theme: {
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      animation: {
        'fadeIn': 'fadeIn 0.2s ease-in-out',
        'slideDown': 'slideDown 0.2s ease-in-out',
        'heartbeat': 'heartbeat 1s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        heartbeat: {
          '0%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.3)' },
          '50%': { transform: 'scale(1)' },
          '75%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [
    // Add custom plugin to handle RTL spacing 
    function({ addUtilities, theme, config }: { addUtilities: any, theme: any, config: any }) {
      const spacingUtilities = {};
      const spacing = theme('spacing');
      
      Object.entries(spacing).forEach(([key, value]) => {
        spacingUtilities[`.rtl\\:gap-${key}`] = {
          '@media (dir: rtl), [dir="rtl"] &': {
            gap: value
          }
        };
      });
      
      addUtilities(spacingUtilities);
    },
  ],
};
export default config;
