# ADR 0001: Defer Integration & Delivery Contexts to Phase 2

## Context
The MVP specification originally included the `Integration` (external APIs) and `Delivery` (Kobo/OPDS) contexts. However, validating the core reading and ingestion pipeline is a higher priority.

## Decision
We are officially deferring the implementation of the `/integration` and `/delivery` Bounded Contexts to a V2 release. The codebase will currently only support local ingestion and manual metadata management.

## Status
Accepted.

## Consequences
- We save immediate token/agent budget by focusing on the core `Catalog`, `Storage`, and `IAM` contexts.
- The `Catalog` context must not depend on external enrichment for the MVP to function.