# PartnR — Technical Overview

> **How to read this document**
> This document explains how PartnR works, from the outside in. No programming experience required.
> Technical terms are always followed by a plain-language explanation in parentheses.
> Skip to any section that interests you — each one stands on its own.

---

## Table of Contents

1. [What is PartnR?](#1-what-is-partnr)
2. [The Big Picture](#2-the-big-picture)
3. [The Three Parts of the App](#3-the-three-parts-of-the-app)
4. [How Data Flows](#4-how-data-flows)
5. [Features, Explained Simply](#5-features-explained-simply)
6. [The Database — What We Store and Why](#6-the-database--what-we-store-and-why)
7. [Security](#7-security)
8. [Emails](#8-emails)
9. [Real-Time Chat](#9-real-time-chat)
10. [Analytics](#10-analytics)
11. [Deployment — Where the App Lives](#11-deployment--where-the-app-lives)
12. [Technology Choices](#12-technology-choices)
13. [API Reference — What the App Can Do](#13-api-reference--what-the-app-can-do)
14. [Glossary](#14-glossary)

---

## 1. What is PartnR?

PartnR is a **sports and activity partner matching app**. The core idea is simple: you want to go for a run, play tennis, or go hiking — but you don't have anyone to go with. PartnR lets you:

- Post an event ("Morning run in Paris, Saturday 8am, 4 spots")
- Join other people's events
- Chat with participants in real-time
- Rate your partners after the activity
- Discover people who share your interests

The app exists in two forms:
- A **website** (for computers and browsers)
- A **mobile app** (for phones, iOS and Android)

Both connect to the same central system, so data is always in sync.

---

## 2. The Big Picture

Think of PartnR like a **restaurant with three entrances** — the kitchen is the same, but you can enter through the front door (website), the side door (mobile app), or even directly through the service entrance if you know the way (API).

```
┌─────────────────────────────────────────────────────────────────┐
│                        USERS                                    │
│                                                                 │
│    🖥️  Web Browser              📱 Mobile Phone                  │
│    (React App on Vercel)        (Expo App on phone)             │
└──────────────┬──────────────────────────┬───────────────────────┘
               │                          │
               │   HTTPS requests         │   HTTPS requests
               │   (encrypted messages)   │   (encrypted messages)
               │                          │
               ▼                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API                                  │
│              (ASP.NET Core on Render)                           │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │   Auth   │  │  Events  │  │ Profiles │  │ Ratings/Chat │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
└──────────────────────────────────┬──────────────────────────────┘
                                   │
                                   │  SQL queries
                                   │  (database language)
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE                                     │
│                  (PostgreSQL on Supabase)                       │
│                                                                 │
│   Users · Events · Participants · Messages · Ratings · ...     │
└─────────────────────────────────────────────────────────────────┘
```

**In plain language:**
- The **frontend** (website and mobile app) is what you see and click.
- The **backend** is the invisible engine that processes your actions, enforces the rules, and talks to the database.
- The **database** is the permanent storage — every user, event, message, and rating lives there.

---

## 3. The Three Parts of the App

### Part 1 — The Backend (The Brain)

**Location:** `backend/PartnR.Api/`
**Technology:** C# / ASP.NET Core 8 (Microsoft's web framework)
**Runs on:** Render.com (a cloud hosting service)

The backend is a web API (Application Programming Interface). Think of it as a **very strict waiter at a restaurant**: it takes your order (request), checks if you're allowed to order it (authentication), prepares the dish (processes the data), and brings it back (response). It doesn't know what your table looks like — that's the frontend's job.

**What it does:**
- Handles all the business logic (the rules of the app)
- Checks that you are who you say you are (login/tokens)
- Reads and writes to the database
- Sends emails (verification, password reset)
- Powers the real-time chat

**How it's organized:**

```
backend/PartnR.Api/
├── Controllers/     ← "Waiters" — receive requests and send responses
├── Services/        ← "Chefs" — the actual logic lives here
├── Entities/        ← "Menu items" — what data looks like
├── DTOs/            ← "Order forms" — structured data for input/output
├── Data/            ← "Kitchen connection" — talks to the database
├── Hubs/            ← "Intercom" — real-time chat (SignalR)
├── Middleware/      ← "Security desk" — catches errors globally
└── Extensions/      ← "Shortcuts" — helper utilities
```

> **Key principle:** The backend *never* shows you raw database data. Every response is carefully shaped into a safe, clean format before being sent to the user.

---

### Part 2 — The Web Frontend (The Face)

**Location:** `frontend/src/`
**Technology:** React 19 + TypeScript + Tailwind CSS
**Runs on:** Vercel (a frontend hosting platform)

The web frontend is the website you see in your browser. It's a **Single Page Application (SPA)** — meaning after the initial load, navigating between pages doesn't reload the whole browser; it just swaps content, like a modern phone app.

**What it does:**
- Shows you the user interface (buttons, forms, lists)
- Calls the backend when you perform actions
- Stores your login token locally so you stay logged in
- Handles routing (navigating between pages)

**The pages:**

| Page | What it does |
|------|-------------|
| `/` — Event List | Browse all events with filters |
| `/events/new` | Create a new event |
| `/events/:id` | View an event, join/leave, see chat and ratings |
| `/events/:id/edit` | Edit your event |
| `/profile/:id` | View a user's profile and ratings |
| `/login` | Sign in |
| `/register` | Create an account |
| `/verify-email` | Confirm your email from a link |
| `/forgot-password` | Request a password reset email |
| `/reset-password` | Set a new password via email link |
| `/admin/analytics` | Admin-only statistics dashboard |

---

### Part 3 — The Mobile App (The Pocket Version)

**Location:** `mobile/`
**Technology:** Expo SDK 51 + React Native + TypeScript
**Runs on:** Users' phones (iOS and Android)

The mobile app is built with **React Native**, which lets us write one codebase that works on both iPhone and Android. It uses **Expo**, a toolkit that simplifies publishing and running the app.

**Screen structure:**

```
App entry
├── Onboarding (first launch)
├── Login
├── Register
├── Forgot Password
└── Main Tabs (after login)
    ├── 🏠 Home        — Discover events near you
    ├── ✨ Match       — Events matching your interests
    ├── 💬 Messages   — Chats for events you've joined
    └── 👤 Profile    — Your profile and settings
         └── (detail screens)
             ├── Event Detail + Join/Leave
             ├── Event Chat (real-time)
             └── Create Event (3-step form)
```

The mobile app connects to the **exact same backend** as the website. A user who registers on the website can log in on mobile and see all their events immediately.

---

## 4. How Data Flows

Here's what happens when you tap "Join Event" on your phone:

```
1. YOU tap "Join"
        ↓
2. The MOBILE APP sends a request to the backend:
   POST https://partnr-p3rv.onrender.com/api/events/{id}/join
   Authorization: Bearer eyJhbGci...  ← your identity token
        ↓
3. The BACKEND receives it and asks:
   • Is this token valid? (authentication check)
   • Is the event still open?
   • Is the event full?
   • Are you already a participant?
        ↓
4. If all checks pass, the BACKEND writes to the DATABASE:
   INSERT into EventParticipants (EventId, UserId, Status)
        ↓
5. The BACKEND sends back a success response (204 No Content)
        ↓
6. The MOBILE APP updates the UI:
   The "Join" button becomes "Leave", participant count goes up
```

This whole round trip takes under 500ms on a good connection.

---

## 5. Features, Explained Simply

### 5.1 Accounts and Login

When you create an account, here's what happens behind the scenes:

1. Your password is **never stored as-is**. It goes through a one-way transformation (hashing with bcrypt) so that even if someone stole the database, they couldn't read your password.
2. A **JWT token** (JSON Web Token) is issued — think of it as a temporary ID badge that expires after 24 hours. Every time you make a request, you show this badge.
3. A **verification email** is sent so we know your email address is real.

```
Register → Password hashed → Account created → Email sent → Token issued
```

### 5.2 Events

An event has:
- **Title, description, city, location, date** — the basics
- **Activity type** — chosen from a fixed list of 10 (running, tennis, yoga, etc.)
- **Max participants** — 2 to 50
- **Status** — Published (visible), Cancelled, Completed (past)

**Business rules enforced by the backend:**
- The event date must be in the future
- You can't join an event that's already full
- You can't leave an event you're the creator of (you'd have to delete it)
- You can't join twice
- Only the creator can edit or delete their event

### 5.3 Ratings

After an event is completed, participants can rate each other on a 1–5 star scale.

**Rules:**
- You can only rate someone if you were both confirmed participants in the same completed event
- You can only rate each person once per event
- You can't rate yourself
- The backend automatically recalculates the user's average rating after each new rating

```
New rating (score=4) is saved
        ↓
Backend recalculates:
new_avg = (old_avg × old_count + 4) / (old_count + 1)
new_count = old_count + 1
        ↓
User's RatingAvg and RatingCount are updated atomically
(both changes happen together or not at all)
```

### 5.4 The Activity Filter

Activities are pre-seeded in the database:

| Icon | Activity |
|------|----------|
| 🏃 | Running |
| 🥾 | Randonnée (Hiking) |
| 🚴 | Vélo (Cycling) |
| 🎲 | Jeux de société (Board Games) |
| 🎾 | Tennis |
| 🧘 | Yoga |
| 🏊 | Natation (Swimming) |
| 🧗 | Escalade (Climbing) |
| ⚽ | Football |
| 🏸 | Badminton |

### 5.5 Searching and Filtering

Events can be filtered by:
- **City** — case-insensitive match (Paris = paris = PARIS)
- **Activity type** — specific sport/activity
- **Status** — published, completed, etc.
- **Mine** — only events you've joined (`?mine=true`)

Results are **paginated** — delivered in pages of 20 (or up to 50) to avoid sending thousands of records at once.

---

## 6. The Database — What We Store and Why

The database is **PostgreSQL**, hosted on **Supabase**. Think of it as a set of very organized spreadsheets, where each "spreadsheet" (table) stores one type of thing, and they all reference each other.

### The Tables

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE TABLES                            │
│                                                                 │
│  AspNetUsers (AppUser)                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ id · email · firstName · city · bio · avatarUrl       │    │
│  │ ratingAvg · ratingCount · favoriteActivities          │    │
│  │ emailConfirmed · role · createdAt                     │    │
│  └────────────────────────────────────────────────────────┘    │
│             │                    │                              │
│             ▼                    ▼                              │
│  Events                          EventParticipants              │
│  ┌──────────────────────┐   ┌──────────────────────────┐      │
│  │ id · title · city   │◄──│ eventId · userId         │      │
│  │ date · status       │   │ status · joinedAt        │      │
│  │ maxParticipants     │   └──────────────────────────┘      │
│  │ creatorId (→ User)  │                                      │
│  │ activityId (→ Act.) │                                      │
│  └──────────────────────┘                                      │
│         │           │                                           │
│         ▼           ▼                                           │
│  Messages          Ratings                                      │
│  ┌─────────────┐  ┌──────────────────────────────────┐        │
│  │ eventId     │  │ eventId · raterId · ratedUserId  │        │
│  │ userId      │  │ score (1-5) · comment           │        │
│  │ content     │  └──────────────────────────────────┘        │
│  │ createdAt   │                                               │
│  └─────────────┘                                               │
│                                                                 │
│  Activities              UserActions (Analytics)                │
│  ┌─────────────────┐    ┌────────────────────────────┐        │
│  │ id · name       │    │ userId · action            │        │
│  │ slug · icon     │    │ entityType · entityId      │        │
│  └─────────────────┘    │ createdAt                  │        │
│                          └────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### Why these constraints?

The database enforces certain rules that can never be violated, even if the code has a bug:

| Constraint | What it prevents |
|-----------|-----------------|
| Unique (EventId + UserId) in EventParticipants | Joining the same event twice |
| Unique (EventId + RaterId + RatedUserId) in Ratings | Rating the same person twice per event |
| Check: RaterId ≠ RatedUserId | Self-rating |
| Check: Score between 1 and 5 | Invalid scores |
| Unique (Name), Unique (Slug) in Activities | Duplicate activity types |

---

## 7. Security

### Authentication (Who are you?)

PartnR uses **JWT (JSON Web Tokens)** — a standard, tamper-proof identity system.

```
Login → Server validates credentials
      → Server creates signed token: { userId, email, name, expiry }
      → Token is sent to client
      → Client sends token with every request (in the Authorization header)
      → Server verifies signature on each request (no database lookup needed)
```

Tokens expire after **24 hours**. After that, you need to log in again.

### Rate Limiting (Prevent abuse)

The API has automatic brakes to prevent bots and attacks:

| Zone | Limit |
|------|-------|
| `/api/auth/*` (login, register, etc.) | 10 requests per minute |
| All other endpoints | 60 requests per minute |

If you exceed the limit, the API returns **429 Too Many Requests**.

### Password Security

Passwords are **never stored** in the database. Instead:
1. The password is run through **bcrypt**, a one-way algorithm that produces a fixed-length "fingerprint"
2. Only that fingerprint is stored
3. When you log in, your typed password is fingerprinted and compared to the stored one
4. Even database administrators cannot read your password

### HTTPS / Encryption

All communication between clients (browser/app) and the backend is **encrypted with TLS** (the technology behind the padlock icon in browsers). No one intercepting the traffic can read your data.

### CORS (Which websites can talk to the API)

The backend only accepts requests from:
- `localhost:5173` (local development)
- `localhost:3000` (local development)
- Any subdomain of `*.vercel.app` (production previews)

Other websites trying to call the API will be blocked.

### Error Handling

The backend catches all unexpected errors and returns generic messages to users — it never leaks internal details (stack traces, database errors, file paths) that could help an attacker.

```
Exception type         → HTTP Status → User sees
─────────────────────────────────────────────────
Not found              → 404        → "Event not found."
Not authorized         → 403        → "Only the creator can update this event."
Invalid input          → 400        → (specific validation message)
Anything unexpected    → 500        → "An unexpected error occurred."
```

---

## 8. Emails

PartnR sends emails for three things:

### Email Verification
When you register, you receive a link to confirm your email address. The link contains a **secure, one-time token** embedded in the URL:
```
https://partnr.app/verify-email?userId=abc123&token=xYz...
```
The token is generated by ASP.NET Identity, encoded in a URL-safe format (Base64Url), and can only be used once.

### Password Reset
When you click "Forgot password":
1. The backend generates a short-lived reset token
2. An email is sent with a link to the reset page
3. You click the link, set a new password, the token is consumed and can't be reused

### Change Password
Logged-in users can change their password via `POST /api/auth/change-password` — this requires knowing the current password.

### Email Infrastructure
Emails are sent via **SMTP** (the standard email protocol). The provider is configurable via environment variables:
```
Email__SmtpHost     = smtp.yourprovider.com
Email__SmtpPort     = 587
Email__Username     = your-api-key
Email__Password     = secret
Email__FromAddress  = noreply@partnr.app
```
In development (when SmtpHost is empty), emails are skipped and a log message is written instead.

---

## 9. Real-Time Chat

Each event has a group chat. Messages appear instantly for all participants — no need to refresh.

### How it works (WebSocket / SignalR)

Normal web communication is **request-response**: you ask, the server answers, the connection closes. Real-time chat needs something different — the server needs to be able to **push messages** to you without you asking.

**SignalR** creates a persistent connection (a WebSocket) between your browser/app and the server:

```
User A joins chat → Opens WebSocket connection to /hubs/event-chat
User B joins chat → Opens WebSocket connection to /hubs/event-chat

User A sends "Let's meet at the park entrance 🏃"
        ↓
Server receives message
        ↓
Server broadcasts to all members of the "event-{id}" group
        ↓
User B's screen updates instantly with User A's message
```

### What happens when you join a chat

1. Client sends `JoinEventChat(eventId)`
2. Server checks you are a confirmed participant of that event
3. Server adds you to a group (all participants of that event)
4. Server sends you the **last 50 messages** (history)
5. From now on, any new message in the group is pushed to you instantly

### Authentication in WebSockets

Regular HTTP requests use the `Authorization: Bearer token` header. WebSockets can't do this. Instead, PartnR passes the token as a URL query parameter:
```
wss://partnr-p3rv.onrender.com/hubs/event-chat?access_token=eyJhbGci...
```
The server reads it from the query string and validates it the same way.

---

## 10. Analytics

PartnR tracks user actions to understand how the app is used. This data is visible only to administrators.

### What is tracked

Every significant action creates a record in the `UserActions` table:

| Action | When |
|--------|------|
| `user_registered` | Account created |
| `user_login` | User signed in |
| `event_created` | New event posted |
| `event_joined` | User joined an event |
| `event_left` | User left an event |
| `event_updated` | Event was edited |
| `event_deleted` | Event was deleted |
| `page_view` | Page visited (frontend) |
| `message_sent` | Chat message sent |

### How tracking works (Fire-and-forget)

Analytics tracking must never slow down the user's action. The solution:

```
User clicks "Join Event"
        ↓
Event join logic runs (fast, critical)
        ↓
Response sent to user immediately
        ↓  (in parallel, in background)
Analytics record written to database
```

This is implemented using `IServiceScopeFactory` — the analytics tracker creates its own background context so it doesn't interfere with the main request.

### The Dashboard

Available at `/admin/analytics`, it shows:
- Total users, total events, total tracked actions
- Actions in the last 24 hours
- New users in the last 7 days
- Actions by day (chart)
- Actions by type (chart)
- Top events by participant count

---

## 11. Deployment — Where the App Lives

### The Three Deployed Pieces

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  🌐 FRONTEND (Website)                                     │
│  Vercel — https://partnr.vercel.app                       │
│  • Serves static HTML/CSS/JavaScript files                 │
│  • Deployed automatically on every push to main           │
│  • Free tier, global CDN, ~0ms startup                   │
│                                                            │
│  ⚙️  BACKEND (API)                                          │
│  Render — https://partnr-p3rv.onrender.com                │
│  • Runs the C# ASP.NET Core server                        │
│  • Free tier — spins down after 15min of inactivity       │
│  • First request after sleep takes ~30 seconds (cold start)│
│                                                            │
│  🗄️  DATABASE                                               │
│  Supabase — PostgreSQL in the cloud                       │
│  • Persistent data storage                                 │
│  • Free tier, hosted in EU                                 │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Deployment Pipeline (CI/CD)

Every time code is pushed to GitHub, automated checks run before anything reaches production:

```
Push code to GitHub
        ↓
GitHub Actions runs automatically:
  ├── 🔍 Backend: dotnet build + dotnet test (all unit tests)
  ├── 🔍 Frontend: eslint (code style) + tsc (type check) + vitest (unit tests) + vite build
  └── 🌐 Vercel: builds and deploys frontend preview
        ↓
If everything passes → merge to main → production deploy
If anything fails   → blocked, must fix first
```

### Environment Variables

Sensitive configuration (passwords, API keys) is never in the code. It's stored as environment variables on each platform:

**On Render (backend):**
```
ConnectionStrings__DefaultConnection = postgresql://...
Jwt__Key                             = long-secret-key
Email__SmtpHost                      = smtp.resend.com
Email__Username                      = resend
Email__Password                      = re_xxxx
FrontendUrl                          = https://partnr.vercel.app
```

**On Vercel (frontend):**
```
VITE_API_URL = https://partnr-p3rv.onrender.com
```

---

## 12. Technology Choices

### Why C# / ASP.NET Core for the backend?

- **Strongly typed** — the compiler catches whole categories of bugs before they reach production
- **Performance** — one of the fastest web frameworks available (benchmarks show it outperforms Node.js, Django, Rails)
- **ASP.NET Identity** — a battle-tested authentication system that handles passwords, tokens, email confirmation, and password reset out of the box
- **Entity Framework Core** — lets you write database queries in C# instead of raw SQL, with automatic safety against SQL injection attacks

### Why React for the frontend?

- **Component-based** — the UI is built from small, reusable pieces (a "star rating" component can be used everywhere)
- **Massive ecosystem** — almost any UI problem has a ready-made library
- **TypeScript** — adds types to JavaScript, catching bugs before they run in the browser
- **Vite** — extremely fast build tool, makes development instant

### Why React Native / Expo for mobile?

- **One codebase, two platforms** — the same TypeScript code runs on both iOS and Android
- **Expo Router** — file-based navigation (the filename becomes the URL/route), same mental model as the web
- **Expo Go** — during development, you can scan a QR code and run the app on your real phone instantly, no compilation needed

### Why PostgreSQL / Supabase?

- **PostgreSQL** — the most feature-rich open-source database. Supports arrays (for `favoriteActivities`), complex queries, and strong data integrity constraints
- **Supabase** — a managed PostgreSQL service with a generous free tier, automatic backups, and a web dashboard for inspecting data

### Why SignalR for chat?

- **Works everywhere** — SignalR automatically falls back from WebSockets to Server-Sent Events to Long Polling depending on what the client supports
- **Built into ASP.NET Core** — no extra infrastructure (no Redis, no separate WebSocket server)
- **Group abstraction** — with one line of code, a message can be broadcast to all members of a group (all participants of an event)

### Why Tailwind CSS?

- **No fighting with CSS files** — styles are written directly in the HTML as class names (`bg-indigo-600 text-white px-4 py-2`)
- **Consistent design system** — spacing, colors, and typography follow a fixed scale
- **No unused CSS in production** — the build tool removes any classes not used in the code

---

## 13. API Reference — What the App Can Do

> **What is an API?** An API (Application Programming Interface) is a list of things you can ask the server to do. Each "endpoint" is like a button the frontend can press. Some buttons require you to be logged in (🔒), others are public.

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Create a new account |
| POST | `/api/auth/login` | — | Sign in, receive a token |
| GET | `/api/auth/me` | 🔒 | Get current user info |
| POST | `/api/auth/confirm-email` | — | Verify email from link |
| POST | `/api/auth/resend-confirmation` | — | Resend verification email |
| POST | `/api/auth/forgot-password` | — | Request password reset email |
| POST | `/api/auth/reset-password` | — | Set new password via token |
| POST | `/api/auth/change-password` | 🔒 | Change password (requires current) |

### Events

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/events` | — | List events (filter: city, activity, status, mine, page) |
| GET | `/api/events/{id}` | — | Get single event with participants |
| POST | `/api/events` | 🔒 | Create event |
| PUT | `/api/events/{id}` | 🔒 | Update event (creator only) |
| DELETE | `/api/events/{id}` | 🔒 | Delete event (creator only) |
| POST | `/api/events/{id}/join` | 🔒 | Join event |
| POST | `/api/events/{id}/leave` | 🔒 | Leave event |

### Profiles

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/profiles/{id}` | — | View a user's public profile |
| GET | `/api/profiles` | — | Search users (filter: city, activity) |
| PUT | `/api/profiles/me` | 🔒 | Update own profile |

### Ratings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/events/{eventId}/ratings` | 🔒 | Rate a participant |
| GET | `/api/events/{eventId}/ratings/user/{userId}` | 🔒 | Get ratings for a user |

### Activities

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/activities` | — | List all activity types |

### Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/analytics/track` | 🔒 | Track a user action |
| GET | `/api/analytics/dashboard` | 🔒 Admin | View analytics dashboard |

### Real-Time Chat (WebSocket)

| Connection | Auth | Description |
|-----------|------|-------------|
| `wss://.../hubs/event-chat?access_token=...` | 🔒 | Connect to chat hub |

| Method (client → server) | Description |
|--------------------------|-------------|
| `JoinEventChat(eventId)` | Join a chat room, receive history |
| `SendMessage(eventId, content)` | Send a message to the room |
| `LeaveEventChat(eventId)` | Leave the chat room |

| Event (server → client) | Description |
|-------------------------|-------------|
| `MessageHistory` | Last 50 messages on join |
| `NewMessage` | A new message in the room |

---

## 14. Glossary

| Term | Plain English |
|------|--------------|
| **API** | A set of rules for how software components talk to each other. Think of it as a menu of things you can ask the server. |
| **ASP.NET Core** | Microsoft's framework for building web servers in C#. |
| **Authentication** | Proving who you are (login). |
| **Authorization** | Proving you're allowed to do something (permissions). |
| **bcrypt** | A mathematical one-way function used to scramble passwords so they can't be read even if the database is stolen. |
| **CDN** | Content Delivery Network — copies of your website stored on servers worldwide so pages load fast everywhere. |
| **CI/CD** | Continuous Integration / Continuous Deployment — automated processes that test and deploy your code every time you push a change. |
| **CORS** | Cross-Origin Resource Sharing — a security system that controls which websites can call your API. |
| **CRUD** | Create, Read, Update, Delete — the four basic database operations. |
| **DTO** | Data Transfer Object — a structured envelope for sending data between the frontend and backend. |
| **Entity Framework** | A library that lets developers write C# code instead of SQL to query databases. |
| **Endpoint** | A specific URL on the API that does one thing (e.g., `/api/events` lists events). |
| **Expo** | A toolkit for building React Native apps more easily. |
| **Frontend** | The visual part of the app — what you see and interact with. |
| **Backend** | The invisible engine — business logic, data processing, security. |
| **HTTPS / TLS** | Encrypted communication between your browser/app and the server (the padlock icon). |
| **JWT** | JSON Web Token — a signed, tamper-proof digital ID badge issued when you log in. |
| **Migration** | A script that changes the database structure (add a table, add a column, etc.) in a trackable way. |
| **Pagination** | Splitting results into pages instead of sending everything at once (like a Google results page). |
| **PostgreSQL** | A powerful open-source relational database. |
| **Rate Limiting** | Automatically blocking requests if someone makes too many in a short time (anti-abuse). |
| **React** | A JavaScript library for building user interfaces as reusable components. |
| **React Native** | A framework for building mobile apps using the same patterns as React. |
| **REST** | A standard style for designing APIs using HTTP methods (GET, POST, PUT, DELETE). |
| **SignalR** | Microsoft's library for real-time, bidirectional communication between server and clients. |
| **SPA** | Single Page Application — a website that loads once and then swaps content without full page reloads. |
| **SQL** | Structured Query Language — the language used to talk to relational databases. |
| **Supabase** | A managed cloud service that provides a PostgreSQL database with extras. |
| **TypeScript** | JavaScript with type declarations added, catching bugs before the code runs. |
| **Vercel** | A hosting platform specialized in frontend apps (React, Next.js, etc.). |
| **WebSocket** | A persistent two-way connection between browser/app and server — used for real-time features like chat. |
| **EF Core** | Short for Entity Framework Core — see "Entity Framework" above. |
| **Npgsql** | The .NET library that connects C# code to a PostgreSQL database. |
| **Tailwind CSS** | A CSS framework where you style elements with short class names directly in HTML/JSX. |
| **Vite** | A fast build tool for frontend projects. Compiles and bundles your React code for the browser. |

---

*Last updated: June 2026*
*This document covers PartnR as of the completion of the auth email verification, password reset, and event creation fix features.*
