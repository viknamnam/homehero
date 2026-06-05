# HomeHero — Phased Build & Launch Plan

**Status:** Living document — tick items as completed, add gaps to Section 11 as discovered.
**Owner:** Product team
**Last updated:** 05 June 2026
**North star:** Less arguing. More appreciation. Better teamwork at home.

Legend: `[ ]` not started · `[x]` done · `[~]` in progress (edit manually) · 🔒 = launch blocker for that phase

---

## How to use this document

1. Each phase has a **goal**, a **task checklist**, **exit criteria**, and a **go/no-go gate**.
2. Do not start a phase until the previous phase's exit criteria are met (or a conscious exception is logged in Section 11).
3. Anything emotionally sensitive (balance %, money display, rebalancing suggestions, AI output) ships behind a **feature flag**.
4. Every user-facing string passes the **copy checklist** (Section 9) before merge.
5. Newly discovered work goes into **Section 11 — Gaps & decisions log**, then gets pulled into the right phase.

---

## Phase 0 — Foundations & validation (Weeks 1–3)

**Goal:** De-risk logging friction and emotional framing before building. Lock stack, schema, categories, and tone.

### 0.1 Product & design

- [ ] Figma prototype: **Today / Home** screen (tasks done, time, value, balance indicator, quick add, send thanks)
- [ ] Figma prototype: **Add Task** flow (category chips → duration → person → value preview → save)
- [ ] Figma prototype: **Week Summary** (hours, value, hours-by-day, category breakdown incl. mental load, vs last week)
- [ ] Figma prototype: **Family Balance** ("Great team" framing, contribution by time/category/value, Plan Next Week CTA)
- [x] Define design system tokens: palette (warm white, sage, coral, peach, butter yellow, sky blue, lavender, charcoal/navy), type scale, spacing, rounded component style
- [x] Define person colours and category colours/icons (13 core categories)
- [ ] Accessibility pass on palette (contrast ratios for text on pastels)

### 0.2 Prototype testing (5–8 real households)

- [ ] Recruit 5–8 households (mix: primary organiser, reluctant partner, at least 2 with kids 6–14)
- [ ] 🔒 Test: can a parent complete the Add Task prototype flow in **<10 seconds**?
- [ ] 🔒 Test: does the Family Balance screen read as *planning* or *judgement*? (interview both partners separately)
- [ ] Test: reaction to estimated value figure — note who wants it hidden and why
- [ ] Test: reaction to the "Invaluable" label on emotional/mental-load value (does it soften or confuse the money framing?)
- [ ] Test: do users understand "mental load" categories without explanation? (If not, rename/iconography fix)
- [ ] Write up findings; adjust screens and copy before build starts

### 0.3 Technical foundations

