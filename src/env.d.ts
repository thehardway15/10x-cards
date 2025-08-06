/// <reference types="astro/client" />

import type { createSupabaseServerInstance } from "./db/supabase.client";
import type { User } from "@supabase/supabase-js";

declare namespace App {
  interface Locals {
    supabase: ReturnType<typeof createSupabaseServerInstance> | null;
    user: User | null;
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
