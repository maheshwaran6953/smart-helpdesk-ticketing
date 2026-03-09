module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#EEF2F8',
        surface: '#FFFFFF',
        surface2: '#F5F7FB',
        border: '#E2E8F0',
        border2: '#C8D3E5',
        blue: {
          DEFAULT: '#3563E9',
          hover: '#2451CC',
          soft: '#EBF0FF',
          mid: '#BDD0FF',
        },
        indigo: {
          DEFAULT: '#5046E4',
          soft: '#EDECFF',
        },
        green: {
          DEFAULT: '#0A8F64',
          soft: '#E8FBF4',
        },
        red: {
          DEFAULT: '#D93B4A',
          soft: '#FFF0F1',
        },
        orange: {
          DEFAULT: '#D4671A',
          soft: '#FFF4EC',
        },
        amber: {
          DEFAULT: '#A8640A',
          soft: '#FFFAEB',
        },
        purple: {
          DEFAULT: '#6D31D9',
          soft: '#F4EEFF',
        },
        text: {
          DEFAULT: '#0D1526',
          secondary: '#4A566E',
          muted: '#8898B4',
          disabled: '#B8C4D6',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        heading: ['Sora', 'sans-serif'],
      },
      boxShadow: {
        'sh0': '0 1px 2px rgba(13,21,38,0.04)',
        'sh1': '0 1px 4px rgba(13,21,38,0.06), 0 4px 14px rgba(13,21,38,0.04)',
        'sh2': '0 4px 20px rgba(13,21,38,0.09)',
        'sh3': '0 12px 40px rgba(13,21,38,0.12)',
      },
      borderRadius: {
        'card': '14px',
        'btn': '9px',
        'input': '9px',
        'badge': '6px',
        'avatar': '9px',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
