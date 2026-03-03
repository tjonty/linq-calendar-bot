import axios from "axios";

export function makeLinqClient({ baseUrl, token }) {
    const http = axios.create({
        baseURL: baseUrl,
        headers: { Authorization: `Bearer ${token}` },
    });

    return {
        async startTyping(chatId) {
            await http.post(`/chats/${chatId}/typing`);
        },

        async sendText(chatId, text) {
            await http.post(`/chats/${chatId}/messages`, {
                message: { parts: [{ type: "text", value: text }] },
            });
        },

        async sendIcsAsUrl(chatId, text, url) {
            await http.post(`/chats/${chatId}/messages`, {
                message: {
                    parts: [
                        { type: "text", value: text },
                        { type: "media", url },
                    ],
                },
            });
        },

        async requestPreupload({ filename, contentType, sizeBytes }) {
            const res = await http.post(`/attachments`, {
                filename,
                content_type: contentType,
                size_bytes: sizeBytes,
            });
            return res.data;
        },
    };
}