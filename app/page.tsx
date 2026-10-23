"use client";

import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  CircleHelp,
  Heart,
  FileText,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  WandSparkles,
  X
} from "lucide-react";
import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type ExperienceTier =
  | "1–3 Years"
  | "4–8 Years"
  | "9–12 Years"
  | "13–17 Years"
  | "18+ Years";

type JobCategory =
  | "Software Engineering"
  | "Finance & Banking"
  | "Marketing"
  | "Healthcare"
  | "Legal"
  | "Executive Leadership"
  | "Product Management"
  | "Design & UX"
  | "Data & Analytics"
  | "Business & Operations"
  | "Accounting"
  | "Education"
  | "Human Resources"
  | "Sales"
  | "Other";

type ResumeEntry = {
  title: string;
  organization: string;
  dates: string;
  description: string;
};

type EducationEntry = {
  school: string;
  degree: string;
  dates: string;
  details: string;
};

type ResumeProfile = {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  jobCategory: JobCategory;
  experienceTier: ExperienceTier;
  summary: string;
  skills: string;
  experience: ResumeEntry[];
  education: EducationEntry[];
};

type Theme = {
  name: string;
  value: string;
  rgb: string;
  bestFor: string;
};

type ToastMessage = { kind: "success" | "error"; text: string };

const STORAGE_KEY = "ats-craft-pro-profile-v1";
const STYLE_STORAGE_KEY = "ats-craft-pro-style-v1";
const DOWNLOAD_COUNT_KEY = "ats-craft-pro-download-count-v1";

const experienceTiers: ExperienceTier[] = [
  "1–3 Years",
  "4–8 Years",
  "9–12 Years",
  "13–17 Years",
  "18+ Years"
];

const jobCategories: JobCategory[] = [
  "Software Engineering",
  "Finance & Banking",
  "Marketing",
  "Healthcare",
  "Legal",
  "Executive Leadership",
  "Product Management",
  "Design & UX",
  "Data & Analytics",
  "Business & Operations",
  "Accounting",
  "Education",
  "Human Resources",
  "Sales",
  "Other"
];

const themes: Theme[] = [
  { name: "Classic Black & White", value: "#000000", rgb: "0, 0, 0", bestFor: "Law, government, accounting" },
  { name: "Universal Navy", value: "#003366", rgb: "0, 51, 102", bestFor: "Finance, consulting, corporate" },
  { name: "Charcoal & Slate", value: "#4A5568", rgb: "74, 85, 104", bestFor: "Technology, engineering" },
  { name: "Calm Forest Green", value: "#1E5631", rgb: "30, 86, 49", bestFor: "Healthcare, sustainability, education" },
  { name: "Sophisticated Burgundy", value: "#800020", rgb: "128, 0, 32", bestFor: "Leadership, luxury, consulting" },
  { name: "Creative Corporate Teal", value: "#0D7377", rgb: "13, 115, 119", bestFor: "Marketing, product, UX" }
];

const spacingOptions = [
  { name: "Compact", gap: "12px" },
  { name: "Focused", gap: "15px" },
  { name: "Balanced", gap: "18px" },
  { name: "Airy", gap: "21px" },
  { name: "Spacious", gap: "24px" }
];

const alignmentOptions = ["Left", "Centered", "Right", "Centered name"] as const;

const tierGuidance: Record<ExperienceTier, { summary: string; bullets: string[] }> = {
  "1–3 Years": {
    summary: "Establish a strong foundation with practical skills, learning and role-relevant experience.",
    bullets: [
      "Bring relevant certifications, academic projects, internships and volunteer work into view.",
      "Name the tools and skills you applied; quantify project outcomes or learning where possible.",
      "Prioritize transferable skills and evidence that maps directly to the target job."
    ]
  },
  "4–8 Years": {
    summary: "Show independent ownership, reliable execution and the results delivered in your core work.",
    bullets: [
      "Lead with projects, features or processes you owned from planning through delivery.",
      "Quantify results: efficiency, quality, revenue, adoption, cost or time saved.",
      "Show how you collaborate across teams and solve problems with increasing autonomy."
    ]
  },
  "9–12 Years": {
    summary: "Demonstrate deep expertise, technical or functional leadership and strategic contribution.",
    bullets: [
      "Highlight system architecture, complex programs and decisions you shaped.",
      "Show cross-functional leadership, mentoring and measurable strategic impact.",
      "Use recent roles for detail and condense experience that is less relevant to the target."
    ]
  },
  "13–17 Years": {
    summary: "Make your leadership scope, organizational change and scale of responsibility clear.",
    bullets: [
      "Show departments or functions you scaled, teams led and resources or budgets managed.",
      "Quantify transformation, stakeholder alignment and organization-wide outcomes.",
      "Emphasize leadership decisions and business results over task-by-task detail."
    ]
  },
  "18+ Years": {
    summary: "Lead with enterprise vision, executive accountability and high-impact organizational results.",
    bullets: [
      "Highlight P&L ownership, board-level advisory and global operating scale where applicable.",
      "Connect corporate vision to measurable growth, market impact and financial ROI.",
      "Curate a concise career narrative around executive scope; summarize early roles."
    ]
  }
};

const categoryKeywords: Record<JobCategory, string> = {
  "Software Engineering": "software architecture, programming languages, cloud platforms, reliability and shipped systems",
  "Finance & Banking": "financial analysis, risk management, forecasting, regulatory controls and portfolio outcomes",
  Marketing: "campaign performance, audience growth, conversion, channel strategy and marketing analytics",
  Healthcare: "patient outcomes, clinical or care expertise, safety protocols, credentials and health systems",
  Legal: "practice area, jurisdictions, legal research, casework, client outcomes and credentials",
  "Executive Leadership": "P&L ownership, enterprise strategy, operating scale, transformation and board engagement",
  "Product Management": "product strategy, roadmaps, customer research, adoption and cross-functional delivery",
  "Design & UX": "research methods, design tools, accessibility, design systems and shipped product outcomes",
  "Data & Analytics": "SQL, data quality, visualization, experimentation and decisions enabled by analysis",
  "Business & Operations": "process improvement, operational KPIs, resource planning, budgets and delivery",
  Accounting: "financial reporting, audit, controls, reconciliations and accounting standards",
  Education: "instruction, curriculum, learner outcomes, assessment and educational tools",
  "Human Resources": "talent acquisition, employee experience, HR systems and workforce outcomes",
  Sales: "quota attainment, pipeline, deal size, territory, customer segment and retention",
  Other: "role-specific tools, domain knowledge, credentials and outcomes named in the job posting"
};

