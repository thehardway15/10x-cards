/// <reference types="astro/client" />

import type { SupabaseClient } from './db/supabase.client';
import type { Session, User } from '@supabase/supabase-js';

declare namespace App {
  interface Locals {
    supabase: SupabaseClient;
    user: User | null;
    session: Session | null;
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
