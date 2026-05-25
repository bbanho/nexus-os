# Feature-Sliced Parallel Development with Worktrees

## Concept

A multi-agent development workflow combining Feature-Sliced Design (FSD) architecture with Git Worktrees for true parallel development. Each feature module gets its own isolated workspace sharing a single `node_modules` via symlinks — zero duplication, zero conflicts.

## Core Principles

1. **Architecture drives parallelism** — FSD guarantees features never import each other, making isolation safe
2. **Worktrees for true parallelism** — CPU/RAM shared across agents, not disk (symlinked `node_modules`)
3. **Isolated commits** — each agent commits only to its feature path, enabling atomic PRs
4. **Autonomous review per PR** — reviews happen independently, sequentially per PR (not blocking other PRs)
5. **Global context matters** — narrow-scope agents must reference repo-wide patterns, not just their feature

---

## Workflow

### Phase 1: Setup (One-time per machine)

```bash
# 1. Ensure .worktrees is gitignored
echo ".worktrees/" >> .gitignore
git add .gitignore && git commit -m "chore: add .worktrees to gitignore"

# 2. Create base directory on fast local storage
mkdir -p /var/mnt/SATA/worktrees

# 3. npm install ONCE in the main repo
cd frontend && npm install
```

### Phase 2: Create Worktrees (One per feature)

```bash
# Each worktree: branch from current main
git worktree add /var/mnt/SATA/worktrees/wt-<feature> -b feat/<feature>

# Symlink node_modules (npm installed only in main repo)
rm -rf frontend/node_modules
ln -s /path/to/main-repo/frontend/node_modules frontend/node_modules
```

### Phase 3: Agent Dispatch (Parallel)

Each agent works **independently** in its own worktree on a **narrow feature scope**.

**Critical constraint**: agents MUST use repo-wide conventions. Example prompt:

```
You are implementing <feature>. The repo uses Angular 18 standalone components,
100% signals, new control flow (@if/@for/@defer), and Tailwind CSS.
Check existing components in frontend/src/app/features/<feature>/ for patterns.
ALWAYS use inject() instead of constructor DI.
ALWAYS use signal()/computed() instead of NgRx for local state.
```

**Per-feature rules**:
- Path scope: `frontend/src/app/features/<feature>/`
- Core services: `frontend/src/app/core/services/` — **read-only** unless explicitly part of feature
- Verify: `../../node_modules/.bin/tsc --noEmit -p tsconfig.app.json`

### Phase 4: PR Publication → Autonomous Review (SEQUENTIAL per PR)

**This is the most critical phase — do NOT skip or batch reviews.**

For EACH PR (one at a time, in any order):

1. **Push branch**:
   ```bash
   cd /var/mnt/SATA/worktrees/wt-<feature>
   git push -u origin feat/<feature>
   ```

2. **Create PR**:
   ```bash
   gh pr create --base main --head feat/<feature> \
     --title "feat(<feature>): description" \
     --body "## Summary\n- <change 1>\n- <change 2>"
   ```

3. **Launch review agent** (WAIT for Gemini comments first, 2-3 min):
   ```
   Wait for Gemini Code Assist to post comments (they auto-review on PR open).
   Then launch agent with instructions to:
   - Read existing Gemini comments on THIS PR
   - Check if build passes
   - Address ALL CRITICAL and MEDIUM issues from Gemini
   - Do NOT ignore Gemini feedback — it often catches real bugs
   ```

   Example review agent prompt:
   ```
   You are reviewing PR #<N> on github.com/bbanho/intraclinica-supabase
   
   1. Wait 2 min for Gemini Code Assist to comment (auto-triggers on PR open)
   2. gh api repos/bbanho/intraclinica-supabase/pulls/<N>/comments
   3. Read changed files: gh api repos/bbanho/intraclinica-supabase/pulls/<N>/files
   4. Run build from worktree: cd /var/mnt/SATA/worktrees/wt-<feature>/frontend && npm run build
   5. For EACH Gemini comment with [critical] or [medium]:
      - If valid: fix in the worktree, commit, push
      - If invalid: comment "Disagree: <reason>" + resolve thread
   6. After fixes pushed, PR auto-updates — verify mergeable
   7. Report: PR URL, issues found/fixed, final status
   ```