const initialProfile: ResumeProfile = {
  name: "Sarah Chen",
  headline: "Product Designer",
  email: "sarah.chen@email.com",
  phone: "+1 (415) 555-0138",
  location: "San Francisco, CA",
  website: "linkedin.com/in/sarahchen",
  jobCategory: "Design & UX",
  experienceTier: "4–8 Years",
  summary:
    "Product designer with 6 years of experience translating customer needs into accessible, intuitive digital products. Led discovery and design for a planning platform redesign that improved new-user activation by 32%.",
  skills: "Product strategy, UX research, Prototyping, Figma, Design systems, Facilitation",
  experience: [
    {
      title: "Senior Product Designer",
      organization: "Northstar Studio",
      dates: "2022 – Present",
      description:
        "Led the redesign of a core planning product, increasing new-user activation by 32%. Partnered with research and engineering to deliver a simpler, accessible experience."
    },
    {
      title: "Product Designer",
      organization: "Goodkind",
      dates: "2019 – 2022",
      description:
        "Built a design system adopted by three product teams. Facilitated discovery and shipped customer-facing improvements from concept through launch."
    }
  ],
  education: [
    {
      school: "California College of the Arts",
      degree: "BFA, Interaction Design",
      dates: "2015 – 2019",
      details: "Graduated with distinction"
    }
  ]
};

function isJobCategory(value: unknown): value is JobCategory {
  return typeof value === "string" && jobCategories.includes(value as JobCategory);
}

function isExperienceTier(value: unknown): value is ExperienceTier {
  return typeof value === "string" && experienceTiers.includes(value as ExperienceTier);
}

function normalizeProfile(value: unknown): ResumeProfile {
  if (!value || typeof value !== "object") return initialProfile;
  const saved = value as Partial<ResumeProfile>;
  return {
    ...initialProfile,
    ...saved,
    jobCategory: isJobCategory(saved.jobCategory) ? saved.jobCategory : initialProfile.jobCategory,
    experienceTier: isExperienceTier(saved.experienceTier) ? saved.experienceTier : initialProfile.experienceTier,
    experience: Array.isArray(saved.experience)
      ? saved.experience.map((entry) => ({ ...initialProfile.experience[0], ...entry }))
      : initialProfile.experience,
    education: Array.isArray(saved.education)
      ? saved.education.map((entry) => ({ ...initialProfile.education[0], ...entry }))
      : initialProfile.education
  };
}

function useResumeProfile(accountEmail: string | null) {
  const [profile, setProfile] = useState<ResumeProfile>(initialProfile);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");

  useEffect(() => {
    if (!accountEmail) {
      setProfile(initialProfile);
      setLoaded(false);
      return;
    }
    try {
      const accountKey = `${STORAGE_KEY}:${encodeURIComponent(accountEmail.toLowerCase())}`;
      const value = localStorage.getItem(accountKey) ?? localStorage.getItem(STORAGE_KEY);
      if (value) {
        setProfile(normalizeProfile(JSON.parse(value)));
        localStorage.setItem(accountKey, value);
        localStorage.removeItem(STORAGE_KEY);
      } else {
        setProfile(initialProfile);
      }
    } catch (error) {
      console.error("Could not load the locally saved CV.", error);
      setSaveState("error");
    } finally {
      setLoaded(true);
    }
  }, [accountEmail]);

  useEffect(() => {
    if (!loaded || !accountEmail) return;
    setSaveState("saving");
    const timeout = window.setTimeout(() => {
      try {
        const accountKey = `${STORAGE_KEY}:${encodeURIComponent(accountEmail.toLowerCase())}`;
        localStorage.setItem(accountKey, JSON.stringify(profile));
        setSaveState("saved");
      } catch (error) {
        console.error("Could not save the CV in this browser.", error);
        setSaveState("error");
      }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [profile, loaded, accountEmail]);

  return { profile, setProfile, saveState, loaded };
}

function downloadFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function createDocx(
  profile: ResumeProfile,
  theme: Theme,
  spacingIndex: number,
  alignment: (typeof alignmentOptions)[number],
  fileName: string
) {
  const {
    AlignmentType,
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    TextRun
  } = await import("docx");
  const accent = theme.value.replace("#", "");
  const headerAlignment = alignment === "Centered" || alignment === "Centered name"
    ? AlignmentType.CENTER
    : alignment === "Right"
      ? AlignmentType.RIGHT
      : AlignmentType.LEFT;
  const sectionHeading = (text: string) => new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 180 + spacingIndex * 45, after: 80 + spacingIndex * 15 }
  });
  const paragraphs = [
    new Paragraph({
      children: [new TextRun({ text: profile.name || "Your Name", bold: true, size: 34, color: accent })],
      heading: HeadingLevel.TITLE,
      alignment: headerAlignment,
      spacing: { after: 60 + spacingIndex * 10 }
    }),
    new Paragraph({
      children: [new TextRun({ text: profile.headline, bold: true, size: 22, color: "000000" })],
      alignment: headerAlignment,
      spacing: { after: 100 + spacingIndex * 15 }
    }),
    new Paragraph({
      text: [profile.email, profile.phone, profile.location, profile.website].filter(Boolean).join(" | "),
      alignment: alignment === "Centered" ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { after: 200 + spacingIndex * 20 }
    }),
    sectionHeading("PROFESSIONAL SUMMARY"),
    new Paragraph({ text: profile.summary, spacing: { after: 140 } }),
    sectionHeading("WORK EXPERIENCE")
  ];

  profile.experience.forEach((item) => {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: item.title || "Role", bold: true })],
        spacing: { before: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: [item.organization, item.dates].filter(Boolean).join(" | "),
            italics: true
          })
        ],
        spacing: { after: 50 }
      }),
      new Paragraph({ text: item.description, spacing: { after: 120 } })
    );
  });

  paragraphs.push(sectionHeading("EDUCATION"));
  profile.education.forEach((item) => {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: item.school || "School", bold: true })],
        spacing: { before: 100 }
      }),
      new Paragraph({
        text: [item.degree, item.dates].filter(Boolean).join(" | "),
        spacing: { after: 40 }
      }),
      new Paragraph({ text: item.details, spacing: { after: 100 } })
    );
  });
  paragraphs.push(
    sectionHeading("SKILLS"),
    new Paragraph({ text: profile.skills })
  );

  const document = new Document({
    creator: "ATS-Craft Pro",
    title: `${profile.name || "Resume"} — CV`,
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 20, color: "000000" },
          paragraph: { spacing: { line: 276 + spacingIndex * 10 } }
        },
        heading1: {
          run: { font: "Arial", size: 22, bold: true, color: accent },
          paragraph: { spacing: { before: 220, after: 90 } }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 850, right: 950, bottom: 850, left: 950 }
          }
        },
        children: paragraphs
      }
    ]
  });
  const blob = await Packer.toBlob(document);
  downloadFile(blob, fileName);
}

