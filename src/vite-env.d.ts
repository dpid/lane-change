/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PLAYFUN_GAME_ID: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