- [x] Decide stack (recommended: React Native or Flutter + Supabase/Firebase or Node/Postgres)
- [x] Decide auth approach (email + magic link recommended for family onboarding simplicity)
- [~] Set up repo, CI/CD, environments (repo + GitHub + staging Supabase done; CI + prod env pending)
- [ ] Set up feature flag system (even a simple remote-config flag service)
- [ ] Set up privacy-conscious analytics (event schema drafted: task_logged, log_duration_ms, thanks_sent, balance_viewed, money_hidden_toggled, weekly_review_opened)
- [x] Implement data model v1:
  - [x] `User` (id, name, role [adult/child/caregiver/guest], age_group, avatar, permissions)
  - [x] `Household` (id, members, currency, locale, default_rates)
  - [x] `Task` (id, title, category, subcategory, date_time, duration, assigned_user, created_by, source, notes, is_recurring_instance)
  - [x] `Category` (name, icon, colour, default_rate, mental_load_flag)
  - [x] `Rate` (category_id, hourly_rate, currency, source, custom_override)
  - [x] `Appreciation` (from_user, to_user, message, related_tasks, date)
  - [x] Reserve (don't build yet): `Reward`, `Suggestion` tables for V1.1
- [x] Seed the 13 core categories with `mental_load_flag` set on Planning/Admin, Remembering, Emotional Support, Child Logistics (logistics = partial — decide and log in Section 11)

### 0.4 Copy & tone foundations

- [x] Write UX copy library v1: all phrases for Today, Add Task, Week Summary, Balance, empty states, errors
- [x] Codify the avoid-list / use-instead table as a linted string review checklist (see Section 9)
- [x] Draft notification copy set (gentle prompts only) for later phases
- [ ] Draft privacy policy outline (flag children's-data requirements early — see Section 10)

### Phase 0 exit criteria (go/no-go)

- [ ] Prototype log flow tested at <10s with real users
- [ ] Balance screen copy validated with at least one couple (no "judgement" reaction)
- [x] Stack, schema, and category list locked
- [ ] Copy library v1 approved

---

## Phase 1 — Private alpha: the logging core (Weeks 4–8)

**Goal:** Prove the core loop — *will households log repeatedly for two weeks?* Nothing else matters yet.

**In scope:** household setup, adult profiles, quick logging, today view, week summary, value calc, hide-money toggle.
**Deliberately out:** balance percentages, Kids Mode, AI, appreciation cards, notifications.

### Sprint 1 (Weeks 4–5): Household + logging

- [x] Onboarding: create account → create household → set currency → add adult members (invite by link/code)
- [x] Household member avatars + person colours
- [x] 🔒 Quick Add Task: category chips (13 categories), duration selector (preset chips: 5/10/15/30/45/60 min + custom), person selector (defaults to me), save in one tap
- [x] Optional notes field (collapsed by default — never in the critical path)
- [x] Edit task / delete task
- [x] Backdate a task (e.g. "this morning") — simple date/time adjust
- [x] Today / Home screen v1: today's tasks, time spent, top categories, quick add CTA
- [x] Empty states with warm copy ("Log your first task — even small things count")

### Sprint 2 (Weeks 6–7): Value + week summary

- [x] Estimated value calculation: `duration_hours × category_hourly_rate`
- [x] Default rate library per category (single sensible default per currency to start)
- [x] Settings: edit hourly rates per category
- [x] Settings: currency selector
- [x] 🔒 Settings: **hide monetary value** toggle (hides value everywhere, instantly — build now, not later)
- [x] Value preview on Add Task (respects hide toggle)
- [ ] **Invaluable Work label v1** (Gaps #20): mental-load categories show "Real value: invaluable 💛" alongside the estimate on the Add Task preview and the Week Summary mental-load band — static copy, no message engine yet
- [x] Week Summary v1: total hours, total estimated value, hours-by-day chart, category breakdown (mental load categories visually first-class), comparison vs last week
- [x] "This week at home…" framing copy on summary

### Sprint 3 (Week 8): Hardening + alpha release

- [x] Offline tolerance: task saves locally if connection drops, syncs later (logging must never fail visibly)
- [x] Instrument: `log_duration_ms` from screen-open to save
- [ ] Crash reporting wired
- [ ] Alpha distribution (TestFlight / Play internal track)
- [ ] Recruit 10–20 friendly households; onboarding guide written
- [ ] Run alpha for 2 weeks minimum; weekly check-in interviews

### Phase 1 exit criteria (go/no-go)

- [ ] 🔒 Median real-app log time **<10 seconds**
- [ ] ≥50% of alpha households still logging in week 2
- [ ] Zero data-loss incidents
- [ ] Qualitative: at least 3 households say the week summary "showed them something they didn't realise"
- [ ] Top 3 friction complaints identified and ticketed

---

## Phase 2 — Closed beta: balance + appreciation together (Weeks 9–14)

**Goal:** Add the emotionally sensitive layer. **Rule: balance and appreciation ship in the same release — never balance alone.**

### Sprint 4 (Weeks 9–10): Appreciation first

- [ ] 🔒 Thanks screen: one-tap "Send thanks" (pick person → pick recent task(s) → optional short message → send)
- [ ] Thanks received: warm in-app card for recipient
- [ ] Weekly appreciation summary (template-based, not AI): "This week, Maria handled most of the child logistics 💛" — per person, per category highlights
- [ ] Weekly family wins block on Week Summary ("Together you logged 14h of family work")
- [ ] Instrument: `thanks_sent`, `appreciation_viewed`

### Sprint 5 (Weeks 11–12): Family Balance (flagged)

- [ ] 🔒 Family Balance screen behind feature flag:
  - [ ] Contribution by **time**, switchable to **category** and **value**
  - [ ] Headline state copy is positive by default ("Great team — you're showing up for each other")
  - [ ] Rule-based balance label (avoid false precision; never "lowest contributor", never red warning states)
  - [ ] Appreciation summary appears **above or beside** percentages
  - [ ] Invaluable framing on mental-load value: estimate shown with "Invaluable" label + basis note ("based on comparable support roles — emotional value cannot be fully priced"); never purely transactional
  - [ ] "Plan next week" CTA → simple shared checklist of recurring responsibilities to assign
- [ ] Recurring tasks: create recurring responsibility (e.g. bins, school run), assign to a person, auto-appears for quick confirm
- [ ] Recurring task reminders (opt-in)
- [ ] **Plan the Day v1** (family task planning — see Gaps #13):
  - [ ] "Today at home — what needs doing?" planned-tasks list; any adult can add and plan
  - [ ] Assign a planned task to a person **or leave it open** in a shared pool
  - [ ] Open tasks show "Who can help with this?" + one-tap **"I'll do it"** acceptance
  - [ ] Status per planned task: open / taken / done; wording is "Taken by {name}", never "assigned to"
  - [ ] Completing a planned task logs it normally (counts toward time/value like any task)
  - [ ] 🔒 Guardrail: planning is shared by design — no "household admin" role, no default planner, any adult can plan; copy never frames one person as dispatcher

### Sprint 6 (Weeks 13–14): Trust layer + beta scale-up

- [ ] 🔒 Privacy controls: role-based permissions (adult / child / caregiver / guest scaffolding even if child UI comes in Phase 3)
- [ ] Private notes on tasks (visible only to author)
- [ ] 🔒 Export household data (CSV/JSON)
- [ ] 🔒 Delete household data (full, verified, irreversible flow with confirmation)
- [ ] Notifications v1: gentle prompts only ("Want to log the school run?", "You have a family win to review") with frequency setting + quiet hours
- [ ] Scale beta to 50–100 households via waitlist; deliberately recruit **reluctant-partner** persona, not just organisers
- [ ] In-app micro-survey: "Has HomeHero made it easier or harder to talk about home tasks?" (conflict signal)

### Phase 2 exit criteria (go/no-go)

- [ ] Thanks are being sent organically (target: thanks_sent ≥ 30% of balance_views; tune after first data)
- [ ] No qualitative reports of the app **causing** an argument (any report = root-cause before proceeding)
- [ ] Week-4 retention within beta cohort ≥ ~35%
- [ ] % of households keeping money visible tracked (if >40% hide it, revisit value framing before launch)
- [ ] Export and delete flows verified end-to-end

---

## Phase 3 — Public MVP launch (Weeks 15–18)

**Goal:** Harden, add basic Kids Mode, ship to the stores.

### Sprint 7 (Weeks 15–16): Basic Kids Mode

- [ ] Child profile type (created and controlled by a parent/guardian)
- [ ] 🔒 Kids Mode UI: assigned tasks list → tap → mark done → celebratory moment
- [ ] Simple badges (first task, 5 tasks, 7-day streak) — effort-framed copy ("You helped 5 times this week!")
- [ ] 🔒 No money, no percentages, no contribution comparison anywhere in Kids Mode by default
- [ ] Parent view: assign tasks to a child, see child's completed tasks
- [ ] Kids see planned/assigned tasks as **"Today's missions"** (Plan the Day flows into Kids Mode)
- [ ] Optional **parent approval** for kids' completed tasks ("Awaiting approval" state) — per-child setting, default decided from beta feedback (Gaps #16)
- [ ] Streak-miss copy is kind ("Let's try again tomorrow") — never "you failed your streak"

### Sprint 8 (Weeks 17–18): Launch readiness

- [ ] Onboarding polish: signup → household → first logged task **with zero help** (test with 5 fresh users)
- [ ] Onboarding asks family goal (recognition / fairness / kids habits / planning) — used only to order the first-run tips
- [ ] 🔒 Children's data compliance review (COPPA / GDPR-K style: parental control, minimal child data, no child-targeted tracking)
- [ ] 🔒 Privacy policy + ToS published; in-app links
- [ ] App Store / Play Store listings, screenshots, age rating
- [ ] Activation funnel instrumented end-to-end (signup → household → 5 tasks logged)
- [ ] Load/perf check on weekly summary queries
- [ ] Support channel + FAQ live
- [ ] Rollback plan and feature-flag kill switches verified for: balance screen, money display, notifications

### Launch gates 🔒

- [ ] All Phase 2 exit criteria still holding at beta scale
- [ ] Activation in beta: >60% of new signups log 5 tasks
- [ ] No open P0/P1 bugs
- [ ] Copy audit complete (Section 9) across every screen including errors and notifications

---

## Phase 4 — V1.1: reduce friction, add delight (Months 5–7)

**Goal:** Attack logging fatigue (mum persona risk) and deepen kids engagement. Each feature ships flagged to a % of users first.

### 4.1 AI smart categorisation & task splitting

- [ ] Natural-language input box: "I packed lunches, drove the kids to football, cleaned the kitchen, ordered groceries"
- [ ] AI parse → multiple structured tasks (category, duration estimate, value)
- [ ] 🔒 **Mandatory review step**: user sees suggested split and can edit every field before save
- [ ] Confidence handling: low confidence → "Review suggested split" prominent
- [ ] Deterministic rules fallback for common phrases (school run, dishes, bins…)
- [ ] AI safeguards verified: no sensitive inference, no relationship commentary, no blame language, no classifying private notes
- [ ] Rollout: 10% → 50% → 100% gated on **>75% of AI suggestions accepted without edit**

### 4.2 Voice logging

- [ ] Voice capture → transcription → same AI parsing pipeline (parsing must be proven first)
- [ ] Hands-free confirm flow ("Save all 4 tasks?")
- [ ] Works for fragmented multi-task sentences

### 4.3 Kids Mode richer rewards & family quests

- [ ] Family quests: Weekend Reset Challenge, Laundry Team-Up, Pet Care Week, School Morning Mission, Kitchen Hero Challenge
- [ ] Quest progress visible to whole family (shared win framing)
- [ ] Points + expanded badge set (still effort/consistency framed)
- [ ] Custom family rewards (parent-defined, e.g. movie night)

### 4.4 Smart rebalancing suggestions (flagged, opt-in)

- [ ] Suggestion format locked: **observation → practical option → family planning** (e.g. "Child logistics took the most time this week. Would someone like to take one school run next week?")
- [ ] "What can I take over?" entry point for partners
- [ ] Accept suggestion → becomes recurring responsibility with reminders
- [ ] 🔒 Suggestion copy audited: no names-as-blame, no fairness verdicts
- [ ] Track: suggestions accepted vs dismissed; any negative sentiment → tune or pull flag

### 4.5 Calendar reminders

- [ ] Recurring responsibilities can create device-calendar reminders (opt-in)

### 4.6 Rotating responsibilities

- [ ] Recurring tasks can rotate fairly between members ("Bins: James this week, Maria next week")
- [ ] Rotation suggestions surfaced in Plan Next Week ("Rotate the school run weekly?")
- [ ] Copy stays planning-framed — rotation is a convenience, never a fairness verdict

### 4.7 Hero Voice v1 (motivation styles — see Gaps #14)

- [ ] Per-person style picker in settings: Warm (default) · Witty · Mission · Magical · Teen · Calm
- [ ] Per-person intensity setting: Low (weekly only) / Medium (completions) / High (reminders + celebrations) + humour fully off switch
- [ ] 🔒 Kids' styles require parent approval; kid-safe styles only for child profiles
- [ ] Curated message library v1 (~500 messages: task completions, reminders, kids missions, badges, weekly encouragement) — every message passes Section 9 + the Hero Voice safety rules below
- [ ] Rotation engine: no repeat to same user within 30 days; vary openings; celebration reserved for milestones; context-aware (heavy mental-load week → gentle, not jokey)
- [ ] 🔒 Hero Voice safety rules (extend copy lint): humour targets the **task, never the person**; no sibling comparisons; no "finally…" framing; no gender/competence/laziness jokes; no "mum does everything / dad finally helped"
- [ ] AI variation engine (flagged): approved base message → mini-model generates 10–30 variations → safety filter → human review → stored & rotated; live AI is NOT called per task
- [ ] **Invaluable Work message pack**: rotating warm/witty/calm/kids messages for emotional & mental-load completions ("The spreadsheet tried to price it and quietly gave up") — shown **occasionally, not every log**, so it stays meaningful; same safety rules; kids variants effort-framed ("You helped someone feel better today — that is hero work")
- [ ] Feedback loop: per-message "not for me / too much" reaction; poor messages retired
- [ ] Data model: `messages`, `user_message_preferences`, `message_history`, `ai_message_jobs` tables (reserve in schema when Phase 4 starts)

### Phase 4 exit criteria

- [ ] AI acceptance-without-edit >75% at full rollout
- [ ] Median log time for multi-task entry < 20s via AI input (vs ~40s+ manual equivalent)
- [ ] Kids weekly task completion: >40% of child profiles complete ≥3 tasks/week
- [ ] No measurable retention drop after rebalancing suggestions launch

---

## Phase 5 — V1.2 and beyond (Months 8–12)

**Goal:** Retention, depth, and household planning value. Pull forward or drop items based on live data, not the roadmap.

- [ ] Local market rate library (per-region default rates, user can still override)
- [ ] Monthly household reports (calm, shareable within household only)
- [ ] Advanced mental load insights (e.g. "remembering" concentration trends — practical framing only)
- [ ] Optional pocket-money mode: fully separate from adult value calculations, adult-controlled, off by default
- [ ] Improved Kids Mode rewards based on Phase 4 data
- [ ] Hero Voice v2: live-AI personalised weekly/monthly summaries and appreciation cards (structured-output JSON, safety-reviewed; premium candidate — Gaps #15). Simple task messages stay curated/pre-generated
- [ ] Hero Voice later (V2 list): audio/voice encouragement, family mascot, custom family tone, multilingual tone adaptation
- [ ] **Later / V2 (do not start without explicit decision):** calendar integration, grocery app integrations, smart-home triggers, wearable time suggestions, multi-household support, premium templates

---

## 6. Continuous practices (every phase)

- [ ] **Family test panel:** standing group of 8–10 diverse households (single parents, dual-working couples, families with teens, one caregiver household) sees every release ~1 week early
- [ ] **Copy review in code review:** no user-facing string merges without passing Section 9
- [ ] **Feature flags** on all emotionally sensitive surfaces (balance, money, suggestions, AI)
- [ ] **Weekly metrics review** against Section 8 dashboard
- [ ] **Reluctant-partner recruitment** in every research round — the organiser persona over-volunteers; the partner persona is where balance features fail
- [ ] **Quarterly ethics check** against the "must not become" list: surveillance tool, parental-control weapon, partner-shaming dashboard, counselling app, family debt tracker

---

## 7. Team & responsibility map (fill in names)

| Role | Owner | Notes |
|---|---|---|
| Product lead | | Go/no-go gate decisions |
| Design lead | | Owns design system + copy library |
| Mobile engineer(s) | | |
| Backend engineer | | Owns data model, export/delete |
| AI/parsing (Phase 4) | | Can be same as backend initially |
| Research / beta coordination | | Owns family panel + surveys |
| Privacy/compliance reviewer | | Children's data sign-off before Phase 3 launch |

---

## 8. Metrics dashboard checklist

| Metric | Target | Phase tracked from | Status |
|---|---|---|---|
| Median time to log simple task | <10s | 1 | [ ] |
| Activation: signup → 5 tasks logged | >60% | 2 | [ ] |
| Week-4 household retention | >35% | 2 | [ ] |
| Thanks sent / active household / week | establish baseline, grow | 2 | [ ] |
| Thanks-to-balance-view ratio | healthy (set after baseline) | 2 | [ ] |
| % households keeping money visible | watch; >40% hiding = framing problem | 2 | [ ] |
| "Work feels more recognised" survey | >70% agree | 2 | [ ] |
| "Easier to discuss home tasks" survey | >50% positive | 2 | [ ] |
| Child profiles completing ≥3 tasks/week | >40% | 3 | [ ] |
| AI categorisation accepted without edit | >75% | 4 | [ ] |
| Rebalancing suggestions accepted | establish baseline | 4 | [ ] |
| Weekly review completion rate | establish baseline, grow | 2 | [ ] |

---

## 9. Copy checklist (apply to every user-facing string)

Before merge, every string must pass:

- [ ] No blame framing ("you did less", "lowest contributor", "behind", "unfair", "owes", "failure")
- [ ] No debt/transactional money language ("salary owed", "payment due", "household debt")
- [ ] Money wording is "estimated household work value" / "estimated value" / "replacement value"
- [ ] Comparisons framed as system/teamwork, not persons ("one person carried more logistics this week")
- [ ] Kids copy is effort-framed; streak misses are kind ("Let's try again tomorrow")
- [ ] Notifications invite, never nag ("Want to log the school run?")
- [ ] Suggestions follow observation → practical option → planning structure
- [ ] No counselling/relationship language anywhere
- [ ] Humour (Hero Voice) punches at the task, never the person; no sibling comparisons; no "finally" framing; gentle tone auto-selected in heavy weeks
- [ ] Emotional-support & mental-load value displays carry "Invaluable" framing — an estimate may appear, but care work is never presented as purely transactional
- [ ] Reads as warm, calm, practical — would both partners feel okay seeing this on a shared screen?

---

## 10. Privacy & ethics checklist (pre-launch hard requirements)

- [ ] 🔒 Household data private by default; no sale, no behaviour-based advertising
- [ ] 🔒 Children's profiles fully parent/guardian controlled; minimal child data collected
- [ ] 🔒 Children's data legal review complete for launch regions (incl. UAE/GCC requirements if launching there first, plus COPPA/GDPR-K style rules for wider release)
- [ ] 🔒 Export household data works (verified with real data)
- [ ] 🔒 Delete household data works (verified: data actually gone, including backups policy documented)
- [ ] Private notes never surface in any shared view, summary, or AI output
- [ ] Role-based permissions enforced server-side, not just hidden in UI
- [ ] Hide-money toggle hides value in **all** surfaces (today, summary, balance, notifications, exports if chosen)
- [ ] Notification frequency limits + quiet hours respected
- [ ] Analytics are privacy-conscious (no content of notes/tasks in analytics events)

---

## 11. Gaps & decisions log (append as you go)

Use this section to record discovered gaps, decisions, and deferred items so nothing is lost between phases.

| # | Date | Gap / decision | Resolution | Phase affected | Status |
|---|---|---|---|---|---|
| 1 | 04 Jun 2026 | Kids Mode appears in both MVP and V1.1 in source spec | Resolved: basic Kids Mode (tasks/done/badges) in Phase 3; quests, points, rich rewards in Phase 4 | 3, 4 | Decided |
| 2 | 04 Jun 2026 | Is Child Logistics a mental-load category? | TBD — decide whether driving time vs. coordinating time split matters for mental-load reporting | 0 | Open |
| 3 | 04 Jun 2026 | "Remembering" + "Homework support" + "Shopping/errands" missing from spec PDF's MVP category list but present in product brief | Include all 13 brief categories from Phase 0 | 0 | Decided |
| 4 | 04 Jun 2026 | Default hourly rates source for MVP | Single sensible default per currency in MVP; local market rate library deferred to V1.2 | 1, 5 | Decided |
| 5 | 04 Jun 2026 | Caregiver/guest persona | Permission scaffolding in Phase 2; dedicated caregiver view deferred — log demand from beta | 2 | Decided |
| 6 | 04 Jun 2026 | Persona-adaptive home screens in mockups (recognition view vs. helper view) | Adopt as user-chosen view modes (maps to onboarding goal question), switchable in settings. **Never auto-assigned by role or gender.** | 2–4 | Decided (pending design) |
| 7 | 04 Jun 2026 | "What can I take over?" shown on home in mockups but planned as Phase 4 rebalancing | Simple rule-based version (unassigned recurring + heaviest category) considered for Phase 2; AI/smart version stays Phase 4 | 2, 4 | Open |
| 8 | 04 Jun 2026 | Mockup chart groupings (Transport, Household, Meals & Food…) ≠ the 13 logging categories | Keep 13 categories for logging; define ~5 display roll-up groups for charts only. Decide mapping before Figma lock | 0 | Open |
| 9 | 04 Jun 2026 | "Mental load: High" indicator on home (Mum mockup) | Needs a coarse threshold rule (mental-load hours vs. household trailing average); **self-facing only**, never shown as a verdict about another member | 2 | Open |
| 10 | 04 Jun 2026 | Tab/screen naming "Home Value" vs "Family Balance" | Adopt "Home Value" per updated spec — lead with value created, keep percentage shares secondary | 2 | Decided |
| 11 | 04 Jun 2026 | Estimated-value model: flat per-currency rate today; regional rates not yet considered | **Regional rate library stays V1.2** (locale field already on household). Near-term improvement: seed *per-category* defaults (differentiated by category, single currency baseline) in Phase 1–2. Phase 0 testing Segment E decides whether money is shown at all before investing in regional accuracy | 1, 2, 5 | Decided |
| 12 | 04 Jun 2026 | Dubai-specific value-framing risk | Local domestic-help wages are common/affordable in the GCC, so a wage-anchored "replacement value" may read **lower** than families expect and feel deflating rather than validating. V1.2 regional library must decide its anchor (local wage vs. blended vs. "worth of the work") per market; probe explicitly in the caregiver-employing test household | 0, 5 | Open |
| 13 | 05 Jun 2026 | Family Task Planning ("Plan the Day") adopted from feature brief | v1 (plan today, assign-or-open, "I'll do it") ships Phase 2 Sprint 5 with recurring tasks → in public MVP; kids missions + parent approval Phase 3; rotations + smart allocation Phase 4. **Hard guardrail: shared planning by design — the feature must reduce, not formalise, one person's dispatcher role.** | 2, 3, 4 | Decided |
| 14 | 05 Jun 2026 | Hero Voice (per-person motivation styles) adopted from feature brief | MVP keeps current warm copy only. Hero Voice v1 = Phase 4 (curated library + rotation engine + style/intensity settings + flagged AI-variation pipeline). Live-AI personalised summaries = Phase 5. Style named "Witty" — inspired-by, never branded on a real filmmaker | 4, 5 | Decided |
| 15 | 05 Jun 2026 | Hero Voice monetisation (free Warm vs paid style packs) | Plausible premium feature; kids' motivational content never paywalled separately from family plan. Decide with V1.2 pricing work | 5 | Open |
| 16 | 05 Jun 2026 | Parent approval of kids' completed tasks: default on or off? | Off = trust + lower friction; On = prevents tap-through. Decide from Phase 3 beta feedback per age group | 3 | Open |
| 17 | 05 Jun 2026 | Magic-link sign-in breaks with corporate email (Outlook Safe Links pre-consumes the one-time token); Supabase built-in mailer limited to ~2–4 emails/hr; new dashboard locks template editing behind custom SMTP | **Pre-alpha requirement:** custom SMTP (Resend/Brevo free tier) + code-based sign-in via {{ .Token }} template. Web link flow acceptable for dev only | 1 | Decided |
| 18 | 05 Jun 2026 | Staging Supabase region landed in Tokyo (ap-northeast-1) | Fine for staging; create the **prod** project in eu-central-1 (Frankfurt) for Dubai latency. Never share staging/prod databases | 3 | Decided |
| 19 | 05 Jun 2026 | Security: Postgres views bypass RLS unless security_invoker is set — found during sync build | Fixed in migration 0003 for all three views; add "views respect RLS" assertion to the cross-household test suite | 1 | Resolved |
| 20 | 05 Jun 2026 | "Invaluable Work" layer adopted from feature brief: emotional/mental-load tasks show estimate + "Invaluable" label rather than pure money | v1 static label → Phase 1 build (tested in Phase 0 Segment E); Home Value framing rule → Phase 2; rotating message pack → Phase 4 Hero Voice. **Also resolves the emotional-support pricing question:** rate multiplier stays modest (1.0–1.1) — the "Invaluable" frame carries the meaning, not the number. Mitigates Dubai value-reads-low risk (#12) | 0, 1, 2, 4 | Decided |
| 21 | | | | | |

---

## 12. Phase gate summary (quick view)

| Gate | Key question | Pass condition |
|---|---|---|
| 0 → 1 | Is the design emotionally safe and fast? | <10s prototype log; balance copy validated; stack locked |
| 1 → 2 | Do people log repeatedly? | <10s real log; week-2 logging retention; zero data loss |
| 2 → 3 | Does balance + appreciation work without conflict? | Organic thanks; no argument reports; ~35% wk-4 retention |
| 3 launch | Are we safe, legal, and ready? | Children's-data review; activation >60% in beta; copy audit done |
| 4 rollouts | Does each flagged feature earn full rollout? | AI >75% accepted; no retention drop from suggestions |

---

*HomeHero is not about proving who does more. It is about helping families see, value, and share the work that keeps home life running.*
