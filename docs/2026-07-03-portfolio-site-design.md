# nickholzherr.com — portfolio site design

Date: 2026-07-03
Status: approved (Nick, in-session)

## Purpose

Personal portfolio / press page for Nick Holzherr: bio, headshot, press
coverage, podcast talking points. Audience: podcast hosts, journalists,
founders, investors. Look: super modern and clean, not complicated.

## Current state

- `nickholzherr.com` is on Cloudflare (nameservers maeve/johnathan
  .ns.cloudflare.com), proxied, serving a "Hello World!" plain-text
  Cloudflare Worker. No `www` record. No existing site repo.

## Design

**Single scrolling page, editorial-minimal direction**: big serif headline
type, generous whitespace, near-monochrome palette, one large headshot.

Sections, in order:

1. **Hero** — name, one-liner ("Three-time founder. Building GitLaw — the
   AI agent for contracts."), large headshot with a B/W treatment.
   Headshot picked from Drive "Images of GitLaw Founder Nick Holzherr"
   (files 014 N / 030 P / 038 N); Nick can veto the pick.
2. **Bio** — Nick's supplied paragraph, verbatim (Whisk → Samsung Food,
   Air HR, GitLaw, 20+ angel investments, honorary doctorate from Aston).
3. **Featured in** — ~12 curated press hits as a clean text list / logo
   row, each linking to the live article. URLs reconstructed from the
   Drive "Press Coverage" cutting filenames and verified before shipping;
   dead links dropped. Pool includes: TechCrunch, The Verge / Vergecast,
   Forbes, BBC, PCMag, Business Insider, AdWeek, VentureBeat, CNET,
   Mashable, Gizmodo, TechRadar, Digital Trends, Campaign, Korea IT Times
   (GitLaw), Insider Media (GitLaw), Samsung Newsroom, Luzerner Zeitung.
4. **Can talk about** — 4–6 podcast topics drafted by Claude, edited by
   Nick. Candidate themes: AI agents in legal; scaling one of the earliest
   fully-distributed teams to 120; founder life inside an acquirer
   (Samsung, 6 years); angel investing; AI × food tech.
5. **Footer / contact** — LinkedIn only (no public email) +
   "Download headshots" link to the shared Drive folder.

## Tech

- One `index.html`, hand-written CSS (inline or single `style.css`), no
  framework, no build step, no JS beyond trivial niceties.
- Web-optimized images in `img/` (headshots resized/compressed for web).
- Responsive; `prefers-color-scheme` dark-mode aware; fast (<100 KB
  excluding images).
- Repo: public `Holzherr/nickholzherr.com`, `CNAME` file containing
  `nickholzherr.com`.

## Hosting & cutover

Same pattern as by9am.com:

- GitHub Pages (classic) from `main` branch root.
- Cloudflare: apex CNAME (flattened) → `holzherr.github.io`, proxied;
  add `www` CNAME → `holzherr.github.io`.
- Remove the "Hello World" Worker route on `nickholzherr.com/*` so it
  stops intercepting the domain.
- Cutover performed by Nick (two clicks) or driven by Claude in Nick's
  Chrome, with confirmation before each Cloudflare change.

## Out of scope

- Separate press-kit page, blog, CMS, analytics, contact form.

## Success criteria

- https://nickholzherr.com serves the page over HTTPS with the custom
  domain, all press links resolve, page looks right on mobile and
  desktop, light and dark.
