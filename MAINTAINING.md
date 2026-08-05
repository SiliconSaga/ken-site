# Maintaining this site (developer notes)

These are the technical notes for whoever helps keep the site running — the
setup, the gotchas, how to preview locally, and how it deploys. They are **not**
published as part of the website (excluded in `_config.yml`). For the everyday
"how do I change content" guide, see [`README.md`](README.md), which is written
for a non-technical owner.

This is a plain **Jekyll** site deployed to **GitHub Pages**. GitHub Actions does
the building: `main` is the source you edit, `gh-pages` is the built output CI
publishes, and every pull request gets its own preview of the site plus a
before/after picture of what changed.

---

## What you need to work on it locally

Local preview is optional — you can edit content and push without it, and GitHub
will build the site. But a local preview (`jekyll serve`) lets you see changes
before they go live.

### 1. Ruby + Jekyll

| OS | Install |
|----|---------|
| **Windows** | `winget install RubyInstallerTeam.RubyWithDevKit.3.3` — the **WithDevKit** variant bundles the MSYS2 build tools, so you skip a separate interactive `ridk install`. |
| **macOS** | `brew install ruby` (or use `rbenv`/`asdf`). The system Ruby is too old. |
| **Linux** | Install `ruby-full` + `build-essential` via your package manager. |

Then install the gems (from the yggdrasil workspace root):

```bash
ws exec ken-site bundle install
```

### 2. Gotchas worth knowing

- **Windows PATH won't refresh until you restart the *IDE*, not just the
  terminal.** After installing Ruby, `ruby --version` can still fail in an
  editor's integrated terminal because the editor process captured the old
  `PATH` at launch. Fully quit and reopen the editor (not just the terminal
  tab).
- **`wdm` is deliberately not in the Gemfile.** That gem (a Windows file-watch
  optimization for `jekyll serve`) fails to compile on Ruby 3.3+. It's optional;
  `listen` falls back fine without it. Don't add it back.
- **The `github-pages` gem is pinned** so a local build uses the exact Jekyll
  version GitHub Pages runs server-side. What you see locally is what deploys.

## Preview locally

```bash
ws exec ken-site bundle exec jekyll serve
```

Open <http://127.0.0.1:4000/ken-site/> (note the `/ken-site/` path — see
*baseurl* below). Or just build without serving to catch errors:

```bash
ws exec ken-site bundle exec jekyll build
```

## How it's laid out

| Path | What it is |
|------|------------|
| `_config.yml` | Site settings: title, nav, contact details, donate URL, announcement bar, form URLs, repo coordinates |
| `index.html`, `about.html`, … | The pages (HTML so the layout can be rich; content is plain prose inside) |
| `_news/*.md` | One Markdown file per news article → each gets its own URL |
| `_layouts/default.html` | Shared header (with the rotating banner), nav, and footer |
| `_layouts/news.html` | Single-article layout |
| `assets/css/site.css` | All the styling (dark + cream sections, gold accents, fonts) |
| `assets/img/` | Logo and photos |
| `Gemfile` · `Gemfile.lock` | The gems CI builds with (see *Deploying*) |
| `.github/workflows/` | `deploy.yml` (publish `main`) and `pr-preview.yml` (preview + visual diff) |
| `.github/visual-diff/` | The screenshot/pixel-diff scripts and the CI-only config overlay |

## Deploying

The live site is served from the **`gh-pages`** branch (root folder), and that
branch is written **only by CI** — never by hand. Two workflows keep it current:

| Workflow | Runs on | What it does |
|----------|---------|--------------|
| `deploy.yml` | push to `main` | Builds the site and replaces the production tree on `gh-pages`, leaving `pr-preview/` alone. |
| `pr-preview.yml` | pull request opened / updated / closed | Publishes that PR's build to `gh-pages:/pr-preview/pr-<N>/` and comments the link; a second job screenshots `main` and the PR, pixel-diffs them, and comments the before/after images. Closing the PR deletes the whole preview. |

Two things about that arrangement are load-bearing:

- **`.nojekyll` at the root of `gh-pages`.** Without it GitHub re-runs Jekyll
  over already-built output and drops `_`-prefixed paths, which silently 404s the
  visual-diff images under `_diff/`.
- **The `Gemfile`/`Gemfile.lock` now decide how the live site is built.** They
  used to be local-preview-only (GitHub Pages supplied its own gems server-side);
  since CI runs `bundle exec jekyll build`, the lockfile is the build. It carries
  the `x86_64-linux` platform so the Linux runner can install from it — don't
  remove that platform, and re-run `bundle lock --add-platform x86_64-linux` if it
  ever goes missing.

Normal change flow (the GDD loop) — a topic branch and a PR, so the preview and
the visual diff exist to review before anything reaches the live site:

```bash
# from the yggdrasil workspace root
ws exec ken-site git checkout -b <type>/<short-description>
# ... edit files ...
ws commit ken-site .commits/<your-bodyfile>.md
ws push ken-site
ws cr ken-site "<type>: <what changed>" .crs/<your-bodyfile>.md
```

The PR picks up two bot comments: the preview link, and the visual diff (or "no
visual changes" for an edit that doesn't touch the rendered site). Merging fires
`deploy.yml` and the live site follows within a minute or two.

One-time setup that's **already done** (recorded here for reference / if the repo
is recreated):

```bash
# Create the repo + push (done under the SiliconSaga org — see token note):
ws gh repo create SiliconSaga/ken-site --public \
  --source=components/ken-site --remote=SiliconSaga --push

# Enable Pages. Write the API endpoint without a leading slash — on Windows,
# MSYS rewrites a leading-slash argument into a filesystem path. (The site's own
# `source[path]=/` is unrelated: that slash means the repository root, and stays.)
# The site launched on main/root and was moved to gh-pages/root when previews
# arrived: Pages serves one site per repo, so previews have to live inside the
# production tree, which means production has to be built output on its own branch.
ws gh api -X POST repos/SiliconSaga/ken-site/pages \
  --raw-field 'source[branch]=gh-pages' --raw-field 'source[path]=/'
```

- **Token / account note.** The repo lives under the **SiliconSaga** org because
  the agent token has rights there. Creating it under a personal account
  (`Cervator`) with an agent/bot token fails with *"cannot create a repository"* —
  that needs a personal PAT. When the site moves to Ken, the repo transfers to
  his account and these coordinates change (update `github_repo` in
  `_config.yml`, which also fixes the footer "Edit this page" links).

## baseurl & the custom domain

`_config.yml` sets `baseurl: /ken-site` because the site is served from a
project-pages path: `https://siliconsaga.github.io/ken-site/`. All links and
asset paths use Jekyll's `relative_url` filter, so this one line moves the whole
site.

To switch to the real domain **gibbonsforwestorange.com** (Ken owns it):

1. Set `baseurl: ""` in `_config.yml`.
2. Add a `CNAME` file at the component root containing `gibbonsforwestorange.com`.
3. Point DNS at GitHub Pages (an `ALIAS`/`ANAME` or four `A` records for the
   apex domain — see GitHub's custom-domain docs).
4. In the repo's **Settings → Pages**, set the custom domain and enable HTTPS.

## Where the content came from

The site was rebuilt from the original `gibbonsforwestorange.com` (a built
Vite/React app whose source the owner couldn't access). Page copy, the news
items, the S.M.A.R.T. and Valley P.A.R.K. plan content, the palette, and the
images were recovered from the live site and rebuilt as these plain, editable
files. The news articles carry the original one-sentence summaries as their
bodies — they're meant to be expanded with Ken over time.
