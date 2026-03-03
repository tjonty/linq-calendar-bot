# Linq Calendar Bot 📅

**Conversational Scheduling via iMessage, RCS, and SMS — No UI Required**

Schedule meetings entirely inside a messaging thread using natural language.  
Built on top of the Linq Partner API (V3), this bot allows users to book meetings conversationally and receive a real `.ics` calendar invite directly in chat.

---

## 🎬 Demo Video

Watch the project in action:  
👉 https://youtu.be/YOUR_VIDEO_LINK

---

## 🚀 What This Project Does

Users can send messages like:

> "Tue 4:30pm for 15 minutes CT"

The bot will:

1. Parse the natural language date/time
2. Normalize timezone correctly
3. Confirm the booking
4. Generate a valid `.ics` calendar invite
5. Send the invite back directly in the conversation

All without leaving iMessage, RCS, or SMS.

---

## 🧠 Why This Is Interesting

Most scheduling tools require users to:
- Click external booking links
- Fill out forms
- Leave the conversation context

This project turns messaging itself into the scheduling interface.

It demonstrates:

- Event-driven webhook architecture
- Secure HMAC webhook verification
- Conversational state machine design
- Natural language time parsing
- Timezone-safe calendar generation
- Media attachment delivery via API

---

## 🏗️ Architecture Overview

```
User
  ↓
Linq Messaging Platform
  ↓ (webhook: message.received)
Express Server
  ↓
Signature Verification (HMAC SHA-256)
  ↓
Conversation State Machine
  ↓
Natural Language Time Parsing
  ↓
ICS Calendar Generation
  ↓
Linq Message API (media attachment)
  ↓
User receives calendar invite
```

---

## 🛠 Tech Stack

- Node.js (ESM modules)
- Express
- Axios
- chrono-node (natural language parsing)
- Luxon (timezone handling + UTC normalization)
- Linq Partner API (V3)
- ngrok (local webhook exposure)

---

## 📂 Project Structure

```
src/
  index.js            # Express server + webhook handler
  bot.js              # Conversational state machine
  timeParse.js        # Natural language time + duration parsing
  ics.js              # ICS calendar generation
  linq.js             # Linq API client wrapper
  webhookVerify.js    # HMAC webhook signature verification
```

---

## 🔐 Security Model

Webhook verification includes:

- HMAC SHA-256 validation over `${timestamp}.${rawBody}`
- Strict raw body usage (no re-stringifying JSON)
- 5-minute replay window protection
- Environment-based secret storage

Invalid signatures immediately return `401`.

---

## 📦 Installation

```bash
npm install
```

---

## ⚙️ Environment Variables

Create a `.env` file:

```env
PORT=3000
LINQ_API_BASE=https://api.linqapp.com/api/partner/v3
LINQ_TOKEN=your_linq_api_token
LINQ_WEBHOOK_SIGNING_SECRET=your_webhook_signing_secret
PUBLIC_BASE_URL=https://your-ngrok-domain.ngrok-free.dev
```

Notes:

- `PUBLIC_BASE_URL` must be publicly reachable via HTTPS.
- Never commit `LINQ_TOKEN` or `LINQ_WEBHOOK_SIGNING_SECRET`.

---

## ▶️ Run Locally

Start server:

```bash
npm start
```

Health check:

```bash
curl http://localhost:3000/health
```

---

## 🌍 Expose Server with ngrok

1. Authenticate ngrok:

```bash
ngrok config add-authtoken YOUR_NGROK_AUTHTOKEN
```

2. Start tunnel:

```bash
ngrok http 3000
```

3. Copy HTTPS forwarding URL into `.env` as `PUBLIC_BASE_URL`.

---

## 🔗 Configure Linq Webhook

Set webhook URL in Linq to:

```
https://<your-public-url>/webhooks/linq
```

Ensure the webhook signing secret matches your `.env` value.

---

## 📅 Booking Flow

1. User sends message containing `book`, `schedule`, or `demo`
2. Bot asks for day/time, duration, and timezone
3. User replies with details
4. Bot asks for confirmation (`YES`)
5. On confirmation:
   - Parse date/time
   - Convert to UTC
   - Generate `.ics`
   - Send media message with invite URL

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|------------|
| GET | `/health` | Health check |
| POST | `/webhooks/linq` | Webhook receiver (raw body required) |
| GET | `/invites/:id.ics` | Serves generated ICS invite |

---

## 🧪 Troubleshooting

### Webhook returns `401 invalid signature`
- Ensure `express.raw()` is used for webhook route
- Confirm signing secret matches Linq
- Confirm server clock is accurate

### Date/time incorrect
- Ensure timezone mapping in `timeParse.js`
- Verify UTC conversion before ICS generation

### ngrok not found
Install via Homebrew:

```bash
brew install ngrok/ngrok/ngrok
```

---

## ⚠️ Limitations

- In-memory state (lost on restart)
- No persistence layer
- No retry/backoff for outbound API calls
- Time parsing optimized for US timezones
- ICS file minimal (no organizer/attendee metadata)

---

## 🔮 Future Improvements

- Persistent storage (Redis / PostgreSQL)
- Structured logging + tracing
- Multi-slot suggestions (reply 1/2/3)
- Reschedule & cancel flow
- Delivery/read receipt-based reminders
- Proper ICS attendee + alarm support
- Dockerized deployment

---

## 👨‍💻 Author

Developed by Jonty Tejani  
Building secure, event-driven AI & messaging systems.

More Projects: Jontytejani.com
LinkedIn: https://www.linkedin.com/in/jontytejani/

---

## 🏷 Tags

#LinqAPI #NodeJS #Webhooks #iMessageAPI #SMSAutomation #CalendarBot #ExpressJS #JavaScript #ConversationalAI