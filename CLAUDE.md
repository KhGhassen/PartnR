# PartnR — Guide pour Claude Code

## Architecture générale

Monorepo avec 3 couches :

```
partnr/
├── backend/          # ASP.NET Core 8 API
├── frontend/         # React 19 + TypeScript + Vite (web)
├── mobile/           # Expo SDK 51 + React Native (iOS/Android)
└── supabase/         # Migrations PostgreSQL
```

## Backend (`backend/`)

**Stack :** ASP.NET Core 8, EF Core, PostgreSQL (Supabase), ASP.NET Identity, JWT, SignalR, Serilog

**Architecture en clean architecture, 4 projets :**

```
backend/
├── PartnR.Domain/          # Entités (AppUser, Event, Activity, Rating, Message, UserAction...)
├── PartnR.Application/      # DTOs, interfaces (Services + Repositories), implémentations des services
├── PartnR.Infrastructure/    # AppDbContext, repositories EF Core, AnalyticsTracker, SmtpEmailService
└── PartnR.Api/               # Controllers, Hubs, Program.cs, Middleware (composition root)
```

**Pattern :** Controller → Service (interface dans `Application/Interfaces/Services`) → Repository (interface dans `Application/Interfaces/Repositories`, implém. dans `Infrastructure/Repositories`) → `AppDbContext`.

- `IRepository<T>` générique : `Query()` (IQueryable\<T\>), `FindAsync(keys)`, `Add(T)`, `Remove(T)`. Interfaces par entité (ex. `IEventRepository`) sans membres additionnels — les services composent du LINQ via `.Query()`.
- `IUnitOfWork` : `SaveChangesAsync()` + `BeginTransactionAsync()` (retourne `ITransaction`, wrapper autour de `IDbContextTransaction`).
- Les autorisations (ex. vérification `Role == "admin"`) sont faites **dans les services** (`IAdminService`, `IAnalyticsService`), qui prennent `Guid requestingUserId` en premier paramètre et lèvent `UnauthorizedAccessException` (→ 403 via `ExceptionMiddleware`).
- `PartnR.Application/DependencyInjection.cs` (`AddApplication()`) et `PartnR.Infrastructure/DependencyInjection.cs` (`AddInfrastructure()`) enregistrent tous les services/repositories. `Program.cs` appelle juste ces deux extensions.

**Couches :**
- `PartnR.Api/Controllers/` — REST + `[Authorize]` sur les endpoints sensibles
- `PartnR.Api/Hubs/EventChatHub.cs` — SignalR, délègue à `IEventChatService`. Auth via query string `?access_token=` (WebSocket ne supporte pas Authorization header)
- `PartnR.Api/Middleware/ExceptionMiddleware.cs` — Gestion globale des erreurs
- `PartnR.Application/Services/` — Logique métier (AuthService, EventService, ProfileService, RatingService, AdminService, AnalyticsService, ActivityService, EventChatService)
- `PartnR.Application/DTOs/` — Validation avec DataAnnotations. Jamais d'entités exposées directement.
- `PartnR.Infrastructure/Services/AnalyticsTracker.cs` — **Singleton** fire-and-forget via `IServiceScopeFactory`. Injecté via `IAnalyticsTracker`.
- `PartnR.Domain/Entities/` — AppUser hérite de IdentityUser\<Guid\>

**DI lifetimes à respecter :**
- `IAnalyticsTracker` (AnalyticsTracker) → Singleton
- Repositories, `IUnitOfWork`, tous les Services → Scoped

**Auth :** JWT Bearer. `User.GetUserId()` via `ClaimsPrincipalExtensions`.

**Rate limiting :** 10 req/min sur `/api/auth/*`, 60 req/min global.

## Frontend (`frontend/src/`)

**Stack :** React 19, TypeScript, Tailwind CSS 4, Vite, Axios, React Router v7, Recharts

