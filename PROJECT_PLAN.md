# CampusCycle — Master Technical Project Plan & Implementation Blueprint
**Google Gemini Hackathon | Track: Industry & Innovation**  
**Team: Codebreak Crew**  
**Document Status: Active Master Reference**  
**Last Updated: 2026-10-23**

---

## Document Status & Verification Notice

> [!IMPORTANT]
> **Authoritative Source Verification Status:**
> - **`PROJECT_PLAN.md`:** **Verified present** in project root (`/PROJECT_PLAN.md`). Primary source of truth for technical architecture, database schemas, and implementation roadmap.
> - **`AGENTS.md`:** **Verified present** in project root (`/AGENTS.md`). Authoritative operating manual for AI coding assistants.
> - **Original Presentation Pitch Deck (`.pptx` / `.pdf`):** **Unavailable as a physical file** in the local workspace. Its feature commitments are recorded authoritatively in Section 2 of this plan.
> - **Official Hackathon Schedule PDF:** **Unavailable as a physical file** in the local workspace. Its milestone timeline (5 hours net hacking across 3 phases) is recorded in Section 13.
> - **Application Source Code (`/frontend`, `/backend`):** **Physically verified**. Clean baseline; no frontend or backend application code has been generated yet.
> - **Status Tags:** Every component in this plan is explicitly tagged as `PLANNED`, `IMPLEMENTED`, `TESTED`, or `DEPLOYED`. At present, all deliverables are `PLANNED`. Nothing is implemented merely because it appears in this plan.

---

