// Quick Log Edge Function — turns natural language into structured household tasks.
// Provider-agnostic: model/endpoint/key are Supabase secrets, never in the app.
//   LLM_API_KEY  (required)            e.g. an OpenAI key
//   LLM_API_URL  (default OpenAI)      any OpenAI-compatible chat completions URL
//   LLM_MODEL    (default gpt-5.4-mini)
// Guardrails (build plan §8/§9 + Quick Log spec): structures tasks only — never
// infers blame, family dynamics, or feelings; mental load is real work.

const CATEGORY_KEYS = [
  'cleaning', 'cooking', 'laundry', 'waste', 'child_logistics', 'planning',
  'remembering', 'emotional', 'pets', 'maintenance', 'shopping', 'homework', 'other',
] as const;

const SYSTEM_PROMPT = `You convert a family member's description of household work into structured tasks.
Output ONLY a JSON object: {"tasks":[{"title":string,"categoryKey":string,"minutes":number}]}
Rules:
- Split the text into one task per distinct activity.
- title: short, past tense, neutral (e.g. "Packed lunches"). Never mention other people's effort levels.
- categoryKey: exactly one of ${JSON.stringify(CATEGORY_KEYS)}.
  planning = organising/admin/booking/ordering; remembering = keeping track of dates/forms/needs;
  emotional = comforting, calming, supporting someone. These mental-load categories are real work — use them confidently.
- minutes: realistic estimate, 5–120, integer.
- If text is not about household/family work, return {"tasks":[]}.
- Never add commentary, advice, judgements about fairness, or anything beyond the JSON.`;

Deno.serve(async (req: Request) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string' || text.length > 1000) {
      return new Response(JSON.stringify({ error: 'invalid input' }), { status: 400, headers: cors });
    }
    const apiKey = Deno.env.get('LLM_API_KEY');
    if (!apiKey) return new Response(JSON.stringify({ error: 'not configured' }), { status: 500, headers: cors });
    const url = Deno.env.get('LLM_API_URL') ?? 'https://api.openai.com/v1/chat/completions';
    const model = Deno.env.get('LLM_MODEL') ?? 'gpt-5.4-mini';

    const llm = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
      }),
    });
    if (!llm.ok) {
      return new Response(JSON.stringify({ error: 'llm unavailable' }), { status: 502, headers: cors });
    }
    const data = await llm.json();
    const raw = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
    // Validate & clamp — the app trusts nothing it didn't check.
    const tasks = (Array.isArray(raw.tasks) ? raw.tasks : [])
      .slice(0, 10)
      .map((t: Record<string, unknown>) => ({
        title: String(t.title ?? '').slice(0, 80) || 'Household task',
        categoryKey: (CATEGORY_KEYS as readonly string[]).includes(String(t.categoryKey))
          ? String(t.categoryKey) : 'other',
        minutes: Math.max(5, Math.min(120, Math.round(Number(t.minutes) || 15))),
      }));
    return new Response(JSON.stringify({ tasks }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'parse failed' }), { status: 500, headers: cors });
  }
});
