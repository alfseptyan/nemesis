/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/frontend/**/*.{js,jsx,ts,tsx,html}',
    './src/frontend/index.html',
  ],
  theme: {
    extend: {
      colors: {
        // Nemesis raw tokens (usable as nm-sage, nm-brick, etc.)
        'nm-bg':       'var(--b0)',
        'nm-surface':  'var(--b1)',
        'nm-surface2': 'var(--b2)',
        'nm-border':   'var(--bd)',
        'nm-muted':    'var(--ba)',
        'nm-text':     'var(--t1)',
        'nm-text2':    'var(--t2)',
        'nm-text3':    'var(--t3)',
        'nm-sage':     'var(--sage)',
        'nm-olive':    'var(--olive)',
        'nm-rose':     'var(--rose)',
        'nm-brick':    'var(--brick)',
        'nm-steel':    'var(--steel)',

        // shadcn/ui semantic tokens
        background:         'hsl(var(--background) / <alpha-value>)',
        foreground:         'hsl(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT:          'hsl(var(--card) / <alpha-value>)',
          foreground:       'hsl(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT:          'hsl(var(--popover) / <alpha-value>)',
          foreground:       'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT:          'hsl(var(--primary) / <alpha-value>)',
          foreground:       'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT:          'hsl(var(--secondary) / <alpha-value>)',
          foreground:       'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT:          'hsl(var(--muted) / <alpha-value>)',
          foreground:       'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT:          'hsl(var(--accent) / <alpha-value>)',
          foreground:       'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT:          'hsl(var(--destructive) / <alpha-value>)',
          foreground:       'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        border:             'hsl(var(--border) / <alpha-value>)',
        input:              'hsl(var(--input) / <alpha-value>)',
        ring:               'hsl(var(--ring) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
