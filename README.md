# ATS-Craft Pro

A responsive ATS-conscious CV builder built with Next.js App Router, TypeScript, Tailwind CSS, Lucide icons, DOCX, and jsPDF.

See [REQUIREMENTS.md](./REQUIREMENTS.md) for the agreed product scope, functional and technical requirements, current implementation status, and limitations.

## Get started

```sh
npm install
npm run dev
```

Open `http://localhost:3000`. To validate a production build, run `npm run typecheck` and `npm run build`.

## Features

- Single-column, selectable-text CV with standard section headings and black-on-white body text
- Job-category keyword suggestions and tailored advice for five experience tiers
- 120 ATS-conscious style combinations: six accent themes, five spacing options, and four header alignments
- Word and Google Docs-compatible `.docx` exports, plus a text-based PDF export
- Free CV creation and unlimited downloads; each download requires a fresh OTP delivered to the signed-in email and mobile
- Import selectable text from PDF and DOCX files directly in the browser
- Optional fixed ₹25 UPI support QR; it never gates CV creation or downloads
- Locally stored CV content; server-side OTP rate limits and one-time grants use Upstash Redis

## Configure OTP and optional UPI support

Copy `.env.example` to `.env.local`. Add Resend, Twilio, and Upstash credentials to enable email/mobile verification outside local development. Generate separate random `OTP_HMAC_SECRET` and `SESSION_HMAC_SECRET` values. Do not commit `.env.local` or expose credentials to the browser. OTPs expire after five minutes, have a five-attempt verification limit, and are rate-limited per address. Production mode fails closed when required provider/storage settings are missing.

For optional support, set `SUPPORT_UPI_ID` and optionally `SUPPORT_PAYEE_NAME`. The app generates a UPI QR for ₹25. It is voluntary; no payment is requested for CV creation or download. The owner is responsible for configuring a valid recipient UPI ID and complying with applicable payment rules.

## Free deployment

Deploy the repository through your hosting account (for example, Vercel's free tier) to get its provider subdomain, such as `your-project.vercel.app`. Add the environment variables from `.env.example` in the deployment settings, then redeploy. The app cannot claim a hosting subdomain or activate provider accounts without the owner's hosting/provider access. Resend sender verification, Twilio country/sender rules, and a persistent Upstash Redis database must be configured before production OTP delivery works.

## Import, privacy and ATS notes

PDF/DOCX extraction runs in the browser; the source document is not uploaded. Scanned/image-only PDFs are not OCR-processed and need selectable text. Imported text is mapped into editable fields heuristically and should be reviewed before export. CV content is stored in this browser's local storage and is not sent to a backend. ATS parsing varies between employers and products; a single-column, text-first layout can improve compatibility, but no template can guarantee parsing or hiring outcomes. Users should follow each employer's upload instructions and verify the exported document.

Local development falls back to an in-memory OTP and displays the code in the UI so the flow can be tested without paid provider services. This fallback is disabled in production. Local mock sessions and OTPs are not durable across server restarts.
