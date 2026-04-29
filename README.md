# 問題清單總表平台 / Issue Tracking Platform

A multi-department issue tracking platform for OP / PE / PC / Sales etc.
Departments raise issues against an order (product + MO number + content +
images), assign a responsible department, and the rest of the company sees
them in real time. Once resolved, issues move to the History page with a
timestamp.

## Features

- 帳號登入（管理員建立）：每筆操作都記錄是誰做的
- 新增問題：產品名稱、MO 號碼、問題內容、多張圖片、優先等級、指定處理部門
- 自動產生問題編號（如 `Q-20260428-0001`）
- 即時清單：使用者可開／關自動更新並調整秒數，預設值由管理員設定
- 狀態流轉：待處理 → 處理中 → 待確認 → 已完成
- 留言／回覆：所有部門可在問題下方對話，並標記作者與時間
- 歷史紀錄頁：完成後自動歸檔，附完成時間
- 篩選與搜尋：依部門、狀態、優先等級、關鍵字（產品 / MO / 內容 / 編號）
- 管理後台：使用者、部門（皆可自行新增 / 停用）、自動更新秒數設定
- 多語介面：繁體中文 / English（每位使用者各自的偏好）

## Tech stack

- Next.js 14 (App Router) + TypeScript
- TailwindCSS
- Prisma + SQLite（雲端起步用；之後可改 PostgreSQL / MySQL）
- NextAuth.js（Credentials provider，bcrypt 雜湊密碼）

## Quick start

```bash
# 1) Install
npm install

# 2) Initialize database (creates ./prisma/dev.db)
npx prisma migrate dev --name init

# 3) Seed default admin and departments (OP / PE / PC / SALES)
npm run prisma:seed

# 4) Start dev server
npm run dev
```

Then open <http://localhost:3000> and sign in with the seeded admin
(default: `admin / admin123`, configurable via `.env`).

## Environment

Copy `.env.example` to `.env` and adjust:

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="change-me-to-a-long-random-string"
NEXTAUTH_URL="http://localhost:3000"
SEED_ADMIN_USERNAME="admin"
SEED_ADMIN_PASSWORD="admin123"
```

### Switching database when moving to the company intranet

In `prisma/schema.prisma` change the datasource block:

```prisma
datasource db {
  provider = "postgresql"  // or "mysql"
  url      = env("DATABASE_URL")
}
```

…then update `DATABASE_URL` and run `npx prisma migrate deploy`.
No application code change is needed.

## Project layout

```
prisma/
  schema.prisma            # data model
  seed.ts                  # default admin + OP/PE/PC/SALES departments
src/
  app/
    api/                   # REST endpoints (issues, comments, users, ...)
    login/                 # sign-in page
    issues/[id]/           # issue detail
    issues/new/            # create issue
    history/               # archived issues
    admin/                 # admin panel (users / depts / settings)
    page.tsx               # active issue list
  components/              # client components
  lib/
    auth.ts                # NextAuth config
    prisma.ts              # Prisma singleton
    i18n.ts                # zh-TW / en dictionaries
    utils.ts               # helpers + constants
  middleware.ts            # protects all non-/login routes
public/uploads/            # uploaded images
```

## Default seed data

- Admin user: `admin / admin123`
- Departments: `OP`（生產）, `PE`（製程工程）, `PC`（生管）, `SALES`（業務）
- Auto-refresh interval: 5 seconds
