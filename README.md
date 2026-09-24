# PartnR

Plateforme sociale pour trouver des partenaires d'activités sportives et de loisirs. Organisez des événements, rejoignez des sorties près de chez vous, et échangez avec les participants en temps réel.

## Fonctionnalités

- **Authentification** — Inscription avec confirmation d'email, connexion JWT, mot de passe oublié, verrouillage après 5 échecs, bannissement effectif immédiatement
- **Profils** — Bio, ville (autocomplétion geo.api.gouv.fr), activités favorites, catégorie de profil, notation, suppression de compte
- **Événements** — Création (photo, géolocalisation, récurrence hebdomadaire), recherche par ville / catégorie / activité / texte / rayon, liste d'attente, verrou de place, cycle de vie automatique (Terminé)
- **Vie privée** — L'adresse exacte, les coordonnées précises et la liste des participants ne sont visibles que des inscrits ; les photos sont redimensionnées et débarrassées de leurs métadonnées EXIF/GPS
- **Chat temps réel** — Messagerie de groupe par événement via SignalR (web + mobile), avec notification des absents
- **Notifications** — In-app, push Expo (avec retries) et email : inscription, liste d'attente, annulation, report, rappel J-1
- **Modération** — Signalement d'un profil ou d'un événement, blocage d'utilisateurs, console admin (utilisateurs, événements, signalements)
- **Notation** — Évaluation post-activité entre participants (1-5 étoiles)
- **Analytics** — Tracking d'actions utilisateur (fire-and-forget), dashboard admin avec graphiques
- **Application mobile** — iOS/Android via Expo React Native, parité fonctionnelle avec le web
- **22 activités en 6 catégories** — Sport, Boire & manger, Culture, Balades, Jeux, Engagement

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend web | React 19, TypeScript, Tailwind CSS 4, Vite 7 |
| Application mobile | Expo SDK 51, React Native 0.74, Expo Router v3 |
| Backend API | ASP.NET Core 8, Entity Framework Core |
| Auth | ASP.NET Identity + JWT Bearer |
| Temps réel | SignalR (web + mobile) |
| Base de données | PostgreSQL (Supabase) |
| ORM | EF Core + Npgsql |
| Tests backend | xUnit + EF Core InMemory |
| Tests frontend | Vitest + Testing Library |
| Documentation | Swagger / OpenAPI |

## Structure du projet

