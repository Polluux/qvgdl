/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHEET_CSV_URL: string;
  readonly VITE_SECURITY_PASSPHRASE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
