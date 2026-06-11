---
title: "The TODO System I Use to Run Claude Code on a Real Rails Project"
description: "How I give Claude Code durable task state across sessions: a two-layer system of version-controlled markdown TODO files, wired into CLAUDE.md so the agent maintains it itself on a production Rails project."
date: 2026-06-10
tags: ["blog", "claude-code", "rails", "ai", "workflow", "productivity"]
layout: layouts/blog-post.njk
permalink: "/blog/{{ title | slugify }}/"
---

{% raw %}
I've been building a Rails app with Claude Code as my pair for a few months now, and the single biggest thing that made it *actually work* — more than any prompt trick or model upgrade — was giving the agent a place to keep track of work.

Here's the problem in one sentence: **an AI agent is stateless between sessions, but a real project isn't.** I close my laptop, come back two days later, start a fresh session, and the model has no memory of what we did, what's half-finished, or what we agreed to do next. If "what's next" only lives in my head or in a chat transcript that got compacted away, every session starts by re-deriving context — slowly, and often wrongly.

The fix turned out to be boring and durable: **keep task state as version-controlled markdown, at two altitudes, and teach the agent the protocol so it maintains the system itself.**

No SaaS tracker. No API. No plugin. Just files in the repo, in the same diffs and PRs as the code. Let me walk through it.

## The shape: two layers

There are two layers, operating at different zoom levels:

1. **`docs/TODO.md`** — one high-level index for the whole project. The "what next" queue.
2. **`docs/todo/<branch-name>.md`** — a granular, disposable checklist for one feature branch. The "how" for a single chunk of work.

And then there's the glue that makes it agent-friendly:

3. **`CLAUDE.md`** — encodes the protocol as standing instructions, so Claude maintains the system without me having to ask.

That third piece is the whole trick, but let's build up to it.

## Layer 1: the index (`docs/TODO.md`)

The top-level file is a strict priority queue with four sections, ordered top-to-bottom:

| Section | Purpose | Rule |
|---|---|---|
| **Now** | Actively in progress | WIP limit: 1–3 items. If "Now" has five things, nothing is moving. |
| **Next** | Prioritized queue | Top item = what I'd start next session. |
| **Someday** | Maybes, low-priority polish | Re-evaluated every few weeks; stale items get evicted. |
| **Done** | Recent wins | Date-stamped, trimmed after ~2 weeks. |

Tasks move through an explicit little state machine:

- New idea → **Next** (will do) or **Someday** (might do)
- Start working → **Now**
- Complete → date-stamp and move to **Done** (`- [x] 2026-06-10 — description`)
- Blocked → annotate inline `(blocked: waiting on X)` and move back to **Next**
- Cancelled → **delete it.** No tombstones unless the *decision* itself matters — and if it does, that belongs in a planning doc, not the task list.

### The opinionated formatting rules

This is where the system earns its keep. A few rules I hold the line on:

- **One line per task.** If a task needs a paragraph to explain, that paragraph belongs in a planning doc, and the TODO line just *references* it: `Add friendly_id — see docs/tech-stack.md`. The queue stays scannable.
- **No nested sub-task forests.** The moment a task sprouts a tree of sub-bullets, one of two things is true: either it's really several sibling tasks, or those sub-steps belong one layer down (more on that in a second). The index never becomes an outline.
- **Dates on Done items only.** Future-dated TODOs lie — they pretend you know when you'll do something. You don't.
- **Git log is the permanent record.** That's *why* `Done` can be trimmed ruthlessly. I'm not keeping a forever-changelog in a markdown file; I'm keeping a short list of recent wins so the agent (and I) can see momentum. The real history is in the commits.

That last point quietly removes a whole category of anxiety. You never have to feel bad deleting things, because nothing is actually lost — it's all in version control.

## Layer 2: the disposable branch scratchpad (`docs/todo/<branch>.md`)

Here's the part most people skip, and it's what lets the system handle work bigger than a single sitting.

When a task is substantial — multi-step, multi-session, lives on a feature branch — the one-liner in `TODO.md` becomes the *goal*, and a companion file holds the granular checklist. The conventions:

