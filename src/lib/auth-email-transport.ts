import nodemailer from "nodemailer";

type Email = { to: string; url: string; kind: "verify" | "reset" };
type GmailConfig = { user: string; appPassword: string; from: string };
type GmailTransport = { sendMail(message: { from: string; to: string; subject: string; text: string }): Promise<unknown> };
export function authEmailMessage(email: Email, origin: string) {
  const url = new URL(email.url);
  if (url.origin !== new URL(origin).origin || !url.pathname.startsWith("/api/auth/") || /[\r\n]/.test(email.to) || email.to.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.to)) throw new Error("Invalid authentication email");
  const reset = email.kind === "reset";
  return {
    to: email.to,
    subject: reset ? "Education — Нууц үг сэргээх" : "Education — Имэйлээ баталгаажуулах",
    text: `${reset ? "Нууц үгээ шинэчлэх холбоос (15 минут хүчинтэй):" : "Имэйл хаягаа баталгаажуулах холбоос (1 цаг хүчинтэй):"}\n\n${url.href}\n\nХэрэв та энэ хүсэлтийг гаргаагүй бол имэйлийг үл тоогоорой. Энэ холбоосыг бусдад бүү дамжуулаарай.`,
  };
}
export async function deliverAuthEmail(message: ReturnType<typeof authEmailMessage>, config: { key: string; from: string }, transport: typeof fetch = fetch) {
  const response = await transport("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${config.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: config.from, ...message, to: [message.to] }), signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Authentication email delivery failed");
}
export function gmailTransportOptions(config: GmailConfig) {
  if (/[\r\n]/.test(config.user) || /[\r\n]/.test(config.from)) throw new Error("Invalid authentication email");
  return {
    host: "smtp.gmail.com", port: 465, secure: true,
    auth: { user: config.user, pass: config.appPassword.replace(/\s+/g, "") },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
  };
}
export async function deliverGmailEmail(
  message: ReturnType<typeof authEmailMessage>,
  config: GmailConfig,
  transport: GmailTransport = nodemailer.createTransport(gmailTransportOptions(config)),
) {
  if (/[\r\n]/.test(config.from)) throw new Error("Invalid authentication email");
  await transport.sendMail({ from: config.from, ...message });
}
