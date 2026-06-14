import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Person = {
  id: string;
  name: string;
  nickname?: string;
  bio?: string;
  superlative?: string;
  photo_url?: string;
  types: string[];
  hp: number;
};

export type Photo = {
  id: string;
  url: string;
  caption?: string;
  person_ids: string[];
  chapter?: string;
  is_group: boolean;
  created_at: string;
};

export async function getPeople(): Promise<Person[]> {
  const { data, error } = await supabase.from('people').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function getPhotos(filter?: { person_id?: string; is_group?: boolean; chapter?: string }): Promise<Photo[]> {
  let query = supabase.from('photos').select('*').order('created_at', { ascending: false });

  if (filter?.is_group !== undefined) {
    query = query.eq('is_group', filter.is_group);
  }
  if (filter?.chapter) {
    query = query.eq('chapter', filter.chapter);
  }
  if (filter?.person_id) {
    query = query.contains('person_ids', [filter.person_id]);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getPhotoUrl(path: string): Promise<string> {
  const { data } = supabase.storage.from('photos').getPublicUrl(path);
  return data.publicUrl;
}

export async function verifyPasscode(code: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('config')
    .select('value')
    .eq('key', 'passcode')
    .single();

  if (error || !data) return false;
  return data.value === code;
}
