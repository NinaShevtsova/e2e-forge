# Forbidden

A checklist of the bans stated across the other rule files, gathered so a diff can be scanned
against it. Reasons live where each rule is stated — this list is deliberately bare. Everything
here is **[invariant]**.

**Locators**

- CSS selectors: class-based, structural, `page.$()`, `page.$$()`, `waitForSelector`, XPath
- Index-based row selection where content-based filtering works
- `getByTestId` where the application has no test-id attribute
- Public locators, or `get*` returning a `Locator`
- A readiness locator that also matches on other pages of the application

**Waiting**

- `waitForTimeout`, `sleep`, hand-written polling loops
- Inline timeout numbers instead of the shared timeout config

**Assertions**

- `expect(await locator.isVisible()).toBe(true)` — any resolved value where a matcher exists
- Assertions inside `if` or `try`
- Weakening or deleting an assertion to make a test pass
- Marking a flaky test as expected-to-fail

**Structure**

- Importing `test` / `expect` into a spec from `@playwright/test`
- Instantiating a page object inside a spec, or touching `page` there
- A page object importing another page object
- A domain fixture extending `@playwright/test` instead of the project's base fixture
- A second page object for a screen that already has one
- Relative imports across folders where an alias exists

**Data and state**

- Hard-coded URLs, timeouts, credentials or UI messages outside their config module
- Mutable state at module scope
- A unique-by-nature value reused across tests
- Committed secrets

**Conduct**

- `force: true` without a justifying comment
- `any` in framework code
- Reporting work finished without running the affected tests
