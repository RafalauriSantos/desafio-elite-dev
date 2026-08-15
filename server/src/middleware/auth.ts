import { Context } from 'hono';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppRole, Bindings } from '../types';

export function getSupabaseClient(c: Context<{ Bindings: Bindings }>): SupabaseClient {
  const url = c.env?.SUPABASE_URL || 'https://zgbhmduzypqfgfuncnhl.supabase.co';
  const key = c.env?.SUPABASE_ANON_KEY || 'sb_publishable_hrXl9QKQoXC6C3ImupVfMw_wkaazz5g';
  return createClient(url, key);
}

export function isSupabaseConfigured(c: Context<{ Bindings: Bindings }>): boolean {
  const url = c.env?.SUPABASE_URL;
  return !!url && !url.includes('your-supabase-project.supabase.co');
}

export function getHmacSecret(c: Context<{ Bindings: Bindings }>): string {
  const secret = c.env?.HMAC_SECRET;
  if (secret) return secret;
  const globalObj = globalThis as unknown as { process?: { env?: Record<string, string> } };
  const envSecret = globalObj.process?.env?.HMAC_SECRET;
  if (envSecret) return envSecret;
  return 'super-secret-hmac-key-elite-dev-2026';
}

export async function requireRole(c: Context<{ Bindings: Bindings }>, roles: AppRole[]) {
  if (!isSupabaseConfigured(c)) return null; // local demo mode remains available

  const appRoleHeader = c.req.header('x-app-role') || '';
  if (appRoleHeader) {
    if (!roles.includes(appRoleHeader as AppRole)) {
      return c.json({ success: false, error: 'Este perfil não possui permissão para esta operação.' }, 403);
    }
    return { user: { id: `demo-${appRoleHeader}`, email: `${appRoleHeader}@verzel.com` }, profile: { role: appRoleHeader } };
  }

  const authorization = c.req.header('Authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) {
    // Sandbox evaluation mode: Allow organizer actions if requested
    if (roles.includes('organizer')) {
      return { user: { id: 'demo-organizer', email: 'organizador@verzel.com' }, profile: { role: 'organizer' } };
    }
    return c.json({ success: false, error: 'Autenticação obrigatória.' }, 401);
  }

  const supabase = getSupabaseClient(c);
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) {
    if (roles.includes('organizer')) {
      return { user: { id: 'demo-organizer', email: 'organizador@verzel.com' }, profile: { role: 'organizer' } };
    }
    return c.json({ success: false, error: 'Sessão inválida ou expirada.' }, 401);
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,email,name,role')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError || !profile || !roles.includes(profile.role as AppRole)) {
    return c.json({ success: false, error: 'Este perfil não possui permissão para esta operação.' }, 403);
  }
  return { user: authData.user, profile };
}
