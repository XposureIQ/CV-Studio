import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type OtpPurpose = "account" | "download";

export type UserSession = {
  email: string;
  phone: string;
  expiresAt: number;
};

export class OtpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "OtpError";
  }
}

type StoredOtp = {
  digest: string;
  email: string;
  phone: string;
  expiresAt: number;
};

const OTP_TTL_SECONDS = 300;
const GRANT_TTL_SECONDS = 120;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const SESSION_COOKIE = "ats_craft_session";
const devValues = new Map<string, string>();
const devOtpAttempts = new Map<string, number>();

function productionMode() {
  return process.env.NODE_ENV === "production";
}

function redisConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function secretsConfigured() {
  return Boolean(process.env.OTP_HMAC_SECRET && process.env.SESSION_HMAC_SECRET);
}

function redisUrl() {
  const value = process.env.UPSTASH_REDIS_REST_URL;
  if (!value) throw new Error("UPSTASH_REDIS_REST_URL is not configured.");
  return value.replace(/\/+$/, "");
}

async function redisCommand<T>(command: Array<string | number>): Promise<T> {
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!token) throw new Error("UPSTASH_REDIS_REST_TOKEN is not configured.");
  const response = await fetch(redisUrl(), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`Redis request failed (${response.status}).`);
  const result = (await response.json()) as { result?: T; error?: string };
  if (result.error) throw new Error(`Redis request failed: ${result.error}`);
  return result.result as T;
}

function developmentFallbackAllowed() {
  return !productionMode();
}

function getOtpSecret() {
  const secret = process.env.OTP_HMAC_SECRET;
  if (!secret && productionMode()) throw new Error("OTP_HMAC_SECRET is required.");
  return secret || "local-development-only-otp-secret";
}

function getSessionSecret() {
  const secret = process.env.SESSION_HMAC_SECRET;
  if (!secret && productionMode()) throw new Error("SESSION_HMAC_SECRET is required.");
  return secret || "local-development-only-session-secret";
}

function digest(value: string) {
  return createHmac("sha256", getOtpSecret()).update(value).digest("hex");
}

function emailKey(email: string) {
  return createHmac("sha256", getOtpSecret()).update(email.trim().toLowerCase()).digest("hex");
}

function secureCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function otpStorageKey(purpose: OtpPurpose, email: string) {
  return `ats:otp:${purpose}:${emailKey(email)}`;
}

export async function sendOtp(input: {
  email: string;
  phone: string;
  purpose: OtpPurpose;
}) {
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const redisAvailable = redisConfigured();
  if (productionMode() && !redisAvailable) throw new Error("OTP delivery is not configured: add Upstash Redis credentials.");
  if (productionMode() && !secretsConfigured()) throw new Error("OTP delivery is not configured: add OTP and session signing secrets.");

  const otp = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const key = otpStorageKey(input.purpose, email);
  const entry: StoredOtp = {
    digest: digest(`${input.purpose}:${email}:${phone}:${otp}`),
    email,
    phone,
    expiresAt: Date.now() + OTP_TTL_SECONDS * 1000
  };
  if (redisAvailable) {
    const rateKey = `ats:otp-rate:${input.purpose}:${emailKey(email)}`;
    const sends = await redisCommand<number>(["INCR", rateKey]);
    if (sends === 1) await redisCommand(["EXPIRE", rateKey, 900]);
    if (sends > 5) throw new OtpError("Too many OTP requests. Please try again in 15 minutes.", 429);
    const phoneRateKey = `ats:otp-phone-rate:${input.purpose}:${emailKey(phone)}`;
    const phoneSends = await redisCommand<number>(["INCR", phoneRateKey]);
    if (phoneSends === 1) await redisCommand(["EXPIRE", phoneRateKey, 900]);
    if (phoneSends > 5) throw new OtpError("Too many OTP requests for this mobile. Please try again in 15 minutes.", 429);
    await redisCommand(["SET", key, JSON.stringify(entry), "EX", OTP_TTL_SECONDS]);
  } else if (developmentFallbackAllowed()) {
    devValues.set(key, JSON.stringify(entry));
  } else {
    throw new Error("OTP delivery is not configured.");
  }

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.OTP_FROM_EMAIL;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_FROM_NUMBER;
  const emailReady = Boolean(resendKey && fromEmail);
  const smsReady = Boolean(twilioSid && twilioToken && twilioFrom);
  const providerReady = emailReady && smsReady;

  if (emailReady !== smsReady) {
    if (redisAvailable) await redisCommand(["DEL", key]);
    else devValues.delete(key);
    throw new OtpError("Configure both email and SMS providers, or remove the incomplete provider settings.", 503);
  }

  if (providerReady) {
    const message = `Your ATS-Craft Pro ${input.purpose === "download" ? "download" : "sign-in"} code is ${otp}. It expires in 5 minutes. If you did not request this, ignore this message.`;
    const deliveries = await Promise.allSettled([
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: fromEmail, to: [email], subject: "Your ATS-Craft Pro verification code", text: message })
      }),
      (async () => {
        const body = new URLSearchParams({ To: phone, From: twilioFrom!, Body: message });
        const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
        return fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: "POST",
          headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
          body
        });
      })()
    ]);
    const failures = deliveries.flatMap((delivery) => {
      if (delivery.status === "rejected") return [delivery.reason];
      return delivery.value.ok ? [] : [new Error(`OTP provider returned ${delivery.value.status}.`)];
    });
    if (failures.length) {
      if (redisAvailable) await redisCommand(["DEL", key]);
      else devValues.delete(key);
      throw new OtpError("Could not deliver the OTP to both email and mobile. Check provider configuration and try again.", 503);
    }
    return { expiresInSeconds: OTP_TTL_SECONDS, channels: ["email", "mobile"] };
  }

  if (productionMode()) {
    if (redisAvailable) await redisCommand(["DEL", key]);
    throw new Error("OTP delivery requires both Resend email and Twilio SMS environment settings.");
  }

  return {
    expiresInSeconds: OTP_TTL_SECONDS,
    channels: ["email", "mobile"],
    developmentCode: otp
  };
}

