/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOADERURL: string;
}

interface ImportMetaEnv {
  readonly VITE_CMSURL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
