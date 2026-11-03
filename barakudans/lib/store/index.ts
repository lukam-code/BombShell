import { FileStore } from './file';
import { SupabaseStore } from './supabase';
import type { Store } from './types';

const g = globalThis as unknown as { __bkStore?: Store };

/** Singleton: Supabase ako su postavljeni SUPABASE_URL + SERVICE_ROLE ključ, inače lokalni JSON fajl. */
export function getStore(): Store {
  if (!g.__bkStore) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    g.__bkStore = url && key ? new SupabaseStore(url, key) : new FileStore();
  }
  return g.__bkStore;
}