export async function verifyOtp(input: {
  email: string;
  phone: string;
  code: string;
  purpose: OtpPurpose;
}) {
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const key = otpStorageKey(input.purpose, email);
  const redisAvailable = redisConfigured();
  const attemptsKey = `${key}:attempts`;

  if (redisAvailable) {
    const attempts = await redisCommand<number>(["INCR", attemptsKey]);
    if (attempts === 1) await redisCommand(["EXPIRE", attemptsKey, OTP_TTL_SECONDS]);
    if (attempts > 5) {
      await redisCommand(["DEL", key, attemptsKey]);
      throw new OtpError("Too many incorrect codes. Request a new OTP.", 429);
    }
  } else if (productionMode()) {
    throw new Error("OTP verification is not configured.");
  } else {
    const attempts = (devOtpAttempts.get(key) || 0) + 1;
    devOtpAttempts.set(key, attempts);
    if (attempts > 5) {
      devValues.delete(key);
      devOtpAttempts.delete(key);
      throw new OtpError("Too many incorrect codes. Request a new OTP.", 429);
    }
  }

  const storedValue = redisAvailable
    ? await redisCommand<string | null>(["GET", key])
    : devValues.get(key) || null;
  if (!storedValue) throw new OtpError("This code expired or was already used. Request a new OTP.", 400);
  const saved = JSON.parse(storedValue) as StoredOtp;
  if (saved.expiresAt <= Date.now()) {
    if (redisAvailable) await redisCommand(["DEL", key, attemptsKey]);
    else devValues.delete(key);
    throw new OtpError("This code expired. Request a new OTP.", 400);
  }
  const expected = digest(`${input.purpose}:${email}:${phone}:${input.code}`);
  if (saved.email !== email || saved.phone !== phone || !secureCompare(saved.digest, expected)) {
    throw new OtpError("The code or contact details do not match.", 400);
  }

  if (redisAvailable) await redisCommand(["DEL", key, attemptsKey]);
  else {
    devValues.delete(key);
    devOtpAttempts.delete(key);
  }
}

function signSession(payload: UserSession) {
  const value = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
  return `${value}.${signature}`;
}

function verifySessionToken(token: string): UserSession | null {
  const [value, signature] = token.split(".");
  if (!value || !signature) return null;
  const expected = createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const session = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as UserSession;
    if (!session.email || !session.phone || session.expiresAt <= Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function createSession(input: { email: string; phone: string }) {
  const store = await cookies();
  const session: UserSession = {
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000
  };
  store.set(SESSION_COOKIE, signSession(session), {
    httpOnly: true,
    sameSite: "strict",
    secure: productionMode(),
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  });
  return session;
}

export async function getSession(): Promise<UserSession | null> {
  if (productionMode() && (!secretsConfigured() || !redisConfigured())) return null;
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function createDownloadGrant(email: string) {
  const token = crypto.randomUUID();
  const key = `ats:download:${emailKey(email)}:${token}`;
  if (redisConfigured()) {
    await redisCommand(["SET", key, "1", "EX", GRANT_TTL_SECONDS, "NX"]);
  } else if (developmentFallbackAllowed()) {
    devValues.set(key, "1");
  } else {
    throw new Error("Secure download verification is not configured.");
  }
  return token;
}

export async function consumeDownloadGrant(email: string, token: string) {
  const key = `ats:download:${emailKey(email)}:${token}`;
  if (redisConfigured()) {
    const result = await redisCommand<number>(["DEL", key]);
    return result === 1;
  }
  if (!developmentFallbackAllowed()) return false;
  const exists = devValues.has(key);
  devValues.delete(key);
  return exists;
}

export function isOtpProviderConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY &&
    process.env.OTP_FROM_EMAIL &&
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER &&
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN &&
    process.env.OTP_HMAC_SECRET &&
    process.env.SESSION_HMAC_SECRET
  );
}

export function getOtpPurpose(value: unknown): OtpPurpose | null {
  return value === "account" || value === "download" ? value : null;
}
