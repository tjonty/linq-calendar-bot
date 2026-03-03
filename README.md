# Linq Calendar Bot

Node.js webhook bot for Linq that:
- receives incoming chat messages
- walks users through a simple booking flow
- parses natural-language time text
- generates a `.ics` calendar invite
- sends the invite back as a media URL

## Tech Stack

- Node.js (ESM modules)
- Express
- Axios
- chrono-node
- Luxon

## Project Structure

- `src/index.js`: Express server, webhook handler, invite hosting route
- `src/bot.js`: conversational state machine (`idle -> collecting -> confirming`)
- `src/timeParse.js`: natural language date/time + duration parsing
- `src/ics.js`: ICS file generation
- `src/linq.js`: Linq API client wrappers
- `src/webhookVerify.js`: HMAC signature verification for webhooks

## Prerequisites

- Node.js 18+ (Node 20+ recommended)
- npm
- ngrok (for local public webhook URL)
- Linq partner credentials and webhook subscription

## Installation

```bash
npm install
```

## Environment Variables

Create `.env` in the project root:

```bash
PORT=3000
LINQ_API_BASE=https://api.linqapp.com/api/partner/v3
LINQ_TOKEN=your_linq_api_token
LINQ_WEBHOOK_SIGNING_SECRET=your_webhook_signing_secret
PUBLIC_BASE_URL=https://your-ngrok-domain.ngrok-free.dev
```

Notes:
- `PUBLIC_BASE_URL` must be publicly reachable over HTTPS.
- Keep `LINQ_TOKEN` and `LINQ_WEBHOOK_SIGNING_SECRET` secret.

## Run Locally

Start the app:

```bash
npm start
```

Health check:

```bash
curl http://localhost:3000/health
```

## Expose Local Server with ngrok

1. Authenticate ngrok once:

```bash
ngrok config add-authtoken <YOUR_NGROK_AUTHTOKEN>
```

2. Start tunnel:

```bash
ngrok http 3000
```

3. Copy the HTTPS forwarding URL into `.env` as `PUBLIC_BASE_URL`.

## Configure Linq Webhook

Point your Linq webhook subscription URL to:

`https://<your-public-url>/webhooks/linq`

Ensure the signing secret from Linq matches `LINQ_WEBHOOK_SIGNING_SECRET`.

## Booking Flow

1. User sends message containing `book`, `schedule`, or `demo`.
2. Bot asks for day/time, duration, and timezone.
3. User replies with details.
4. Bot asks for confirmation (`YES`).
5. On confirmation, app parses the details, creates an ICS invite, and sends a message with the invite URL.

## Endpoints

- `GET /health` -> `{ "ok": true }`
- `POST /webhooks/linq` -> webhook receiver (expects raw body for signature validation)
- `GET /invites/:id.ics` -> serves generated invite from in-memory store

## Important Behavior

- Webhook verification uses HMAC SHA-256 over `${timestamp}.${rawBody}`.
- Timestamps older than 5 minutes are rejected.
- Invite storage is in-memory (`Map`), so invite URLs are lost on restart.

## Troubleshooting

- `Cannot use import statement outside a module`
  - Ensure `package.json` includes `"type": "module"`.

- `chrono-node does not provide an export named 'default'`
  - Use `import * as chrono from "chrono-node";`.

- `zsh: command not found: ngrok`
  - Install ngrok (for Homebrew users): `brew install ngrok/ngrok/ngrok`

- Webhook returns `401 invalid signature`
  - Confirm raw body is used (`express.raw(...)` on webhook route).
  - Confirm `LINQ_WEBHOOK_SIGNING_SECRET` exactly matches Linq config.
  - Confirm server clock is accurate (5-minute replay window).

## Limitations

- Conversation and invite state are not persistent (memory only).
- No retries/backoff around outbound Linq API calls.
- Time parsing is heuristic and currently US-timezone focused.
- ICS generation is minimal and can be extended with organizer/attendees/alarms.

## Next Improvements

1. Persist chat state and invite files (Redis/DB/object storage).
2. Add structured logging and error tracking.
3. Add unit tests for parsing, webhook verification, and ICS formatting.
4. Add stricter validation for webhook payload schema.
