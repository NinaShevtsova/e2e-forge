# e2e-forge

A Claude Code plugin that scaffolds and grows Playwright + TypeScript E2E test frameworks. It
creates the skeleton from verified templates, discovers the live application rather than guessing
at it, and writes page objects and specs to the target project's own conventions — instead of
those conventions being re-explained by hand in every prompt.

## The three skills

| Skill | What it does | What you get |
|---|---|---|
| `/e2e-forge:init-framework` | Creates a framework where none existed | Folders, base classes, config, fixtures, first page object, a passing smoke test, `CLAUDE.md` and `.claude/rules/` |
| `/e2e-forge:new-page-object` | Adds a page object for one page | The class, its fixture registration, its route, and a test proving it works |
| `/e2e-forge:cover-page` | Writes the scenarios for one page | A coverage matrix for your approval, then specs, message constants, data cases, and a green run |

They run in that order. Each is scoped to one page per invocation: batching means guessing at the
later ones, and a review of six generated files at once is not a review.

## Install

For everyday use, install it once and the skills are available in any project:

```bash
claude plugin marketplace add <this-repository>
claude plugin install e2e-forge
```

For development on the plugin itself, load it from disk without installing:

```bash
claude --plugin-dir ./ai-assistents-for-ui-framework-building
```

After editing a skill, `/reload-plugins` picks up the change without restarting.

## Layout

```
.claude-plugin/plugin.json   Manifest. Only this file lives here.
skills/                      The three skills, one folder each.
rules/                       The universal layer — craft rules with no project specifics.
templates/                   Code skeletons: base classes, configs, first page object.
templates/claude-rules/      Path-scoped rules copied into each generated project.
```

`rules/` and `templates/` sit at the plugin root rather than inside one skill, because every skill
draws on them: writing a page object reads `rules/page-objects.md`, writing a spec reads
`rules/specs.md`.

## How it stays universal

Three layers, and only the first travels between projects unchanged.

| Layer | Lives in | Portable |
|---|---|---|
| Craft rules — POM contract, locator policy, isolation, assertions | `rules/` | yes |
| Project profile — URLs, exemplar paths, naming, known bugs | the target project's `CLAUDE.md` | no |
| Live application knowledge — routes, roles, texts, messages | discovered at run time | no |

A skill contains no site specifics. It reads the target project's `CLAUDE.md`, follows to the
exemplars named there, and writes in that project's style. Swap the project and the same skill
produces different code — that is what makes the flow reusable.

## What each generated project receives

A short `CLAUDE.md` — under 200 lines, because a longer file both consumes context and measurably
reduces how reliably its instructions are followed — carrying what every task needs: the
application, the commands, the dependency direction, the exemplars, the ban list, the recorded
deviations.

Alongside it, `.claude/rules/` with the detailed craft rules, each scoped with `paths:` frontmatter
so it loads only when a file it governs is opened. Both are committed with the project and contain
no reference back to this plugin: a project generated here works for someone who has never
installed it.

## Principles the skills enforce

**Nothing is recalled, everything is observed.** Locators come from a script that opened the real
page. Validation messages come from submitting the real form. A count of matches is one line of
script; a wrong locator is an hour of debugging later.

**Deciding what to test stays human.** `cover-page` proposes a coverage matrix and stops. The page
shows which inputs exist; it does not show which failures matter to a business.

**A failing test is information.** Never an assertion weakened, never a case deleted, never a flaky
test marked as an expected failure. Where the fault is genuinely ambiguous, the skill stops and
hands both the assertion and the observed behaviour to a person.
