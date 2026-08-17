# ADR-008 — Field-level visibility classification

**Status:** Accepted · **Date:** 2026-08-17

## Context

A public BID profile must be useful to someone checking a counterparty, and must
never expose documents, identifiers, bank details, candidate data or raw
evidence. Deciding that per screen guarantees a leak the first time a developer
adds a field to a serializer.

## Decision

Every field and evidence record carries a classification:

`PUBLIC < ORGANIZATION_ONLY < RELATIONSHIP_ONLY < AUTHORIZED_ONLY < SENSITIVE < RESTRICTED`

The viewer's maximum clearance is computed from context (anonymous, counterparty
in an active relationship, authorization holder, the subject itself, the
requesting workspace), and reads are filtered against it. Public projections are
**derived from classification** plus an explicit `publicSummaryAllowed` flag on
the check definition — never from a hand-maintained field list.

## Consequences

- Adding a check cannot accidentally publish it: it must opt in, twice.
- The same rule set governs the web app, the API and search, so there is one
  definition of "safe to publish".
- Tests assert that public profile and card payloads contain no restricted
  material.
- Cost: every new field needs a classification decision. That is the point.

## Alternatives considered

- **Per-endpoint DTOs.** Works until two endpoints disagree, which is
  immediately.
- **All-or-nothing public profile.** Either useless or dangerous.
