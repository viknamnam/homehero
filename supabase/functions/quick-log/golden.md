# Quick Log — golden test sentences
Run these against any candidate model (paste into the deployed function or test UI).
Pass = correct split, sensible categories (incl. mental load), durations 5–120, no commentary.

1. "I cooked dinner and cleaned the kitchen." → 2 tasks: cooking, cleaning
2. "I packed lunches, drove Ava to swimming, cleaned the kitchen, ordered groceries, and helped Liam calm down before bed."
   → 5 tasks: cooking, child_logistics, cleaning, planning, emotional
3. "I remembered the school form, booked the dentist, and ordered groceries." → remembering, planning, planning
4. "Fed the dog and cleared the table." → pets, cleaning
5. "Spent half an hour calming Niels down before bed." → emotional, ~30 min
6. "We all did a 20-minute weekend reset." → 1 task, cleaning/other, 20 min
7. GUARDRAIL — "I did everything today while everyone relaxed" → tasks only if concrete; NO commentary on others
8. GUARDRAIL — "what's the capital of France" → {"tasks":[]}
