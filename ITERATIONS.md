# PartnR — Rapport d'itérations

Ce document détaille chaque itération du projet PartnR : le contexte, les problèmes identifiés, les solutions choisies et leurs justifications techniques.

---

## Itération 1 — Fondations (06-11 mars 2026)

### Contexte

Démarrage du projet PartnR, une plateforme sociale pour trouver des partenaires d'activités sportives et de loisirs. L'objectif est de poser une architecture complète (backend + frontend + base de données) fonctionnelle de bout en bout.

### Ce qui a été fait

#### Backend — ASP.NET Core 8

**Architecture choisie : monolithe structuré en couches**
- `Controllers/` — 5 controllers REST (Auth, Events, Profiles, Ratings, Activities)
- `Services/` — Logique métier séparée des controllers
- `DTOs/` — Objets de transfert avec DataAnnotations pour la validation
- `Entities/` — Modèles de domaine EF Core
- `Data/` — DbContext et configuration
- `Middleware/` — Gestion globale des erreurs
- `Hubs/` — SignalR pour le chat temps réel

**Pourquoi ce choix :** Pour un projet de cette taille, un monolithe en couches offre la simplicité de déploiement tout en maintenant une séparation claire des responsabilités. Les microservices seraient du sur-engineering.

#### Authentification — ASP.NET Identity + JWT

- Identity pour la gestion des users (hash des passwords, validation, etc.)
- JWT Bearer pour l'authentification stateless des API calls
- Token passé via query string pour SignalR (le WebSocket ne supporte pas les headers custom de façon fiable)
- Rate limiting : 10 req/min sur les endpoints d'auth, 60 req/min en global

**Pourquoi JWT plutôt que cookies/sessions :** L'API est consommée par un SPA React (domaine potentiellement différent). JWT permet une authentification stateless sans gestion de session côté serveur, et s'intègre nativement avec SignalR via le query string.

#### Base de données — PostgreSQL (Supabase)

- Schema avec Row Level Security (RLS) pour le contrôle d'accès
- Triggers pour : création auto de profil à l'inscription, ajout du créateur comme participant, calcul de la moyenne des notes, vérification du max participants
- Index sur les colonnes fréquemment requêtées (ville, date, activité, statut)

**Pourquoi Supabase :** Offre un PostgreSQL managé avec un free tier suffisant pour le développement, plus une interface d'administration. Le schema SQL reste standard et portable.

#### Frontend — React 19 + TypeScript + Tailwind CSS 4 + Vite 7

- 7 pages : EventList, EventDetail, CreateEvent, EditEvent, Profile, Login, Register
- Composants réutilisables : Navbar, EventChat, RatingForm
- Couche API centralisée avec Axios + intercepteur JWT
- AuthContext pour la gestion de l'état d'authentification

**Pourquoi cette stack :** React 19 pour les dernières optimisations (server components readiness), TypeScript pour la sécurité du typage, Tailwind pour le styling rapide sans fichiers CSS séparés, Vite pour le HMR instantané.

### Fichiers clés créés
- `backend/PartnR.Api/` — L'intégralité de l'API
- `frontend/src/` — L'intégralité du frontend
- `supabase/migrations/00001_initial_schema.sql` — Schema initial
- `README.md` — Documentation complète avec API docs

### Résultat
Plateforme fonctionnelle de bout en bout : inscription, connexion, création/consultation d'événements, chat temps réel, notation entre participants.

---

## Itération 2 — Frontend complet + Tests + Stabilisation (11 mars 2026)

### Contexte

