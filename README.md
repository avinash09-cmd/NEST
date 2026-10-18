<div align="center">

<img src="https://img.shields.io/badge/N.E.S.T.-Neighborhood%20Emergency%20%26%20Safety%20Tool-1e40af?style=for-the-badge&logoColor=white" alt="NEST" />

# 🛡️ N.E.S.T.
### Neighborhood Emergency and Safety Tool

**AI-powered civic platform for residents and administrators to manage neighborhood safety, complaints, alerts, and emergencies.**

![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![Anthropic](https://img.shields.io/badge/Claude_AI-D97706?style=flat-square)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

</div>

---

## 📸 Screenshots

### 🏠 Landing Page
![Landing Page](./screenshots/landing.svg)

---

### 🔐 Login
![Login](./screenshots/login.svg)

---

### 📊 Dashboard
![Dashboard](./screenshots/dashboard.svg)

---

### 📋 Complaints Management
![Complaints](./screenshots/complaints.svg)

---

### 🚨 Emergency Management
![Emergency](./screenshots/emergency.svg)

---

### 🔔 Alerts & Notifications
![Alerts](./screenshots/alerts.svg)

---

### 💧 Water Quality Monitoring
![Water Quality](./screenshots/water-quality.svg)

---

### 💡 Suggestion Box
![Suggestions](./screenshots/suggestions.svg)

---

### 🤖 AI Chat Assistant
![AI Chat](./screenshots/ai-chat.svg)

---

### 🛡️ Admin Panel
![Admin Panel](./screenshots/admin.svg)

---

### 👥 User Management
![Users](./screenshots/users.svg)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | Email/password login, role-based access (Resident / Admin / Super Admin) |
| 📊 **Dashboard** | Live stats, Recharts area + bar charts, recent activity feed |
| 📋 **Complaints** | File, track, comment, AI auto-classification + risk scoring |
| 💡 **Suggestions** | Fully anonymous community idea box with sentiment analysis |
| 🔔 **Alerts** | Neighborhood-wide alerts with auto fan-out notifications |
| 🚨 **Emergency** | Live incident board with status progression (Reported → Resolved) |
| 💧 **Water Quality** | Zone-by-zone monitoring with WHO threshold enforcement + auto-alerts |
| 🤖 **AI Classifier** | Auto-categorises complaints using Claude claude-sonnet-4-6 |
| 💬 **Sentiment Analysis** | Detects complaint/suggestion emotional tone |
| ⚠️ **Risk Scoring** | Auto-escalates complaint priority based on 0–100 risk score |
| 🧠 **AI Chat** | Floating assistant with conversation history and quick prompts |
| 📝 **Audit Log** | Tracks all admin actions with before/after snapshots |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + ShadCN UI |
| **Database** | PostgreSQL on Neon |
| **ORM** | Prisma |
| **Auth** | NextAuth v5 (JWT) |
| **AI** | Anthropic Claude (claude-sonnet-4-6) |
| **Charts** | Recharts |
| **Deployment** | Vercel |

---

## 🚀 Quick Start

```bash
# 1. Clone & install
git clone https://github.com/avinash09-cmd/nest-app.git
cd nest-app
npm install

# 2. Set up environment
cp .env.example .env.local
# Fill in DATABASE_URL, NEXTAUTH_SECRET, ANTHROPIC_API_KEY

# 3. Set up database
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts

# 4. Run
npm run dev
```

Visit **http://localhost:3000** 🎉

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@nest.gov | Admin@123 |
| **Resident** | resident@nest.gov | Resident@123 |

---

## 🤖 AI Pipeline

Every complaint goes through a 3-step async pipeline:

```
POST /api/complaints
        ↓
POST /api/ai/classify     →  category + confidence + summary
        ↓
POST /api/ai/sentiment    →  POSITIVE / NEUTRAL / NEGATIVE + score
        ↓
POST /api/ai/risk-score   →  0–100 score, auto-escalates priority
```

All steps are **fire-and-forget** — instant response, AI enriches in background.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, Register
│   ├── (dashboard)/     # All protected pages
│   └── api/             # REST API routes
│       └── ai/          # classify / sentiment / risk-score / chat
├── components/
│   ├── ai/              # ChatAssistant widget
│   ├── layout/          # Sidebar, TopBar, MobileNav
│   └── dashboard/       # StatsCard
├── lib/
│   ├── auth.ts          # NextAuth config
│   ├── prisma.ts        # DB singleton
│   └── validations.ts   # Zod schemas
└── middleware.ts        # Route protection
```

---

## 🔒 Security

- bcrypt password hashing (cost factor 12)
- httpOnly JWT cookies
- 3-layer RBAC (middleware + layout + API)
- IDOR prevention on all queries
- Security headers (X-Frame-Options, nosniff, etc.)
- Rate limiting on anonymous suggestions
- Zod validation on all endpoints

---

## 🌐 Deploy to Vercel

1. Push to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Add env vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ANTHROPIC_API_KEY`
4. Deploy — auto-runs `prisma generate && next build`

---

<div align="center">

---

### 💙 Made with Love by Avinash Kumar Singh

*B.Tech CSE (Cyber Security & Digital Forensics) · VIT Bhopal*

[![GitHub](https://img.shields.io/badge/GitHub-avinash09--cmd-181717?style=flat-square&logo=github)](https://github.com/avinash09-cmd)

*"Building safer neighborhoods, one commit at a time."* 🛡️

---

</div>