type AuthSession = { email: string; expiresAt: number };

function AuthGate({ onAuthenticated }: { onAuthenticated: (session: AuthSession) => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [developmentCode, setDevelopmentCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function requestCode() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", purpose: "account", email })
      });
      const result = await response.json() as { error?: string; developmentCode?: string };
      if (!response.ok) throw new Error(result.error || "Could not send the verification code.");
      setSent(true);
      setDevelopmentCode(result.developmentCode || "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send the verification code.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", purpose: "account", email, code })
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "The verification code could not be checked.");
      const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
      const sessionResult = await sessionResponse.json() as { session: AuthSession | null };
      if (!sessionResponse.ok || !sessionResult.session) throw new Error("Your session could not be started. Please try again.");
      onAuthenticated(sessionResult.session);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <span className="auth-brand"><span className="brand-icon"><FileText size={16} /></span> ATS-Craft Pro</span>
        <p className="eyebrow mt-8">YOUR CAREER, IN FOCUS</p>
        <h1>Create your CV, for free.</h1>
        <p className="auth-description">Verify your email with a one-time code. Your CV stays in this browser.</p>
        <form className="auth-form" onSubmit={verify}>
          <label className="field"><span><Mail className="mr-1 inline" size={12} /> Email address</span><input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" disabled={sent} /></label>
          {sent && <label className="field"><span><KeyRound className="mr-1 inline" size={12} /> Six-digit verification code</span><input inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" /></label>}
          {developmentCode && <p className="development-code">Local development OTP: <strong>{developmentCode}</strong></p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          {!sent
            ? <button className="button button-primary w-full" disabled={busy} onClick={(event) => { event.preventDefault(); void requestCode(); }} type="button">{busy ? <LoaderCircle className="animate-spin" size={14} /> : <ShieldCheck size={14} />} Send email code</button>
            : <div className="auth-actions"><button className="button button-secondary" disabled={busy} onClick={() => { setSent(false); setCode(""); setDevelopmentCode(""); }} type="button">Change details</button><button className="button button-primary" disabled={busy || code.length !== 6} type="submit">{busy ? <LoaderCircle className="animate-spin" size={14} /> : <Check size={14} />} Verify &amp; create CV</button></div>}
        </form>
        <p className="auth-foot"><LockKeyhole size={12} /> Free to use. Each download needs a fresh OTP. Optional ₹25 support is never required.</p>
      </section>
    </main>
  );
}

