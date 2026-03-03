// In-memory store keyed by chatId
const state = new Map();

export async function handleIncomingText({ linq, chatId, text }) {
    const s = state.get(chatId) || { step: "idle" };

    const t = (text || "").trim().toLowerCase();

    if (s.step === "idle") {
        if (t.includes("book") || t.includes("schedule") || t.includes("demo")) {
            state.set(chatId, { step: "collecting" });
            await linq.startTyping(chatId);
            await linq.sendText(
                chatId,
                "Sure — what day/time works (e.g., “Tue 2:30pm”), and how long (15/30/60)? Also what timezone?"
            );
            return;
        }

        // Default help message
        await linq.sendText(chatId, 'Say "book a meeting" to schedule time.');
        return;
    }

    if (s.step === "collecting") {
        state.set(chatId, { step: "confirming", details: text });

        await linq.startTyping(chatId);
        await linq.sendText(
            chatId,
            `Got it: "${text}". Reply YES to confirm, or send new details to change.`
        );
        return;
    }

    if (s.step === "confirming") {
        if (t === "yes" || t === "y") {
            state.set(chatId, { step: "confirmed", details: s.details });

            await linq.startTyping(chatId);
            await linq.sendText(chatId, "Confirmed ✅ I’m generating your calendar invite now.");
            // We’ll generate + send ICS in the next step (from index.js)
            return { action: "SEND_ICS", details: s.details };
        }

        // update details
        state.set(chatId, { step: "confirming", details: text });
        await linq.sendText(chatId, `Updated: "${text}". Reply YES to confirm.`);
        return;
    }
}