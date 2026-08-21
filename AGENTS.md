# Working on this site

Notes for an AI agent asked to change this site. Humans are welcome to read it, but the audience is unusual on purpose: most of what follows is what an agent gets wrong here on its first attempt.

For the everyday "how do I change content" guide see [`README.md`](README.md), written for the site's non-technical owner. For setup, deploys and gotchas see [`MAINTAINING.md`](MAINTAINING.md).

## What this site is

A Jekyll site for a local election campaign, owned by a non-technical candidate. Every page is a plain file he can edit or ask an agent to edit — that independence is the point of the whole rebuild, so prefer changes that keep it: plain files, no build steps he cannot run, no service only you can log into.

Published under his name, to people who will act on what it says. That makes invented facts the worst failure available here, worse than an ugly page or a broken build. See *Never invent facts* below.

## The one that catches every agent: content repeats

A phrase on one page is usually on others too — a summary card on the home page, a nav label, the same heading in another layout, a mention in a news post. **Search the whole project before changing anything**, for the exact text and for the words around it, then change every place it appears or say plainly which you are leaving and why.

This has happened for real: an acronym was updated on the Priorities page while the home page kept the old wording. The reviewer caught it, which is what the reviewer is for — but it cost a round trip that a project-wide search would have saved.

The site's look is driven by *custom* classes rather than defaults, so grep for those too. `bg-cream-section` marks the alternating light sections; a reconstruction that only looked at `:root` and `bg-white` flattened the whole site to dark and had to be redone.

## Layout

| Path | What it is |
|------|------------|
| `_config.yml` | Title, nav, contact details, donate URL, the rotating announcement bar, form URLs, repo coordinates |
| `index.html`, `about.html`, … | The pages. HTML so the layout can be rich; the prose inside is plain |
| `_news/*.md` | One file per news article — each gets its own URL by construction |
| `_layouts/` | `default.html` (header, nav, footer) and `news.html` (single article) |
| `assets/css/site.css` | All styling: dark and cream sections, gold accents, fonts |
| `assets/img/` | Logo and photos |
| `.github/visual-diff/` | Screenshot and pixel-diff scripts used by CI |

Adding a news post means adding one file to `_news/` with `title`, `date`, `category` and `excerpt_text` in its front matter. It appears on the News page and gets its own address automatically. Keep pages **short** where you can: a long page still diffs correctly but reviews worse.

## Never invent facts

Do not invent dates, times, venues, addresses, prices, names, quotes, endorsements or statistics — not even as a placeholder that reads better. If a detail is missing from the page text, leave it visibly unfilled (`TBD`) and ask. An obviously incomplete draft is safe; a confidently wrong one is not, because the person whose name is on it will be the one correcting the record.

**`TBD` belongs in prose, never in front matter.** A news post's `date` is parsed as a real date when the site builds, so `date: TBD` does not render as a placeholder — it fails the build. If you do not know a required front-matter value, stop and ask for it rather than filling something in.

Knowing the town does not tell you the venue. Only repeat specifics someone gave you or that you read in this repository.

## How changes reach the site

Branch, commit, open a pull request. **Never commit to `main`** and never merge your own work: the owner merges, and the PR page is what he reviews on.

That page carries a preview link and before/after screenshots of anything that changed visually, which is what makes review possible for someone who does not read diffs. Say what you changed in a sentence or two and hand over the link.

## Checking your work

```bash
ws exec ken-site bundle exec jekyll build     # catches Liquid errors
ws exec ken-site bundle exec jekyll serve     # http://127.0.0.1:4000/ken-site/
```

A local build is optional — CI builds every PR — but it is the fastest way to catch a broken template before a reviewer does.

---

<!-- The section below is temporary. It is GDD workspace idiom rather than knowledge
     about this site, and it belongs in the sandbox's concierge skill once that
     exists. Kept here for now because a cold agent session hit every one of these
     and had nowhere to learn them. Delete it when the skill lands. -->

## Working in a GDD workspace (temporary — moves to the concierge skill)

- **One command per call.** No `cd`, `&&`, `;` or pipes — the workspace refuses composed commands so each one can be checked on its own.
- **Use `ws exec ken-site <command>`** to run anything inside this repository. It is the composed form's job done in a single command: `ws exec ken-site git checkout -b fix/typo`, not `cd components/ken-site; git checkout -b fix/typo`.
- **Use the `ws` verbs, not raw git**, for the things that need attribution and auth: `ws commit`, `ws push`, `ws cr`.
- **Narrow output with flags, not pipes** — `git log -3`, `ws review --limit 5`. Only when you are sampling: a search for content to change has to show every occurrence, so never cut one short with `grep -m5` or a `head`. Missing the fifth-and-later copies of a phrase is the failure described at the top of this file.
- **Prefer `Read` / `Glob` / `Grep` over shelling out.** They are direct and there is nothing to compose.
