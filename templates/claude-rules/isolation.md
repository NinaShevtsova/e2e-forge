---
paths:
  - "tests/**/*.spec.ts"
  - "src/fixtures/**/*.ts"
---

# Isolation and parallel safety

Tests run concurrently. Every test must stand alone, or the suite becomes order-dependent and
fails differently on every machine.

## Independence

**[invariant]** A test never depends on another test having run, and never on execution order.
Anything a test needs, it creates or receives from a fixture.

**[invariant]** No mutable state at module scope. Data loaded at module scope is read-only: never
push to it, never reassign it, never let a test mutate a shared object. Two workers reading the
same array is safe; one worker writing to it is a race.

**[invariant]** No state carried between tests through the file system, environment variables, or
module variables.

## Unique data

**[invariant]** Anything that must be unique per test is generated, never hard-coded. Two parallel
workers registering the same fixed email collide, and the failure looks like an application bug:

```ts
export function generateEmail(prefix = 'test'): string {
  return `${prefix}+${Date.now()}@example.com`;
}
```

**[default]** Shared fixed credentials are acceptable for **read-only** logins — a browsing account
that no test modifies. The moment a test changes that account's state, it needs its own account.

## Browser state

**[invariant]** Each test receives its own browser context. Never reuse a page across tests, and
never disable isolation to "speed things up" — the time saved is repaid many times over in
debugging.

**[default]** Authentication that is slow and read-only can be performed once and reused via a
stored storage state, provided no test mutates the account.

## Worker count

**[default]** Parallel execution is on by default. Reducing worker count is a diagnostic step when
investigating a race, not a fix — if a test only passes serially, it has a real isolation defect
that will resurface in CI.
