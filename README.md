# Nano GDPR

**100% free, forever. No cost, no account, no catch.**

Cookie consent for static sites. No database, no server, no tracking, no price
tag. Drop in two files and you are done. MIT licensed, so it is free to use on
any site, including client work, with nothing to pay and no strings attached.

Zero dependencies, zero database, no server state, nothing to attack. Consent
lives only in the visitor's own browser (localStorage plus a mirror cookie).
Gated scripts do not run until the matching category is accepted, which is what
makes this genuinely compliant rather than a cosmetic banner.

Part of the Nano suite. Drop it into any HTML page: one stylesheet, one config
block, one script. No build step, no server, no framework.

## Install

Copy `nano-gdpr.css` and `nano-gdpr.js` somewhere on your site, then add to your
page `<head>`:

```html
<!-- 1. Stylesheet -->
<link rel="stylesheet" href="/path/to/nano-gdpr.css">

<!-- 2. Config (set BEFORE the script loads) -->
<script>
  window.NanoGDPR = {
    text: "We use cookies to improve your experience on this site.",
    privacyUrl: "/privacy-policy"
  };
</script>

<!-- 3. The widget -->
<script src="/path/to/nano-gdpr.js" defer></script>
```

That is the whole installation. The banner injects itself; there is no HTML to
paste into the body.

## Gating scripts behind consent (the important bit)

A consent banner is only lawful if the cookies it asks about do not fire until
the visitor agrees. Mark any analytics or marketing script as
`type="text/plain"` and tag it with its category. Nano GDPR swaps it for a live
script only once that category is accepted.

External script:

```html
<script type="text/plain" data-nano-gdpr="analytics"
        data-src="https://www.googletagmanager.com/gtag/js?id=G-XXXX"></script>
```

Inline script:

```html
<script type="text/plain" data-nano-gdpr="analytics">
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', 'G-XXXX');
</script>
```

Until consent, the browser treats `type="text/plain"` as inert data and never
runs it. Nothing about the gated script leaks before the visitor chooses.

## Reopening preferences (withdraw consent)

GDPR requires that visitors can change their mind. Add a trigger anywhere:

```html
<a href="#" data-nano-gdpr-open>Cookie settings</a>
```

Or call it from your own code: `NanoGDPR.open()`.

If a visitor withdraws a previously accepted category, the page reloads so the
now-rejected scripts are not present (a script that already ran cannot be
unrun).

## Configuration

All fields are optional except where noted.

| Field | Default | Notes |
|-------|---------|-------|
| `text` | "We use cookies…" | Banner message. |
| `privacyUrl` | `/privacy-policy` | Link target in the banner. |
| `privacyLabel` | `Privacy Policy` | Link text. |
| `position` | `bottom` | `bottom` or `top`. |
| `colors` | (theme default) | `{ bg, text, accept, reject, link }` hex values. |
| `categories` | Analytics + Functional | Array of `{ id, label, description }`. The `id` is what you put in `data-nano-gdpr`. Essential is always present and always on. |
| `logUrl` | `""` (off) | Path to `optional-logging/log.php` to record choices. Needs PHP. Empty means no logging. |

### Custom categories example

```html
<script>
  window.NanoGDPR = {
    privacyUrl: "/privacy",
    categories: [
      { id: "analytics", label: "Analytics", description: "Anonymous usage stats." },
      { id: "marketing", label: "Marketing", description: "Ad and remarketing pixels." }
    ]
  };
</script>
```

Then gate scripts with `data-nano-gdpr="analytics"` or `data-nano-gdpr="marketing"`.

## JavaScript API

| Call | Effect |
|------|--------|
| `NanoGDPR.open()` | Open the preferences modal. |
| `NanoGDPR.close()` | Close it. |
| `NanoGDPR.get()` | Return the stored consent object (or `null`). |
| `NanoGDPR.reset()` | Clear the stored choice and reload (useful for testing). |

## What is stored

A single JSON record in `localStorage` under `nano_gdpr`, e.g.

```json
{
  "consent": "partial",
  "analytics": "accepted",
  "functional": "rejected",
  "timestamp": "2026-06-19T10:00:00.000Z"
}
```

plus a mirror cookie `nano_gdpr` holding the summary value, so server-side code
(if any) can read the decision. By default nothing is sent anywhere: no
endpoint, no logging, no database.

## Optional logging (proof of consent)

By default there is no record on your side. If you need proof that a choice was
made, you can turn on a simple log. **This needs PHP and Apache hosting. It does
not work on a pure static host.**

1. Upload the `optional-logging/` folder (it holds `log.php` and a protecting
   `.htaccess`).
2. Set `logUrl: "optional-logging/log.php"` in your settings.

Each choice is then appended as one line to `nano-gdpr-log.txt` inside that
folder. The `.htaccess` keeps the log private. Leave `logUrl` empty to keep
logging off. See `LIMITATIONS.txt` for the full trade-off.

## Demo

Open `demo/index.html` in a browser. Use the console to watch the gated script
activate on Accept and stay dormant on Reject.

## Licence

MIT. Free. No footer link.

Built by [Digital Fracture](https://digitalfracture.co.uk).
