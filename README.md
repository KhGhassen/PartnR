# PartnR

Plateforme sociale pour trouver des partenaires d'activités sportives et de loisirs. Organisez des événements, rejoignez des sorties près de chez vous, et échangez avec les participants en temps réel.

## Fonctionnalités

- **Authentification** — Inscription, connexion, JWT avec rate limiting
- **Profils** — Bio, ville, activités favorites, système de notation
- **Événements** — Création, modification, recherche par ville/activité, gestion des participants (2-50)
- **Chat temps réel** — Messagerie de groupe par événement via SignalR
- **Notation** — Évaluation post-activité entre participants (1-5 étoiles) avec UI dédiée
- **10 activités** — Running, Randonnée, Vélo, Jeux de société, Tennis, Yoga, Natation, Escalade, Football, Badminton

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 19, TypeScript, Tailwind CSS 4, Vite 7 |
| Backend API | ASP.NET Core 8, Entity Framework Core |
| Auth | ASP.NET Identity + JWT Bearer |
| Temps réel | SignalR |
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
│   │   ├── Hubs/               # SignalR (chat temps réel)
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

### Authentification (rate limited: 10 req/min)
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/auth/register` | Non | Créer un compte |
| POST | `/api/auth/login` | Non | Se connecter (retourne JWT) |
| GET | `/api/auth/me` | Oui | Profil de l'utilisateur connecté |

### Profils
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/profiles/{id}` | Non | Voir un profil |
| GET | `/api/profiles?city=&activity=` | Non | Rechercher des profils |
| PUT | `/api/profiles/me` | Oui | Modifier son profil |

### Événements
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/events?city=&activityId=&status=` | Non | Lister les événements |
| GET | `/api/events/{id}` | Non | Détail d'un événement |
| POST | `/api/events` | Oui | Créer un événement |
| PUT | `/api/events/{id}` | Oui | Modifier (créateur uniquement) |
| DELETE | `/api/events/{id}` | Oui | Supprimer (créateur uniquement) |
| POST | `/api/events/{id}/join` | Oui | Rejoindre un événement |
| POST | `/api/events/{id}/leave` | Oui | Quitter un événement |

### Notations
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/events/{eventId}/ratings` | Oui | Noter un participant |
| GET | `/api/events/{eventId}/ratings/user/{userId}` | Non | Voir les avis reçus |

### Activités
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/activities` | Non | Liste des activités disponibles |

### SignalR Hub — `/hubs/event-chat`
| Méthode | Direction | Description |
|---------|-----------|-------------|
| `JoinEventChat(eventId)` | Client → Serveur | Rejoindre le chat d'un événement |
| `SendMessage(eventId, content)` | Client → Serveur | Envoyer un message |
| `LeaveEventChat(eventId)` | Client → Serveur | Quitter le chat |
| `MessageHistory(messages)` | Serveur → Client | Historique des messages |
| `NewMessage(message)` | Serveur → Client | Nouveau message reçu |

## Base de données

Le schéma PostgreSQL inclut :
- **Row Level Security (RLS)** — Contrôle d'accès par utilisateur
- **Triggers** — Création auto de profil, ajout du créateur comme participant, calcul de la moyenne des notes, vérification du nombre max de participants
- **Index** — Sur les colonnes fréquemment requêtées (ville, date, activité, statut)

### Modèle de données

```
profiles ──1:N── events (créateur)
profiles ──M:N── events (via event_participants)
profiles ──1:N── messages
profiles ──1:N── ratings (rater / rated)
events   ──N:1── activities
events   ──1:N── messages
events   ──1:N── ratings
```

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

# Appliquer les migrations
dotnet ef database update

# Lancer l'API
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

Si vous utilisez Supabase, exécutez le fichier de migration dans l'éditeur SQL :

```
supabase/migrations/00001_initial_schema.sql
```

## Sécurité

- **Rate limiting** — Auth endpoints: 10 req/min, API globale: 60 req/min
- **CORS** — Origines configurables via `Cors:AllowedOrigins` dans appsettings
- **Validation** — DataAnnotations côté backend + validation inline côté frontend
- **JWT** — Tokens signés avec expiration configurable

## Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `ConnectionStrings__DefaultConnection` | Chaîne de connexion PostgreSQL | `localhost` |
| `Jwt__Key` | Clé secrète JWT (min 32 caractères) | À changer |
| `Jwt__Issuer` | Émetteur du token | `PartnR.Api` |
| `Jwt__Audience` | Audience du token | `PartnR.Client` |
| `Jwt__ExpireMinutes` | Durée de validité du token | `1440` (24h) |
| `Cors__AllowedOrigins__0` | Origine CORS autorisée | `http://localhost:5173` |

## Licence

MIT
