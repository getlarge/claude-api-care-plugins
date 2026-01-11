# The API Hygiene Manifesto

> APIs are surfaces others must touch.

API hygiene is not about elegance, cleverness, or personal taste.
It is about being safe, predictable, and respectful to interact with.

You can debate style.
You cannot debate hygiene.

---

## Hygiene is not style

A well-dressed person who hasn't showered is still unpleasant to be around.
A beautifully documented API that crashes clients is no better.

Style expresses identity.
Hygiene protects others.

- camelCase vs snake_case is style
- REST vs RPC flavor is style
- pagination existing at all is hygiene
- consistent error formats are hygiene
- clever endpoints are style
- idempotency guarantees are hygiene

Style is optional.
Hygiene is non-negotiable.

---

## Most API problems are hygiene problems

APIs rarely fail because of a single bad decision.
They fail because of small inconsistencies that compound over time.

One endpoint paginates differently.
Another returns errors in a custom format.
A third behaves slightly differently on retries.

Individually acceptable.
Collectively expensive.

What emerges is:

- fragile integrations
- defensive client code
- undocumented assumptions
- "legacy APIs" no one wants to change

This is not a design failure.
It is a hygiene failure.

---

## Hygiene is preventive

API hygiene exists to prevent known failure modes.

It reduces:

- cognitive load for consumers
- operational risk in production
- support and debugging effort
- migration and versioning pressure

Good hygiene is rarely noticed.
Its absence always is.

---

## Hygiene is for consumers

API hygiene is not primarily for the team that builds the API.

It is for:

- client developers
- partner teams
- downstream systems
- future maintainers

An API that requires guessing creates bugs.
An API that relies on tribal knowledge creates support load.
An API that behaves inconsistently creates defensive code.

Predictability is a feature.

---

## Common sense does not scale

Most API hygiene issues are not caused by bad engineers.
They are caused by speed, pressure, and missing systems.

Humans are not good at:

- remembering hundreds of rules
- enforcing consistency across teams
- reviewing patterns while focused on business logic

If a rule matters, it must be:

- written down
- agreed upon
- enforced automatically

What is not automated will eventually be violated.

---

## Hygiene before sophistication

Advanced API design only works on a clean foundation.

Before introducing:

- async workflows
- batching
- partial responses
- clever abstractions

An API must be:

- consistent
- explicit
- defensively designed
- predictable

Sophistication without hygiene creates fragility.

---

## This is not about perfection

API hygiene is not about doing everything at once.
It is about not repeating the same mistakes.

It is:

- progressive
- enforceable
- practical

Start with "not broken".
Move toward "predictable".
Evolve toward "robust".

---

## The principle

APIs are shared surfaces.
Shared surfaces require hygiene.

Not to impress.
Not to show taste.
But to be safe to use.

---

**API hygiene is how shared surfaces stay safe to touch.**
