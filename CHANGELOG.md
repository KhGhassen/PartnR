# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.
Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Itération 9] — 2026-04-29

### Mobile — Chat temps réel
- Nouveau hook `useEventChat(eventId)` — connexion SignalR, `JoinEventChat`, `SendMessage`, `LeaveEventChat` avec nettoyage sur démontage
- Authentification SignalR via `?access_token=` en query string (WebSocket ne supporte pas Authorization header)
- Reconnexion automatique (`withAutomaticReconnect`) et gestion des erreurs (not a participant → message localisé)
- Nouvel écran `app/chat/[id].tsx` — bulles coral (soi) / blanches (autres), nom de l'expéditeur, timestamps, input désactivé en attendant la connexion
- Écran `app/(tabs)/messages.tsx` — liste des événements comme salles de chat

### Backend
- `GET /api/events?mine=true` — filtre les événements où l'utilisateur connecté est participant confirmé
- Paramètre `mine` optionnel (bool) dans `EventsController.List` + `EventService.ListAsync`, sans authentification requise (ignoré si non authentifié)

## [Itération 8] — 2026-04-29

### Mobile — Auth + Intégration API réelle
- `AppContext` refondu : `token`, `user` (UserInfo), `isLoading`, `login()`, `logout()` avec persistance SecureStore
- `api/client.ts` — instance Axios avec intercepteur JWT (Bearer token) + gestion auto-logout sur 401
- `api/auth.ts` — `login()` + `register()` → `AuthResponse { token, user }`
- `api/events.ts` — `listEvents()`, `getEvent()`, `joinEvent()`, `leaveEvent()`, `createEvent()`
- `api/profiles.ts` — `getProfile()`, `updateMyProfile()`
- `api/activities.ts` — `listActivities()`
- Écrans `login.tsx` + `register.tsx` — formulaires avec validation, gestion d'erreurs API
- Écran `onboarding.tsx` — flux 3 étapes → redirige vers register avec `pendingName` pré-rempli
- Écrans `(tabs)/index.tsx`, `activity/[id].tsx`, `(tabs)/profile.tsx`, `create.tsx` connectés à l'API réelle

## [Itération 7] — 2026-04-14

### Mobile — Application Expo React Native
- Initialisation du projet Expo SDK 51 + Expo Router v3 dans `mobile/`
- Navigation par onglets (Accueil, Messages, Profil) avec FAB "Créer" central en coral
- Design system : tokens de couleur (`constants/tokens.ts`), typographie DM Sans
- 8 écrans prototypés : Onboarding (3 étapes), Login, Register, Accueil, Détail événement, Créer activité (3 étapes), Messages, Profil
- Composants réutilisables : `Avatar`, `BackBtn`, `CTAButton`, `CustomTabBar`
- Config backend : `mobile/config.ts` avec `API_URL = 'https://partnr-p3rv.onrender.com'`
- Dépendances ajoutées : `expo-secure-store`, `axios`, `@microsoft/signalr`

## [Itération 6] — 2026-04-14

### Backend — Module Analytics
- Nouveau `AnalyticsController` avec 3 endpoints : summary, events/jour, top actions
- `AnalyticsService` (Scoped) — agrégations EF Core sur `AnalyticsEvents`
- `AnalyticsTracker` (Singleton) — tracking fire-and-forget via `IServiceScopeFactory`, sans bloquer les requêtes
- Entité `AnalyticsEvent` : userId, action, entityType, entityId, timestamp
- Tracking automatique : `event_created`, `event_joined`, `event_left`, `event_deleted`, `message_sent`, `user_registered`, `user_login`
- CORS élargi pour accepter les origines `*.vercel.app` en production

## [Itération 5] — 2026-03-30

### Infrastructure
- Ajout de Docker : `Dockerfile` backend/frontend, `docker-compose.yml` avec PostgreSQL, Nginx reverse proxy
- Ajout de GitHub Actions CI/CD (`.github/workflows/ci.yml`) : build + test backend et frontend sur push/PR
- Ajout de `.env.example` pour la gestion des variables d'environnement (JWT, DB, CORS)
- Intégration de Serilog pour le logging structuré (console + fichiers rotatifs 14 jours)
- Redirection HTTPS en production (`UseHttpsRedirection`)

