# ADR-001 — Organization as the primary entity

**Status:** Accepted · **Date:** 2026-08-17

## Context

Verification and due-diligence products usually start by modelling the account
type they were first sold to: a vendor-management tool has vendors, a BGV tool
has candidates, a KYB tool has "merchants". That works until the same company
turns up on the other side of a relationship — which it always does. XYZ HR
Consultants is a vendor to ABC, a customer of its own suppliers, an employer of
people, and a verification requester. Modelling it as a `VendorAccount` makes
three of those four cases unrepresentable.

## Decision

**Organization** is the primary entity. It is never intrinsically a vendor,
supplier, customer or contractor. Those are facts about a *relationship* or about
the organization's *commercial state with BID*, held separately.

The model is `ORGANIZATION + RELATIONSHIP + ROLE + POLICY + PERMISSIONS`.
There are no `VendorAccount`, `SupplierAccount` or `CustomerAccount` types.

## Consequences

- One identity per organization across the whole network, however many roles it
  plays. A verification it completed for one buyer is visible to it as an asset,
  not duplicated per counterparty.
- Adding a new relationship type is configuration, not a new account type, a new
  table, or a new UI surface.
- The cost is indirection: nothing about an organization tells you what it *is*
  to you — you must read the relationship. That is the correct trade.
- The flywheel becomes expressible at all: subject today, requester tomorrow, on
  the same identity.

## Alternatives considered

- **Separate account types per role.** Simpler screens on day one; unrepresentable
  network on day thirty.
- **Role as an attribute on the organization.** Breaks the moment two
  counterparties disagree about what the organization is to them.