```
partnr/
├── backend/
│   ├── PartnR.Api/
│   │   ├── Controllers/        # Endpoints REST
│   │   │   ├── ActivitiesController.cs
│   │   │   ├── AnalyticsController.cs
│   │   │   ├── AuthController.cs
│   │   │   ├── EventsController.cs
│   │   │   ├── ProfilesController.cs
│   │   │   └── RatingsController.cs
│   │   ├── DTOs/               # Objets de transfert + validations
│   │   │   ├── Auth/
│   │   │   ├── Events/
│   │   │   └── Profiles/
│   │   ├── Entities/           # Modèles de domaine
│   │   ├── Data/               # DbContext + configuration EF
│   │   ├── Services/           # Logique métier
│   │   │   ├── AnalyticsService.cs
│   │   │   ├── AnalyticsTracker.cs  # Singleton fire-and-forget
│   │   │   ├── AuthService.cs
│   │   │   ├── EventService.cs
│   │   │   ├── ProfileService.cs
│   │   │   └── RatingService.cs
│   │   ├── Hubs/               # SignalR (chat temps réel)
│   │   ├── Extensions/         # Méthodes d'extension (ClaimsPrincipal)
│   │   ├── Middleware/         # Gestion globale des erreurs
│   │   ├── Program.cs          # Point d'entrée + configuration
│   │   └── appsettings.json    # Configuration
│   └── PartnR.Api.Tests/       # Tests unitaires backend
│       ├── EventServiceTests.cs
│       └── RatingServiceTests.cs
├── frontend/
│   └── src/
│       ├── api/                # Couche API (Axios)
│       ├── components/         # Composants réutilisables
│       │   ├── EventChat.tsx
│       │   ├── Navbar.tsx
│       │   └── RatingForm.tsx
│       ├── context/            # State management (AuthContext)
│       ├── hooks/              # useAnalytics (batching + sendBeacon)
│       ├── pages/              # Pages de l'application
│       │   ├── EventList.tsx
│       │   ├── EventDetail.tsx
│       │   ├── CreateEvent.tsx
│       │   ├── EditEvent.tsx
│       │   ├── Profile.tsx
│       │   ├── Login.tsx
│       │   └── Register.tsx
│       ├── types/              # Types TypeScript
│       └── __tests__/          # Tests frontend
├── mobile/
│   ├── app/                    # Écrans (Expo Router file-based)
│   │   ├── (tabs)/             # Onglets principaux
│   │   │   ├── index.tsx       # Accueil — liste des événements
│   │   │   ├── messages.tsx    # Liste des chats
│   │   │   └── profile.tsx     # Profil utilisateur
│   │   ├── activity/[id].tsx   # Détail d'un événement
│   │   ├── chat/[id].tsx       # Chat temps réel (SignalR)
│   │   ├── create.tsx          # Créer un événement (3 étapes)
│   │   ├── onboarding.tsx      # Onboarding (3 étapes)
│   │   ├── login.tsx           # Connexion
│   │   └── register.tsx        # Inscription
│   ├── api/                    # Couche API (Axios, mêmes endpoints que web)
│   ├── components/             # Composants réutilisables (Avatar, BackBtn, CTAButton…)
│   ├── constants/              # Design tokens (tokens.ts)
│   ├── context/                # AppContext (JWT + user state)
│   ├── hooks/                  # useEventChat (SignalR)
│   └── config.ts               # API_URL
└── supabase/
    └── migrations/
        └── 00001_initial_schema.sql
```

## Pages frontend

| Route | Page | Description |
|-------|------|-------------|
| `/` | EventList | Liste des événements avec filtres (ville, activité) |
| `/events/new` | CreateEvent | Créer un événement (auth requise) |
| `/events/:id` | EventDetail | Détail, participants, chat, notation |
| `/events/:id/edit` | EditEvent | Modifier un événement (créateur uniquement) |
| `/profile/:id` | Profile | Profil utilisateur (vue/édition) |
| `/login` | Login | Connexion |
| `/register` | Register | Inscription avec validation en temps réel |

## API Endpoints

Les erreurs sont renvoyées en JSON `{ "error": "…" }` : 400 (validation, règle métier), 403 (droit insuffisant), 404 (introuvable), 429 (rate limit).

### Authentification (10 req/min par IP)
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/auth/register` | Non | Créer un compte (email de confirmation) |
| POST | `/api/auth/login` | Non | Se connecter (retourne JWT) — 5 échecs = 15 min de verrouillage |
| GET | `/api/auth/me` | Oui | Profil de l'utilisateur connecté |
| POST | `/api/auth/confirm-email` | Non | Confirmer l'adresse email |
| POST | `/api/auth/resend-confirmation` | Non | Renvoyer l'email de confirmation |
| POST | `/api/auth/forgot-password` | Non | Demander un lien de réinitialisation |
| POST | `/api/auth/reset-password` | Non | Réinitialiser le mot de passe |
| POST | `/api/auth/change-password` | Oui | Changer le mot de passe |

### Profils
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/profiles/{id}` | Non | Voir un profil |
| GET | `/api/profiles/{id}/ratings` | Non | Avis reçus par un profil |
| GET | `/api/profiles?city=&activity=` | Non | Rechercher des profils |
| PUT | `/api/profiles/me` | Oui | Modifier son profil |
| DELETE | `/api/profiles/me` | Oui | Supprimer son compte (annule ses événements à venir) |

