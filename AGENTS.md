# AGENTS.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## 5. Record Product and Design Decisions

- Use `PRD.md` for the product goal, scope, and acceptance criteria. Use
  `UI-UX.md` for screens, interactions, and visual references.
- During planning, record agreed decisions in the relevant file. Start editing
  app code when asked to build. Before starting, flag conflicts between the
  specs and gaps that would change the scope or user experience.
- Keep the specs in sync when a product or design decision changes.

## 6. Build and Verify One User Flow

- Before scaffolding a new project, propose the stack and where V1 will run.
  Call out any dependency on a paid service or external account.
- For UI work, define the relevant empty, loading, success, and error states.
  Use the references in `UI-UX.md` for the specific details they illustrate.
- Verify the flow through the app's normal entry point. For UI changes, preview
  the result at the relevant screen sizes when possible.
- Report the checks that ran, anything you could not verify, and the exact
  steps the user can follow to try the change locally.

## 7. Keep Local Setup Reproducible

- Keep real credentials in local environment variables and out of Git. If the
  app needs configuration, document the required keys in `.env.example` with
  placeholders and add setup and launch commands to `README.md`.
- Check the working tree before editing. Preserve other agents' and the user's
  edits. Use separate Git worktrees when agents need to edit in parallel.
