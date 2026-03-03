import "dotenv/config";
import express from "express";
import { verifyLinqWebhook } from "./webhookVerify.js";
import { makeLinqClient } from "./linq.js";
import { handleIncomingText } from "./bot.js";
import { buildIcs } from "./ics.js";
import crypto from "crypto";
import { parseMeetingRequest } from "./timeParse.js";

const app = express();

app.use("/webhooks/linq", express.raw({ type: "*/*" }));

const linq = makeLinqClient({
    baseUrl: process.env.LINQ_API_BASE,
    token: process.env.LINQ_TOKEN,
});

// Quick health check
app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/webhooks/linq", async (req, res) => {
    const timestamp = req.header("X-Webhook-Timestamp");
    const signature = req.header("X-Webhook-Signature");
    const eventType = req.header("X-Webhook-Event");

    const rawBody = req.body?.toString("utf8") ?? "";

    console.log("event:", eventType);
    console.log("timestamp header:", timestamp);
    console.log("signature header:", signature);
    console.log("rawBody length:", rawBody.length);
    console.log("rawBody preview:", rawBody.slice(0, 120));

    const ok = verifyLinqWebhook({
        signingSecret: process.env.LINQ_WEBHOOK_SIGNING_SECRET,
        timestamp,
        signature,
        rawBody,
    });

    console.log("webhook verification:", ok);

    if (!ok) return res.status(401).send("invalid signature");

    res.status(200).send("ok");

    // Process after responding
    try {
        if (eventType !== "message.received") return;

        const payload = JSON.parse(rawBody);

        console.log("DATA KEYS:", Object.keys(payload.data || {}));
        console.log("DATA SAMPLE:", JSON.stringify(payload.data).slice(0, 1200));

        const chatId = payload?.data?.chat?.id;

        const parts = payload?.data?.parts || [];
        const textPart = parts.find((p) => p.type === "text");
        const text = textPart?.value;

        const from = payload?.data?.sender_handle?.handle;          // user’s number
        const to = payload?.data?.chat?.owner_handle?.handle;

        console.log("chatId:", chatId);
        console.log("from:", from, "to:", to);
        console.log("text:", text);

        if (!chatId || !text) return;

        const result = await handleIncomingText({ linq, chatId, text });

        // If bot says "send ICS", generate an invite and send it.
        if (result?.action === "SEND_ICS") {
            const { startUtc, endUtc, debug } = parseMeetingRequest(result.details);
            console.log("Parsed meeting:", debug);

            const ics = buildIcs({
                startUtc,
                endUtc,
                summary: "Demo Meeting",
                description: `Requested: ${result.details}`,
            });

            const id = crypto.randomUUID();
            invites.set(id, ics);

            const inviteUrl = `${process.env.PUBLIC_BASE_URL}/invites/${id}.ics`;

            console.log("INVITE URL:", inviteUrl);
            console.log("INVITE BYTES:", Buffer.byteLength(ics, "utf8"));
            try {
                await linq.sendIcsAsUrl(chatId, "Here’s your calendar invite:", inviteUrl);
                console.log("Sent invite message");
            } catch (e) {
                console.error("Failed to send invite:", e?.response?.data || e);
            }
        }
    } catch (e) {
        console.error("Webhook processing error:", e);
    }
});

const invites = new Map();

app.get("/invites/:id.ics", (req, res) => {
    const ics = invites.get(req.params.id);
    if (!ics) return res.status(404).send("not found");
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.send(ics);
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Listening on ${process.env.PORT || 3000}`);
});