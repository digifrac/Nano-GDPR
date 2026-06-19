# Nano GDPR 1.0.0

**100% free, forever. No cost, no account, no catch.**

Cookie consent for static sites. No database, no server, no tracking, no price
tag. Drop in two files and you are done.

## Features

- Cookie banner with **Accept All**, **Reject All**, and **Manage Preferences**
- Holds back analytics and marketing scripts until the visitor agrees
- "Cookie settings" link so visitors can change their mind later
- Saves the choice in the visitor's own browser only (no server, no database)
- Optional flat-file logging (PHP) for proof of consent, off by default
- One-snippet install, no build step, no dependencies

## Downloads

| File | Use |
|------|-----|
| `nano-gdpr-dropin.zip` | Unzips to a ready `gdpr` folder. Upload to your site. |
| `nano-gdpr-1.0.0.zip` | Full package with guide, demo and docs. |

## Get started

1. Put the files in a `gdpr` folder on your site.
2. Add two lines to your page `<head>`:

```html
<link rel="stylesheet" href="/gdpr/nano-gdpr.css">
<script src="/gdpr/nano-gdpr.js" defer></script>
```

Open `GUIDE.html` (in the full package) for the complete guide.

---

MIT licensed. Built by [Digital Fracture](https://digitalfracture.co.uk).
If it helped, you can [buy me a coffee](https://buymeacoffee.com/digitalfracture).