- **The filename matches the branch name** (dropping any `feature/` prefix): `feature/implement-auth` → `docs/todo/implement-auth.md`.
- The `Now` line in `TODO.md` **links to it**, so the index points down to the detail.
- It's a **scratchpad, not a deliverable.** Refine it constantly as you work — that's expected and fine.
- **It's deleted when the branch merges**, in the same commit or right after. The PR description and commit messages become the permanent record.

The template is deliberately minimal:

```markdown
# <One-line statement of the branch's goal>

**Branch:** `<branch-name>`
**Started:** <YYYY-MM-DD>

## Sub-tasks
- [ ] ...
- [ ] ...
```

Because the branch file is throwaway, it's allowed to have all the structure the index forbids — headed sub-sections, in-progress checkbox states, notes to yourself. The index stays clean precisely *because* the mess has somewhere to go.

### The rule I'm proudest of: cross-branch follow-ups

This is the sharpest idea in the whole system, and it's a one-liner:

> If you discover work mid-branch that **outlives** the current branch, it goes to `TODO.md`'s `Next` or `Someday` — **never** the branch file.

Why? Because the branch file *dies on merge.* If I'm deep in the auth branch and notice "we should really add the `bullet` gem someday," and I jot that in the branch file, it gets deleted the moment auth merges. The idea evaporates.

So the rule forces a tiny decision at the moment of capture: **how long does this follow-up need to live?** Branch-local detail goes in the scratchpad. Anything that outlives the branch goes up to the index. You decide the *lifespan* of every note when you write it, which means nothing important ever gets thrown away and nothing trivial ever clutters the long-term list.

## The glue: making Claude maintain it

Everything above is just a convention. It would work fine for a solo human with discipline. What makes it sing with an AI agent is that **the protocol is written into `CLAUDE.md`** — the file Claude Code reads as standing instructions at the start of every session.

That turns the convention into *behavior*. Specifically, Claude:

**Runs a fixed ritual when starting substantial work.** It doesn't just dive into code. It:

1. Syncs `main` (`git checkout main && git pull`)
2. Cuts the branch
3. Copies the template into `docs/todo/<branch>.md` and fills in a first-pass sub-task list
4. Moves the `TODO.md` line into `Now` and points it at the branch file
5. **Plans with me before writing any feature code**
6. Commits and pushes the setup as a clean baseline

Step 5 is the one I'd underline. The instruction is explicit that the agent presents its refined sub-task list and *confirms scope before implementing.* It's not allowed to run off and build against its own first guess. The TODO system doubles as a planning gate.

**It treats task-tracking as part of "done."** The instruction in `CLAUDE.md` is blunt about this: updating the TODO is "the same as updating tests or docs — the task isn't done until `TODO.md` (and the branch file, if any) reflect reality." So I don't have to remember to prompt "now update the todo." Finishing the work *includes* updating the queue.

**It self-classifies.** Trivial, single-line fixes skip the entire ceremony — no branch, no file, just do it and log it to `Done`. The overhead only kicks in when the work warrants it.

## The payoff: cold-resuming across sessions

Here's the moment that sold me. Right now my active branch is `first-deploy` — getting the app onto a VPS with Kamal. It's a multi-day task with an external blocker (waiting on DNS to propagate). I paused it, did other things, came back.

When I reopened the session, Claude read `docs/todo/first-deploy.md` and immediately knew where we stood — because the top of that file is a `▶ Resume here` block: a handoff note explaining exactly what's done, what we're blocked on, and the *literal next command to run* once DNS resolves. Something like:

```markdown
## ▶ Resume here (last updated 2026-06-10)

All repo config is done, committed, and pushed (tests green). We are paused
on a single external blocker: DNS propagation.

Before running setup, export both secrets, then verify:

    dig +short wheretodirtbike.com      # must return the VPS IP
    dig +short www.wheretodirtbike.com  # must return the VPS IP

Then the next command is: bin/kamal setup
```

Below that, the granular checklist uses three states — `[ ]` not started, `[~]` in progress, `[x]` done — grouped under headed sections (Prerequisites / Repo config / Bootstrap & deploy / Wrap-up). All the structure the flat index would never allow, living happily in the disposable file.

A fresh session reads that and resumes cold. So does future-me. There's no "wait, where were we?" tax — the state is on disk, in the repo, legible to both human and model.

