---
name: plan-review
description: Review a project plan or design document (PLAN.md, a spec, a stage description) against a fixed checklist — future scale, failure handling, security, time and data, testability, scope — and report concrete issues with proposed fixes. Use when asked to review the plan, review a design, or "看一下 plan 有什么问题".
---

# Plan review

Review the plan as the person who will have to implement and run it. The goal is concrete problems, each with a proposed fix — not a summary of the plan.

## Steps

1. Read the whole plan, plus `AGENTS.md`, `README.md` and the code if it exists, so the review checks the plan against reality (a plan that contradicts the code is a finding).
2. Go through the checklist below. Skip items that do not apply; do not pad.
3. Report findings in Chinese, most important first, numbered so the user can answer "都加入" or "改 1、3、5":
   - **问题**: what is wrong or missing, quoting the section.
   - **影响**: what goes wrong in practice (a concrete scenario).
   - **建议**: the specific change to the plan.
   Separate real problems from optional improvements. Mark decisions that are the user's to make, with a recommendation.
4. Do not edit the plan until the user says which findings to apply. When applying, keep every copy in sync (e.g. prompts quoted in the plan and in code).
5. If a previous round's findings were applied, check them first, then look for new issues. Say so plainly when the plan is in good shape rather than inventing findings.

## Checklist

**Goal and scope**
- Is the goal clear, with explicit non-goals? Is anything in scope that belongs in a later batch or the backlog?
- Is the work split into stages, each small enough to verify on its own, with concrete, testable acceptance criteria?

**Future scale (not just the POC)**
- How would this move to a server or the cloud? Anything tied to one machine: system timezone, hard-coded paths, OS-specific service managers, local-only assumptions?
- More users or instances: is all state per instance? Any global state, fixed paths or shared files that would collide?
- Are the seams there (interfaces at external boundaries, config and secrets from the environment, one data directory) without building the future features now?

**Failure handling**
- What happens when each external dependency (API, feed, model, network, disk) is slow, down or returns garbage? Timeouts? Does one failure take down the whole run, or degrade one part?
- Retries: bounded, with backoff? Could a retry or restart duplicate an action (double send, double write)?
- Process killed mid-write, restart, sleep/wake, clock changes: is state consistent afterwards? Atomic writes?
- Two instances running at once: prevented or harmless?
- Graceful shutdown on SIGTERM.

**Security and privacy**
- Where do secrets live? Can they leak into logs, error messages, prompts, the repo or the container image?
- Untrusted input (user content, feeds, calendar invites, model output): injection into prompts, links, commands or files?
- Who may use it: is the sender checked?

**Time and data**
- Every "today", schedule and date calculation: in which timezone? DST, midnight, travel?
- What is stored, where, in what format, for how long? Is it enough to answer later questions ("can I see last week's?") without keeping more than needed? Corrupt-file recovery? Migration and backup?

**User control**
- Is anything automatic that the user would rather decide (guessing location, silent changes)? Can frequently changed settings be changed at runtime, including removal?
- Are first-run and error messages clear to the user, in their language?

**Testability and operations**
- Can the core logic be unit-tested without network or clock (pure functions, injected `now`)? Time logic under more than one TZ?
- How does the user try each stage for real (dry run, test command)?
- Logs: enough to debug a failure the next morning, nothing sensitive? How does the user notice when it silently stopped working?
- Dependencies: few, pinned, justified?

**Consistency**
- Does the plan contradict itself, the README, `AGENTS.md` or the code? Are names and terms used consistently?
