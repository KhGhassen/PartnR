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
├── PartnR.Domain/          # Entités (AppUser, Event, EventParticipant, Activity, Rating, Message, Notification, Report, UserBlock, StoredImage, UserAction...)
├── PartnR.Application/      # DTOs, interfaces (Services + Repositories), implémentations des services, Common/FrenchDate
├── PartnR.Infrastructure/    # AppDbContext, SqlMigrationRunner, repositories EF Core, AnalyticsTracker, SmtpEmailService, ImageSharpProcessor, AccountDeletionService
└── PartnR.Api/               # Controllers, Hubs, Services (BackgroundServices), Program.cs, Middleware (composition root)
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
- `PartnR.Application/Services/` — Logique métier (AuthService, EventService, ProfileService, RatingService, AdminService, AnalyticsService, ActivityService, EventChatService, EventCommentService, EventPhotoService, NotificationService, ReportService, BlockService, UploadService)
- `PartnR.Application/DTOs/` — Validation avec DataAnnotations. Jamais d'entités exposées directement.
- `PartnR.Application/Common/FrenchDate.cs` — toute date écrite **par le serveur** à un humain (email, texte de notification) passe par ici : Europe/Paris, français (« demain à 20h00 »). Les clients formatent leurs propres dates.
- `PartnR.Api/Services/` — BackgroundServices : `EventReminderService` (rappel J-1, un par participant via `EventParticipant.ReminderSentAt`, sauvegarde avant email), `ExpoPushService` (pousse toute `Notification` non envoyée, retries avec backoff), `EventLifecycleService` (passe les événements en Terminé).
- `PartnR.Infrastructure/Services/AnalyticsTracker.cs` — **Singleton** fire-and-forget via `IServiceScopeFactory`. Injecté via `IAnalyticsTracker`.
- `PartnR.Infrastructure/Services/ImageSharpProcessor.cs` — `IImageProcessor` : tout upload est décodé, orienté, débarrassé de ses métadonnées, borné à 1600 px et ré-encodé. Ne jamais stocker les octets reçus tels quels.
- `PartnR.Domain/Entities/` — AppUser hérite de IdentityUser\<Guid\>

**DI lifetimes à respecter :**
- `IAnalyticsTracker` (AnalyticsTracker), `IImageProcessor` (ImageSharpProcessor) → Singleton
- Repositories, `IUnitOfWork`, tous les Services → Scoped

**Auth :** JWT Bearer. `User.GetUserId()` via `ClaimsPrincipalExtensions`. Le JWT porte un claim `sst` (SecurityStamp) revalidé toutes les 60 s : bannir ou changer le mot de passe fait tomber les sessions.

**Rate limiting :** partitionné — `auth` 10 req/min par IP, `api` 60 req/min par utilisateur (ou IP), 300 req/min global. `UseRateLimiter()` vient **après** `UseAuthentication()` pour partitionner par utilisateur.

**Invariants métier à respecter :**
- Toutes les dates en base sont UTC ; les clients envoient des instants ISO (`lib/datetime.ts`), `EventService.ToUtc` normalise.
- `GetByIdAsync(id, viewerId)` : l'adresse exacte, les coordonnées précises et la liste des participants dépendent du viewer (organisateur / inscrit / connecté / anonyme, `LocationHidden`).
- `ListAsync(..., userId: viewer)` : le contrôleur passe l'utilisateur dès qu'il est authentifié ; les événements des personnes bloquées (dans les deux sens) sont masqués. Le blocage refuse aussi les inscriptions et masque les messages de la paire — jamais annoncé à l'autre partie.
- `JoinAsync` / `LeaveAsync` sont sérialisés par `IEventRepository.LockAsync` (`pg_advisory_xact_lock`, no-op hors PostgreSQL).
- Changer la date d'un événement notifie les participants (`event_rescheduled`) et remet `ReminderSentAt` à null.

## Frontend (`frontend/src/`)