### Événements
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/events?city=&category=&activityId=&status=&search=&lat=&lng=&radiusKm=&mine=&page=&pageSize=` | Opt | Lister (paginé). Une série récurrente = une carte. Connecté : les événements des personnes bloquées sont masqués |
| GET | `/api/events/{id}` | Opt | Détail. Adresse exacte, coordonnées précises et participants réservés aux inscrits (`locationHidden`) |
| POST | `/api/events` | Oui | Créer (`recurrenceWeeks` pour une série hebdomadaire) |
| PUT | `/api/events/{id}?applyToSeries=` | Oui | Modifier (créateur). Un changement de date notifie les participants |
| DELETE | `/api/events/{id}?applyToSeries=` | Oui | Supprimer (créateur) |
| POST | `/api/events/{id}/join` | Oui | Rejoindre (liste d'attente si complet) |
| POST | `/api/events/{id}/leave` | Oui | Quitter (promeut le premier en attente) |
| GET | `/api/events/{id}/comments` | Non | Questions / réponses publiques |
| POST | `/api/events/{id}/comments` | Oui | Poser une question |
| DELETE | `/api/events/{id}/comments/{commentId}` | Oui | Supprimer (auteur ou créateur) |
| POST | `/api/events/{id}/photos` | Oui | Ajouter une photo (participants) |
| DELETE | `/api/events/{id}/photos/{photoId}` | Oui | Retirer une photo |
| POST | `/api/events/{id}/ratings` | Oui | Noter un participant |
| GET | `/api/events/{id}/ratings/user/{userId}` | Oui | Avis reçus sur cet événement |

### Notifications, blocages, signalements
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/notifications` | Oui | Mes notifications |
| POST | `/api/notifications/read-all` | Oui | Tout marquer lu |
| POST | `/api/notifications/push-token` | Oui | Enregistrer un token Expo push |
| GET | `/api/blocks` | Oui | Personnes que j'ai bloquées |
| POST | `/api/blocks/{userId}` | Oui | Bloquer (masque événements et messages, refuse les inscriptions, dans les deux sens) |
| DELETE | `/api/blocks/{userId}` | Oui | Débloquer |
| POST | `/api/reports` | Oui | Signaler un profil ou un événement |
| GET | `/api/reports` | Admin | Liste des signalements |
| POST | `/api/reports/{id}/resolve` | Admin | Clore un signalement |

### Fichiers, référentiels, santé
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/uploads` | Oui | Envoyer une image (≤ 5 Mo ; redimensionnée à 1600 px max, EXIF supprimé) |
| GET | `/api/uploads/{id}` | Non | Servir une image (cache 1 an) |
| GET | `/api/activities` | Non | Catalogue des activités (avec `category`) |
| GET | `/api/cities` | Non | Villes suggérées |
| GET | `/api/health` | Non | Liveness (sans accès DB) — utilisé par les clients pour réveiller l'API et par le pinger |
| GET | `/api/health/ready` | Non | Readiness : 200 si la base répond, 503 sinon — pour l'alerting |

### Admin et analytics
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/admin/users` | Admin | Utilisateurs |
| POST | `/api/admin/users/{id}/ban` · `/unban` | Admin | Bannir / réhabiliter (les sessions du banni tombent dans la minute) |
| GET | `/api/admin/events` | Admin | Événements |
| POST | `/api/admin/events/{id}/cancel` | Admin | Annuler un événement |
| DELETE | `/api/admin/events/{id}` | Admin | Supprimer un événement |
| POST | `/api/analytics/track` | Oui | Envoyer un lot d'actions utilisateur |
| GET | `/api/analytics/dashboard` | Admin | Données du dashboard |

### SignalR Hub — `/hubs/event-chat`
| Méthode | Direction | Description |
|---------|-----------|-------------|
| `JoinEventChat(eventId)` | Client → Serveur | Rejoindre le chat d'un événement |
| `SendMessage(eventId, content)` | Client → Serveur | Envoyer un message |
| `LeaveEventChat(eventId)` | Client → Serveur | Quitter le chat |
| `MessageHistory(messages)` | Serveur → Client | Historique des messages |
| `NewMessage(message)` | Serveur → Client | Nouveau message reçu |

