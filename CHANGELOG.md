# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.
Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

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
