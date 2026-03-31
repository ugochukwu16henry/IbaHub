import 'server-only';

import { createClient, type User as SupabaseUser } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  '';

const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    })
  : null;

export async function getSupabaseUserFromRequest(
  request: NextRequest
): Promise<SupabaseUser | null> {
  if (!supabase) return null;

  const cookieToken =
    request.cookies.get('sb-access-token')?.value ??
    request.cookies.get('supabase-auth-token')?.value;
  const headerToken = request.headers
    .get('authorization')
    ?.replace(/^Bearer\s+/i, '')
    .trim();

  const accessToken = cookieToken || headerToken;
  if (!accessToken) return null;

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return null;
  return data.user;
}

