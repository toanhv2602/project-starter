/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Empty = same origin (recommended). Set only when the API is on another origin. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
