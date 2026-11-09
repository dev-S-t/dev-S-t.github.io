# Branch rules

- All work happens on branches named `abhishek-*`. The base working branch is `abhishek-main`, created from `main`.
- Start new work by branching from `abhishek-main` (e.g. `abhishek-<topic>`), or commit directly to `abhishek-main`.
- Never commit to, push to, or merge into `main` (or any branch not prefixed `abhishek-`). Changes reach `main` only through a pull request that a human merges.
- A local `pre-push` hook (`.git/hooks/pre-push`) rejects pushes to any branch not named `abhishek-*`. Do not bypass it with `--no-verify`.