## Why files beat a task-tracker SaaS (for agent work)

I want to be clear this isn't anti-Jira zealotry. For *agent* work specifically, plain files in the repo win for concrete reasons:

- **Same diff, same PR, same review.** Task changes ride along with the code changes that caused them. The story of *what* changed and *why it was on the list* is one unit.
- **No integration surface.** The agent already reads and writes files. There's no API to authenticate against, no MCP server to keep alive, no rate limit.
- **Fully legible to the model.** It's just markdown in the context window. The agent can read the whole queue, reason about priority, and edit it — no tool round-trips, no lossy API schema in between.
- **Version-controlled by definition.** Every state of the task list is recoverable. The history is free.

## The minimum viable version

If you want to try this, you don't need my exact setup. The smallest version that captures the value:

1. A `docs/TODO.md` with **Now / Next / Someday / Done**, a WIP limit on Now, and one-line tasks.
2. A `docs/todo/` folder with one disposable file per feature branch, deleted on merge.
3. A paragraph in your `CLAUDE.md` telling the agent to (a) plan in the branch file before coding, and (b) treat updating the TODO as part of finishing any task.

That's it. The discipline is in the rules — one line per task, no forests, decide a follow-up's lifespan when you write it, dates on Done only — and the magic is in handing those rules to an agent that will actually follow them every single time.

## Appendix: copy-paste skeletons

Here are the three files, stripped to the bone. Drop them in, adjust the wording, and you're running.

### `docs/TODO.md`

```markdown
# TODO

The operational task list for this project. **What's next**, not what or why.

## How to use this file

- **Now** — actively in progress. Cap at 1–3 items (WIP limit).
- **Next** — prioritized queue. Top item is what you'd start next session.
- **Someday** — ideas, maybes, low-priority polish. Re-evaluate every few weeks.
- **Done** — recent wins, date-stamped. Trim after ~2 weeks (git log is the record).

Lifecycle: new idea → Next/Someday · start → Now · done → date-stamp into Done ·
blocked → annotate `(blocked: X)` and move back to Next · cancelled → delete it.

One line per task. No nested sub-task forests. Dates on Done items only.
Substantial work gets a branch file at `docs/todo/<branch>.md` that this line links to.

---

## Now

- [ ] <active task — links to docs/todo/<branch>.md if it has one>

## Next

- [ ] <next thing you'd start>

## Someday

- [ ] <maybe, someday>

## Done

- [x] 2026-06-10 — <recently shipped thing>
```

### `docs/todo/_template.md`

```markdown
# <One-line statement of the branch's goal>

**Branch:** `<branch-name>`
**Started:** <YYYY-MM-DD>

## Sub-tasks

- [ ] ...
- [ ] ...
- [ ] ...
```

For a multi-session branch, add a resume block at the very top so any fresh
session (or future-you) can pick it up cold:

```markdown
## ▶ Resume here (last updated <YYYY-MM-DD>)

<What's done. What we're blocked on. The literal next command to run.>
```

Checkbox states I use in branch files: `[ ]` not started · `[~]` in progress · `[x]` done.

### The `CLAUDE.md` paragraph that wires it to the agent

```markdown
## Task management

Work is tracked in two layers: `docs/TODO.md` (high-level index: Now / Next /
Someday / Done) and `docs/todo/<branch>.md` (granular sub-tasks for substantial
work — filename matches the branch, deleted on merge).

When starting substantial work: sync main, cut the branch, copy
`docs/todo/_template.md` to `docs/todo/<branch>.md`, fill in a first-pass
sub-task list, move the TODO.md line into Now. **Then plan with me and confirm
scope before writing feature code.** Trivial single-line fixes skip all of this.

Follow-ups discovered mid-branch: branch-local → the branch file; outlives the
branch → TODO.md's Next or Someday (never the branch file — it dies on merge).

Updating the TODO is part of finishing any task — same as updating tests or
docs. The task isn't done until TODO.md (and the branch file, if any) reflect
reality. Delete the branch file when the branch merges.
```

---

*This is part of an ongoing series on how I actually use Claude Code day-to-day on a production Rails project. Next up: how I keep planning docs and the agent's context in sync.*
{% endraw %}
