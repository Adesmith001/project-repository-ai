export const themeTokens = {
  colors: {
    background: '#f7f8fa',
    surface: '#ffffff',
    text: '#0f172a',
    muted: '#5f6b7d',
    accent: '#1d4ed8',
  },
  spacing: {
    section: 'clamp(3.2rem, 7vw, 7rem)',
    contentMaxWidth: '1180px',
  },
  radius: {
    card: '20px',
    control: '14px',
  },
  shadow: {
    soft: '0 10px 30px rgba(15, 23, 42, 0.07)',
    float: '0 24px 60px rgba(15, 23, 42, 0.12)',
  },
  typography: {
    display: 'clamp(2.25rem, 5vw, 4.7rem)',
    body: '1rem',
  },
} as const
