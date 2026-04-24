/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly GROQ_API_KEY: string;
  readonly GROQ_MODEL: string;
  readonly VOYAGE_API_KEY: string;
  readonly VOYAGE_MODEL: string;
  readonly TURSO_DATABASE_URL: string;
  readonly TURSO_AUTH_TOKEN: string;
  readonly DASHBOARD_PASSWORD: string;
  readonly SESSION_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    isAuthed: boolean;
  }
}
