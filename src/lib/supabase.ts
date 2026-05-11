import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getEnv(key: string, fallback: string): string {
  const viteEnv = typeof import.meta !== 'undefined' ? import.meta.env?.[key] : undefined;
  if (viteEnv) return viteEnv;

  const processEnv = typeof process !== 'undefined' ? process.env?.[key] : undefined;
  return processEnv || fallback;
}

function isConfigured(): boolean {
  const url = getEnv('VITE_SUPABASE_URL', getEnv('NEXT_PUBLIC_SUPABASE_URL', ''));
  return url.length > 0 && !url.includes('your-project-id');
}

declare global {
  var __biteblastSupabaseClient__: SupabaseClient | undefined;
}

function createBrowserSupabaseClient(): SupabaseClient {
  const url = getEnv('VITE_SUPABASE_URL', getEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://placeholder.supabase.co'));
  const key = getEnv('VITE_SUPABASE_ANON_KEY', getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'placeholder-anon-key'));

  if (!globalThis.__biteblastSupabaseClient__) {
    globalThis.__biteblastSupabaseClient__ = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'biteblast-auth',
      },
    });
  }

  return globalThis.__biteblastSupabaseClient__;
}

export const supabase = createBrowserSupabaseClient();

export function getSupabase(): SupabaseClient {
  return supabase;
}

export const supabaseConfigured = isConfigured();

export type { SupabaseClient } from '@supabase/supabase-js';