**Stack :** React 19, TypeScript, Tailwind CSS 4, Vite, Axios, React Router v7, Recharts, Lucide (icônes)

**Charte « Le Programme » :** tokens sémantiques dans `src/index.css` (`--color-bg`, `surface`, `surface-sunken`, `text`, `text-2`, `text-3`, `border`, `border-strong`, `accent`, `on-accent`, `success/danger/warn` + surfaces, `night`). Le thème sombre est une permutation de ces valeurs dans `[data-theme='dark']`. Les anciens noms (`cream`, `ink*`, `coral-*`, `line`) sont des **alias en cours de migration** : nouveau code = tokens sémantiques uniquement, jamais de couleur Tailwind littérale (`bg-white`, `text-gray-*`). Titres en Bricolage Grotesque (`font-display`, jamais sous 18 px), corps en Inter. Emojis = contenu (icône d'activité), Lucide = interface.

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
├── chat/[id].tsx      # Chat SignalR (id = eventId) — appui long sur une bulle = bloquer
├── notifications.tsx  # Liste des notifications
├── map.tsx            # Carte des événements
├── forgot-password.tsx / reset-password.tsx
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

**Design tokens :** `mobile/constants/tokens.ts` — mêmes valeurs que la charte web « Le Programme » (`coral` = accent `#c2451c`, `bg` `#f7f4ee`, `success/danger/warn` + surfaces `*L`, `night`). Les noms historiques (`coral`, `coralL`, `bg2`) sont conservés ; jamais de couleur littérale dans les écrans, toujours `T.*`. Pas de thème sombre mobile pour l'instant.

**Builds :** `mobile/eas.json` (profils development / preview / production). Le push exige un `extra.eas.projectId` dans `app.json`, écrit par `eas init` — sans lui `registerForPush` échoue silencieusement.

**Fonts :** DMSans via `@expo-google-fonts/dm-sans` (le paquet ne fournit pas de 600 : `DMSans_600SemiBold` est un alias du 700 dans `app/_layout.tsx`).

## Base de données

**Il n'existe aucune migration EF Core dans le dépôt.** Le schéma est piloté par les fichiers SQL de `supabase/migrations/` (00001 → 00018), appliqués **automatiquement au démarrage de l'API** par `PartnR.Infrastructure/Data/SqlMigrationRunner.cs` :

- chaque fichier est exécuté une seule fois, dans une transaction, et son nom est consigné dans `__PartnrMigrations` ;
- les fichiers doivent être **idempotents** (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`) — le runner ne les protège pas d'un rejeu manuel ;
- `EnsureCreated()` ne s'exécute que sur une base vierge (tests, poste local) : **une donnée seedée via `HasData` doit aussi exister dans une migration SQL, avec les mêmes GUID** (cf. `00015_activity_catalog.sql`).
- Le Dockerfile racine copie `supabase/` dans l'image ; sans ça le runner ne trouve rien et le logge en erreur.

Pour ajouter une table ou une colonne : un nouveau fichier `000NN_nom.sql` + la propriété sur l'entité + sa config dans `AppDbContext`. Jamais `dotnet ef migrations`.

## Tests

```bash
# Backend
cd backend/PartnR.Api.Tests && dotnet test

# Frontend
cd frontend && npm test
```

Tests backend : xUnit + EF Core InMemory. Couvrent EventService, AuthService, ProfileService, RatingService, EventChatService, EventCommentService, EventPhotoService, ReportService, BlockService, UploadService, ImageProcessor, EventReminderService (`RunOnceAsync` avec horloge injectée).
Tests frontend : Vitest + Testing Library. Couvrent AuthContext, EventList, Register, RatingForm.
Mobile : `npx tsc --noEmit` (pas de tests).

Le backend ne se compile que dans la CI GitHub (pas de SDK .NET dans l'environnement Claude) : relire attentivement avant de pousser, puis attendre le job « Backend (build + test) ».

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
