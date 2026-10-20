# Dental clinic websites — portfolio

Farhan Khan's sales site for Mumbai dental clinics, plus three **fictional** demo clinic sites:

| Page | What it is |
|---|---|
| `index.html` | Studio home: demos, packages and prices, process, ownership terms, enquiry form |
| `demos/maison-ivoire.html` | Demo concept: luxury cosmetic dentistry (editorial) |
| `demos/little-banyan.html` | Demo concept: family dentistry (warm, rounded) |
| `demos/axial-implant-centre.html` | Demo concept: implant centre (clinical, modern) |
| `privacy.html` | Privacy notice for the enquiry form (DPDP Act 2023 wording) |
| `404.html` | Not-found page for static hosts |

Plain HTML, CSS and JavaScript. No framework and no npm dependencies.

## Run it locally

Requires Node.js 18 or newer (`node -v` to check).

```bash
cd portfolio
npm start          # serves the site at http://localhost:8080
npm run check      # link, asset, accessibility-markup and demo-safety checks
npm run build      # runs the checks, then copies the deployable site into dist/
npm run preview    # serves dist/ at http://localhost:8080
```

No Node? `python -m http.server 8080` from this folder works too (then open http://localhost:8080).

## Before going live — edit `assets/js/config.js`

| Setting | What it does | If left empty |
|---|---|---|
| `FORM_ENDPOINT` | Where the studio enquiry form posts JSON (Formspree `https://formspree.io/f/xxxx`, or Web3Forms `https://api.web3forms.com/submit`) | Falls back to `CONTACT_EMAIL` |
| `WEB3FORMS_KEY` | Access key, only if you use Web3Forms | — |
| `CONTACT_EMAIL` | Fallback: opens the visitor's email app with the enquiry filled in. Also shown on the privacy page | If both are empty the form shows "This form isn't connected yet" and sends nothing |
| `WHATSAPP_NUMBER` | Digits only with country code, e.g. `919812345678` | Every WhatsApp button stays hidden |
| `WHATSAPP_MESSAGE` | Pre-filled WhatsApp text | — |

Demo-clinic forms never send anything, whatever the config says.

### Also worth doing at launch
- Set absolute URLs once you have a domain: `og:image` in `index.html` must be a full `https://` URL for link previews on WhatsApp/LinkedIn; add `<link rel="canonical">` and a `sitemap.xml`.
- Photos are hot-linked from Unsplash (free licence). For best speed and privacy, download the exact sizes into `assets/img/` and update the `src`/`srcset` URLs. Fonts load from Google Fonts; self-hosting them removes the last third-party request.
- Prices, revision counts and delivery days are in `index.html` (packages, comparison table and terms). Change them in all three places together.

## Deploy
Upload the contents of `dist/` (after `npm run build`) to any static host: Netlify, Cloudflare Pages, GitHub Pages or Vercel. Point your domain at it and enable HTTPS.