### Frontend
- Pagination de la liste d'événements avec navigation (Précédent/Suivant, numéro de page)
- Gestion d'erreurs API améliorée : messages localisés FR pour 400, 401, 403, 404, 429, 500, timeout, erreur réseau
- Bouton « Réessayer » sur les erreurs de chargement dans `EventList`
- Timeout API configuré à 15 secondes

### Backend
- API de pagination : `PaginatedResult<T>` avec `page`, `pageSize`, `totalCount`, `totalPages`, `hasNextPage`
- Limite de l'historique chat à 100 derniers messages dans `EventChatHub.JoinEventChat`
- Rate limiting `[EnableRateLimiting("api")]` sur les endpoints de recherche (events, profiles)

### Tests
- Nouveaux tests backend : `ProfileServiceTests` (5 tests), `AuthServiceTests` (5 tests)
- Nouveaux tests frontend : `EventList.test.tsx` (5 tests), `AuthContext.test.tsx` (4 tests)
- Fix `EventServiceTests.ListAsync_FiltersbyCity` pour `PaginatedResult` + 2 tests pagination

### Sécurité
- Sanitisation HTML des messages chat (`WebUtility.HtmlEncode`) contre XSS stocké
- Rate limiting granulaire sur les endpoints de recherche publics
- Logging structuré des erreurs avec contexte de requête (méthode + path)

## [Itération 4] — 2026-03-12

### Sécurité
- Ajout de transactions DB dans `RatingService.CreateAsync` pour garantir l'atomicité (rating + mise à jour moyenne)
- Ajout de transactions DB dans `EventService.JoinAsync` pour empêcher les race conditions sur `MaxParticipants`
- Sécurisation de l'endpoint `GET /api/events/{eventId}/ratings/user/{userId}` avec `[Authorize]`
- Restriction de la politique CORS : méthodes et headers explicitement listés au lieu de `AllowAny`

### Refactoring
- Création de `ClaimsPrincipalExtensions.GetUserId()` pour centraliser l'extraction de l'ID utilisateur
- Remplacement de 8 occurrences de `Guid.Parse(User.FindFirstValue(...))` dans tous les controllers et hubs
- Calcul de la moyenne des ratings via `AverageAsync` SQL au lieu de charger tous les ratings en mémoire

## [Itération 3] — 2026-03-12

### Ajouté
- `ErrorBoundary` React pour capturer les erreurs de rendu
- Composant `ProtectedRoute` pour protéger les routes authentifiées

### Corrigé
- Fix du `AuthContext` (gestion du state et du token)
- Fix du `ExceptionMiddleware` (gestion correcte des erreurs)
- Corrections diverses dans `EventList.tsx`, `Profile.tsx`, `EventChat.tsx`, `App.tsx`

## [Itération 2] — 2026-03-11

### Ajouté
- Page `EditEvent` pour modifier un événement (créateur uniquement)
- UI de notation avec étoiles interactives (`RatingForm`)
- Tests unitaires backend (`EventServiceTests`, `RatingServiceTests`) avec EF Core InMemory
- Tests frontend (`RatingForm.test.tsx`, `Register.test.tsx`) avec Vitest + Testing Library
- Validation inline temps réel sur le formulaire d'inscription
- Présentation architecturale interactive (11 slides HTML)

### Corrigé
- Fix des types backend (DTOs, entités) pour correspondance avec le frontend
- Corrections de typage TypeScript dans les composants React

## [Itération 1] — 2026-03-06 → 2026-03-11

### Ajouté
- **Backend ASP.NET Core 8** : 5 controllers REST (Auth, Events, Profiles, Ratings, Activities)
- **Authentification** : ASP.NET Identity + JWT Bearer avec rate limiting (10 req/min auth, 60 req/min global)
- **Services métier** : AuthService, EventService, ProfileService, RatingService
- **SignalR Hub** : Chat temps réel par événement (`EventChatHub`)
- **Base de données** : Schema PostgreSQL avec RLS, triggers, index — migration Supabase
- **Frontend React 19** : 7 pages (EventList, EventDetail, CreateEvent, EditEvent, Profile, Login, Register)
- **Composants** : Navbar, EventChat, RatingForm
- **API client** : Couche Axios avec intercepteur JWT
- **State management** : AuthContext avec persistance du token
- **10 activités** : Running, Randonnée, Vélo, Jeux de société, Tennis, Yoga, Natation, Escalade, Football, Badminton
- **Documentation** : README complet avec API docs, schéma de données, guide d'installation
- **Swagger/OpenAPI** : Documentation interactive de l'API
