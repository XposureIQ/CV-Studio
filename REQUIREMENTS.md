# ATS-Craft Pro Requirements

## 1. Purpose and scope

ATS-Craft Pro is a free, browser-based CV builder for creating clean, single-column CVs designed to be easier for applicant tracking systems (ATS) to parse. It provides role- and experience-level guidance, live editing and preview, document import, and downloadable Word and PDF files.

This document records the product and technical requirements agreed so far and distinguishes implemented behavior from setup that still depends on external accounts or deployment.

## 2. Product decisions

- CV creation and downloads are free. There is no subscription, checkout, or mandatory payment.
- Users may optionally contribute INR 25 through a UPI QR code. Support must never block access to the builder or downloads.
- Users provide an email address and mobile number and verify using one six-digit code sent to both channels.
- Every individual download requires a new OTP. A successfully verified code authorizes one download in the app flow.
- CV content is kept in the user's browser; importing a file must not upload its contents to the application server.
- ATS compatibility is a design goal, not a guarantee of parser results, interview selection, or employment.

## 3. Functional requirements

### 3.1 Authentication and sessions

- **FR-AUTH-1:** Before using the builder, a user must provide a valid email address and a mobile number in international format.
- **FR-AUTH-2:** On request, generate one six-digit OTP and send the same code to the supplied email and mobile number.
- **FR-AUTH-3:** A valid account OTP starts an authenticated session. Users can refresh the page and retain the session, or sign out.
- **FR-AUTH-4:** An OTP expires after five minutes and can be verified no more than five times.
- **FR-AUTH-5:** In production, OTP requests are rate-limited by email and mobile number to five requests per 15-minute window.
- **FR-AUTH-6:** A missing or partial production configuration must result in an explicit error; the app must not silently treat a user as authenticated.
- **FR-AUTH-7:** Local development may use an in-memory session and show the development OTP in the interface. This fallback is not production-safe and does not persist through server restarts.

### 3.2 CV authoring and guidance

- **FR-CV-1:** Provide a live, editable CV with personal details, headline, contact details, professional summary, work experience, education, and skills.
- **FR-CV-2:** Allow users to add and remove work-experience and education entries.
- **FR-CV-3:** Let the user choose a job category from: Software Engineering, Finance & Banking, Marketing, Healthcare, Legal, Executive Leadership, Product Management, Design & UX, Data & Analytics, Business & Operations, Accounting, Education, Human Resources, Sales, and Other.
- **FR-CV-4:** Let the user select one experience tier: 1–3, 4–8, 9–12, 13–17, or 18+ years.
- **FR-CV-5:** Show category-relevant keywords and experience-tier guidance:
  - **1–3 years:** foundational skills, certifications, academic projects, internships, and learning outcomes.
  - **4–8 years:** project execution, independent ownership, delivery, and measurable results.
  - **9–12 years:** architecture or functional expertise, leadership, collaboration, mentoring, and strategic impact.
  - **13–17 years:** department or function scaling, budgets and resources, stakeholder management, and transformation.
  - **18+ years:** executive accountability, P&L, board engagement, global operations, corporate vision, and financial results.
- **FR-CV-6:** Display a completion indicator and a live preview as the user edits.
- **FR-CV-7:** Save CV profile data locally in the browser, scoped by the signed-in email address. The application does not provide server-side CV storage or cross-device synchronization.

### 3.3 ATS-focused presentation

- **FR-ATS-1:** Use a single-column document structure and standard, selectable text; do not rely on tables, multi-column layout, or graphic containers for CV content.
- **FR-ATS-2:** Use clear, conventional CV section headings and a black-on-white body. Accent colors may be applied to the name and major headings.
- **FR-ATS-3:** Provide six accent themes: Classic Black & White, Universal Navy, Charcoal & Slate, Calm Forest Green, Sophisticated Burgundy, and Creative Corporate Teal.
- **FR-ATS-4:** Provide five spacing choices and four header-alignment variations. The combinations yield 120 selectable style combinations (6 themes × 5 spacing options × 4 alignments).
- **FR-ATS-5:** Persist selected style settings in browser local storage.
- **FR-ATS-6:** Explain the parsing benefit of a simple, single-column text structure in the interface, without promising universal ATS compatibility.

### 3.4 Importing an existing CV

- **FR-IMPORT-1:** Accept PDF and DOCX files up to 10 MB.
- **FR-IMPORT-2:** Extract PDF and DOCX text in the browser and map recognizable contact details and standard sections into editable CV fields.
- **FR-IMPORT-3:** Show an explicit error for unsupported file types, files over the size limit, or files without extractable text.
- **FR-IMPORT-4:** Scanned/image-only PDFs are not OCR-processed. Users must provide a PDF with selectable text or use OCR separately before import.
- **FR-IMPORT-5:** Tell users to review and correct imported content because section recognition and field mapping are heuristic.

### 3.5 Exports and download verification

- **FR-EXPORT-1:** Export an editable Microsoft Word `.docx` document.
- **FR-EXPORT-2:** Offer a Google Docs-compatible `.docx` export for upload to Google Drive.
- **FR-EXPORT-3:** Export an A4 PDF containing selectable text.
- **FR-EXPORT-4:** Before each export, request a fresh download OTP and send it to the authenticated email and mobile number.
- **FR-EXPORT-5:** A download OTP expires after five minutes, is limited to five verification attempts, and cannot be reused.
- **FR-EXPORT-6:** A successful verification creates a short-lived, one-use download grant. The application consumes the grant before running the selected client-side export.
- **FR-EXPORT-7:** Downloads are unlimited in number and are not conditional on payment.

