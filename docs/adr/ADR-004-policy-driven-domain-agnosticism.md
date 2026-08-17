# ADR-004 — Policy-driven domain agnosticism

**Status:** Accepted · **Date:** 2026-08-17

## Context

Due diligence differs by industry: a hospital cares about sector licences, a
factory about quality certification and financial stability, a recruiter about
statutory workforce compliance. The obvious implementation — a module per
industry — multiplies the engine by the number of verticals and guarantees they
drift apart.

## Decision

One engine, configurable by **policy**:

```
CORE BID ENGINE + CONFIGURABLE POLICY = INDUSTRY WORKFLOW
```

A policy declares subject type, relationship type, industry, risk level,
required and optional checks (with blocking flags), documents, thresholds,
validity, re-verification interval, monitoring cadence, approval rule and
consent requirement. Policies are versioned, and **a version becomes immutable
once it has justified a completed decision**; edits create a new version.

## Consequences

- No industry branches exist in the codebase; `grep -i hospital src/` returns
  nothing outside copy and templates.
- New verticals ship as templates, which product staff can author.
- A decision is always reconstructible: it names a policy *version* that cannot
  have changed underneath it.
- The policy generator (`/demo`) can produce a working policy from
  target × industry × risk, because policy is data.
- Cost: policy authoring becomes a first-class product surface, with versioning,
  sealing and (eventually) diffing.

## Alternatives considered

- **Industry modules.** Fast for vertical #1, quadratic thereafter.
- **Mutable policies.** Cheap, and silently destroys the auditability that is the
  entire product.
