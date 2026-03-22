# Adaptive Business Suite Constitution

## Core Principles

### I. Business-Critical Reliability
Adaptive Business Suite treats core workflows, tenant data access, and operator-facing automation as business-critical paths. Every change MUST preserve predictable behavior for authentication, tenant isolation, persistence, and user-visible workflows before adding new capability. Features that can degrade correctness or availability MUST ship behind explicit safeguards such as bounded retries, idempotent handlers, failure states visible to operators, and health indicators that distinguish degraded service from healthy service.

### II. Security And Tenant Data Protection
Security and tenant isolation are mandatory design constraints, not follow-up work. All new server behavior MUST enforce authentication, authorization, input validation, and least-privilege access to tenant data. Shared contracts in `shared/` MUST avoid exposing secrets or cross-tenant data by default, and all AI, document, image, and analytics workflows MUST define how tenant boundaries, auditability, and redaction are preserved before implementation begins.

### III. Independently Testable Vertical Slices
All material changes MUST be delivered as incremental vertical slices that can be implemented, verified, and rolled back independently. A valid slice spans only the files needed across `client/`, `server/`, `shared/`, `test/`, and `e2e/` for one user-visible capability, and MUST avoid speculative rewrites of unrelated areas. Each slice MUST define unit or contract coverage in `test/` and an end-to-end or workflow-level verification path in `e2e/` when user behavior changes.

### IV. Observability By Default
Every new endpoint, async worker, realtime channel, and high-value UI workflow MUST emit enough telemetry to answer four questions without ad hoc debugging: what happened, for whom, when, and whether it succeeded. Structured logs, request or job identifiers, error categorization, and service health visibility are required for new backend capabilities. User-facing workflows that depend on async or AI processing MUST expose actionable status to operators rather than silent waiting or hidden failure.

### V. Simplicity Over Cleverness
The repository favors straightforward TypeScript, explicit contracts, and small composable modules over abstractions that reduce clarity. New design work MUST preserve the current `client/`, `server/`, and `shared/` architecture unless a change is necessary to unlock a tested vertical slice. Hidden control flow, framework churn, and novelty-driven dependency adoption are prohibited unless they clearly reduce operational risk and the benefit is documented in the spec.

## Delivery Constraints

- The canonical application shape remains the existing TypeScript full-stack layout rooted in `client/`, `server/`, `shared/`, `test/`, and `e2e/`.
- Full rewrites are not allowed. Migration work MUST coexist with the current architecture and retire old behavior only after equivalent or better behavior is proven in production-ready tests.
- Deployment, runtime, or infrastructure changes MUST NOT ship without documented health checks, rollback steps, and a clear owner for operational verification.
- Secrets, tokens, certificates, local IDE settings, local agent state, build artifacts, and machine-specific workflow files MUST NOT be committed to git. Runtime configuration belongs in environment variables, managed secret stores, or documented local examples only.
- Dependency adoption MUST remain cost-aware. Premium or operationally heavy services require explicit justification in the spec, including why existing platform capabilities or low-cost alternatives are insufficient.

## Engineering Workflow And Quality Gates

1. Every feature spec MUST describe independent user stories, edge cases, measurable outcomes, and the smallest viable slice order.
2. Every implementation plan MUST identify the touched vertical slice, affected tenant data boundaries, required observability, and rollback approach before coding begins.
3. Shared types and validation schemas in `shared/` MUST change before or together with server and client behavior so contracts remain explicit and testable.
4. New backend routes, AI endpoints, queue workers, and realtime paths MUST include request protection, failure handling, and operational logs in the same change set.
5. New user-visible workflows MUST include test coverage in `test/` and `e2e/` appropriate to the risk of regression; missing coverage requires written justification in the spec or plan.
6. Pull requests and reviews MUST reject changes that add cross-cutting complexity without a demonstrated need, weaken tenant protections, bypass observability, or introduce deployment risk without health and rollback procedures.

## Governance

This constitution overrides conflicting local habits and informal conventions for this repository. Specs, plans, tasks, and reviews MUST cite compliance with these principles. Amendments require: a documented rationale, the exact operational or product pressure driving the change, updates to affected templates or workflow guidance, and approval from repository maintainers. Versioning rules are strict: editorial clarifications increment the patch version, new principles or materially stronger guardrails increment the minor version, and any redefinition or removal of a core principle increments the major version.

**Version**: 1.0.0 | **Ratified**: 2026-03-22 | **Last Amended**: 2026-03-22
