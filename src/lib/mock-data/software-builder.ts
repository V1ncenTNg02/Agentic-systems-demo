export interface AppArchetype {
  name: string;
  supervisorPlan: string;
  frontend: { deliverable: string };
  backend: { deliverable: string };
  database: { deliverable: string };
  infra: { deliverable: string };
  summary: string;
}

const ARCHETYPES: Record<string, AppArchetype> = {
  'task-manager': {
    name: 'Task Management App',
    supervisorPlan: `Requirements analysis complete. Breaking into 4 workstreams:

1. FRONTEND — React SPA with auth flows, task board (drag-and-drop), real-time sync, team panel
2. BACKEND — REST API + WebSocket server, JWT auth, task/user/team endpoints
3. DATABASE — PostgreSQL schema (users, tasks, teams, memberships), Redis session cache
4. INFRA — Docker + AWS ECS, RDS, ElastiCache, GitHub Actions CI/CD

Assigning to specialist agents now…`,
    frontend: { deliverable: `✅ FRONTEND COMPLETE
Stack: React 18 + TypeScript + Zustand + TanStack Query
Components: AuthProvider, TaskBoard (drag via @dnd-kit), WebSocketProvider, TeamPanel, NotificationBadge
Pages: Login, Register, Dashboard, Board, Team, Settings (6 pages)
Real-time: WebSocket client with optimistic updates and reconnect logic
Bundle: 148KB gzipped` },
    backend: { deliverable: `✅ BACKEND COMPLETE
Stack: Node.js + Express + TypeScript + Zod
Endpoints: 24 REST routes (tasks CRUD, users, teams, invitations, notifications)
Auth: JWT + refresh tokens, bcrypt password hashing, rate limiting (100 req/min)
WebSocket: Socket.io rooms per workspace, presence tracking
Test coverage: 87%` },
    database: { deliverable: `✅ DATABASE COMPLETE
Tables: users, tasks, teams, memberships, task_assignments, audit_log (6 tables)
Indexes: 16 indexes optimised for dashboard query patterns
Views: team_task_summary, user_workload_report (2 materialised views)
Cache: Redis session store (24h TTL), task list cache (5min TTL)
Migrations: 8 migration files, rollback scripts included` },
    infra: { deliverable: `✅ INFRASTRUCTURE COMPLETE
Containerisation: Multi-stage Dockerfile, images <180MB
Orchestration: AWS ECS Fargate with auto-scaling (2–10 tasks)
Database: RDS PostgreSQL Multi-AZ (db.t3.medium)
Cache: ElastiCache Redis cluster (cache.t3.micro)
CI/CD: GitHub Actions — lint → test → build → deploy to ECS
Estimated monthly cost: ~$285` },
    summary: `🚀 TASK MANAGEMENT APP — BUILD COMPLETE

Frontend:  React 18 SPA · 6 pages · real-time WebSocket · 148KB bundle
Backend:   24 REST endpoints · JWT auth · Socket.io · 87% test coverage
Database:  6 tables · 16 indexes · Redis cache · 8 migrations
Infra:     ECS Fargate · RDS Multi-AZ · ElastiCache · GitHub Actions CI/CD

Estimated timeline: 6 weeks (4 engineers)
Monthly infra cost: ~$285
Recommended next step: User acceptance testing with 5 pilot teams`,
  },
  'ecommerce': {
    name: 'E-Commerce Platform',
    supervisorPlan: `Requirements analysis complete. Breaking into 4 workstreams:

1. FRONTEND — Next.js storefront, product catalogue, cart, checkout, order tracking
2. BACKEND — Product/order/payment APIs, Stripe integration, inventory management
3. DATABASE — PostgreSQL (products, orders, customers, inventory), Elasticsearch for search
4. INFRA — Vercel (frontend), Railway (backend), managed Postgres, CDN for assets

Assigning to specialist agents now…`,
    frontend: { deliverable: `✅ FRONTEND COMPLETE
Stack: Next.js 14 + TypeScript + Tailwind + Zustand (cart state)
Pages: Home, Catalogue, Product Detail, Cart, Checkout, Order Confirmation, Account (7 pages)
Features: Server-side rendering for SEO, image optimisation, mobile-responsive
Payment UI: Stripe Elements integrated, 3D Secure supported
Performance: LCP < 2.1s, CLS < 0.1` },
    backend: { deliverable: `✅ BACKEND COMPLETE
Stack: Node.js + Fastify + TypeScript
Endpoints: 31 routes (products, orders, payments, customers, inventory, webhooks)
Payments: Stripe integration with webhook verification, refund handling
Inventory: Real-time stock tracking with optimistic locking to prevent oversell
Email: Transactional emails via Resend (order confirmation, shipping updates)` },
    database: { deliverable: `✅ DATABASE COMPLETE
Tables: products, product_variants, orders, order_items, customers, inventory, reviews (7 tables)
Search: Elasticsearch index for full-text product search with faceted filtering
Cache: Redis for session cart, product catalogue (10min TTL)
Analytics: Read replica for reporting queries` },
    infra: { deliverable: `✅ INFRASTRUCTURE COMPLETE
Frontend: Vercel deployment with edge caching
Backend: Railway (auto-scaling containers)
Database: Railway managed Postgres + Redis
Assets: Cloudflare CDN for product images
Monitoring: Sentry for errors, Vercel Analytics for Web Vitals
Estimated monthly cost: ~$190` },
    summary: `🚀 E-COMMERCE PLATFORM — BUILD COMPLETE

Frontend:  Next.js 14 SSR · 7 pages · Stripe Elements · LCP < 2.1s
Backend:   31 endpoints · Stripe payments · inventory lock · email notifications
Database:  7 tables · Elasticsearch search · Redis cart cache · read replica
Infra:     Vercel + Railway + Cloudflare CDN · monitoring via Sentry

Estimated timeline: 8 weeks (4 engineers)
Monthly infra cost: ~$190`,
  },
};

export function getAppArchetype(input: string): AppArchetype {
  const lower = input.toLowerCase();
  if (lower.includes('task') || lower.includes('todo') || lower.includes('project management')) return ARCHETYPES['task-manager'];
  if (lower.includes('ecommerce') || lower.includes('shop') || lower.includes('store') || lower.includes('product')) return ARCHETYPES['ecommerce'];
  return ARCHETYPES['task-manager'];
}
