# Nexus OS — AI-Native Adaptive Operational Platform

## Overview

Nexus OS is a full-scale adaptive operational platform designed for car rental entrepreneurs, fully customizable for personal and professional use. It features an AI-driven workspace assistant, modular dashboards, deep car rental operational workflows, and responsive design across all devices.

## Architecture

- **Frontend**: React + TypeScript + Vite, TailwindCSS v4, shadcn/ui components, wouter routing, TanStack Query
- **Backend**: Express.js + TypeScript, session-based auth (express-session + memorystore)
- **Database**: PostgreSQL with Drizzle ORM
- **Fonts**: Inter (body) + Plus Jakarta Sans (headings)
- **Theme**: Deep-space dark aesthetic with electric purple/indigo primary, glass cards, subtle gradient backgrounds

## Key Features

- **Auth**: Sign up / login with session-based auth (30-day sessions)
- **Workspace Modes**: Rental, Personal, Professional — each seeds default dashboard modules
- **Modular Dashboard**: Grid-based layout with KPI, Fleet, Bookings, Tasks, Notes, Quick Actions, Daily Overview widgets
- **AI Assistant**: Chat-driven workspace customization, deterministic fallback mode, assistant memory
- **Command Bar**: Cmd+K palette for navigation, actions, and assistant queries
- **Fleet Management**: Full CRUD for vehicles with status tracking (available/rented/maintenance)
- **Bookings**: Create, manage, complete rentals with customer and vehicle association
- **Customers**: Contact management with license and ID tracking
- **Maintenance**: Service logging with vehicle status integration
- **Tasks**: Priority-based task management with completion tracking
- **Notes**: Quick notes with titles and categories
- **Financial Snapshot**: Revenue tracking from completed bookings
- **Settings**: Mode switching, model configuration (OpenAI/Anthropic/Google/Local), action history
- **Proactive Suggestions**: Context-aware setup and workflow suggestions

## Database Schema (PostgreSQL)

Tables: users, workspaces, modules, chat_messages, vehicles, customers, bookings, maintenance_records, tasks, notes, action_history, assistant_memory

## Project Structure

```
shared/schema.ts          — Drizzle schema + types for all tables
server/routes.ts          — All API routes (auth, CRUD, assistant, stats, suggestions)
server/storage.ts         — DatabaseStorage class implementing IStorage interface
client/src/App.tsx        — Main router with protected routes
client/src/lib/api.ts     — API client for all endpoints
client/src/lib/store.tsx  — Global state (AppStateProvider + useAppState hook)
client/src/components/layout/
  AppLayout.tsx           — Main layout with header, sidebar, chat panel
  Sidebar.tsx             — Navigation + mode switcher
  CommandBar.tsx          — Cmd+K command palette
  AssistantChat.tsx       — AI assistant chat panel
  MobileNav.tsx           — Bottom navigation for mobile
client/src/components/modules/
  ModuleRenderer.tsx      — Dynamic module type router
  KPIWidget.tsx           — Stats-driven KPI cards
  FleetWidget.tsx         — Fleet overview with utilization bar
  BookingsWidget.tsx      — Recent bookings list
  TasksWidget.tsx         — Inline task management
  NotesWidget.tsx         — Quick notes with inline add
  QuickActionsWidget.tsx  — Quick action grid
  DailyOverviewWidget.tsx — Greeting + daily summary
  GenericWidget.tsx       — Fallback widget + WidgetWrapper
client/src/pages/
  auth/AuthPage.tsx       — Login/register
  dashboard/DashboardPage.tsx — Modular dashboard grid
  fleet/FleetPage.tsx     — Vehicle management
  bookings/BookingsPage.tsx — Booking management
  customers/CustomersPage.tsx — Customer CRM
  tasks/TasksPage.tsx     — Task management
  notes/NotesPage.tsx     — Notes management
  maintenance/MaintenancePage.tsx — Service tracking
  settings/SettingsPage.tsx — Mode, model config, action history
  financial/FinancialPage.tsx — Revenue snapshot
```

## API Endpoints

- `POST /api/auth/register|login|logout`, `GET /api/auth/me`
- `PATCH /api/user/mode|preferences`
- `GET|POST /api/modules`, `PATCH|DELETE /api/modules/:id`
- `GET|POST /api/chat` (assistant with command processing)
- `GET|POST /api/vehicles|customers|bookings|maintenance|tasks|notes`, `PATCH|DELETE /:id`
- `GET /api/stats` (aggregated dashboard stats)
- `GET /api/suggestions` (proactive suggestions)
- `GET|PATCH /api/model-config`
- `GET /api/actions` (action history)

## User Preferences

- Passwords stored as plaintext (demo only)
- Sessions persist 30 days
- Mode switching reseeds all dashboard modules
- Assistant works without AI model via deterministic command processing
