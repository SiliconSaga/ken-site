# Maintaining this site (developer notes)

These are the technical notes for whoever helps keep the site running — the
setup, the gotchas, how to preview locally, and how it deploys. They are **not**
published as part of the website (excluded in `_config.yml`). For the everyday
"how do I change content" guide, see [`README.md`](README.md), which is written
for a non-technical owner.

This is a plain **Jekyll** site deployed to **GitHub Pages**. There is no build
server to babysit: push to `main`, GitHub rebuilds, done.

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
| `Gemfile` | Local build dependencies (GitHub Pages ignores this and uses its own) |

## Deploying

It's **GitHub Pages, "deploy from a branch"** (`main`, root folder). Every push
to `main` triggers a rebuild within a minute — no Actions workflow to maintain.

Normal change flow (the GDD loop):

```bash
# edit files, then from the yggdrasil root:
ws commit ken-site .commits/<your-bodyfile>.md
ws push ken-site main
```

One-time setup that's **already done** (recorded here for reference / if the repo
is recreated):

```bash
# Create the repo + push (done under the SiliconSaga org — see token note):
ws gh repo create SiliconSaga/ken-site --public \
  --source=components/ken-site --remote=SiliconSaga --push

# Enable Pages (no leading slash on the path — Windows MSYS rewrites it):
ws gh api -X POST repos/SiliconSaga/ken-site/pages \
  --raw-field 'source[branch]=main' --raw-field 'source[path]=/'
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