### 3.6 Optional support

- **FR-SUPPORT-1:** Provide clearly optional INR 25 UPI support, separate from account verification and export.
- **FR-SUPPORT-2:** Generate a UPI QR with a fixed amount of INR 25 and configurable recipient UPI ID and payee name.
- **FR-SUPPORT-3:** If the recipient UPI ID is not configured or is invalid, explain that support is unavailable; do not interrupt normal CV functionality.
- **FR-SUPPORT-4:** Do not collect payment details or represent support as a prerequisite for any feature.

## 4. Non-functional requirements

- **NFR-1 Usability:** Provide a responsive interface usable on desktop and mobile, with editing controls and a CV preview.
- **NFR-2 Accessibility and readability:** Use semantic headings, recognizable form labels, visible status/errors, and readable contrast.
- **NFR-3 Privacy:** Do not upload imported source documents or CV profile content to the server. Authentication and OTP data are processed by the configured providers.
- **NFR-4 Secret handling:** Keep provider credentials and signing secrets in server-side environment variables; never expose them to the browser or commit populated secrets.
- **NFR-5 OTP storage:** Store OTP digests rather than plaintext codes in the configured Redis store. Apply expiry, attempt limits, rate limits, and one-time use.
- **NFR-6 Session security:** Use a signed, HTTP-only, SameSite strict session cookie; use the Secure cookie flag in production.
- **NFR-7 Error handling:** Report provider, storage, export, import, and configuration failures visibly; do not return a success-shaped fallback.
- **NFR-8 Compatibility:** Use standard document text, headings, and fonts intended to remain editable in Microsoft Word and compatible with Google Docs import.
- **NFR-9 Reliability:** Validate TypeScript and produce an optimized production build using the project's npm scripts.

## 5. Technical requirements

- **Framework:** Next.js App Router, React, and TypeScript.
- **Styling and interface:** Tailwind CSS and Lucide React icons.
- **DOCX:** `docx` package.
- **PDF export:** `jspdf`.
- **DOCX import:** `mammoth`.
- **PDF import:** `pdfjs-dist`.
- **UPI QR:** `qrcode`.
- **Production OTP and one-use grant storage:** Upstash Redis REST API.
- **Email delivery:** Resend.
- **SMS delivery:** Twilio Programmable Messaging.
- **Local development:** Node.js and npm; run `npm install`, `npm run dev`, `npm run typecheck`, and `npm run build`.

## 6. Environment and deployment requirements

Production setup requires the environment variables documented in `.env.example`:

- `OTP_HMAC_SECRET` and `SESSION_HMAC_SECRET`: distinct, random signing secrets.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`: persistent Redis storage for OTPs, rate limits, and download grants.
- `RESEND_API_KEY` and `OTP_FROM_EMAIL`: Resend credentials and a verified sender.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER`: Twilio credentials and an eligible sender.
- `SUPPORT_UPI_ID`: valid recipient ID to enable the optional UPI QR.
- `SUPPORT_PAYEE_NAME`: optional display name for the recipient.

The deployment owner must provision and configure these services, verify sender/domain requirements, and deploy the application. A free hosting-provider subdomain (for example, a Vercel subdomain) is a deployment target, not a domain already provisioned by the application.

## 7. Current implementation status and limitations

| Area | Current status |
| --- | --- |
| CV editor, live preview, category and tier guidance | Implemented |
| Six color themes, five spacing options, four alignment choices | Implemented (120 combinations) |
| DOCX, Google Docs-compatible DOCX, and searchable-text PDF export | Implemented |
| PDF/DOCX import | Implemented; browser-side extraction and heuristic mapping; no OCR |
| Account OTP and per-download OTP workflow | Implemented; local mock for development, external providers required in production |
| Production OTP storage, rate limits, and one-use grants | Implemented for configured Upstash Redis |
| Optional INR 25 UPI QR | Implemented; requires a valid configured UPI ID |
| CV persistence | Browser local storage only; no server backup or synchronization |
| AI-generated writing suggestions | Not implemented; current suggestions are rule-based category/tier guidance |
| Payment processing, subscription, or checkout | Not implemented and intentionally excluded; the product is free |
| Hosting/domain deployment | Not completed; deployment account and configuration are required |

The one-use grant protects the normal application download flow: the client consumes it before generating a file locally. It is not a tamper-proof server-side restriction on the exported file, since document generation happens in the browser. Likewise, verifying one shared OTP sent to both channels does not independently prove control of each channel.

## 8. Acceptance criteria

The implementation meets the current product scope when:

1. A user can authenticate with an OTP sent to the provided email and mobile, or see a clear setup failure when production services are not configured.
2. The user can create or import a CV, edit the fields, choose a category, experience tier, and visual style, and see the preview update.
3. The user can download Word, Google Docs-compatible DOCX, or PDF without payment, with a fresh OTP required for each file in the normal app flow.
4. PDF/DOCX import is performed locally, rejected when unsupported or oversized, and clearly reports when no selectable text is found.
5. Optional INR 25 support appears only when configured and never gates building or downloading.
6. CV content remains in browser local storage, and documentation clearly describes its privacy and persistence limits.
7. `npm run typecheck` and `npm run build` complete successfully.
