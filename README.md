# Gibbons for West Orange — campaign website

This is the website for **Kenneth Gibbons for West Orange Township
Council**. It's a plain, file-based site: every page is a simple text
file you (or your AI agent) can edit. No logins to a website builder, no
waiting on anyone else — you own all of it.

> **The easiest way to change anything: just ask your agent.**
> *"Add a news post about tonight's town hall."* ·
> *"Change the hero headline to …"* · *"Update my email address."*
> Then look it over, and publish. The rest of this file is the map for
> when you (or the agent) want the details.

---

## How the site is laid out

| You want to change… | Edit this file |
|---|---|
| Home page (hero, sections) | `index.html` |
| About Kenneth | `about.html` |
| Priorities (S.M.A.R.T. plan) | `priorities.html` |
| Accountability Agenda | `accountability.html` |
| FAQ questions & answers | `faq.html` |
| Privacy Policy | `privacy.html` |
| Volunteer / Contact / Survey / Bulletin pages | `volunteer.html`, `contact.html`, `survey.html`, `bulletin.html` |
| Donate page | `donate.html` |
| Site title, email, address, donate link, menu | `_config.yml` |
| The colors, fonts, spacing (the "look") | `assets/css/site.css` |
| Photos and the logo | `assets/img/` |
| **News articles** | one file each in `_news/` |

## Adding a news post

Each article is one small file in the `_news/` folder. Copy an existing
one (e.g. `_news/campaign-launch.md`), rename it, and edit the top:

```markdown
---
title: Your headline here
date: 2026-07-01
category: Campaign Update
excerpt_text: "One sentence that shows on the news list."
---

Write the full article here. As long or short as you like.
```

That's it — the new article automatically appears on the **News** page
and gets its own web address. (On the old site, clicking a news item
did nothing; here every article is a real page.)

## Switching a form to a Google Form (optional)

The Volunteer, Contact, Survey, and Community Bulletin pages currently
use an **"email the campaign"** button — replies go straight to your
inbox. If you'd rather collect responses in a Google Form, create the
form, copy its "embed" link, and paste it into `_config.yml`:

```yaml
volunteer_form_url: https://docs.google.com/forms/d/e/XXXX/viewform?embedded=true
```

Leave a line blank to keep the email button. Donations always go to your
secure **Anedot** page (set by `donate_url` in `_config.yml`).

## Previewing and publishing

- **Preview locally** (see changes before anyone else): from the
  workspace, `ws exec ken-site bundle exec jekyll serve` then open
  <http://127.0.0.1:4000/ken-site/>. (One-time setup: install Ruby, then
  `ws exec ken-site bundle install`.)
- **Publish:** commit and push (your agent can do this for you). GitHub
  rebuilds the live site within a minute.

When you're ready to use **gibbonsforwestorange.com** for this site,
change `baseurl` in `_config.yml` back to `""` and add a `CNAME` file —
ask your agent to walk you through the domain switch.

---

*This site is maintained by the campaign with the help of an AI agent,
using the GDD workflow. It was rebuilt from the original campaign site
as a clean, self-manageable version Kenneth controls end to end.*
