export const OGPConfig = {
  GAME_ID: import.meta.env.VITE_PLAYFUN_GAME_ID || '',
  BASE_URL: 'https://api.dev.opengameprotocol.com',
  USE_POINTS_WIDGET: true,
  THEME: 'light',
  LOG_LEVEL: 1,
} as const
