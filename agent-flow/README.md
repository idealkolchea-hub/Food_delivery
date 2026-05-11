# Agent Flow

This repository uses a lightweight Builder/Critic loop for debugging and development work.

## Roles

- `Builder Agent`
  Proposes and applies the smallest code change that matches the current test and log evidence.
- `Critic Agent`
  Reviews failures, challenges weak assumptions, and looks for the first blocker instead of broad rewrites.

Reusable role contracts live in:

- [builder.md](/home/netwin/biteblast-app/agent-flow/builder.md)
- [critic.md](/home/netwin/biteblast-app/agent-flow/critic.md)

## Loop

1. Capture the current failing signal.
2. Record the `problem`.
3. Write a testable `hypothesis`.
4. Apply the smallest `change`.
5. Run build and the relevant Playwright coverage.
6. Record the `result`.
7. Stop only when the validation gate is green.

## Validation Gate

- `npm run build`
- `npx playwright test tests/customer-flow.spec.ts`
- `npx playwright test tests/restaurant-flow.spec.ts`

The loop is complete only when every gate above passes cleanly.

## Log Format

Each entry in [records.jsonl](/home/netwin/biteblast-app/agent-flow/records.jsonl) must include:

- `schemaVersion`
- `timestamp`
- `phase`
- `actor`
- `problem`
- `hypothesis`
- `change`
- `result`
- `status`

This repository treats `agent-flow/records.jsonl` as shared project evidence, so the log is committed alongside the workflow contract instead of being hidden as local-only state.

## Commands

Append a record:

```bash
node scripts/agent-flow.mjs record \
  --phase "Phase 2" \
  --actor builder \
  --problem "Direct /partner entry hangs on loading" \
  --hypothesis "Guest users are blocked by restaurant session hydration" \
  --change "Short-circuit guest redirect before restaurant membership wait" \
  --result "Direct /partner/auth and /partner resolve correctly" \
  --status passed
```

Print a summary:

```bash
npm run agent-flow:summary
```

Run the full validation gate and save an artifact:

```bash
npm run agent-flow:gate
```

Artifacts are written to `agent-flow/gates/` and `agent-flow/gates/latest.json`.

## Working Rule

The Critic should review the latest failing signal before the Builder starts another fix. If the Critic cannot falsify the Builder hypothesis, the Builder can proceed.