export default function HomePage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const { profile, setProfile, saveState, loaded } = useResumeProfile(session?.email ?? null);
  const [theme, setTheme] = useState<Theme>(themes[1]);
  const [spacingIndex, setSpacingIndex] = useState(2);
  const [alignment, setAlignment] = useState<(typeof alignmentOptions)[number]>("Left");
  const [styleLoaded, setStyleLoaded] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [downloadCount, setDownloadCount] = useState(0);
  const [authLoading, setAuthLoading] = useState(true);
  const [downloadFormat, setDownloadFormat] = useState<"pdf" | "docx" | "google-docs" | null>(null);
  const [downloadCode, setDownloadCode] = useState("");
  const [downloadOtpSent, setDownloadOtpSent] = useState(false);
  const [downloadCodeMessage, setDownloadCodeMessage] = useState("");
  const [downloadDevelopmentCode, setDownloadDevelopmentCode] = useState("");
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportQr, setSupportQr] = useState("");
  const [supportError, setSupportError] = useState("");
  const [supportLoading, setSupportLoading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    try {
      setDownloadCount(Number(localStorage.getItem(DOWNLOAD_COUNT_KEY) || 0));
    } catch (error) {
      console.error("Could not read the local download count.", error);
    }
  }, []);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Session check failed (${response.status}).`);
        const result = await response.json() as { authenticated: boolean; session: AuthSession | null };
        if (result.authenticated && result.session) setSession(result.session);
      })
      .catch((error: unknown) => {
        console.error("Could not check the sign-in session.", error);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STYLE_STORAGE_KEY);
      if (stored) {
        const style = JSON.parse(stored) as { themeName?: string; spacingIndex?: number; alignment?: string };
        const savedTheme = themes.find((item) => item.name === style.themeName);
        if (savedTheme) setTheme(savedTheme);
        if (Number.isInteger(style.spacingIndex) && style.spacingIndex! >= 0 && style.spacingIndex! < spacingOptions.length) {
          setSpacingIndex(style.spacingIndex!);
        }
        if (alignmentOptions.includes(style.alignment as (typeof alignmentOptions)[number])) {
          setAlignment(style.alignment as (typeof alignmentOptions)[number]);
        }
      }
    } catch (error) {
      console.error("Could not load saved CV style settings.", error);
    } finally {
      setStyleLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!styleLoaded) return;
    try {
      localStorage.setItem(
        STYLE_STORAGE_KEY,
        JSON.stringify({ themeName: theme.name, spacingIndex, alignment })
      );
    } catch (error) {
      console.error("Could not save CV style settings.", error);
    }
  }, [theme, spacingIndex, alignment, styleLoaded]);

  const guidance = tierGuidance[profile.experienceTier];
  const categoryTerms = categoryKeywords[profile.jobCategory];
  const themeIndex = themes.findIndex((item) => item.value === theme.value);
  const combinationCount = themes.length * spacingOptions.length * alignmentOptions.length;
  const styleNumber = themeIndex * spacingOptions.length * alignmentOptions.length
    + spacingIndex * alignmentOptions.length
    + alignmentOptions.indexOf(alignment)
    + 1;

  const completion = useMemo(() => {
    const checks = [
      profile.name.trim(),
      profile.headline.trim(),
      profile.jobCategory,
      profile.experienceTier,
      profile.email.trim(),
      profile.phone.trim() || profile.website.trim(),
      profile.summary.trim().length >= 50,
      profile.experience.some((item) => item.title.trim() && item.organization.trim() && item.description.trim()),
      profile.education.some((item) => item.school.trim() && item.degree.trim()),
      profile.skills.trim()
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [profile]);

  const paperStyle = {
    "--cv-accent": theme.value,
    "--cv-accent-rgb": theme.rgb,
    "--cv-section-gap": spacingOptions[spacingIndex].gap,
    "--cv-header-align": alignment === "Centered" || alignment === "Centered name"
      ? "center"
      : alignment === "Right"
        ? "right"
        : "left"
  } as CSSProperties;

  function updateField<K extends keyof ResumeProfile>(field: K, value: ResumeProfile[K]) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function updateEntry(
    group: "experience" | "education",
    index: number,
    field: string,
    value: string
  ) {
    setProfile((current) => ({
      ...current,
      [group]: current[group].map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry
      )
    }));
  }

  function addEntry(group: "experience" | "education") {
    setProfile((current) => ({
      ...current,
      [group]: [
        ...current[group],
        group === "experience"
          ? { title: "", organization: "", dates: "", description: "" }
          : { school: "", degree: "", dates: "", details: "" }
      ]
    }));
  }

  function removeEntry(group: "experience" | "education", index: number) {
    setProfile((current) => ({
      ...current,
      [group]: current[group].filter((_, entryIndex) => entryIndex !== index)
    }));
  }

  function showToastMessage(message: ToastMessage) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }

  async function sendDownloadCode() {
    const isResend = downloadOtpSent;
    setDownloadBusy(true);
    setDownloadCode("");
    setDownloadCodeMessage("");
    setDownloadError("");
    try {
      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", purpose: "download" })
      });
      const result = await response.json() as { error?: string; developmentCode?: string };
      if (!response.ok) throw new Error(result.error || "Could not send your download code.");
      setDownloadOtpSent(true);
      setDownloadDevelopmentCode(result.developmentCode || "");
      setDownloadCodeMessage(isResend
        ? "A new code was sent. Use the latest code; the previous one is no longer valid."
        : "Code sent. Check your email.");
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Could not send your download code.");
    } finally {
      setDownloadBusy(false);
    }
  }

  function beginDownload(format: "pdf" | "docx" | "google-docs") {
    setDownloadFormat(format);
    setDownloadCode("");
    setDownloadOtpSent(false);
    setDownloadCodeMessage("");
    setDownloadDevelopmentCode("");
    setDownloadError("");
    void sendDownloadCode();
  }

  async function verifyAndDownload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!downloadFormat) return;
    setDownloadBusy(true);
    setDownloadError("");
    try {
      const verification = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", purpose: "download", code: downloadCode })
      });
      const verificationResult = await verification.json() as { error?: string; downloadToken?: string };
      if (!verification.ok || !verificationResult.downloadToken) {
        throw new Error(verificationResult.error || "The code could not be verified.");
      }
      const authorization = await fetch("/api/download/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationResult.downloadToken })
      });
      const authorizationResult = await authorization.json() as { error?: string };
      if (!authorization.ok) throw new Error(authorizationResult.error || "This download could not be authorized.");
      setDownloadFormat(null);
      if (downloadFormat === "pdf") await exportPdf();
      else await exportWord(downloadFormat === "google-docs");
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Download verification failed.");
    } finally {
      setDownloadBusy(false);
    }
  }

  function recordDownload() {
    const nextCount = downloadCount + 1;
    setDownloadCount(nextCount);
    try {
      localStorage.setItem(DOWNLOAD_COUNT_KEY, String(nextCount));
    } catch (error) {
      console.error("Could not save the local download count.", error);
    }
  }

  async function exportPdf() {
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ format: "a4", unit: "mm", compress: true });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 16;
      const maxWidth = pageWidth - margin * 2;
      const accent = theme.value.replace("#", "");
      let y = 18;

      const addText = (
        text: string,
        options?: { heading?: boolean; bold?: boolean; align?: "left" | "center" | "right" }
      ) => {
        if (!text) {
          y += 2;
          return;
        }
        const heading = options?.heading ?? false;
        const bold = options?.bold ?? false;
        pdf.setFont("helvetica", heading || bold ? "bold" : "normal");
        pdf.setFontSize(heading ? 11 : 9.5);
        pdf.setTextColor(0, 0, 0);
        if (heading) {
          const rgb = [0, 2, 4].map((offset) => parseInt(accent.slice(offset, offset + 2), 16));
          pdf.setTextColor(rgb[0], rgb[1], rgb[2]);
        }
        const wrapped = pdf.splitTextToSize(text, maxWidth) as string[];
        const lineHeight = (heading ? 6.5 : 4.5) + spacingIndex * 0.3;
        if (y + wrapped.length * lineHeight > pageHeight - margin) {
          pdf.addPage();
          y = 18;
        }
        const align = options?.align ?? "left";
        const x = align === "center" ? pageWidth / 2 : align === "right" ? pageWidth - margin : margin;
        pdf.text(wrapped, x, y, { align });
        y += wrapped.length * lineHeight + (heading ? 1.5 : 1);
      };

      const headerAlignment = alignment === "Centered" || alignment === "Centered name"
        ? "center"
        : alignment === "Right"
          ? "right"
          : "left";
      addText(profile.name || "Your Name", { heading: true, align: headerAlignment });
      addText(profile.headline, { bold: true, align: headerAlignment });
      addText([profile.email, profile.phone, profile.location, profile.website].filter(Boolean).join(" | "), {
        align: alignment === "Centered" ? "center" : "left"
      });
      y += 2;
      addText("PROFESSIONAL SUMMARY", { heading: true });
      addText(profile.summary);
      y += 2;
      addText("WORK EXPERIENCE", { heading: true });
      profile.experience.forEach((item) => {
        addText(item.title, { bold: true });
        addText([item.organization, item.dates].filter(Boolean).join(" | "));
        addText(item.description);
        y += 1;
      });
      addText("EDUCATION", { heading: true });
      profile.education.forEach((item) => {
        addText(item.school, { bold: true });
        addText([item.degree, item.dates].filter(Boolean).join(" | "));
        addText(item.details);
      });
      addText("SKILLS", { heading: true });
      addText(profile.skills);
      pdf.save(`${(profile.name || "resume").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")}-ats-craft.pdf`);
      recordDownload();
      showToastMessage({ kind: "success", text: "Your searchable, text-based PDF is ready." });
    } catch (error) {
      console.error("PDF export failed.", error);
      showToastMessage({ kind: "error", text: "PDF export failed. Please try again." });
    }
  }

  async function exportWord(googleDocsReady = false) {
    try {
      const safeName = (profile.name || "resume").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
      await createDocx(
        profile,
        theme,
        spacingIndex,
        alignment,
        `${safeName}${googleDocsReady ? "-google-docs" : ""}-ats-craft.docx`
      );
      recordDownload();
      showToastMessage({
        kind: "success",
        text: googleDocsReady ? "Google Docs-ready Word file downloaded." : "Editable Word document downloaded."
      });
    } catch (error) {
      console.error("Word export failed.", error);
      showToastMessage({ kind: "error", text: "Word export failed. Please try again." });
    }
  }

  async function openSupport() {
    setSupportOpen(true);
    setSupportLoading(true);
    setSupportError("");
    try {
      const response = await fetch("/api/support/qr", { cache: "no-store" });
      const result = await response.json() as { image?: string; error?: string };
      if (!response.ok || !result.image) throw new Error(result.error || "Support QR is not configured.");
      setSupportQr(result.image);
    } catch (error) {
      setSupportError(error instanceof Error ? error.message : "Support QR is not available.");
    } finally {
      setSupportLoading(false);
    }
  }

  async function importExistingCv(file?: File) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToastMessage({ kind: "error", text: "Choose a PDF or DOCX file under 10 MB." });
      return;
    }
    const extension = file.name.toLowerCase().split(".").pop();
    try {
      let text = "";
      if (extension === "docx") {
        const mammoth = await import("mammoth");
        const extracted = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        text = extracted.value;
      } else if (extension === "pdf") {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();
        const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
        const pageTexts: string[] = [];
        for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
          const page = await document.getPage(pageNumber);
          const content = await page.getTextContent();
          pageTexts.push(content.items.map((item) => "str" in item ? item.str : "").join(" "));
        }
        text = pageTexts.join("\n");
      } else {
        throw new Error("This file type is not supported. Upload a PDF or DOCX document.");
      }
      if (!text.trim()) {
        throw new Error("No selectable text was found. Scanned PDFs need OCR before import.");
      }
      applyImportedText(text);
      showToastMessage({ kind: "success", text: "CV text imported. Review and correct each field before downloading." });
    } catch (error) {
      console.error("Could not import the selected CV.", error);
      showToastMessage({ kind: "error", text: error instanceof Error ? error.message : "CV import failed." });
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function applyImportedText(rawText: string) {
    const text = rawText.replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
    const headingPatterns: Record<string, RegExp> = {
      summary: /^(professional\s+)?(summary|profile|objective|about\s+me)$/i,
      experience: /^(professional\s+)?(work\s+)?(experience|employment(\s+history)?|career\s+history)$/i,
      education: /^(education|academic\s+background|qualifications)$/i,
      skills: /^(technical\s+)?(skills|core\s+competencies|competencies|expertise)$/i
    };
    const sectionHeaders = Object.values(headingPatterns);
    const section = (name: keyof typeof headingPatterns) => {
      const index = lines.findIndex((line) => headingPatterns[name].test(line.replace(/:$/, "")));
      if (index < 0) return "";
      const content: string[] = [];
      for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
        if (sectionHeaders.some((pattern) => pattern.test(lines[cursor].replace(/:$/, "")))) break;
        content.push(lines[cursor]);
      }
      return content.join("\n");
    };

    const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
    const phone = text.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}/)?.[0] || "";
    const firstLine = lines.find((line) => !line.includes("@") && !headingPatterns.summary.test(line)) || "";
    const summaryText = section("summary");
    const experienceText = section("experience");
    const educationText = section("education");
    const skillsText = section("skills");

    setProfile((current) => ({
      ...current,
      name: firstLine.length < 70 ? firstLine : current.name,
      headline: firstLine.length < 70 && lines[0] === firstLine ? lines[1] || current.headline : current.headline,
      email: email || current.email,
      phone: phone || current.phone,
      summary: summaryText.slice(0, 900) || current.summary,
      skills: skillsText.replace(/\n/g, ", ").slice(0, 1200) || current.skills,
      experience: experienceText
        ? [{ title: "Imported experience — review", organization: "", dates: "", description: experienceText.slice(0, 3500) }]
        : current.experience,
      education: educationText
        ? [{ school: "Imported education — review", degree: "", dates: "", details: educationText.slice(0, 1500) }]
        : current.education
    }));
  }

  async function signOut() {
    try {
      const response = await fetch("/api/auth/session", { method: "DELETE" });
      if (!response.ok) throw new Error(`Sign out failed (${response.status}).`);
      setSession(null);
    } catch (error) {
      console.error("Could not end the current session.", error);
      showToastMessage({ kind: "error", text: "Could not sign out. Please try again." });
    }
  }

  const visiblePreview = (
    <section className="preview-area" aria-label="Live CV preview">
      <div className="preview-bar">
        <span className="preview-label"><span className="live-dot" /> ATS-FRIENDLY LIVE PREVIEW</span>
        <button
          className="ats-tooltip"
          title="A single-column structure, standard section headings and selectable text can help parsers read your CV. ATS behavior varies by employer, so always follow the application instructions."
          type="button"
        >
          <CircleHelp size={13} /> Why ATS-friendly?
        </button>
      </div>
      <div className="format-grid" aria-label="Professional style combination controls">
        <div className="format-control">
          <label htmlFor="theme">Accent color</label>
          <select id="theme" value={theme.name} onChange={(event) => setTheme(themes.find((item) => item.name === event.target.value) ?? themes[1])}>
            {themes.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
          </select>
        </div>
        <div className="format-control">
          <label htmlFor="spacing">Section spacing</label>
          <select id="spacing" value={spacingIndex} onChange={(event) => setSpacingIndex(Number(event.target.value))}>
            {spacingOptions.map((item, index) => <option key={item.name} value={index}>{item.name}</option>)}
          </select>
        </div>
        <div className="format-control">
          <label htmlFor="alignment">Header alignment</label>
          <select id="alignment" value={alignment} onChange={(event) => setAlignment(event.target.value as (typeof alignmentOptions)[number])}>
            {alignmentOptions.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </div>
      <div className="style-count">
        Combination {styleNumber} of {combinationCount} · six themes × five spacing options × four header alignments. Always single-column.
      </div>
      <div className="paper-scroll">
        <article className="resume-paper" data-alignment={alignment.toLowerCase().replaceAll(" ", "-")} id="resume-paper" style={paperStyle} aria-label="ATS-friendly resume document">
          <header className="resume-header">
            <h1 className="resume-name">{profile.name || "Your Name"}</h1>
            <p className="resume-headline">{profile.headline || "Professional Headline"}</p>
            <p className="resume-contact">{[profile.email, profile.phone, profile.location, profile.website].filter(Boolean).join(" | ")}</p>
          </header>
          <section className="resume-section">
            <h3>Professional Summary</h3>
            <p>{profile.summary || "Write a concise professional summary tailored to your target role."}</p>
          </section>
          <section className="resume-section">
            <h3>Work Experience</h3>
            {profile.experience.map((item, index) => (
              <div className="resume-entry" key={`cv-experience-${index}`}>
                <h4>{item.title || "Job Title"}</h4>
                <span className="resume-date">{[item.organization, item.dates].filter(Boolean).join(" | ")}</span>
                <p className="resume-description">{item.description}</p>
              </div>
            ))}
          </section>
          <section className="resume-section">
            <h3>Education</h3>
            {profile.education.map((item, index) => (
              <div className="resume-entry" key={`cv-education-${index}`}>
                <h4>{item.school || "School or University"}</h4>
                <span className="resume-date">{[item.degree, item.dates].filter(Boolean).join(" | ")}</span>
                {item.details && <p>{item.details}</p>}
              </div>
            ))}
          </section>
          <section className="resume-section">
            <h3>Skills</h3>
            <p>{profile.skills}</p>
          </section>
        </article>
      </div>
      <div className="preview-foot">
        <span>Text-first · single-column · selectable text</span>
        <span>{theme.bestFor}</span>
      </div>
    </section>
  );

  if (authLoading) {
    return <main className="auth-screen"><div className="auth-loading"><LoaderCircle className="animate-spin" size={20} /> Checking your session…</div></main>;
  }
  if (!session) {
    return <AuthGate onAuthenticated={setSession} />;
  }

  return (
    <div className="app-frame">
      <aside className="sidebar" aria-label="Application navigation">
        <a href="#" className="brand" aria-label="ATS-Craft Pro home">
          <span className="brand-icon"><FileText size={16} /></span>
          <span>ATS-Craft<span className="brand-pro">PRO</span></span>
        </a>
        <p className="side-kicker">WORKSPACE</p>
        <nav className="side-links" aria-label="CV sections">
          <a className="side-link active" href="#profile"><UserRound size={15} /><span>Personal details</span></a>
          <a className="side-link" href="#experience"><BriefcaseBusiness size={15} /><span>Experience</span></a>
          <a className="side-link" href="#education"><GraduationCap size={15} /><span>Education</span></a>
          <a className="side-link" href="#skills"><BadgeCheck size={15} /><span>Skills</span></a>
        </nav>
        <div className="side-separator" />
        <p className="side-kicker">DOCUMENT</p>
        <nav className="side-links">
          <a className="side-link" href="#preview"><LayoutDashboard size={15} /><span>ATS preview</span></a>
          <button className="side-link w-full border-0 bg-transparent text-left" onClick={() => { void openSupport(); }} type="button">
            <Heart size={15} /><span>Optional ₹25 support</span>
          </button>
        </nav>
        <div className="upgrade-card">
          <span className="upgrade-tag"><Heart size={13} /> FREE TO USE</span>
          <p>All CV building and downloads are free. If you find it useful, you can optionally support the project with ₹25.</p>
          <button className="link-button" onClick={() => { void openSupport(); }} type="button">Support optionally <ArrowRight size={13} /></button>
        </div>
        <div className="profile-row">
          <span className="avatar">{profile.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "CV"}</span>
          <div><p>{profile.name || "Your CV"}<small>{session.email}</small></p></div>
          <button className="delete-button ml-auto" onClick={() => { void signOut(); }} type="button" title="Sign out"><ArrowLeft size={13} /></button>
        </div>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <div className="crumbs"><span>My documents</span><ArrowRight size={12} /><strong>{profile.name ? `${profile.name} — CV` : "Untitled CV"}</strong><span className="saved">{saveState === "saved" ? "Saved" : saveState === "saving" ? "Saving" : "Save error"}</span></div>
          <div className="top-actions">
            <button className="button button-secondary hide-mobile" onClick={() => beginDownload("google-docs")} type="button"><ArrowDownToLine size={14} /> Google Docs</button>
            <button className="button button-secondary hide-mobile" onClick={() => beginDownload("docx")} type="button"><FileText size={14} /> Word</button>
            <button className="button button-primary" onClick={() => beginDownload("pdf")} type="button"><ArrowDownToLine size={14} /> PDF</button>
            <button className="button button-ghost" onClick={() => { void openSupport(); }} type="button"><Heart size={14} /> Support ₹25</button>
            <button className="button button-secondary mobile-toggle" onClick={() => setMobilePreview((value) => !value)} type="button">
              {mobilePreview ? <><ArrowLeft size={13} /> Edit</> : <>Preview <ArrowRight size={13} /></>}
            </button>
          </div>
        </header>

        <section className="welcome">
          <div>
            <p className="eyebrow"><Sparkles className="mr-1 inline" size={12} /> BUILT FOR YOUR NEXT MOVE</p>
            <h1>Make your experience count.</h1>
            <p className="welcome-sub">A focused, ATS-conscious CV—built around the work you want next.</p>
          </div>
          <div className="plan-pill"><ShieldCheck size={14} /><strong>{completion}%</strong> profile complete <span>· free forever</span></div>
        </section>

        <div className={`main-grid ${mobilePreview ? "show-preview" : ""}`}>
          <section className="editor" aria-label="CV editor">
            <div className="editor-title">
              <div><h2>Your CV, your story.</h2><p>Start fresh or import a PDF or Word CV to edit.</p></div>
              <div className="flex items-center gap-2">
                <input ref={fileInput} accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(event) => { void importExistingCv(event.target.files?.[0]); }} type="file" />
                <button className="button button-secondary" onClick={() => fileInput.current?.click()} type="button"><Upload size={13} /> Import CV</button>
              </div>
            </div>

            <form onSubmit={(event: FormEvent<HTMLFormElement>) => event.preventDefault()}>
              <section className="form-section" id="profile">
                <div className="section-head">
                  <div><h3>Target role &amp; experience</h3><p>Get guidance that fits your career stage.</p></div>
                  <WandSparkles size={15} className="text-[#69836a]" />
                </div>
                <div className="field-grid">
                  <label className="field">
                    <span>Job category</span>
                    <select value={profile.jobCategory} onChange={(event) => updateField("jobCategory", event.target.value as JobCategory)}>
                      {jobCategories.map((category) => <option key={category}>{category}</option>)}
                    </select>
                  </label>
                  <label className="field">
                    <span>Experience tier</span>
                    <select value={profile.experienceTier} onChange={(event) => updateField("experienceTier", event.target.value as ExperienceTier)}>
                      {experienceTiers.map((tier) => <option key={tier}>{tier}</option>)}
                    </select>
                  </label>
                </div>
                <aside className="guidance" aria-live="polite">
                  <h4><Sparkles size={13} /> {profile.experienceTier}: what to highlight</h4>
                  <p>{guidance.summary} For {profile.jobCategory}, surface relevant terms like {categoryTerms}.</p>
                  <ul>{guidance.bullets.map((tip) => <li key={tip}>{tip}</li>)}</ul>
                  <p className="guidance-note">Guidance helps you tailor your content. Add only accurate, verifiable information.</p>
                </aside>
              </section>

              <section className="form-section">
                <div className="section-head"><div><h3>Personal details</h3><p>Use the name and contact details on your application.</p></div></div>
                <div className="field-grid">
                  <label className="field field-wide"><span>Full name</span><input autoComplete="name" value={profile.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Alex Morgan" /></label>
                  <label className="field field-wide"><span>Professional headline</span><input value={profile.headline} onChange={(event) => updateField("headline", event.target.value)} placeholder="Senior Software Engineer" /></label>
                  <label className="field"><span>Email</span><input autoComplete="email" type="email" value={profile.email} onChange={(event) => updateField("email", event.target.value)} placeholder="you@example.com" /></label>
                  <label className="field"><span>Phone</span><input autoComplete="tel" type="tel" value={profile.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="+1 555 123 4567" /></label>
                  <label className="field"><span>Location</span><input autoComplete="address-level2" value={profile.location} onChange={(event) => updateField("location", event.target.value)} placeholder="City, State" /></label>
                  <label className="field"><span>LinkedIn or portfolio</span><input value={profile.website} onChange={(event) => updateField("website", event.target.value)} placeholder="linkedin.com/in/you" /></label>
                  <label className="field field-wide"><span>Professional summary</span><textarea maxLength={900} value={profile.summary} onChange={(event) => updateField("summary", event.target.value)} placeholder="Summarize your specialty, years of experience and most relevant impact." /><span className="field-hint">{profile.summary.length}/900 characters. Use clear, role-relevant language.</span></label>
                </div>
              </section>

              <section className="form-section" id="experience">
                <div className="section-head">
                  <div><h3>Work experience</h3><p>Focus on responsibilities, tools and measurable results.</p></div>
                  <button className="link-button" onClick={() => addEntry("experience")} type="button"><Plus size={13} /> Add role</button>
                </div>
                <div className="entry-list">
                  {profile.experience.map((entry, index) => (
                    <article className="entry-card" key={`experience-${index}`}>
                      <div className="entry-card-top"><span>Position {index + 1}</span><button aria-label={`Remove position ${index + 1}`} className="delete-button" onClick={() => removeEntry("experience", index)} type="button"><Trash2 size={13} /></button></div>
                      <div className="entry-grid">
                        <label className="field"><span>Job title</span><input value={entry.title} onChange={(event) => updateEntry("experience", index, "title", event.target.value)} placeholder="Job title" /></label>
                        <label className="field"><span>Employer</span><input value={entry.organization} onChange={(event) => updateEntry("experience", index, "organization", event.target.value)} placeholder="Company" /></label>
                        <label className="field field-wide"><span>Dates</span><input value={entry.dates} onChange={(event) => updateEntry("experience", index, "dates", event.target.value)} placeholder="2022 – Present" /></label>
                        <label className="field field-wide"><span>Achievements &amp; responsibilities</span><textarea value={entry.description} onChange={(event) => updateEntry("experience", index, "description", event.target.value)} placeholder="What did you do, how, and what changed?" /></label>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="form-section" id="education">
                <div className="section-head">
                  <div><h3>Education</h3><p>Include relevant qualifications and credentials.</p></div>
                  <button className="link-button" onClick={() => addEntry("education")} type="button"><Plus size={13} /> Add education</button>
                </div>
                <div className="entry-list">
                  {profile.education.map((entry, index) => (
                    <article className="entry-card" key={`education-${index}`}>
                      <div className="entry-card-top"><span>Education {index + 1}</span><button aria-label={`Remove education ${index + 1}`} className="delete-button" onClick={() => removeEntry("education", index)} type="button"><Trash2 size={13} /></button></div>
                      <div className="entry-grid">
                        <label className="field field-wide"><span>School or institution</span><input value={entry.school} onChange={(event) => updateEntry("education", index, "school", event.target.value)} placeholder="School or university" /></label>
                        <label className="field"><span>Degree or credential</span><input value={entry.degree} onChange={(event) => updateEntry("education", index, "degree", event.target.value)} placeholder="Degree, certification" /></label>
                        <label className="field"><span>Dates</span><input value={entry.dates} onChange={(event) => updateEntry("education", index, "dates", event.target.value)} placeholder="2018 – 2022" /></label>
                        <label className="field field-wide"><span>Relevant details</span><input value={entry.details} onChange={(event) => updateEntry("education", index, "details", event.target.value)} placeholder="Honors, focus or relevant coursework" /></label>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="form-section" id="skills">
                <div className="section-head"><div><h3>Skills</h3><p>Use plain text and standard role-specific terminology.</p></div></div>
                <label className="field"><span>Relevant skills</span><textarea value={profile.skills} onChange={(event) => updateField("skills", event.target.value)} placeholder="SQL, project management, financial modeling" /><span className="field-hint">Separate skills with commas. Keep the preview as a simple text list.</span></label>
              </section>
            </form>

            <div className="editor-foot"><span><LockKeyhole className="mr-1 inline" size={11} /> Saved in this browser. Not sent to a server.</span><span>{loaded ? `Autosave on · ${downloadCount} downloads` : "Loading your CV…"}</span></div>
          </section>

          <div id="preview">{visiblePreview}</div>
        </div>
      </main>

      {downloadFormat && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDownloadFormat(null); }}>
          <section className="modal-card" aria-labelledby="download-otp-title" aria-modal="true" role="dialog">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div><span className="mb-2 inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[.1em] text-[#667b62]"><ShieldCheck size={13} /> SECURE DOWNLOAD</span><h2 id="download-otp-title">Verify this download.</h2></div>
              <button aria-label="Close verification dialog" className="delete-button" onClick={() => setDownloadFormat(null)} type="button"><X size={16} /></button>
            </div>
            <p>A fresh six-digit code is sent to <strong>{session?.email}</strong> for each export. One verified code authorizes one file.</p>
            {downloadOtpSent ? (
              <form className="auth-form" onSubmit={(event) => { void verifyAndDownload(event); }}>
                <label className="field"><span><KeyRound className="mr-1 inline" size={12} /> Six-digit code</span><input autoComplete="one-time-code" inputMode="numeric" pattern="\d{6}" maxLength={6} required value={downloadCode} onChange={(event) => setDownloadCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" /></label>
                {downloadCodeMessage && <p className="field-hint" role="status">{downloadCodeMessage}</p>}
                {downloadDevelopmentCode && <p className="development-code">Local development OTP: <strong>{downloadDevelopmentCode}</strong></p>}
                {downloadError && <p className="form-error" role="alert">{downloadError}</p>}
                <div className="modal-actions">
                  <button className="button button-secondary" disabled={downloadBusy} onClick={() => { void sendDownloadCode(); }} type="button">Resend code</button>
                  <button className="button button-primary" disabled={downloadBusy || downloadCode.length !== 6} type="submit">{downloadBusy ? <LoaderCircle className="animate-spin" size={14} /> : <ArrowDownToLine size={14} />} Verify &amp; download</button>
                </div>
              </form>
            ) : (
              <div className="modal-actions">
                {downloadError && <p className="form-error" role="alert">{downloadError}</p>}
                <button className="button button-secondary" onClick={() => setDownloadFormat(null)} type="button">Cancel</button>
                <button className="button button-primary" disabled={downloadBusy} onClick={() => { void sendDownloadCode(); }} type="button">{downloadBusy ? <LoaderCircle className="animate-spin" size={14} /> : <Mail size={14} />} Send email code</button>
              </div>
            )}
            <p className="modal-note">Downloads are always free. Your code expires after five minutes and cannot be reused.</p>
          </section>
        </div>
      )}
      {supportOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSupportOpen(false); }}>
          <section className="modal-card support-card" aria-labelledby="support-title" aria-modal="true" role="dialog">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div><span className="mb-2 inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[.1em] text-[#667b62]"><Heart size={13} /> OPTIONAL SUPPORT</span><h2 id="support-title">Free CVs. ₹25 if you’d like.</h2></div>
              <button aria-label="Close support dialog" className="delete-button" onClick={() => setSupportOpen(false)} type="button"><X size={16} /></button>
            </div>
            <p>Creating and downloading your CV is always free. If ATS-Craft Pro helped you, scan to optionally support the project with ₹25. Support is never required.</p>
            {supportLoading && <div className="support-loading"><LoaderCircle className="animate-spin" size={18} /> Preparing support QR…</div>}
            {supportQr && <div className="support-qr"><img alt="UPI QR code for optional ₹25 support" src={supportQr} /><span>Open any UPI app to scan. Review the recipient and amount before paying.</span></div>}
            {supportError && <div className="support-error" role="status"><p>{supportError}</p><span>To enable QR support, configure SUPPORT_UPI_ID in the hosting environment. CV creation and downloads remain free.</span></div>}
            <div className="modal-actions"><button className="button button-secondary" onClick={() => setSupportOpen(false)} type="button">Close</button></div>
            <p className="modal-note">Payments go directly to the UPI ID configured by the site owner. ATS-Craft Pro does not process or verify UPI payments.</p>
          </section>
        </div>
      )}
      {toast && <div className="toast" role="status">{toast.text}</div>}
    </div>
  );
}
