import crypto from "crypto";

export function verifyLinqWebhook({ signingSecret, timestamp, signature, rawBody }) {
    if (!timestamp || !signature) return false;

    const ts = Number(timestamp);
    if (!Number.isFinite(ts)) return false;

    // replay protection: 5 minutes
    const nowSec = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSec - ts) > 5 * 60) return false;

    const signedPayload = `${timestamp}.${rawBody}`;

    const expected = crypto
        .createHmac("sha256", signingSecret)
        .update(signedPayload)
        .digest("hex");

    // constant-time compare
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    if (a.length !== b.length) return false;

    return crypto.timingSafeEqual(a, b);
}