**Pattern :**
- `api/` — Fonctions Axios par domaine (auth, events, profiles, activities, analytics)
- `context/AuthContext.tsx` — Token JWT + user en localStorage
- `hooks/useAnalytics.ts` — Batching analytics (5s) + sendBeacon sur visibilitychange
- `pages/` — Une page = une route
- `components/` — Navbar, EventChat (SignalR), RatingForm, ProtectedRoute, ErrorBoundary

**Variables d'env :** `VITE_API_URL` pour l'URL du backend en production.

## Mobile (`mobile/`)

**Stack :** Expo SDK 51, Expo Router v3 (file-based routing), React Native, TypeScript

**Navigation :**
```
app/
├── index.tsx          # Redirect → /onboarding ou /(tabs)
├── onboarding.tsx     # Welcome + name + interests → /register
├── login.tsx          # Login screen
├── register.tsx       # Register screen
├── create.tsx         # Modal : créer une activité (3 étapes)
├── activity/[id].tsx  # Détail événement + join/leave
├── chat/[id].tsx      # Chat SignalR (id = eventId)
└── (tabs)/
    ├── _layout.tsx    # Tab bar custom avec FAB central coral
    ├── index.tsx      # Home — liste d'événements
    ├── match.tsx      # For You — suggestions
    ├── messages.tsx   # Liste événements comme chats
    └── profile.tsx    # Profil + logout
```

**Auth :** JWT stocké dans `expo-secure-store`. Vérifié au démarrage dans `AppContext`.

**API :** `mobile/config.ts` → `API_URL` (URL du backend). Client Axios dans `mobile/api/client.ts`.

**SignalR :** `mobile/hooks/useEventChat.ts` — token passé via `?access_token=` (même pattern que web).

**Design tokens :** `mobile/constants/tokens.ts` — coral `#E8603A`, violet `#7B65D4`, fond `#FAFAF7`.

**Fonts :** DMSans (400/500/600/700) via `@expo-google-fonts/dm-sans`, chargées dans `app/_layout.tsx`.

## Base de données

Migrations dans `supabase/migrations/` (ordre : 00001 → 00002 → 00003).

- `00001_initial_schema.sql` — Schema complet avec RLS, triggers, index
- `00002_efcore_schema.sql` — Tables EF Core Identity (AspNetUsers, etc.)
- `00003_user_actions.sql` — Table analytics UserActions

**EF Core** gère le schema en production via `dotnet ef database update`. Les migrations Supabase sont pour référence et Supabase directement.

## Tests

```bash
# Backend
cd backend/PartnR.Api.Tests && dotnet test

# Frontend
cd frontend && npm test
```

Tests backend : xUnit + EF Core InMemory. Couvrent EventService, AuthService, ProfileService, RatingService.
Tests frontend : Vitest + Testing Library. Couvrent AuthContext, EventList, Register, RatingForm.

## Variables d'environnement

Backend (`appsettings.json` ou env vars) :
```
ConnectionStrings__DefaultConnection   Chaîne PostgreSQL
Jwt__Key                               Clé secrète (min 32 chars)
Jwt__Issuer                            PartnR.Api
Jwt__Audience                          PartnR.Client
Jwt__ExpireMinutes                     1440
Cors__AllowedOrigins__0                URL frontend
```

Frontend : `VITE_API_URL` dans `.env`.

Mobile : `mobile/config.ts` → `export const API_URL = 'https://...'`

## Backend déployé

- **API :** `https://partnr-p3rv.onrender.com` (Render, free tier — cold start ~30s)
- **DB :** Supabase PostgreSQL

## Conventions

- Nommage C# : PascalCase classes/methods, camelCase variables
- Nommage TS/RN : camelCase fonctions, PascalCase composants
- Pas de commentaires sauf invariants non-évidents
- DTOs toujours validés avec DataAnnotations côté backend
- Toujours utiliser `toApiError()` côté frontend/mobile pour parser les erreurs Axios
