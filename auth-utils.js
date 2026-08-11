import { supabase as defaultSupabase } from './supabase.js';

export async function isCurrentUserAdmin(supabase = defaultSupabase) {
    const { data, error } = await supabase.rpc('is_admin');
    return !error && data === true;
}

export async function getPostAuthRoute(supabase = defaultSupabase) {
    return (await isCurrentUserAdmin(supabase)) ? 'admin.html#dashboard' : 'home.html';
}

export async function ensureUserProfile(supabase = defaultSupabase, user, overrides = {}) {
    if (!user?.id) return null;

    const { data: existing, error: readError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    if (readError) throw readError;
    if (existing) return existing;

    const metadata = user.user_metadata || {};
    const fallbackEmailName = user.email?.split('@')[0] || 'Detective';
    const name = String(
        overrides.displayName ||
        metadata.display_name ||
        metadata.full_name ||
        fallbackEmailName
    ).trim();

    const payload = {
        id: user.id,
        username: name,
        display_name: name,
        email: overrides.email || user.email || null
    };

    const { data, error } = await supabase
        .from('profiles')
        .insert(payload)
        .select('*')
        .maybeSingle();

    if (error) {
        // A concurrent profile trigger can win the race. Re-read instead of
        // creating a duplicate or failing the authentication flow unnecessarily.
        if (error.code === '23505') {
            const { data: racedProfile, error: racedError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();
            if (!racedError && racedProfile) return racedProfile;
        }
        throw error;
    }

    return data;
}

export async function redirectAuthenticatedUser(supabase = defaultSupabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;
    const route = await getPostAuthRoute(supabase);
    window.location.replace(new URL(route, window.location.href).href);
    return true;
}
