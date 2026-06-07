/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PRINTROVE_API_KEY: string;
  readonly VITE_QIKINK_CLIENT_ID: string;
  readonly VITE_QIKINK_TOKEN: string;
  readonly VITE_BLINKSTORE_API_KEY: string;
  readonly VITE_VENDORGO_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
