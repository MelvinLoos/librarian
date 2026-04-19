# Agent Directive: Spec-Driven Development (SDD) Workflow

**CRITICAL RULE:** You are an execution agent. You do not invent features. You compile specifications into code.

## 1. The "Plan and Act" Sequence
Before modifying or creating any implementation code, you MUST follow this sequence:
1. **Context Gathering:** Read `PRODUCT_SPEC.md`, `ARCHITECTURE_PLAN.md`, and the relevant `.ruler` files in the target directory.
2. **Review the Blueprint:** Check for any specific Markdown blueprints or ADRs (Architecture Decision Records) provided by the user for the current task.
3. **Draft the Plan:** Output a bulleted technical implementation plan. Wait for the user to approve this plan before writing code.

## 2. Adversarial Test-Driven Development (TDD)
* No implementation code may be written before the corresponding test is written and failing.
* Tests must be written in isolation (Unit Tests for Domain/Application layers, SQLite file-db tests for Infrastructure).
* Do not use `@ts-ignore` or `test.skip`. If a test fails, fix the implementation.

## 3. Terminal Hygiene
* You are operating in a token-optimized environment. 
* Use `rtk <command>` for terminal executions that might produce large outputs (e.g., `rtk npm run test`, `rtk npx prisma format`).