## Base de données

PostgreSQL hébergé sur Supabase, schéma piloté par EF Core (tables `AspNetUsers`, `Events`, `EventParticipants`, `Messages`, `Ratings`, `EventPhotos`, `EventComments`, `Notifications`, `PushTokens`, `Reports`, `UserBlocks`, `StoredImages`, `UserActions`, `Activities`).

Toutes les règles d'accès sont dans les services de l'API (pas de RLS) : le schéma Supabase historique de `00001_initial_schema.sql` est conservé pour référence.

### Modèle de données

```
AspNetUsers ──1:N── Events (CreatorId)
AspNetUsers ──M:N── Events (via EventParticipants : Confirmed / Waitlisted / Cancelled, ReminderSentAt)
AspNetUsers ──1:N── Messages, EventComments, Notifications, PushTokens, Reports, StoredImages
AspNetUsers ──M:N── AspNetUsers (via UserBlocks)
AspNetUsers ──1:N── Ratings (RaterId / RatedUserId)
Events      ──N:1── Activities (catalogue, avec Category)
Events      ──1:N── Messages, Ratings, EventPhotos, EventComments
Events      ──N:1── Events (RecurrenceGroupId : occurrences d'une série)
```

### Migrations

`supabase/migrations/` contient un fichier SQL idempotent par changement de schéma, appliqué par l'API au démarrage (voir « Initialiser la base Supabase »). Chaque ajout de colonne ou de table côté EF Core doit être accompagné de son fichier ; les données de référence (`HasData`) y sont reproduites avec les mêmes identifiants.

| Fichier | Contenu |
|---------|---------|
| `00001` – `00003` | Schéma initial, tables Identity, analytics |
| `00004` – `00009` | Modération admin, type de profil, photos, géolocalisation, images stockées, notifications |
| `00010` – `00014` | Rappel J-1, questions/réponses, récurrence, signalements, tokens push |
| `00015` | Catalogue de 22 activités en 6 catégories |
| `00016` | Retries push avec backoff |
| `00017` | Rappel J-1 par participant (`EventParticipants.ReminderSentAt`) |
| `00018` | Blocages (`UserBlocks`) |

## Installation

