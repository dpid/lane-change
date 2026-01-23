/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PLAYFUN_GAME_ID: string | undefined
  readonly VITE_PLAYFUN_API_KEY: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