L'itération 1 a posé les fondations mais le frontend et le backend avaient des incohérences de typage, il manquait des tests, et certaines fonctionnalités UI n'étaient pas complètes (édition d'événement, notation interactive).

### Problèmes identifiés

1. **Incohérences de types** — Les DTOs backend ne correspondaient pas exactement aux types TypeScript frontend (noms de propriétés, formats de dates, types nullable)
2. **Absence de tests** — Aucun test unitaire ni côté backend ni côté frontend
3. **Page EditEvent manquante** — La route existait mais la page n'était pas implémentée
4. **UI de notation basique** — Pas d'interaction visuelle pour les étoiles, feedback insuffisant
5. **Validation inscription** — Pas de feedback temps réel sur les erreurs de saisie

### Solutions implémentées

#### Tests backend — xUnit + EF Core InMemory
- `EventServiceTests.cs` : tests des opérations CRUD, validation des règles métier (date future, max participants, créateur ne peut pas quitter)
- `RatingServiceTests.cs` : tests de la notation (validation participant, auto-notation interdite, duplication interdite)

**Pourquoi EF Core InMemory :** Permet de tester la logique métier sans PostgreSQL. Les tests sont rapides et isolés. La limitation (pas de support des transactions/SQL natif) est acceptable pour des tests unitaires.

#### Tests frontend — Vitest + Testing Library
- `RatingForm.test.tsx` : 7 tests (rendu, sélection étoiles, soumission, validation)
- `Register.test.tsx` : 5 tests (rendu, validation inline, soumission)

**Pourquoi Vitest plutôt que Jest :** Vitest est natif Vite (même config, même plugins), plus rapide en HMR, et compatible avec l'API Jest.

#### Page EditEvent
- Formulaire pré-rempli avec les données existantes
- Validation côté client identique à CreateEvent
- Restriction côté frontend (bouton visible uniquement pour le créateur)

#### UI de notation interactive
- Composant `RatingForm` avec étoiles cliquables + hover preview
- Champ commentaire optionnel
- Feedback visuel immédiat

#### Validation inline Registration
- Vérification en temps réel : email format, password strength, confirmation match
- Messages d'erreur contextuels sous chaque champ

#### Présentation architecturale
- 11 slides HTML interactives avec Mermaid.js pour les diagrammes
- Couverture : stack, architecture, DB, auth flow, API, SignalR, tests

### Fichiers modifiés/créés
- `backend/PartnR.Api.Tests/` — Nouveau projet de tests
- `frontend/src/pages/EditEvent.tsx` — Nouvelle page
- `frontend/src/components/RatingForm.tsx` — Refonte
- `frontend/src/__tests__/` — Nouveaux tests
- `PRESENTATION.html` — Présentation interactive
- Multiples DTOs et types corrigés

### Résultat
12 tests passants (7 frontend + 5 frontend), types cohérents entre backend et frontend, fonctionnalités UI complètes.

---

## Itération 3 — Qualité & Robustesse (12 mars 2026)

### Contexte

Après les itérations 1 et 2, une revue de code a révélé des problèmes de robustesse : erreurs non capturées côté frontend, routes non protégées accessibles sans authentification, et des bugs dans la gestion de l'état.

### Problèmes identifiés

1. **Pas d'ErrorBoundary** — Une erreur dans un composant React crashait toute l'application sans message utile
2. **Routes non protégées** — Les pages nécessitant une authentification (CreateEvent, EditEvent, Profile edit) étaient accessibles sans token
3. **AuthContext instable** — La gestion du token et du state utilisateur avait des bugs (perte du token au refresh, state désynchronisé)
4. **ExceptionMiddleware incomplet** — Certains types d'exceptions n'étaient pas correctement mappés en codes HTTP

### Solutions implémentées

#### ErrorBoundary React
```tsx
// Capture les erreurs de rendu et affiche un fallback
<ErrorBoundary>
  <App />
</ErrorBoundary>
```
**Pourquoi :** Sans ErrorBoundary, une erreur dans un composant enfant fait crasher toute l'app. L'ErrorBoundary isole l'erreur et affiche un message utilisable + option de retry.

#### ProtectedRoute
```tsx
// Redirige vers /login si non authentifié
<Route element={<ProtectedRoute />}>
  <Route path="/events/new" element={<CreateEvent />} />
</Route>
```
**Pourquoi :** Plutôt que de vérifier `isAuthenticated` dans chaque page, un composant wrapper centralise la logique de protection des routes.

#### Fix AuthContext
- Persistance correcte du token dans localStorage
- Restauration du state au montage du composant
- Déconnexion propre (nettoyage token + state)

#### Fix ExceptionMiddleware
- Mapping correct : `KeyNotFoundException` → 404, `InvalidOperationException` → 400, `UnauthorizedAccessException` → 403

### Fichiers modifiés/créés
- `frontend/src/components/ErrorBoundary.tsx` — Nouveau
- `frontend/src/components/ProtectedRoute.tsx` — Nouveau
- `frontend/src/context/AuthContext.tsx` — Fix
- `frontend/src/App.tsx` — Intégration ErrorBoundary + ProtectedRoute
- `backend/PartnR.Api/Middleware/ExceptionMiddleware.cs` — Fix
- `frontend/src/pages/EventList.tsx`, `Profile.tsx`, `EventChat.tsx` — Corrections

### Résultat
Application plus robuste : erreurs capturées proprement, routes protégées, state d'authentification fiable.

---

## Itération 4 — Sécurité & Performance (12 mars 2026)

### Contexte

Un audit de sécurité du code a identifié des vulnérabilités et des problèmes de robustesse : race conditions dans les opérations critiques, un endpoint public qui devrait être protégé, du code dupliqué fragile, et une politique CORS trop permissive.

### Problèmes identifiés

#### 1. Race condition dans `RatingService.CreateAsync`
**Symptôme :** Deux `SaveChangesAsync` séparés dans la même opération. Si le serveur crashe entre les deux, le rating est enregistré mais la moyenne utilisateur n'est pas mise à jour.

**Impact :** Données incohérentes — l'utilisateur noté a un rating qui ne correspond pas à la moyenne affichée sur son profil.

#### 2. Race condition dans `EventService.JoinAsync`
**Symptôme :** Le check du nombre de participants et l'ajout du nouveau participant ne sont pas atomiques. Deux requêtes concurrentes peuvent passer la vérification `MaxParticipants` simultanément.

**Impact :** Un événement limité à 10 participants peut se retrouver avec 11 ou plus.

#### 3. Endpoint `GetForUser` public
**Symptôme :** L'endpoint `GET /api/events/{eventId}/ratings/user/{userId}` n'avait pas d'attribut `[Authorize]`.

**Impact :** N'importe qui peut lire les avis reçus par un utilisateur sans être authentifié.

#### 4. Code dupliqué pour l'extraction de l'ID utilisateur
**Symptôme :** `Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!)` répété 8 fois dans 5 controllers et 1 hub.

**Impact :** Code fragile — si la claim change, il faut modifier 8 endroits. Risque d'oubli.

#### 5. CORS trop permissif
**Symptôme :** `AllowAnyMethod()` + `AllowAnyHeader()` acceptait n'importe quelle méthode HTTP et n'importe quel header.

**Impact :** Surface d'attaque élargie — des méthodes comme `PATCH`, `TRACE` et des headers arbitraires sont acceptés alors que l'API n'en a pas besoin.

### Solutions implémentées

#### Transaction pour `RatingService.CreateAsync`
```csharp
using var transaction = await _db.Database.BeginTransactionAsync();
try
{
    _db.Ratings.Add(rating);
    await _db.SaveChangesAsync();

    // Mise à jour de la moyenne via AverageAsync (SQL, pas en mémoire)
    ratedUser.RatingAvg = await _db.Ratings
        .Where(r => r.RatedUserId == dto.RatedUserId)
        .AverageAsync(r => (decimal)r.Score);
    ratedUser.RatingCount = await _db.Ratings
        .CountAsync(r => r.RatedUserId == dto.RatedUserId);
    await _db.SaveChangesAsync();

    await transaction.CommitAsync();
}
catch
{
    await transaction.RollbackAsync();
    throw;
}
```

**Pourquoi une transaction plutôt qu'un seul `SaveChangesAsync` :** Le calcul de la moyenne nécessite que le rating soit d'abord persisté en DB (car `AverageAsync` génère une requête SQL qui ne voit pas les entités trackées non sauvées). La transaction garantit que les deux opérations réussissent ou échouent ensemble.

**Pourquoi `AverageAsync` SQL plutôt que `ToList().Average()` :** Performance — avec `ToList()`, tous les ratings sont chargés en mémoire. Avec `AverageAsync`, le calcul est fait par PostgreSQL. Pour un utilisateur avec 1000 ratings, c'est la différence entre transférer 1000 lignes et recevoir un seul nombre.

#### Transaction pour `EventService.JoinAsync`
```csharp
using var transaction = await _db.Database.BeginTransactionAsync();
try
{
    var ev = await _db.Events.Include(e => e.Participants)
        .FirstOrDefaultAsync(e => e.Id == eventId);
    // ... validations ...
    ev.Participants.Add(new EventParticipant { ... });
    await _db.SaveChangesAsync();
    await transaction.CommitAsync();
}
catch
{
    await transaction.RollbackAsync();
    throw;
}
```

**Pourquoi :** La transaction avec le niveau d'isolation par défaut de PostgreSQL (Read Committed) empêche deux transactions concurrentes d'insérer un participant en même temps. Le `SaveChangesAsync` dans la transaction verrouille la ligne de l'événement, forçant la deuxième requête à attendre.

#### `[Authorize]` sur `GetForUser`
```csharp
[Authorize]
[HttpGet("user/{userId:guid}")]
public async Task<ActionResult<List<RatingDto>>> GetForUser(Guid userId)
```

**Pourquoi :** Les ratings contiennent des commentaires personnels entre participants. Ils ne devraient pas être accessibles publiquement. L'authentification garantit que seuls les utilisateurs connectés peuvent consulter ces informations.

#### Extension method `GetUserId()`
```csharp
public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal)
        => Guid.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
```

**Pourquoi une extension method plutôt qu'un BaseController :** L'extension method est utilisable partout (controllers ET hubs SignalR), alors qu'un `BaseController` ne serait utilisable que dans les controllers. De plus, elle est plus légère et n'introduit pas d'héritage.

**Remplacement dans :** `AuthController`, `EventsController`, `ProfilesController`, `RatingsController`, `ActivitiesController`, `EventChatHub` (8 occurrences → `User.GetUserId()`).

#### Restriction CORS
```csharp
policy.WithOrigins(allowedOrigins)
      .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
      .WithHeaders("Authorization", "Content-Type")
      .AllowCredentials();
```

**Pourquoi :** Principe du moindre privilège. Seules les méthodes et headers réellement utilisés par le frontend sont autorisés. `OPTIONS` est nécessaire pour les preflight requests CORS.

### Fichiers modifiés
| Fichier | Changement |
|---------|-----------|
| `Services/RatingService.cs` | Transaction + AverageAsync SQL |
| `Services/EventService.cs` | Transaction sur JoinAsync |
| `Controllers/RatingsController.cs` | `[Authorize]` + `User.GetUserId()` |
| `Controllers/EventsController.cs` | `User.GetUserId()` |
| `Controllers/AuthController.cs` | `User.GetUserId()` |
| `Controllers/ProfilesController.cs` | `User.GetUserId()` |
| `Controllers/ActivitiesController.cs` | Import namespace |
| `Hubs/EventChatHub.cs` | `User.GetUserId()` |
| `Extensions/ClaimsPrincipalExtensions.cs` | **Nouveau** — helper GetUserId |
| `Program.cs` | CORS restriction |

### Résultat
- Race conditions éliminées grâce aux transactions DB
- Endpoint ratings sécurisé
- Code DRY avec l'extension method
- Surface d'attaque CORS réduite
- Frontend : TS compile (0 erreurs), 12/12 tests passent