### Prérequis
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/)
- PostgreSQL 15+ (ou compte [Supabase](https://supabase.com))

### Lancer le backend

```bash
cd backend/PartnR.Api

# Configurer la connexion DB dans appsettings.json
# "ConnectionStrings": { "DefaultConnection": "Host=...;Port=5432;Database=partnr;..." }

# Lancer l'API — les migrations SQL de supabase/migrations/ sont appliquées
# automatiquement au démarrage (aucune commande dotnet ef à lancer)
dotnet run
```

L'API sera disponible sur `https://localhost:5001` avec Swagger UI sur `/swagger`.

### Lancer le frontend

```bash
cd frontend

npm install
npm run dev
```

L'application sera disponible sur `http://localhost:5173`.

### Lancer l'application mobile

```bash
cd mobile

npm install

# Lancer Metro Bundler
npx expo start

# Scanner le QR code avec l'app Expo Go (iOS/Android)
# ou appuyer sur 'a' pour Android Emulator, 'i' pour iOS Simulator
```

L'application se connecte par défaut à `https://partnr-p3rv.onrender.com`.
Pour pointer vers un backend local, modifier `mobile/config.ts` :

```typescript
export const API_URL = 'http://YOUR_LOCAL_IP:5001';
```

#### Builds natifs et notifications push (EAS)

Expo Go suffit pour développer, mais les notifications push ont besoin d'un projet EAS (un `projectId` dans `app.json`) et un build natif est nécessaire pour distribuer l'app. Les profils sont dans `mobile/eas.json` :

```bash
cd mobile
npm install -g eas-cli
eas login
eas init                     # crée le projet EAS et écrit extra.eas.projectId dans app.json (à committer)

eas build --profile preview --platform android   # APK installable, partageable par lien
eas build --profile development                   # dev client (hot reload + modules natifs)
eas build --profile production                    # store-ready, version auto-incrémentée
```

Sans `projectId`, `registerForPush` échoue silencieusement et l'app fonctionne sans push.

### Tests

```bash
# Backend
cd backend/PartnR.Api.Tests
dotnet test

# Frontend
cd frontend
npm test
```

### Initialiser la base Supabase

Rien à faire à la main : au premier démarrage, l'API applique dans l'ordre tous les fichiers de `supabase/migrations/` et consigne ceux déjà passés dans la table `__PartnrMigrations`. Pour vérifier, cherchez `Applied SQL migrations` ou `SQL migrations up to date` dans les logs.

### Éviter le cold start (Render free tier)

Render endort l'API après 15 minutes sans trafic ; le réveil prend ~30 s, que les clients masquent avec un écran d'attente. Pour que les visiteurs ne le voient jamais, faites pinger `GET https://partnr-p3rv.onrender.com/api/health` toutes les 10 minutes par un service gratuit (UptimeRobot, cron-job.org, Better Stack). Ce endpoint ne touche pas la base ; pour être alerté d'une vraie panne, surveillez `GET /api/health/ready`, qui renvoie 503 quand PostgreSQL ne répond plus.

## Sécurité

- **Rate limiting partitionné** — par IP (10 req/min sur `/api/auth/*`) puis par utilisateur (60 req/min sur les endpoints marqués `api`, 300 req/min global). `X-Forwarded-For` est honoré sur un seul saut derrière le proxy Render
- **Comptes** — Verrouillage 15 min après 5 échecs de connexion ; bannissement et changement de mot de passe invalident les JWT existants dans la minute (claim `sst` comparé au `SecurityStamp`)
- **Démarrage** — L'API refuse de démarrer hors développement si `Jwt__Key` est absente, trop courte ou encore la valeur d'exemple ; une migration SQL invalide est fatale
- **Uploads** — Type déduit des octets (jamais du header client), image décodée, redimensionnée et ré-encodée : EXIF/GPS supprimés, `nosniff` à la lecture
- **Vie privée** — Détail d'événement dépendant du viewer (adresse, coordonnées arrondies à ~1 km, participants) ; blocage silencieux entre utilisateurs
- **Concurrence** — Inscription et désistement sérialisés par verrou consultatif PostgreSQL (`pg_advisory_xact_lock`)
- **CORS** — Origines configurables (+ `*.vercel.app`), méthodes et headers restreints
- **Validation** — DataAnnotations côté backend + validation inline côté clients ; les redirections post-login sont limitées aux chemins internes

## Variables d'environnement

**Backend (ASP.NET Core)**

| Variable | Description | Défaut |
|----------|-------------|--------|
| `ConnectionStrings__DefaultConnection` | Chaîne de connexion PostgreSQL | `localhost` |
| `Jwt__Key` | Clé secrète JWT (min 32 caractères) | À changer |
| `Jwt__Issuer` | Émetteur du token | `PartnR.Api` |
| `Jwt__Audience` | Audience du token | `PartnR.Client` |
| `Jwt__ExpireMinutes` | Durée de validité du token | `1440` (24h) |
| `Cors__AllowedOrigins__0` | Origine CORS autorisée | `http://localhost:5173` |

**Frontend web**

| Variable | Description | Défaut |
|----------|-------------|--------|
| `VITE_API_URL` | URL du backend | `http://localhost:5001` |

**Mobile (Expo)**

| Fichier | Variable | Description |
|---------|----------|-------------|
| `mobile/config.ts` | `API_URL` | URL du backend (modifiable directement) |

## Licence

MIT
