# Branch rules

- All work happens on branches named `abhishek-*`. The base working branch is `abhishek-main`, created from `main`.
- Start new work by branching from `abhishek-main` (e.g. `abhishek-<topic>`), or commit directly to `abhishek-main`.
- Never commit to, push to, or merge into `main` (or any branch not prefixed `abhishek-`). Changes reach `main` only through a pull request that a human merges.
- A local `pre-push` hook (`.git/hooks/pre-push`) rejects pushes to any branch not named `abhishek-*`. Do not bypass it with `--no-verify`.

# Logo and design

- Read `experimental-assets/DESIGN.md` before designing anything. Two things are constant: the logo, and the idea that everything is made from lines.
- Refer to the logo page, `experimental-assets/pages/marks.html`, before any work that touches the logo. It shows the three marks, what every part means and how each was made. The file is large, so read its text in `experimental-assets/pages/marks.md`, and look at the page itself through a local server for the drawings.
- Mark A, Three Loops, is the main logo. Use the files in `assets/img/` and never redraw it.