## Table of Contents
1. [Project Overview, Problem, Solution & Objectives](#1-project-overview-problem-solution--objectives)
2. [PPT Feature Inventory & Non-Negotiable Requirements](#2-ppt-feature-inventory--non-negotiable-requirements)
3. [Scope & Priorities: Hackathon MVP vs. Future Scope](#3-scope--priorities-hackathon-mvp-vs-future-scope)
4. [Technology Stack, Tooling & Technical Rationale](#4-technology-stack-tooling--technical-rationale)
5. [System Architecture & End-to-End Data Flow](#5-system-architecture--end-to-end-data-flow)
6. [Frontend Architecture, Pages & Teammate Responsibilities](#6-frontend-architecture-pages--teammate-responsibilities)
7. [Backend Architecture, Directory Structure & Responsibilities](#7-backend-architecture-directory-structure--responsibilities)
8. [Firebase Firestore Database Schema & Sample Documents](#8-firebase-firestore-database-schema--sample-documents)
9. [Authentication, Authorization & Storage Security Rules](#9-authentication-authorization--storage-security-rules)
10. [REST API Contracts (Proposed Specification)](#10-rest-api-contracts-proposed-specification)
11. [Rental Lifecycle, Concurrency & Deterministic Pricing Engine](#11-rental-lifecycle-concurrency--deterministic-pricing-engine)
12. [Google Gemini AI Integration, Prompt Strategy & Fallback Engine](#12-google-gemini-ai-integration-prompt-strategy--fallback-engine)
13. [Official Hackathon Schedule vs. Internal Execution Timeline](#13-official-hackathon-schedule-vs-internal-execution-timeline)
14. [Team Workflow, Git Strategy & Integration Protocol](#14-team-workflow-git-strategy--integration-protocol)
15. [Step-by-Step Implementation Roadmap](#15-step-by-step-implementation-roadmap)
16. [Comprehensive Testing Matrix & Live 3-Minute Demo Script](#16-comprehensive-testing-matrix--live-3-minute-demo-script)
17. [Deployment Checklist & Environment Variable Directory](#17-deployment-checklist--environment-variable-directory)
18. [Risk Assessment, Mitigation Strategies & Future Scope](#18-risk-assessment-mitigation-strategies--future-scope)
19. [Chronological Planning Decision Log (Q1–Q39)](#19-chronological-planning-decision-log-q1q39)
20. [Progress Tracking Matrix, Change Log & Decision Template](#20-progress-tracking-matrix-change-log--decision-template)
21. [Guidelines for Teammates & Antigravity IDE Agents](#21-guidelines-for-teammates--antigravity-ide-agents)

---

## 1. Project Overview, Problem, Solution & Objectives

### 1.1 Problem Statement
In university and college environments, students repeatedly experience high friction and financial strain purchasing high-cost, short-duration utility items. Examples include:
- **Academic Tools:** Graphing/scientific calculators (e.g., Casio fx-991, TI-84) needed only during specific semesters or examination weeks.
- **Laboratory Essentials:** White lab coats, safety goggles, and dissecting kits required exclusively for one-semester lab courses.
- **Formal Attire & Event Gear:** Blazers, formal suits, and ethnic wear required for placement drives, academic conferences, and viva voce presentations.
- **Specialized Project Hardware:** Arduino/Raspberry Pi developer boards, sensors, drafting kits, and DSLR cameras for club events.

Purchasing these items new imposes an unnecessary economic burden on students. Simultaneously, senior students and alumni store these exact items unused in campus hostels, creating clutter and eventual electronic/textile waste. No structured, safe, campus-centric medium exists for students to rent these goods peer-to-peer on flexible terms.

### 1.2 Proposed Solution: CampusCycle
**CampusCycle** is an intelligent, AI-powered peer-to-peer campus rental ecosystem. It allows university students to list dormant items for rent and borrow required academic/campus gear from trusted peers within their college campus. 

Integrated with **Google Gemini AI**, CampusCycle elevates the rental experience by:
1. **Intelligent Natural-Language Recommendations:** Allowing students to express unstandardized needs (e.g., *"I have a fluid mechanics lab tomorrow and need safety equipment under ₹100 for two days"*) and grounding responses strictly in verified, available campus inventory.
2. **AI-Powered Item Listing & Categorization:** Eliminating seller friction by transforming rough student notes into structured, compelling listings with automated category assignment.

### 1.3 Core Project Objectives
- **End-to-End Rental Loop:** Deliver a complete, seamless lifecycle: listing creation $\rightarrow$ multi-faceted search $\rightarrow$ date-based reservation request $\rightarrow$ owner approval/rejection $\rightarrow$ active lease $\rightarrow$ physical return confirmation.
- **Grounded AI Utility:** Implement Google Gemini as a functional, grounded assistant that never hallucinates prices or phantom inventory.
- **Data Integrity & Concurrency Safety:** Enforce deterministic pricing calculations and strict calendar overlap prevention so no physical item can be double-booked.
- **Production-Ready Delivery:** Deploy a secure, high-contrast, responsive React application on Firebase Hosting connected to a Node.js/Express backend on Render, ready for live judging.

---

## 2. PPT Feature Inventory & Non-Negotiable Requirements

The hackathon pitch deck (PPT) is the authoritative contract for promised deliverables. Every feature listed below is non-negotiable and must be functional for the final evaluation.

| # | PPT Promised Feature | Description & Technical Acceptance Criteria | Status |
|---|---|---|---|
| **F-01** | **Student Accounts & Profiles** | Single student account model enabling both borrowing and lending under a single account. Firebase Auth-backed profile storing UID, name, email, and photo. | `PLANNED` |
| **F-02** | **Rich Item Listings** | Title, category, rich description, photos (Firebase Storage URLs), pickup location, pricing model (daily/weekly/monthly), and explicit availability calendar window. | `PLANNED` |
| **F-03** | **Search & Multi-Filter Engine** | Real-time filtering by category, maximum budget, desired rental duration, and date availability. | `PLANNED` |
| **F-04** | **Date-Based Rental Requests** | Renters choose exact start and end dates. Total calculated automatically on the backend. Status tracked via `pending`. | `PLANNED` |
| **F-05** | **Owner Approval & Lifecycle Control** | Listing owners review incoming requests in a dashboard and approve/reject. Approval locks calendar window. | `PLANNED` |
| **F-06** | **Return Lifecycle Tracking** | Progression: `pending` $\rightarrow$ `approved` $\rightarrow$ `active` (when start date arrives) $\rightarrow$ `returned` (confirmed by owner upon physical handover). | `PLANNED` |
| **F-07** | **Gemini Natural-Language Recommender** | Gemini API ranks real Firestore inventory against conversational student prompts; backend verifies returned IDs before sending to UI. | `PLANNED` |
| **F-08** | **Gemini Assisted Description & Categorization** | Lender inputs basic bullet points; Gemini drafts an attractive description and infers the correct catalog category. | `PLANNED` |
| **F-09** | **Responsive UI & Live Demonstration** | Mobile-responsive, high-contrast modern UI built with React + Tailwind CSS with seeded campus inventory for live judging. | `PLANNED` |

---

## 3. Scope & Priorities: Hackathon MVP vs. Future Scope

To ensure successful delivery within the **5-hour build window**, features are strictly partitioned into **In-Scope (MVP)** and **Future Scope (Post-Hackathon)**.

```mermaid
pie title Hackathon Feature Focus Allocation
    "Core Rental Workflow & Calendar Conflict Prevention" : 40
    "Firebase Auth, Firestore Schema & Storage" : 20
    "Gemini AI Recommendations & Descriptions" : 20
    "Frontend Polish & Search/Filter UI" : 15
    "Deployment & Seed Data Verification" : 5
```

### 3.1 In-Scope (Hackathon MVP — High Priority)
1. **Unified Authentication:** Firebase Authentication (Email/Password or Google Sign-In) with backend JWT token verification via Firebase Admin SDK.
2. **Item Management:** Create listings with photo upload (Firebase Storage), edit listing details, browse catalog, search and filter.
3. **Rental Booking Engine:** Date selection, conflict detection algorithm, pricing calculation (daily/weekly/monthly), booking request creation.
4. **Owner Dashboard ("My Rentals"):** Segregated into *Borrowing* (requests made by the student) and *Lending* (incoming requests for the student's items).
5. **Item Lifecycle Actions:** Approve, Reject, and Mark Returned.
6. **Gemini Features:**
   - Semantic natural-language search grounded in real Firestore items.
   - Listing description generator with automated category classification.
   - Resilient fallback mechanism when AI limits are hit.
7. **Production Deployment:** Backend deployed on Render, frontend deployed on Firebase Hosting.

### 3.2 Out-of-Scope (Future Enhancements — Low Priority)
- **Payment Gateway Integration:** Payment will be handled via physical cash/UPI at pickup during the demo to avoid payment gateway KYC delays.
- **Security Deposit Escrow:** Digital wallet holds and damage claim arbitration.
- **Real-Time WebSockets Chat:** In-app messaging is deferred; campus pickup location and student contact details serve as coordination points.
- **Institutional SSO Enforcement:** Restricting accounts strictly to `@college.edu` domains (mocked/noted for future scope).
- **Multi-Campus Scaling:** Cross-college federation and shipping options.
- **Peer Ratings & Reviews:** Qualitative reviews and karma badges.

---

## 4. Technology Stack, Tooling & Technical Rationale

| Layer | Selected Technology | Version / Spec | Primary Owner | Architectural Rationale |
|---|---|---|---|---|
| **Frontend** | React.js | `^18.3.0` | Frontend Teammate | Industry-standard declarative component architecture; large ecosystem for UI widgets. |
| **Language (FE)** | TypeScript | `^5.5.0` | Frontend Teammate | Strict typing eliminates runtime prop/type bugs across API boundaries. |
| **Styling** | Tailwind CSS | `^3.4.0` | Frontend Teammate | Rapid utility-first styling; responsive layouts without CSS bloat. |
| **Icons** | Lucide React | `^0.400.0` | Frontend Teammate | Clean, modern iconography for student UI. |
| **Backend** | Node.js / Express.js | `Node 20 LTS / Express ^4.19.0` | Backend Teammate | Lightweight, flexible, fast REST API execution; seamless TypeScript support. |
| **Database** | Firebase Firestore | NoSQL Cloud Database | Backend Teammate | Final decision over Supabase. Google ecosystem synergy, zero-config Firebase Admin SDK, real-time potential. |
| **Authentication** | Firebase Authentication | Client SDK + Admin SDK | Both Teammates | Client handles token issuance; Express backend verifies token signature on every protected route. |
| **Object Storage** | Firebase Storage | Cloud Storage for Firebase | Frontend / Backend | Direct client-to-bucket photo uploads via signed security rules; URLs saved in Firestore. |
| **AI Engine** | Google Gemini API | `gemini-1.5-flash` (`@google/genai` or `@google/generative-ai`) | Backend Teammate | Sub-second latency, structured JSON output mode, generous free tier for hackathon demos. Verified accessible. |
| **Hosting (FE)** | Firebase Hosting | Global CDN | Frontend Teammate | Low-latency static asset delivery, seamless rewrite rules for single-page applications (SPA). |
| **Hosting (BE)** | Render | Web Service (Linux) | Backend Teammate | Simple deployment from GitHub repository, free/affordable SSL, environment variable management. |
| **Tooling** | Google AI Studio, Antigravity IDE, GitHub | Latest | All Teammates | Fast prompt prototyping, automated task verification, pair programming. |

### Database Platform Decision: Firestore vs. Supabase
- **Final Decision:** **Firebase Firestore**.
- **Rationale:** 
  1. Deep integration with Firebase Authentication and Firebase Storage within a single Google Cloud project.
  2. The Google Gemini Hackathon context prioritizes Google ecosystem technologies.
  3. Firebase Admin SDK provides native server-side privileges without requiring external connection pooling libraries.

---

## 5. System Architecture & End-to-End Data Flow

### 5.1 High-Level Architectural Diagram
```mermaid
graph TD
    subgraph Client ["Client Browser (Frontend SPA)"]
        UI["React 18 + Tailwind CSS"]
        AuthClient["Firebase Auth Client SDK"]
        StorageClient["Firebase Storage Client SDK"]
    end

    subgraph CDN ["Firebase Hosting"]
        StaticAssets["SPA Static Bundle (index.html, JS, CSS)"]
    end

    subgraph BackendServer ["Render Cloud (Backend REST API)"]
        Express["Express.js Server"]
        AuthMiddleware["verifyAuth Middleware (Firebase Admin)"]
        ItemsRouter["/api/items"]
        RentalsRouter["/api/rentals"]
        AIRouter["/api/ai"]
        ConflictEngine["Date Overlap & Pricing Engine"]
    end

    subgraph GoogleCloud ["Google Cloud / Firebase Ecosystem"]
        FirebaseAuth["Firebase Authentication"]
        CloudStorage["Firebase Cloud Storage (Item Photos)"]
        FirestoreDB[("Firebase Firestore Database")]
        GeminiAPI["Google Gemini 1.5 Flash API"]
    end

    UI --> StaticAssets
    UI --> AuthClient
    AuthClient -->|1. Sign in / Get ID Token| FirebaseAuth
    UI --> StorageClient
    StorageClient -->|2. Direct Photo Upload| CloudStorage
    
    UI -->|3. API Request + Bearer Token| Express
    Express --> AuthMiddleware
    AuthMiddleware -->|4. Verify Token Signature| FirebaseAuth
    
    Express --> ItemsRouter
    Express --> RentalsRouter
    Express --> AIRouter

    ItemsRouter --> FirestoreDB
    RentalsRouter --> ConflictEngine
    ConflictEngine --> FirestoreDB

    AIRouter -->|5. Fetch Active Listings| FirestoreDB
    AIRouter -->|6. Grounded Prompt with Items Catalog| GeminiAPI
    GeminiAPI -->|7. Structured Recommendations| AIRouter
    AIRouter -->|8. Verify Item IDs & Sanitize| Express
```

### 5.2 End-to-End Data Flows

#### Flow A: AI-Assisted Item Listing Creation
1. **Lender Input:** Owner fills in basic fields (Title, approximate specs, pricing model, rate, available dates, pickup location).
2. **AI Assistance (Optional):** Owner clicks *"Generate Description with Gemini"*. Frontend dispatches `POST /api/ai/description` with raw points.
3. **Gemini Ingestion:** Backend formats points into an instruction prompt; Gemini returns a polished markdown description and predicted category.
4. **Review & Edit:** Owner inspects AI draft in UI, modifies if desired before publishing.
5. **Photo Upload:** Frontend uploads selected photos directly to Firebase Storage (`/items/{uid}/{timestamp}_{filename}.jpg`) and obtains public download URLs.
6. **Persistence:** Frontend dispatches `POST /api/items` with payload including image URLs and auth token. Backend validates data and writes document to `items/{itemId}`.

#### Flow B: Grounded Gemini Recommendation Flow
```mermaid
sequenceDiagram
    autonumber
    actor Student as Student Renter
    participant FE as React Frontend
    participant BE as Express Backend (/api/ai/recommendations)
    participant FS as Firestore DB
    participant AI as Google Gemini 1.5 Flash

    Student->>FE: Types: "Need a scientific calculator for math exam under ₹100 for 2 days"
    FE->>BE: POST /api/ai/recommendations { query, maxBudget: 100, durationDays: 2 }
    BE->>FS: Query items where isAvailable == true
    FS-->>BE: Returns candidate listings (id, title, category, price, description)
    alt Candidates found
        BE->>AI: System prompt + User query + JSON Catalog context
        AI-->>BE: Returns JSON array of { itemId, reason, confidenceScore }
        BE->>BE: Verification: Filter out any itemId NOT in active candidates
        BE-->>FE: 200 OK { success: true, data: { recommendations: [...itemsWithReasons], fallback: false } }
    else No items match or Gemini API error
        BE->>BE: Fallback to keyword matching (regex on title/category)
        BE-->>FE: 200 OK { success: true, data: { recommendations: [...fallbackItems], fallback: true } }
    end
    FE->>Student: Displays ranked, clickable item cards with AI match explanation
```

#### Flow C: Rental Request, Approval & Return Flow
```mermaid
sequenceDiagram
    autonumber
    actor Renter as Student Renter
    actor Owner as Item Owner
    participant FE as React Frontend
    participant BE as Express Backend
    participant FS as Firestore DB

    Renter->>FE: Selects dates (e.g., Oct 25 - Oct 27) on Item Page
    FE->>BE: POST /api/rentals { itemId, startDate, endDate }
    BE->>FS: Check for overlapping requests where status IN ['approved', 'active']
    alt Overlap exists
        BE-->>FE: 409 Conflict { code: "CALENDAR_CONFLICT", message: "Item is already booked for these dates." }
    else Available
        BE->>BE: Calculate total price using pricing model
        BE->>FS: Create doc in rentalRequests with status: "pending"
        BE-->>FE: 201 Created { requestId, totalPrice, status: "pending" }
    end

    Owner->>FE: Opens "My Rentals" -> Lending Tab
    FE->>BE: GET /api/rentals/my
    BE-->>FE: Returns { lending: [pendingRequest], borrowing: [] }
    Owner->>FE: Clicks "Approve"
    FE->>BE: PATCH /api/rentals/:id/status { status: "approved" }
    BE->>FS: Run transaction: verify no newly approved overlap; update status to "approved"
    BE-->>FE: 200 OK { status: "approved" }

    Note over Renter, Owner: When today >= startDate, effective status evaluates to 'active'.
    Note over Owner: After physical item is returned on campus:
    Owner->>FE: Clicks "Mark Returned"
    FE->>BE: PATCH /api/rentals/:id/return
    BE->>FS: Update status to "returned", set returnedAt = now
    BE-->>FE: 200 OK { status: "returned" }
```

---

## 6. Frontend Architecture, Pages & Teammate Responsibilities

### 6.1 Frontend Directory Structure
```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/               # Logos, static illustrations
│   ├── components/           # Reusable UI components
│   │   ├── common/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── items/
│   │   │   ├── ItemCard.tsx
│   │   │   ├── ItemGrid.tsx
│   │   │   ├── FilterSidebar.tsx
│   │   │   └── PhotoUploader.tsx
│   │   ├── rentals/
│   │   │   ├── DateRangePicker.tsx
│   │   │   ├── RentalRequestModal.tsx
│   │   │   ├── BorrowingCard.tsx
│   │   │   └── LendingCard.tsx
│   │   └── ai/
│   │       ├── AIChatSearchModal.tsx
│   │       └── AIDescriptionGenerator.tsx
│   ├── context/              # Global React Context
│   │   ├── AuthContext.tsx   # Firebase user session & ID token management
│   │   └── ToastContext.tsx  # Global notification banners
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useItems.ts
│   │   └── useRentals.ts
│   ├── pages/                # Route Views
│   │   ├── HomePage.tsx      # Landing hero, search bar, category shortcuts
│   │   ├── ExplorePage.tsx   # Catalog with search, filters, and sorting
│   │   ├── ItemDetailPage.tsx# Photo gallery, specs, date picker, request CTA
│   │   ├── CreateItemPage.tsx# Listing creation with AI description button
│   │   ├── MyRentalsPage.tsx # Segmented dashboard (Borrowing vs. Lending)
│   │   └── LoginPage.tsx     # Student login / registration modal/page
│   ├── services/             # Backend API client calls
│   │   ├── api.ts            # Axios / Fetch client with token interceptor
│   │   ├── itemService.ts
│   │   ├── rentalService.ts
│   │   └── aiService.ts
│   ├── types/                # Shared TypeScript definitions
│   │   ├── item.ts
│   │   ├── rental.ts
│   │   └── user.ts
│   ├── utils/                # Date formatting, price calculators
│   │   └── dateUtils.ts
│   ├── App.tsx               # React Router layout & route definitions
│   ├── index.css             # Tailwind directives & custom design tokens
│   └── main.tsx              # DOM entry point
├── .env.example
├── firebase.json             # Firebase Hosting rewrite rules
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

### 6.2 Key Pages & Component Specifications

| Page | Route | Purpose & Key Features | Primary Owner |
|---|---|---|---|
| **Landing Page** | `/` | Hero section, value proposition, quick-category chips (Calculators, Lab Coats, Blazers, Tech), featured listings carousel, quick AI search launcher. | Frontend Teammate |
| **Explore / Catalog** | `/items` | Search bar with debounce, multi-filter sidebar (Category, Max Price, Duration, Availability), sort dropdown (Price Low-High, Newest), responsive item grid. | Frontend Teammate |
| **Item Details** | `/items/:id` | Photo carousel, owner metadata, pickup location badge, pricing model breakdown, interactive date range selector with instant dynamic price calculation, "Request Rental" action button. | Frontend Teammate |
| **Create Listing** | `/items/new` | Multi-image dropzone with preview, title, category picker, pricing model radio (daily/weekly/monthly), rate input, pickup location, date boundaries. Includes an *"AI Generate"* modal for auto-drafting description and category. | Frontend Teammate |
| **My Rentals Dashboard** | `/my-rentals` | Two primary tabs: <br>1. **Borrowing:** List of sent rental requests, status badges (`pending`, `approved`, `active`, `returned`, `rejected`), cancel button for pending requests. <br>2. **Lending:** List of user's listed items, incoming pending requests with Approve/Reject buttons, active rentals with "Mark Returned" action. | Frontend Teammate |
| **Auth / Login** | `/login` | High-contrast login/signup modal with email/password and Google Sign-In options. Automatically sets AuthContext. | Frontend Teammate |

---

## 7. Backend Architecture, Directory Structure & Responsibilities

### 7.1 Backend Directory Structure
```
backend/
├── src/
│   ├── config/
│   │   ├── env.ts                   # Validated environment variables (Zod/dotenv)
│   │   ├── firebaseAdmin.ts         # Firebase Admin SDK initialization
│   │   └── gemini.ts                # Google Gemini AI client instance
│   ├── controllers/
│   │   ├── items.controller.ts      # List, get, create, update items
│   │   ├── rentals.controller.ts    # Create request, list my, update status, return
│   │   ├── ai.controller.ts         # Recommendations and description generation
│   │   └── health.controller.ts     # Health check & uptime
│   ├── middleware/
│   │   ├── auth.middleware.ts       # Firebase ID token validation (verifyAuth)
│   │   ├── validate.middleware.ts   # Request body & query parameter schema validation
│   │   └── error.middleware.ts      # Global centralized error handler
│   ├── routes/
│   │   ├── items.routes.ts          # /api/items endpoints
│   │   ├── rentals.routes.ts        # /api/rentals endpoints
│   │   ├── ai.routes.ts             # /api/ai endpoints
│   │   └── health.routes.ts         # /api/health endpoint
│   ├── services/
│   │   ├── items.service.ts         # Firestore CRUD logic for items collection
│   │   ├── rentals.service.ts       # Rental request creation, status updates, returns
│   │   ├── pricing.service.ts       # Mathematical price calculation logic
│   │   ├── conflict.service.ts      # Calendar interval overlap detection & transactions
│   │   └── gemini.service.ts        # Gemini API prompt building, calls, and fallback
│   ├── types/
│   │   ├── express.d.ts             # Augment Express Request with req.user
│   │   ├── item.types.ts            # Item interfaces & schemas
│   │   └── rental.types.ts          # Rental request interfaces & schemas
│   ├── utils/
│   │   ├── apiResponse.ts           # Standardized JSON response helper
│   │   └── dateUtils.ts             # Date parser and comparison utilities
│   ├── app.ts                       # Express app configuration (CORS, JSON, routes)
│   └── server.ts                    # Server listener entry point
├── .env.example
├── package.json
├── tsconfig.json
└── render.yaml                      # Optional Render blueprint
```

### 7.2 Backend Responsibilities & Principles
- **No Direct Database Writes from Frontend:** Client never updates Firestore rental statuses directly; all mutations occur via Express endpoints enforcing permission rules and validation.
- **Server-Side Pricing Authority:** Rental totals are computed strictly on the backend based on start/end dates and the item's stored pricing model. The client never supplies `totalPrice`.
- **Atomic Operations for Concurrency:** Approvals execute strictly inside Firestore transactions (`runTransaction`) to eliminate double-booking race conditions.

---

## 8. Firebase Firestore Database Schema & Sample Documents

The database consists of three top-level collections: `users`, `items`, and `rentalRequests`.

```mermaid
erDiagram
    USERS ||--o{ ITEMS : "owns/lists"
    USERS ||--o{ RENTAL_REQUESTS : "rents (as renter)"
    ITEMS ||--o{ RENTAL_REQUESTS : "is requested for"

    USERS {
        string uid PK
        string name
        string email
        string photoURL
        timestamp createdAt
    }

    ITEMS {
        string itemId PK
        string ownerId FK
        string title
        string category
        string description
        string_array photoURLs
        string pricingModel "daily | weekly | monthly"
        number rentalPrice
        string availableFrom "YYYY-MM-DD"
        string availableTo "YYYY-MM-DD"
        string pickupLocation
        boolean isAvailable
        timestamp createdAt
        timestamp updatedAt
    }

    RENTAL_REQUESTS {
        string requestId PK
        string itemId FK
        string renterId FK
        string ownerId FK
        string startDate "YYYY-MM-DD"
        string endDate "YYYY-MM-DD"
        string pricingModel
        number pricePerPeriod
        number totalPrice
        string status "pending | approved | active | returned | rejected | cancelled"
        timestamp createdAt
        timestamp updatedAt
        timestamp approvedAt
        timestamp returnedAt
    }
```

### 8.1 Collection Specifications

#### Collection 1: `users`
- **Document ID:** Firebase Auth `uid` (`users/{uid}`)
- **Security:** Created automatically on first login. Readable by authenticated users; writable only by the account owner.

| Field | Type | Description |
|---|---|---|
| `uid` | `string` | Unique identifier from Firebase Authentication. |
| `name` | `string` | Display name of student (e.g., "Priya Patel"). |
| `email` | `string` | Student email address. |
| `photoURL` | `string` | Optional avatar image URL. |
| `createdAt` | `timestamp` | Timestamp when user record was initialized. |

#### Collection 2: `items`
- **Document ID:** Auto-generated Firestore ID (`items/{itemId}`)
- **Security:** Public read. Create requires valid Auth. Update/delete restricted to `ownerId == req.user.uid`.

| Field | Type | Description |
|---|---|---|
| `itemId` | `string` | Unique document ID. |
| `ownerId` | `string` | `uid` of the student who listed the item. |
| `title` | `string` | Name of the equipment (e.g., "Casio fx-991EX ClassWiz Calculator"). |
| `category` | `string` | Enum: `Calculators`, `Lab Gear`, `Formal Wear`, `Textbooks & Notes`, `Tech & Electronics`, `Other`. |
| `description` | `string` | Detailed description of condition, specifications, and terms. |
| `photoURLs` | `array<string>` | List of public Firebase Storage URLs. |
| `pricingModel` | `string` | Enum: `"daily"`, `"weekly"`, `"monthly"`. |
| `rentalPrice` | `number` | Rate in INR (₹) $> 0$ corresponding to the `pricingModel`. |
| `availableFrom`| `string` | ISO Date string (`YYYY-MM-DD`) earliest rental start. |
| `availableTo`  | `string` | ISO Date string (`YYYY-MM-DD`) latest rental return. |
| `pickupLocation` | `string` | Physical meeting spot (e.g., "Hostel 4 Common Room"). |
| `isAvailable`  | `boolean`| Master toggle by owner to deactivate listing. |
| `createdAt`    | `timestamp`| Document creation timestamp. |
| `updatedAt`    | `timestamp`| Last modification timestamp. |

#### Collection 3: `rentalRequests`
- **Document ID:** Auto-generated Firestore ID (`rentalRequests/{requestId}`)
- **Security:** Read restricted to `renterId == req.user.uid` OR `ownerId == req.user.uid`. Status transitions controlled via Express backend.

| Field | Type | Description |
|---|---|---|
| `requestId` | `string` | Unique document ID. |
| `itemId` | `string` | Reference to `items/{itemId}`. |
| `renterId` | `string` | `uid` of the borrowing student. |
| `ownerId` | `string` | `uid` of the lending student (denormalized for query performance). |
| `startDate` | `string` | Requested rental start date (`YYYY-MM-DD`). |
| `endDate` | `string` | Requested rental return date (`YYYY-MM-DD`). |
| `pricingModel` | `string` | Snapshot from item (`daily`, `weekly`, `monthly`). |
| `pricePerPeriod` | `number` | Snapshot rate from item at booking time. |
| `totalPrice` | `number` | Backend-computed total amount for the reservation. |
| `status` | `string` | Enum: `"pending"`, `"approved"`, `"active"`, `"returned"`, `"rejected"`, `"cancelled"`. |
| `createdAt` | `timestamp` | Time of request submission. |
| `updatedAt` | `timestamp` | Time of last status change. |
| `approvedAt` | `timestamp \| null` | Time owner approved the request. |
| `returnedAt` | `timestamp \| null` | Time owner marked the physical item returned. |

### 8.2 Composite Indexes Required in Firestore
1. `items`: `isAvailable ASC, category ASC, rentalPrice ASC`
2. `items`: `ownerId ASC, createdAt DESC`
3. `rentalRequests`: `itemId ASC, status ASC, startDate ASC`
4. `rentalRequests`: `ownerId ASC, status ASC, createdAt DESC`
5. `rentalRequests`: `renterId ASC, status ASC, createdAt DESC`

---

## 9. Authentication, Authorization & Storage Security Rules

### 9.1 Authentication Architecture
- **Identity Provider:** Firebase Authentication manages student identity, issuing short-lived JSON Web Tokens (JWT ID Tokens).
- **Client Protocol:** The React application acquires the ID Token via `currentUser.getIdToken()` and attaches it to the HTTP header of every backend request:
  ```http
  Authorization: Bearer <FIREBASE_ID_TOKEN>
  ```
- **Backend Middleware (`verifyAuth`):**
  1. Extracts token from `Authorization` header.
  2. Verifies cryptographically via `admin.auth().verifyIdToken(token)`.
  3. Rejects invalid or expired tokens with `401 Unauthorized`.
  4. Injects decoded claims into the Express request context:
     ```typescript
     req.user = {
       uid: decodedToken.uid,
       email: decodedToken.email || '',
       name: decodedToken.name || ''
     };
     ```

### 9.2 Authorization Matrix

| Action | Route | Target Resource | Permitted Actor |
|---|---|---|---|
| View Listings | `GET /api/items` | Item Catalog | Public / Anonymous |
| View Single Listing | `GET /api/items/:id` | Single Item | Public / Anonymous |
| Create Item Listing | `POST /api/items` | New Item Document | Authenticated Student |
| Edit Item Listing | `PATCH /api/items/:id` | Existing Item | Item Owner (`ownerId === req.user.uid`) |
| Request Rental | `POST /api/rentals` | New Rental Request | Authenticated Student (`req.user.uid !== item.ownerId`) |
| View My Rentals | `GET /api/rentals/my` | User's Rentals | Authenticated Student (`renterId` or `ownerId`) |
| Approve / Reject Rental | `PATCH /api/rentals/:id/status` | Rental Request | Item Owner (`ownerId === req.user.uid`) |
| Cancel Rental | `PATCH /api/rentals/:id/status` | Rental Request | Renter (`renterId === req.user.uid` AND `status === 'pending'`) |
| Mark Item Returned | `PATCH /api/rentals/:id/return`| Rental Request | Item Owner (`ownerId === req.user.uid`) |
| AI Recommendations | `POST /api/ai/recommendations` | Gemini Engine | Public or Authenticated Student |
| AI Description Assist | `POST /api/ai/description` | Gemini Engine | Authenticated Student |

### 9.3 Firebase Storage Security Rules
Images are uploaded directly from the frontend to Cloud Storage for Firebase to avoid streaming heavy binary payloads through the Express server. The security rules strictly separate operations:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Images stored strictly under owner folder: /items/{userId}/{fileName}
    match /items/{userId}/{fileName} {
      // 1. Public Read: Any student/visitor can view item listing photos
      allow read: if true;
      
      // 2. Authenticated Create: Uploading user must match folder UID, size < 5MB, image MIME
      allow create: if request.auth != null
                   && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/(jpeg|png|webp)');
      
      // 3. Authenticated Update: Owner can replace file subject to same constraints
      allow update: if request.auth != null
                   && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/(jpeg|png|webp)');
      
      // 4. Authenticated Delete: Only the owner can delete their images
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 10. REST API Contracts (Proposed Specification)

All API responses strictly adhere to a consistent JSON envelope pattern.

**Standard Success Envelope:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Human-readable operation confirmation"
}
```

**Standard Error Envelope:**
```json
{
  "success": false,
  "error": {
    "code": "MACHINE_READABLE_ERROR_CODE",
    "message": "Descriptive error explanation"
  }
}
```

---

### 10.1 Health Check
#### `GET /api/health`
- **Auth:** None (Public)
- **Description:** Uptime monitor for Render hosting and deployment health verification.
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "status": "healthy",
      "timestamp": "2026-10-23T08:30:00.000Z",
      "uptime": 1248.5
    },
    "message": "CampusCycle API is fully operational."
  }
  ```

---

### 10.2 Item Management Endpoints

#### `GET /api/items`
- **Auth:** None (Public)
- **Description:** Retrieve filtered list of active item listings.
- **Query Parameters:** `category`, `search`, `minPrice`, `maxPrice`, `pricingModel`, `availableFrom`, `availableTo`.
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "itemId": "itm_calc_901",
          "ownerId": "usr_std_101",
          "title": "Casio fx-991EX ClassWiz Scientific Calculator",
          "category": "Calculators",
          "description": "Mint condition scientific calculator...",
          "photoURLs": ["https://.../calc_front.jpg"],
          "pricingModel": "daily",
          "rentalPrice": 40.0,
          "availableFrom": "2026-10-23",
          "availableTo": "2026-11-30",
          "pickupLocation": "Girls Hostel Block A",
          "isAvailable": true,
          "createdAt": "2026-10-23T08:15:00.000Z"
        }
      ],
      "total": 1
    },
    "message": "Items fetched successfully."
  }
  ```

#### `POST /api/items`
- **Auth:** Required (`Bearer <token>`)
- **Description:** Create a new rental item listing.
- **Request Body:**
  ```json
  {
    "title": "White Chemistry Lab Coat (Size M)",
    "category": "Lab Gear",
    "description": "100% cotton laboratory coat with two deep pockets. Washed and ironed.",
    "photoURLs": ["https://.../coat.jpg"],
    "pricingModel": "weekly",
    "rentalPrice": 70.0,
    "availableFrom": "2026-10-24",
    "availableTo": "2026-12-15",
    "pickupLocation": "Chemistry Dept Foyer"
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "success": true,
    "data": {
      "itemId": "itm_coat_302",
      "title": "White Chemistry Lab Coat (Size M)",
      "createdAt": "2026-10-23T08:40:00.000Z"
    },
    "message": "Listing published successfully."
  }
  ```

#### `GET /api/items/:id`
- **Auth:** None (Public)
- **Description:** Retrieve complete details of a single item including owner metadata.
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "item": {
        "itemId": "itm_calc_901",
        "owner": {
          "uid": "usr_std_101",
          "name": "Priya Patel",
          "email": "priya.patel@campus.edu",
          "photoURL": "https://.../avatar.jpg"
        },
        "title": "Casio fx-991EX ClassWiz Scientific Calculator",
        "category": "Calculators",
        "description": "Mint condition scientific calculator...",
        "photoURLs": ["https://.../calc_front.jpg"],
        "pricingModel": "daily",
        "rentalPrice": 40.0,
        "availableFrom": "2026-10-23",
        "availableTo": "2026-11-30",
        "pickupLocation": "Girls Hostel Block A",
        "isAvailable": true
      }
    },
    "message": "Item details retrieved."
  }
  ```

#### `PATCH /api/items/:id`
- **Auth:** Required (`Bearer <token>`)
- **Description:** Update item details or toggle `isAvailable`. Restricted to item owner.
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": { "itemId": "itm_calc_901", "isAvailable": false },
    "message": "Listing updated successfully."
  }
  ```

---

### 10.3 Rental Lifecycle Endpoints

#### `POST /api/rentals`
- **Auth:** Required (`Bearer <token>`)
- **Description:** Submit a new rental request for an item across a date window.
- **Request Body:**
  ```json
  {
    "itemId": "itm_calc_901",
    "startDate": "2026-10-25",
    "endDate": "2026-10-27"
  }
  ```
- **Validation Rules:**
  - `startDate <= endDate` and `startDate >= today`.
  - Date window falls within item's `[availableFrom, availableTo]`.
  - Renter cannot be the owner (`req.user.uid !== item.ownerId`).
  - Dates must not overlap existing bookings where status is `approved` or `active`.
- **Success Response (`201 Created`):**
  ```json
  {
    "success": true,
    "data": {
      "requestId": "req_rent_701",
      "itemId": "itm_calc_901",
      "durationDays": 3,
      "totalPrice": 120.0,
      "status": "pending",
      "createdAt": "2026-10-23T08:50:00.000Z"
    },
    "message": "Rental request submitted to owner for approval."
  }
  ```

#### `GET /api/rentals/my`
- **Auth:** Required (`Bearer <token>`)
- **Description:** Fetch rental history and incoming requests for the authenticated user with **effective status** applied.
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "borrowing": [
        {
          "requestId": "req_rent_701",
          "itemId": "itm_calc_901",
          "itemTitle": "Casio fx-991EX Scientific Calculator",
          "ownerName": "Priya Patel",
          "startDate": "2026-10-25",
          "endDate": "2026-10-27",
          "totalPrice": 120.0,
          "status": "active"
        }
      ],
      "lending": [
        {
          "requestId": "req_rent_805",
          "itemId": "itm_suit_401",
          "itemTitle": "Navy Blue Raymond Blazer (Size 38)",
          "renterName": "Karan Verma",
          "startDate": "2026-10-28",
          "endDate": "2026-10-30",
          "totalPrice": 300.0,
          "status": "pending"
        }
      ]
    },
    "message": "User rentals retrieved successfully."
  }
  ```

#### `PATCH /api/rentals/:id/status`
- **Auth:** Required (`Bearer <token>`)
- **Description:** Approve or reject an incoming request (Owner), or cancel a pending request (Renter).
- **Request Body:** `{ "status": "approved" | "rejected" | "cancelled" }`
- **Concurrency & Validation:** Approvals execute inside a Firestore transaction re-verifying that no overlapping booking was approved concurrently.
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "requestId": "req_rent_805",
      "status": "approved",
      "approvedAt": "2026-10-23T08:55:00.000Z"
    },
    "message": "Rental request has been approved."
  }
  ```

#### `PATCH /api/rentals/:id/return`
- **Auth:** Required (`Bearer <token>`)
- **Description:** Item owner marks the physical item as returned after handover.
- **Permission:** Only item owner (`ownerId === req.user.uid`).
- **Condition:** Effective status must be `active` or `approved`.
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "requestId": "req_rent_805",
      "status": "returned",
      "returnedAt": "2026-10-23T09:00:00.000Z"
    },
    "message": "Item return confirmed. Rental closed."
  }
  ```

---

### 10.4 Google Gemini AI Endpoints

#### `POST /api/ai/recommendations`
- **Auth:** Optional (Public or Authenticated)
- **Description:** Analyzes conversational student need, filters active Firestore inventory, and returns Gemini-ranked recommendations with explanations.
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "recommendations": [
        {
          "item": {
            "itemId": "itm_meter_501",
            "title": "Aneng Digital Multimeter with Probes",
            "category": "Tech & Electronics",
            "rentalPrice": 50.0,
            "pricingModel": "daily",
            "pickupLocation": "Boys Hostel 2 Foyer",
            "photoURLs": ["https://.../meter.jpg"]
          },
          "estimatedCost": 100.0,
          "aiExplanation": "Perfect for your practical test; includes DC/AC probes and costs exactly ₹100 for 2 days, well within your ₹150 budget.",
          "confidenceScore": 0.95
        }
      ],
      "fallback": false
    },
    "message": "AI recommendations generated successfully."
  }
  ```

#### `POST /api/ai/description`
- **Auth:** Required (`Bearer <token>`)
- **Description:** Auto-generates an attractive listing description and recommends an appropriate category from brief student notes.
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "suggestedCategory": "Calculators",
      "generatedDescription": "Genuine Casio fx-991ES Plus (Silver Edition) scientific calculator in great condition..."
    },
    "message": "Description drafted successfully."
  }
  ```

---

## 11. Rental Lifecycle, Concurrency & Deterministic Pricing Engine

### 11.1 Rental Lifecycle & Deterministic "Active" Derivation

```mermaid
stateDiagram-v2
    [*] --> pending : Renter submits request
    pending --> approved : Owner approves (Locks dates)
    pending --> rejected : Owner rejects
    pending --> cancelled : Renter cancels
    approved --> active : Start date arrives (today >= startDate)
    active --> returned : Owner marks returned
    approved --> returned : Owner marks returned (Early return)
    returned --> [*]
    rejected --> [*]
    cancelled --> [*]
```

#### Deterministic Effective Status Resolution Rule
To avoid relying on brittle client-side timers or unnecessary cloud infrastructure (such as Cloud Tasks or background cron jobs), CampusCycle enforces **Deterministic Effective Status Resolution** directly within the backend service layer (`rental.service.ts`):

1. **Resolution Logic:** Whenever a rental document is accessed or evaluated:
   $$\text{effectiveStatus}(R) = \begin{cases} 
     \text{'active'}, & \text{if } R.\text{status} = \text{'approved'} \text{ and } \text{today} \ge R.\text{startDate} \\
     R.\text{status}, & \text{otherwise}
   \end{cases}$$
   Where `today` is evaluated as the canonical `YYYY-MM-DD` date string in the local campus timezone.
2. **API Responses (`GET /api/rentals/my`, `GET /api/rentals/:id`):** The backend dynamically injects `effectiveStatus`. If the document's stored status is `approved` and `today >= startDate`, the API returns `"status": "active"`, and the service opportunistically updates Firestore in the background.
3. **Return Confirmation (`PATCH /api/rentals/:id/return`):** The owner is authorized to confirm return whenever the effective status is `active` or `approved`. Upon invocation, status transitions to `returned`, and `returnedAt` is set to the current timestamp.
4. **Cancellation Policy:** Renters can only cancel requests whose status is strictly `pending`. Once approved or active, cancellations are blocked.

---

### 11.2 Concurrency & Atomic Approval Specification

> [!IMPORTANT]
> **Pending Requests DO NOT Reserve Dates:** Multiple students can submit overlapping rental requests for the same item while they remain in `pending` status. Calendar dates are reserved **strictly when an owner approves a request**.

#### Firestore Atomic Transaction Specification (`runTransaction`)
When an owner clicks **Approve** (`PATCH /api/rentals/:id/status` with `status: "approved"`), the backend executes an atomic Firestore transaction following this strict protocol:

```mermaid
graph TD
    T1["1. Begin Firestore Transaction"] --> T2["2. Read Target rentalRequests/{requestId}"]
    T2 --> T3{"Target Valid?\n(status == 'pending' &&\nownerId == req.user.uid)"}
    T3 -- No --> T_ERR["Abort: 400 Bad Request / 403 Forbidden"]
    T3 -- Yes --> T4["3. Query All rentalRequests for itemId\nwhere status IN ['approved', 'active']"]
    T4 --> T5{"Any Interval Overlap?\n(S_target <= E_existing &&\nS_existing <= E_target)"}
    T5 -- Yes --> T_CONFLICT["Abort: 409 Conflict\n(CALENDAR_CONFLICT)"]
    T5 -- No --> T6["4. Write Target Document:\nstatus = 'approved'\napprovedAt = serverTimestamp()"]
    T6 --> T7["5. Commit Transaction"]
    T7 --> T8["6. Post-Commit Auto-Reject:\nReject remaining overlapping pending requests"]
```

1. **Transaction Reads:**
   - Read `rentalRequests/{requestId}` inside transaction. Verify target status is `pending` and `ownerId === req.user.uid`.
   - Query all existing bookings for that `itemId` where `status IN ['approved', 'active']`.
2. **Transaction Conflict Check:**
   - Check if the requested range $[S_{\text{target}}, E_{\text{target}}]$ overlaps with any existing booking $[S_{\text{existing}}, E_{\text{existing}}]$ using:
     $$S_{\text{target}} \le E_{\text{existing}} \quad \text{AND} \quad S_{\text{existing}} \le E_{\text{target}}$$
   - If an overlap exists, abort transaction immediately with `409 Conflict` (`code: "CALENDAR_CONFLICT"`).
3. **Transaction Writes:**
   - Update target request: `status = "approved"`, `approvedAt = FieldValue.serverTimestamp()`, `updatedAt = FieldValue.serverTimestamp()`.
4. **Post-Transaction Cascade:**
   - After transaction commits, batch-update any other remaining `pending` requests for this `itemId` that overlap with $[S_{\text{target}}, E_{\text{target}}]$ to `status = "rejected"` with `rejectionReason = "Dates no longer available due to approved booking"`.

---

### 11.3 Deterministic Pricing Engine & Partial-Period Formulas

Rental days are counted **inclusively**:
$$\text{durationDays} = \text{differenceInCalendarDays}(E, S) + 1$$
*(e.g., Oct 25 to Oct 27 = 3 days; Oct 25 to Oct 25 = 1 day).*

#### Formulas by Pricing Model

1. **Daily Model (`pricingModel == 'daily'`):**
   - Minimum rental duration: 1 day.
   - $\text{totalPrice} = \text{roundTo2Decimals}(\text{durationDays} \times \text{rentalPrice})$.
   - Minimum charge: $1 \times \text{rentalPrice}$.

2. **Weekly Model (`pricingModel == 'weekly'`):**
   - Base weekly rate: `rentalPrice`.
   - Daily prorated equivalent: $\text{dailyEquivalent} = \frac{\text{rentalPrice}}{7}$.
   - Full weeks: $W = \lfloor \text{durationDays} / 7 \rfloor$.
   - Extra days: $D_{\text{rem}} = \text{durationDays} \pmod 7$.
   - **Formula:**
     $$\text{unroundedPrice} = (W \times \text{rentalPrice}) + \left(D_{\text{rem}} \times \frac{\text{rentalPrice}}{7}\right)$$
   - **Minimum Charge Rule:** Minimum rental duration is 1 day. The minimum charge under the weekly model is 1 prorated day's rate:
     $$\text{minPrice} = \frac{\text{rentalPrice}}{7}$$
     $$\text{totalPrice} = \text{roundTo2Decimals}(\max(\text{unroundedPrice}, \text{minPrice}))$$

3. **Monthly Model (`pricingModel == 'monthly'`):**
   - Standard 30-day base cycle.
   - Base monthly rate: `rentalPrice`.
   - Daily prorated equivalent: $\text{dailyEquivalent} = \frac{\text{rentalPrice}}{30}$.
   - Full months: $M = \lfloor \text{durationDays} / 30 \rfloor$.
   - Extra days: $D_{\text{rem}} = \text{durationDays} \pmod{30}$.
   - **Formula:**
     $$\text{unroundedPrice} = (M \times \text{rentalPrice}) + \left(D_{\text{rem}} \times \frac{\text{rentalPrice}}{30}\right)$$
   - **Minimum Charge Rule:** Minimum rental duration is 1 day. The minimum charge under the monthly model is 1 prorated day's rate:
     $$\text{minPrice} = \frac{\text{rentalPrice}}{30}$$
     $$\text{totalPrice} = \text{roundTo2Decimals}(\max(\text{unroundedPrice}, \text{minPrice}))$$

*All totals are rounded to 2 decimal places ($₹$) using standard rounding (`Math.round(val * 100) / 100`).*

#### Unambiguous Worked Examples
- **Weekly Model (Duration $< 7$ days):** Lab coat listed at ₹70/week rented for 1 day:
  $$W = 0, \quad D_{\text{rem}} = 1 \implies 0 + (1 \times 10) = \mathbf{₹10.00}$$
- **Weekly Model (Duration $> 7$ days):** Lab coat listed at ₹70/week rented for 10 days:
  $$W = 1, \quad D_{\text{rem}} = 3 \implies 70 + (3 \times 10) = \mathbf{₹100.00}$$
- **Monthly Model (Duration $< 30$ days):** Drawing kit listed at ₹300/month rented for 2 days:
  $$M = 0, \quad D_{\text{rem}} = 2 \implies 0 + (2 \times 10) = \mathbf{₹20.00}$$
- **Monthly Model (Duration $> 30$ days):** Drawing kit listed at ₹300/month rented for 45 days:
  $$M = 1, \quad D_{\text{rem}} = 15 \implies 300 + (15 \times 10) = \mathbf{₹450.00}$$

---

## 12. Google Gemini AI Integration, Prompt Strategy & Fallback Engine

### 12.1 Configured Gemini Model
- **Configured Model Identifier:** `gemini-1.5-flash` via `@google/genai` (or `@google/generative-ai`).
- **Verification Status:** **Verified accessible** via Google AI Studio API (`models/gemini-1.5-flash`). Provides sub-second latency, native JSON output mode (`responseMimeType: "application/json"`), and cost-efficient multimodal token economics.

### 12.2 Grounded Recommendation Engine
- **Catalog Grounding:** Backend queries Firestore for active items (`isAvailable == true`), strips non-essential metadata, and injects the candidate catalog directly into the Gemini prompt.
- **Strict Anti-Hallucination Rule:** Gemini is instructed to recommend items *only* from the provided catalog.
- **Backend ID Verification:** The backend parses Gemini's JSON output and verifies every returned `itemId` against the candidate set. Any hallucinated ID is silently discarded before responding to the client.

### 12.3 Resilient Fallback Engine
If Gemini encounters a `429 Rate Limit`, quota depletion, or timeout:
1. Backend catches the error without crashing.
2. Executes a local keyword regex search over item `title`, `description`, and `category`.
3. Returns matched items with `"fallback": true`.
4. Core rental operations (listing, requesting, approving, returning) continue with 100% functionality.

---

## 13. Official Hackathon Schedule vs. Internal Execution Timeline

### 13.1 Schedule Comparison & Analysis

| Official Event Milestone | Official Time | Activity Analysis | Actual Active Build Time |
|---|---|---|---|
| **Registration** | 7:00 – 7:30 AM | Check-in, Wi-Fi connectivity. | 0 min |
| **Breakfast & Hacking Phase 1** | 7:30 – 10:30 AM | **Primary core development window.** | **180 min (3.0h)** |
| **Opening Ceremony** | 10:30 – 11:00 AM | Event briefing; code freeze. | 0 min |
| **Hacking Phase 2** | 11:00 AM – 12:00 PM | **Secondary development window.** | **60 min (1.0h)** |
| **Mentoring Session** | 12:00 – 12:30 PM | Prototype demo & mentor feedback. | 0 min (Sync) |
| **Lunch Break** | 12:30 – 1:00 PM | Lunch; staging deployment smoke tests. | 0 min |
| **Final Build & Submission** | 1:00 – 2:00 PM | **Final bug squashing & submission.** Code freeze at 1:45 PM. | **60 min (1.0h)** |
| **Final Judgement** | 2:00 – 3:00 PM | Live demonstration to judges. | 0 min (Presentation) |
| **Closing Ceremony** | 3:30 – 5:00 PM | Results announcement and wrap-up. | 0 min |
| **TOTALS** | **10 Hours Overall** | **Official Build Windows:** 3h + 1h + 1h | **5.0 Hours Total Build Time** |

---

## 14. Team Workflow, Git Strategy & Integration Protocol

- **Monorepo Structure:** Isolated `/frontend` and `/backend` directories.
- **Primary Branches:** `main` (production), `develop` (integration), `feat/be-*`, `feat/fe-*`.
- **Secret Hygiene:** `.env` and `serviceAccountKey.json` are strictly git-ignored; clean `.env.example` templates provided.
- **Integration Rule:** Frontend and backend teammates align on API contracts before code changes.

---

## 15. Step-by-Step Implementation Roadmap

```mermaid
graph TD
    P1["Phase 1: Project Alignment & API Contract Lock"] --> P2["Phase 2: Backend Skeleton & Health Endpoint"]
    P2 --> P3["Phase 3: Firebase Project, Auth & Storage Setup"]
    P3 --> P4["Phase 4: Item Listing Management & Filter Engine"]
    P4 --> P5["Phase 5: Rental Request Engine & Conflict Prevention"]
    P5 --> P6["Phase 6: Frontend Integration & 'My Rentals' Dashboard"]
    P6 --> P7["Phase 7: Google Gemini AI Integration & Fallback"]
    P7 --> P8["Phase 8: End-to-End Testing & Polish"]
    P8 --> P9["Phase 9: Production Deployment & Live Demo Verification"]
```

---

## 16. Comprehensive Testing Matrix & Live 3-Minute Demo Script

### 16.1 Testing Matrix

| Test ID | Category | Scenario / Action | Input / Condition | Expected Result | Status |
|---|---|---|---|---|---|
| **T-01** | **Health** | Ping server status | `GET /api/health` | `200 OK`, `status: "healthy"`. | `PLANNED` |
| **T-02** | **Auth** | Unauthenticated mutation | `POST /api/items` with no header | `401 Unauthorized`, `TOKEN_MISSING`. | `PLANNED` |
| **T-03** | **Items** | Valid listing creation | Title, category, daily price, photo | `201 Created`, doc created in Firestore. | `PLANNED` |
| **T-04** | **Items** | Invalid date boundaries | `availableTo < availableFrom` | `400 Bad Request`, `VALIDATION_ERROR`. | `PLANNED` |
| **T-05** | **Items** | Unauthorized item edit | Student B edits Student A's item | `403 Forbidden`, `FORBIDDEN_ACTION`. | `PLANNED` |
| **T-06** | **Pricing** | Pro-rated weekly rental | 10 days on ₹70/week item | Total calculated exactly as ₹100.00. | `PLANNED` |
| **T-07** | **Rentals** | Owner renting own item | `renterId === ownerId` | `400 Bad Request`, `CANNOT_RENT_OWN_ITEM`. | `PLANNED` |
| **T-08** | **Rentals** | Double booking prevention | Request overlapping approved booking | `409 Conflict`, `CALENDAR_CONFLICT`. | `PLANNED` |
| **T-09** | **Rentals** | Concurrent approval race | Two pending requests overlap; owner approves #1 then #2 | Request #1 succeeds; Request #2 fails with `409 Conflict`. | `PLANNED` |
| **T-10** | **Rentals** | Full lifecycle progression | `pending` $\rightarrow$ `approved` $\rightarrow$ `active` $\rightarrow$ `returned` | Status updates accurately; `returnedAt` timestamp set. | `PLANNED` |
| **T-11** | **AI** | Grounded recommendations | Query: "Need lab coat under 100" | Returns real lab coat listing with explanation; no phantom IDs. | `PLANNED` |
| **T-12** | **AI** | Description generator | Rough notes on calculator | Returns structured 80-word description + "Calculators" category. | `PLANNED` |
| **T-13** | **AI** | Fallback on API outage | Simulated Gemini 429 quota exhaustion | Gracefully returns keyword matches with `fallback: true`. | `PLANNED` |

---

## 17. Deployment Checklist & Environment Variable Directory

### 17.1 Required Environment Variables

#### Backend (`/backend/.env`)
- `PORT=5000`
- `NODE_ENV=production`
- `FRONTEND_URL=https://campuscycle-hack.web.app`
- `GEMINI_API_KEY=AIzaSy...`
- `FIREBASE_PROJECT_ID=campuscycle-hack`
- `FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@campuscycle-hack.iam.gserviceaccount.com`
- `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`

#### Frontend (`/frontend/.env`)
- `VITE_API_BASE_URL=https://campuscycle-backend.onrender.com/api`
- `VITE_FIREBASE_API_KEY=AIzaSy...`
- `VITE_FIREBASE_AUTH_DOMAIN=campuscycle-hack.firebaseapp.com`
- `VITE_FIREBASE_PROJECT_ID=campuscycle-hack`
- `VITE_FIREBASE_STORAGE_BUCKET=campuscycle-hack.appspot.com`
- `VITE_FIREBASE_MESSAGING_SENDER_ID=...`
- `VITE_FIREBASE_APP_ID=...`

---

## 18. Risk Assessment, Mitigation Strategies & Future Scope

| Risk ID | Risk Description | Severity | Probability | Mitigation Strategy |
|---|---|---|---|---|
| **R-01** | **Gemini Rate Limit during Demo** | High | Medium | Graceful keyword fallback; seeded demo prompts. |
| **R-02** | **Render Cold Start Latency** | Medium | High | Ping `/api/health` 10 minutes prior to live judging. |
| **R-03** | **Timezone Discrepancies** | High | Medium | Canonical `YYYY-MM-DD` strings throughout. |
| **R-04** | **Storage Upload Abuse** | Medium | Low | Strict Firebase Storage rules (UID match, < 5MB, image MIME). |
| **R-05** | **Double-Booking Collisions** | High | Low | Atomic Firestore transactions (`runTransaction`) on approval. |

---

## 19. Chronological Planning Decision Log (Q1–Q39)

- **Q1–Q4:** Project identity (CampusCycle, Team Codebreak Crew, Industry & Innovation Track, PPT authoritative).
- **Q5:** Database choice: **Firebase Firestore** finalized over Supabase.
- **Q6–Q10:** Stack: React 18, TypeScript, Tailwind, Node.js, Express, Render, Firebase Hosting, Firebase Storage.
- **Q11–Q12:** AI: **Google Gemini 1.5 Flash** (`gemini-1.5-flash`), backend-only, verified accessible.
- **Q13:** Auth: **Firebase Authentication from Day 1** with backend token verification via `verifyAuth`.
- **Q14:** Roles: Unified student account (both lender and borrower).
- **Q15–Q17:** Schema: 3 collections (`users`, `items`, `rentalRequests`).
- **Q18–Q20:** Pricing: Daily, weekly, monthly with deterministic daily prorated remainder and 1-day minimum charge.
- **Q21–Q25:** Lifecycle: `pending` $\rightarrow$ `approved` $\rightarrow$ `active` (when `today >= startDate`) $\rightarrow$ `returned`. Pending requests do not lock dates; approval locks dates inside a Firestore transaction.
- **Q26:** Dashboard: `MyRentalsPage` split into Borrowing and Lending tabs.
- **Q27–Q29:** Gemini: Grounded in real listings, ID verification, owner description review, keyword fallback.
- **Q30–Q33:** API & Security: Structured JSON envelopes, server-side validation, resource ownership guards.
- **Q34:** Hackathon build time: **5.0 hours total active hacking**.
- **Q35–Q37:** Seed data: 10 realistic campus items; chat/payments deferred to future scope.
- **Q38–Q39:** Workflow: Atomic, small tasks; explicit status tracking (`PLANNED`, `IMPLEMENTED`, `TESTED`, `DEPLOYED`).

---

## 20. Progress Tracking Matrix, Change Log & Decision Template

### 20.1 Master Deliverables Tracking Matrix

| Module / Deliverable | Target File(s) | Owner | Status | Verified By |
|---|---|---|---|---|
| Master Technical Plan | `PROJECT_PLAN.md` | Team | `IMPLEMENTED` | Antigravity |
| AI Operating Manual | `AGENTS.md` | Team | `IMPLEMENTED` | Antigravity |
| Express App & Health Route | `backend/src/server.ts`, `backend/src/routes/health.routes.ts` | Backend | `PLANNED` | — |
| Firebase Admin SDK Config | `backend/src/config/firebaseAdmin.ts` | Backend | `PLANNED` | — |
| Auth Middleware (`verifyAuth`) | `backend/src/middleware/auth.middleware.ts` | Backend | `PLANNED` | — |
| Item Controller & CRUD Routes | `backend/src/controllers/items.controller.ts` | Backend | `PLANNED` | — |
| Pricing & Conflict Engine | `backend/src/services/pricing.service.ts` | Backend | `PLANNED` | — |
| Rental Controller & Actions | `backend/src/controllers/rentals.controller.ts` | Backend | `PLANNED` | — |
| Gemini Service & Fallback | `backend/src/services/gemini.service.ts` | Backend | `PLANNED` | — |
| Frontend Vite & Tailwind Scaffolding | `frontend/package.json`, `frontend/tailwind.config.js` | Frontend | `PLANNED` | — |
| Firebase Auth Context & Client | `frontend/src/context/AuthContext.tsx` | Frontend | `PLANNED` | — |
| Navbar & App Routing | `frontend/src/App.tsx`, `frontend/src/components/common/Navbar.tsx`| Frontend | `PLANNED` | — |
| Explore Catalog & Filters | `frontend/src/pages/ExplorePage.tsx` | Frontend | `PLANNED` | — |
| Item Detail & Date Range Selector | `frontend/src/pages/ItemDetailPage.tsx` | Frontend | `PLANNED` | — |
| Create Item Form & Photo Upload | `frontend/src/pages/CreateItemPage.tsx` | Frontend | `PLANNED` | — |
| "My Rentals" Dashboard (Two Tabs) | `frontend/src/pages/MyRentalsPage.tsx` | Frontend | `PLANNED` | — |
| Gemini Search & Description Modals | `frontend/src/components/ai/` | Frontend | `PLANNED` | — |
| Render Backend Deployment | Render Dashboard | Backend | `PLANNED` | — |
| Firebase Hosting Deployment | Firebase Hosting | Frontend | `PLANNED` | — |
| Seed Data (10 Realistic Items) | Firestore Database | Both | `PLANNED` | — |

---

## 21. Guidelines for Teammates & Antigravity IDE Agents

1. **Hierarchy:** `PROJECT_PLAN.md` owns technical architecture and roadmap; `AGENTS.md` owns implementation guardrails and AI workflows.
2. **One Small Task at a Time:** Never generate massive multi-file rewrites. Implement, test, inspect diff, update status, and wait for approval.
3. **No Unverified Claims:** Do not mark items `IMPLEMENTED` or `TESTED` without verifying code in the repository.

---
*End of Master Technical Project Plan — CampusCycle (Team Codebreak Crew)*
