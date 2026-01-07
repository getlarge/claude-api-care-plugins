# API Hygiene: A Framework for Better API Design

> **Purpose:** Arguments, principles, and references for articles, LinkedIn posts, and talks about API hygiene.
> **Created:** 2025-01-07
> **Status:** Draft

---

## Table of Contents

1. [The Core Thesis](#the-core-thesis)
2. [The Problem: Why APIs Get Dirty](#the-problem-why-apis-get-dirty)
3. [The Hidden Costs](#the-hidden-costs)
4. [Core Principles](#core-principles)
5. [The Authority Argument (Why AIPs?)](#the-authority-argument)
6. [Progressive Disclosure (Adoption Path)](#progressive-disclosure)
7. [Quotable Lines](#quotable-lines)
8. [Content Angles](#content-angles)
9. [Thought Leaders & References](#thought-leaders--references)
10. [Further Reading](#further-reading)

---

## The Core Thesis

**API Hygiene** is the practice of maintaining clean, consistent, and predictable APIs through systematic principles—much like code hygiene (linting, formatting, testing) but applied to your interface contracts.

### Why "Hygiene"?

The word is intentional:

| Aspect | Why It Fits |
|--------|-------------|
| **Preventive** | Like washing hands, not surgery |
| **Habitual** | Daily practice, not occasional deep clean |
| **Foundational** | Everything else (security, performance, DX) depends on it |
| **Invisible** | You notice when it's missing, not when it's present |

---

## The Problem: Why APIs Get Dirty

### APIs Accumulate Cruft Faster Than Code

| Code | APIs |
|------|------|
| Refactor freely | Breaking changes hurt clients |
| Internal concern | Public contract |
| One team maintains | Many teams consume |
| Delete unused code | Can't delete deprecated endpoints |

**Key insight:** Every API decision becomes permanent. The cost of a bad endpoint name or inconsistent error format compounds over time as clients build around it.

### Common Symptoms of Poor API Hygiene

- Different pagination styles across endpoints
- Inconsistent error response formats
- Mixed naming conventions (camelCase, snake_case, kebab-case)
- Verbs in resource paths (`/getUser`, `/createOrder`)
- Missing or inconsistent status codes
- Undocumented edge cases
- No idempotency guarantees on POST requests

---

## The Hidden Costs

### For API Consumers

| Cost | Example |
|------|---------|
| **Cognitive load** | Each endpoint is a special case to learn |
| **Boilerplate** | Custom error handling per endpoint |
| **Brittle integrations** | Guessing at undocumented behavior |
| **Debugging nightmares** | Non-standard errors, missing request IDs |

### For API Providers

| Cost | Example |
|------|---------|
| **Support burden** | "Why does /users paginate differently than /orders?" |
| **Migration pain** | Fixing design later requires versioning or breaking changes |
| **Documentation rot** | Spec doesn't match implementation |
| **Onboarding cost** | New devs inherit the inconsistencies |

### The Compound Effect

```
Day 1:    One inconsistent endpoint (seems fine)
Month 6:  12 endpoints, 4 different patterns
Year 2:   50 endpoints, tribal knowledge required
Year 5:   "Legacy API" nobody wants to touch
```

---

## Core Principles

### Principle 1: Consistency Over Cleverness

Every list endpoint paginates the same way. Every error looks the same. Every resource follows the same naming pattern.

```
❌ Bad: Mixed approaches
   GET /users      (offset pagination)
   GET /orders     (cursor pagination)
   GET /products   (no pagination)

✅ Good: One pattern everywhere
   All lists use cursor-based pagination with page_size + page_token
```

**Why:** Consistency reduces the surface area developers need to learn. One pattern, applied everywhere.

---

### Principle 2: Explicit Over Implicit

Don't make clients guess your intent.

| Implicit (Ambiguous) | Explicit (Clear) |
|----------------------|------------------|
| `PATCH` with missing fields = no change? null? | Field masks: `update_mask=title,description` |
| `POST` failed, did it create or not? | Idempotency key: client knows retry is safe |
| Response took 30 seconds, is it done? | 202 Accepted + operation ID for polling |
| Error returned, what went wrong? | Structured error with code, message, field details, request_id |

---

### Principle 3: Resources Over Actions

HTTP methods already convey intent. Let paths describe *what*, not *how*.

```
❌ Verbs in paths (anti-pattern)
   POST /createOrder
   GET  /fetchUserById/{id}
   POST /orders/submit
   DELETE /removeItem/{id}

✅ Resource-oriented (REST)
   POST   /orders           (create)
   GET    /users/{id}       (read)
   POST   /orders/{id}:submit   (custom action per AIP-136)
   DELETE /items/{id}       (delete)
```

**Why:** REST is a constraint that creates predictability. Violating it trades short-term convenience for long-term confusion.

---

### Principle 4: Defensive Defaults

Assume clients will misuse your API. Protect them (and yourself).

| Practice | Why |
|----------|-----|
| **Paginate everything** | An unbounded `/users` list will eventually crash someone's client |
| **Limit page sizes** | Don't let clients request 1 million items |
| **Allowlist filter fields** | Prevent injection and performance issues |
| **Require idempotency keys on POST** | Network failures are inevitable |
| **Always return request_id** | Debugging without correlation IDs is painful |

---

### Principle 5: Spec as Source of Truth

Whether code-first or spec-first, the OpenAPI spec is what clients see. That's what needs hygiene.

```
Spec-First Flow:
  Design spec → Review → Implement → Validate spec matches code

Code-First Flow:
  Implement → Extract spec → Review → Fix discrepancies
```

---

## The Authority Argument

### Why Google's AIPs?

For skeptics who ask "why not just use common sense?"

Google's AIPs represent:

| Aspect | Value |
|--------|-------|
| **Scale** | Billions of API calls worth of lessons |
| **Breadth** | Thousands of APIs across Cloud, Maps, Ads, YouTube |
| **Iteration** | Years of refinement with documented rationale |
| **Transparency** | Anyone can read https://aip.dev |

**Key insight:** AIPs aren't arbitrary rules—each one includes the "why" and addresses specific failure modes Google encountered at scale.

### AIP Structure

Every AIP includes:
- **Summary**: What the guidance is
- **Guidance**: Detailed rules with examples
- **Rationale**: Why these rules exist
- **Changelog**: How the guidance has evolved

---

## Progressive Disclosure

### For People Who Say "This Is Too Much"

You don't need to implement everything. API hygiene is a spectrum:

| Level | Focus | Example Rules |
|-------|-------|---------------|
| **Basic** | Not broken | GET has no body, DELETE is idempotent |
| **Consistent** | Predictable | All lists paginate, errors have standard schema |
| **Defensive** | Safe | Idempotency keys, max page sizes, field masks |
| **Robust** | Scalable | LRO for async ops, batch endpoints, rate limiting |

### Adoption Strategy

```
Week 1:  Run reviewer, fix all errors
Week 2:  Address warnings (pagination, error schemas)
Week 4:  Review suggestions, adopt what makes sense
Ongoing: Include review in CI/CD, PR process
```

---

## Quotable Lines

Use these in articles, talks, and social posts:

### On the Problem

> "Technical debt in code is paid by your team. Technical debt in APIs is paid by everyone who integrates with you."

> "Your API is your UI for developers. Inconsistency in a UI is confusing. Inconsistency in an API is expensive."

### On the Solution

> "An API that requires guessing is an API that causes bugs."

> "A well-designed API makes the right thing easy and the wrong thing hard."

> "Common sense isn't common. That's why Google wrote 200+ documents codifying what good API design means."

### On Hygiene

> "You don't notice good API hygiene. You notice the infection that spreads when it's absent."

> "API hygiene isn't about perfection—it's about preventing the compound interest of small mistakes."

### On Automation

> "Humans review business logic. Machines review patterns and consistency."

---

## Content Angles

### Article: "API Hygiene: The Missing Discipline"

**Outline:**

1. **Hook**: The 3am support call because a client crashed from unbounded pagination
2. **Problem**: APIs accumulate cruft faster than code (with examples)
3. **Cost**: The hidden tax of inconsistency (developer hours, support tickets)
4. **Framework**: The 5 principles of API hygiene
5. **Authority**: What Google learned from billions of API calls (AIPs)
6. **Practice**: Progressive adoption path with tooling
7. **Call to action**: Start with a review of your existing specs

---

### LinkedIn Post Series

#### Post 1: The Problem (Hook with question)

```
Your API is your UI for developers.

Would you ship a UI where:
- Every button had a different style?
- Error messages were in 4 different formats?
- Some forms validated, others just failed silently?

Then why do our APIs look like this?

🧵 Thread on API hygiene...
```

#### Post 2: The Cost (Story-based)

```
We spent 3 weeks debugging an integration.

The API returned 200 for failures.
"Success" with an error buried in the body.

The fix? 5 minutes.
The discovery? 3 engineer-weeks.

This is what inconsistent APIs cost.

Here's what we learned... 🧵
```

#### Post 3: The Pattern (Authority-based)

```
Google has 200+ documents on API design.

The most important lesson fits in 4 words:

"Consistency over cleverness."

Here's what that means in practice... 🧵
```

#### Post 4: The Tool (Practical)

```
We built a linter for APIs.

Not for code style—for design patterns.

It found 47 inconsistencies in our "finished" spec:
- 3 pagination styles
- 5 error formats
- 12 naming violations

Here's what we learned building it... 🧵
```

#### Post 5: The Practice (Actionable)

```
API hygiene in 4 levels:

Level 1: Not broken
  → GET has no body, proper status codes

Level 2: Consistent
  → Same pagination everywhere, unified errors

Level 3: Defensive
  → Idempotency keys, page size limits

Level 4: Robust
  → Async operations, rate limiting, field masks

Which level is your API at?
```

---

### Talk: "Lessons from Google's 200+ API Improvement Proposals"

**Structure (30-40 min):**

1. **Hook** (3 min)
   - Show a messy API spec
   - Ask audience: "What's wrong here?"
   - Reveal: "This passed code review"

2. **Problem** (7 min)
   - Why APIs get messy (incentives, speed, lack of standards)
   - The compound cost (support, debugging, migration)
   - War stories (200 OK with error body, 5 pagination styles)

3. **Solution** (10 min)
   - The AIP approach: battle-tested, documented rationale
   - Walk through 3-4 key AIPs:
     - AIP-158 (Pagination)
     - AIP-193 (Errors)
     - AIP-134 (Field masks)
     - AIP-155 (Idempotency)

4. **Demo** (8 min)
   - Run the reviewer on a real spec
   - Show findings with severity levels
   - Generate fix plan

5. **Adoption** (5 min)
   - Progressive disclosure levels
   - CI/CD integration
   - Team buy-in strategies

6. **Call to Action** (2 min)
   - Resources: aip.dev, this repo
   - Start with a review of one spec
   - Contribute rules for your own conventions

---

## Thought Leaders & References

### The Foundational Voices

#### Roy Fielding
- **Contribution**: Created REST in his 2000 PhD dissertation
- **Key Work**: "Architectural Styles and the Design of Network-based Software Architectures"
- **Why It Matters**: The original constraints (statelessness, uniform interface, etc.) are still the foundation
- **Reference**: [Fielding Dissertation Guide - O'Reilly](https://www.oreilly.com/library/view/restful-web-apis/9781449359713/apc.html)

#### Leonard Richardson
- **Contribution**: Richardson Maturity Model (RMM), co-author of foundational REST books
- **Key Works**:
  - "RESTful Web Services" (2007, with Sam Ruby)
  - "RESTful Web APIs" (2013, with Mike Amundsen)
- **Why It Matters**: RMM provides a ladder for API maturity (Level 0-3)

---

### The Practitioners

#### Mike Amundsen
- **Role**: Internationally known API consultant, speaker, and author
- **Key Works**:
  - "RESTful Web APIs" (2013)
  - "Design and Build Great Web APIs" (2020)
  - "RESTful Web API Patterns and Practices Cookbook" (2022)
  - "Continuous API Management" (2018, co-author)
- **Focus**: Hypermedia, adaptable APIs, practical patterns
- **Links**:
  - [Design and Build Great APIs - Amazon](https://www.amazon.com/Design-Build-Great-Web-APIs/dp/1680506803)
  - [RESTful Web API Patterns Cookbook - Amazon](https://www.amazon.com/RESTful-Patterns-Practices-Cookbook-Orchestrating/dp/1098106741)

#### Erik Wilde
- **Role**: API strategist, formerly CA Technologies API Academy
- **Key Work**: "Continuous API Management" (2018, co-author)
- **Focus**: API strategy, lifecycle management, architecture
- **Link**: [Continuous API Management - Amazon](https://www.amazon.com/Continuous-API-Management-Decisions-Landscape/dp/1492043559)

#### Arnaud Lauret ("The API Handyman")
- **Role**: API Industry Researcher at Postman, creator of API Stylebook
- **Key Work**: "The Design of Web APIs" (2019, 2nd edition 2024)
- **Focus**: Practical API design, consumer-first mindset
- **Why It Matters**: Bridges theory and practice with real examples
- **Links**:
  - [The Design of Web APIs - Manning](https://www.manning.com/books/the-design-of-web-apis)
  - [API Handyman Blog](http://apihandyman.io)
  - [API Stylebook](http://apistylebook.com)

#### Phil Sturgeon
- **Role**: API consultant, formerly WeWork API lead
- **Key Work**: "Build APIs You Won't Hate" (2015, 2nd edition)
- **Focus**: Practical, opinionated, real-world horror stories
- **Why It Matters**: Honest about what goes wrong and why
- **Links**:
  - [Build APIs You Won't Hate - Official Site](https://apisyouwonthate.com/books/build-apis-you-wont-hate/)
  - [Leanpub (2nd Edition)](https://leanpub.com/build-apis-you-wont-hate-2)

---

### The Organizations

#### Google (AIPs)
- **Contribution**: 200+ API Improvement Proposals
- **Why It Matters**: Battle-tested at massive scale, publicly documented rationale
- **Links**:
  - [Google AIP Site](https://google.aip.dev/)
  - [AIP GitHub Repository](https://github.com/aip-dev/google.aip.dev)
  - [Nordic APIs: Google's Take on API Style Guide](https://nordicapis.com/api-improvement-proposals-googles-take-on-the-api-style-guide/)

#### Postman
- **Contribution**: State of the API Report (annual), tooling ecosystem
- **Key Stat**: "65% of organizations generate revenue from APIs" (2025 report)
- **Link**: [Postman API Design](https://www.postman.com/api-platform/api-design/)

#### OpenAPI Initiative
- **Contribution**: OpenAPI 3.x specification (formerly Swagger)
- **Why It Matters**: De facto standard for REST API description
- **Note**: OpenAPI 3.2 adds improved webhooks, security schemas, gateway integrations

#### AsyncAPI Initiative
- **Contribution**: Standard for event-driven APIs
- **Key Stat**: Downloads grew from 5M (2022) to 17M (2023)
- **Why It Matters**: Extends API design principles to async/event architectures

---

### The Classic Books (Chronological)

| Year | Title | Author(s) | Focus |
|------|-------|-----------|-------|
| 2007 | RESTful Web Services | Richardson, Ruby | REST fundamentals |
| 2010 | RESTful Web Services Cookbook | Allamaraju | Practical patterns |
| 2011 | REST API Design Rulebook | Masse | Naming, URIs, methods |
| 2013 | RESTful Web APIs | Richardson, Amundsen | Hypermedia, modern REST |
| 2015 | Build APIs You Won't Hate | Sturgeon | Practical, opinionated |
| 2019 | The Design of Web APIs | Lauret | Consumer-first design |
| 2020 | Design and Build Great Web APIs | Amundsen | End-to-end workflow |
| 2022 | RESTful Web API Patterns Cookbook | Amundsen | Microservices, distributed |

**Reference**: [REST API Books Collection - GitHub](https://github.com/tdonker/REST-API-books)

---

## Further Reading

### Industry Reports

- [Postman 2024/2025 State of the API Report](https://www.postman.com/state-of-api/)
- [Salt Security API Security Report 2024](https://salt.security/) - "95% experienced security issues in production APIs"

### Articles & Analysis

- [6 API Trends and Practices to Know for 2024 - The New Stack](https://thenewstack.io/6-api-trends-and-practices-to-know-for-2024/)
- [What's Next for APIs? 4 API Trends for 2025 - TechTarget](https://www.techtarget.com/searchapparchitecture/tip/Whats-next-for-APIs-API-trends)

### This Project

- **Repository**: https://github.com/getlarge/claude-aip-plugins
- **AIP Rules Implemented**: See `plugins/aip-api-design/openapi-reviewer/RULES.md`
- **Knowledge Base**: See `plugins/aip-api-design/skills/aip-knowledge/`

---

## Meta: Using This Document

### For Articles
1. Pick an angle from [Content Angles](#content-angles)
2. Use [Quotable Lines](#quotable-lines) for pull quotes
3. Reference [Thought Leaders](#thought-leaders--references) for credibility
4. Include practical examples from [Core Principles](#core-principles)

### For LinkedIn Posts
1. Start with a hook (question, story, or bold statement)
2. Keep each post focused on ONE idea
3. End with engagement prompt ("Which level is your API at?")
4. Use the post templates in [LinkedIn Post Series](#linkedin-post-series)

### For Talks
1. Use the outline in [Talk Structure](#talk-lessons-from-googles-200-api-improvement-proposals)
2. Create live demo from this repo's reviewer
3. Include war stories (audience loves failures)
4. Make it actionable (what can they do Monday?)

---

*Document created as part of the claude-aip-plugins project. Contributions welcome.*