4. **Respond to threads** (agent or human):
   ```bash
   gh pr comment <N> --body "Applied fix for [critical] issue"
   ```

5. **Merge when green**:
   ```bash
   gh pr merge <N> --squash --delete-branch
   # If branch protected by worktree: skip --delete-branch
   ```

**IMPORTANT**: Do NOT start Phase 5 cleanup until ALL PRs are merged.

### Phase 5: Cleanup

```bash
# After all PRs merged:
git worktree remove /var/mnt/SATA/worktrees/wt-<feature>
git branch -d feat/<feature>  # Safe — already merged
```

---

## Anti-Patterns

- ❌ **Batching PR reviews** — agents reviewing multiple PRs simultaneously lose focus and miss issues
- ❌ **Ignoring Gemini comments** — Gemini Code Assist catches real CRITICAL issues (e.g., enum mismatches, broken templates)
- ❌ **Agents touching `core/services/` in parallel** — race condition on shared code
- ❌ **npm install in multiple worktrees simultaneously** — RAM exhaustion
- ❌ **Worktrees on network storage** — symlink performance death
- ❌ **Over-engineering prompts** — prompts that don't reference existing repo patterns create code that doesn't fit

---

## Why Narrow Scope + Review Phase Works

The FSD architecture means each PR is **guaranteed not to conflict** with others at merge time. This enables:

1. **Agents can work in parallel** — no merge conflicts to resolve
2. **Reviews are fast** — each PR touches 1-3 files max
3. **Rollback is safe** — one `git revert` per PR, no cascading effects
4. **Global consistency via review** — Gemini catches cross-cutting issues (e.g., type safety, security, API contract)

---

## Directory Structure

```
repo/
├── .git/                        # Shared canonical repo
├── frontend/
│   └── node_modules/            # ONCE — npm install here only
├── features/                    # FSD: features never import each other
│   ├── reception/
│   ├── inventory/
│   └── clinical/
└── /var/mnt/SATA/worktrees/    # Fast local storage
    ├── wt-reception/           # Branch: feat/reception
    ├── wt-inventory/           # Branch: feat/inventory
    └── wt-clinical/            # Branch: feat/clinical
```

## Space Analysis

| Component | Size | Notes |
|-----------|------|-------|
| `frontend/node_modules` | ~2GB | Installed ONCE |
| Each worktree (code only) | ~50MB | No node_modules (symlink) |
| 3 concurrent worktrees | ~3.2GB total | With node_modules + overhead |

Total vs cloning: **~70% less disk** vs 3 separate clones.

## FSD Safety Contract

Worktrees + parallel agents ONLY work because FSD guarantees:

```
features/A/ → MUST NOT import features/B/
features/A/ → CAN import core/
core/services/ → MUST NOT import features/
```

If features ever need shared logic: extract to `core/` FIRST, then parallelize.

## Rollback Strategy

```bash
# Per-feature: revert the specific commit
git revert <sha>

# Full rollback: remove worktree + branch
git worktree remove /var/mnt/SATA/worktrees/wt-<feature>
git branch -D feat/<feature>
```

Each PR is atomic. A broken feature merge does NOT affect other features.

## Skill Integration

Pairs with:
- `dispatching-parallel-agents` — for Phase 3 agent dispatch
- `git-worktrees` — for Phase 2 worktree creation
- `receiving-code-review` — for Phase 4 review workflow
- `test-driven-development` — each feature can run its own tests in isolation
- `gemini-code-assist` — auto-posts comments on PRs (must be addressed before merge)
