/**
 * SMS plumbing. No-op stub by default — drop Twilio (or similar) credentials
 * into .env.local to turn it on:
 *
 *   TWILIO_ACCOUNT_SID=AC...
 *   TWILIO_AUTH_TOKEN=...
 *   TWILIO_FROM_NUMBER=+15551234567
 *   LADI_PHONE_NUMBER=+15559876543
 *
 * Then `npm install twilio` and uncomment the Twilio block below.
 */

export interface SmsResult {
  ok: boolean;
  delivered: boolean;
  reason: string;
}

export async function sendSms(body: string, to?: string): Promise<SmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const recipient = to ?? process.env.LADI_PHONE_NUMBER;

  if (!sid || !token || !from || !recipient) {
    console.log(`[SMS-STUB] would send to ${recipient ?? "(no number)"}: ${body}`);
    return { ok: true, delivered: false, reason: "stub (no provider configured)" };
  }

  // Uncomment after `npm install twilio`:
  //
  // const twilio = (await import("twilio")).default(sid, token);
  // try {
  //   const message = await twilio.messages.create({ from, to: recipient, body });
  //   return { ok: true, delivered: true, reason: `delivered (${message.sid})` };
  // } catch (err) {
  //   const reason = err instanceof Error ? err.message : "unknown";
  //   console.error(`[SMS] failed: ${reason}`);
  //   return { ok: false, delivered: false, reason };
  // }

  console.log(`[SMS-STUB] credentials present but Twilio import not wired. Body: ${body}`);
  return { ok: true, delivered: false, reason: "stub (Twilio import disabled)" };
}
