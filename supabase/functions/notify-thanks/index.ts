// supabase/functions/notify-thanks/index.ts
// Delivers notification type 1 of 2: "X sent you thanks 💛".
// Invoked by the SENDER's app right after a thanks row uploads (fire-and-forget).
// Verifies the caller's JWT and that sender + recipient share a household, then
// pushes via Expo's push API to the recipient's registered device (if any).
//
// Deploy:  npx supabase functions deploy notify-thanks
// Secrets: uses the project's built-in SUPABASE_URL / SERVICE_ROLE key (auto-provided).

import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const auth = req.headers.get('Authorization') ?? '';
    const { toMemberId, fromName } = await req.json();
    if (!toMemberId || typeof toMemberId !== 'string') {
      return new Response('bad request', { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Caller must be an authenticated member of the recipient's household
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return new Response('unauthorized', { status: 401 });

    const { data: target } = await supabase
      .from('members').select('id, household_id').eq('id', toMemberId).single();
    if (!target) return new Response('ok', { status: 200 });

    const { data: caller } = await supabase
      .from('members').select('id')
      .eq('household_id', target.household_id)
      .eq('auth_user_id', userData.user.id)
      .maybeSingle();
    if (!caller) return new Response('forbidden', { status: 403 });

    const { data: tokenRow } = await supabase
      .from('push_tokens').select('token').eq('member_id', toMemberId).maybeSingle();
    if (!tokenRow?.token) return new Response('ok', { status: 200 }); // recipient opted out / no device

    const name = typeof fromName === 'string' && fromName.trim() ? fromName.trim().slice(0, 40) : 'Someone';
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: tokenRow.token,
        title: 'HeroNest',
        body: `${name} sent you thanks 💛`,
        sound: 'default',
      }),
    });
    return new Response('ok', { status: 200 });
  } catch {
    return new Response('ok', { status: 200 }); // never let notification failures surface as errors
  }
});
