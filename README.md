# 🌿 EcoGarbage — Plateforme de Collecte de Déchets à la Demande

> Application fullstack complète (React + Node.js + MySQL) pour la gestion intelligente de la collecte de déchets.  
> Développée par **[Xhris Dior](https://xhris84.netlify.app/)** 🚀

---

## 📋 Sommaire

1. [Présentation du projet](#-présentation-du-projet)
2. [Stack technique](#-stack-technique)
3. [Structure du projet](#-structure-du-projet)
4. [Prérequis](#-prérequis)
5. [Installation & Configuration](#-installation--configuration)
6. [Lancer le projet en développement](#-lancer-le-projet-en-développement)
7. [Rôles et accès](#-rôles-et-accès)
8. [Routes API — Documentation](#-routes-api--documentation)
9. [Pages frontend](#-pages-frontend)
10. [Variables d'environnement](#-variables-denvironnement)
11. [Déploiement en production](#-déploiement-en-production)
12. [Compte de test](#-compte-de-test)

---

## 🌍 Présentation du projet

**EcoGarbage** est une plateforme numérique de collecte de déchets à la demande qui connecte :
- 👤 **Les utilisateurs** (particuliers, entreprises) qui souhaitent faire collecter leurs déchets
- 🚛 **Les collecteurs** qui reçoivent et exécutent les tâches de collecte
- 🛡️ **Les administrateurs** qui supervisent les opérations, gèrent les utilisateurs et analysent les performances

### Fonctionnalités principales
- ✅ Inscription et connexion par rôle (Utilisateur / Collecteur / Admin)
- ✅ Création de demandes de collecte avec catégorie, adresse, créneau, quantité
- ✅ Suivi des statuts en temps quasi réel (pending → assigned → on_way → completed)
- ✅ Assignation manuelle ou automatique des collecteurs
- ✅ Système de paiement (mobile money, carte, espèces)
- ✅ Notation des collecteurs (1–5 étoiles)
- ✅ Réclamations et système de support
- ✅ Notifications in-app
- ✅ Dashboard admin avec rapports et graphiques (Recharts)
- ✅ Interface responsive (mobile, tablette, desktop)

---

## 🛠 Stack technique

### Backend
| Techno | Rôle |
|--------|------|
| **Node.js + Express** | Serveur API REST |
| **MySQL 8** | Base de données relationnelle |
| **mysql2** | Driver MySQL pour Node.js |
| **bcryptjs** | Hashage des mots de passe |
| **jsonwebtoken** | Authentification JWT |
| **express-validator** | Validation des données |
| **multer** | Upload de fichiers |
| **morgan** | Logs des requêtes HTTP |
| **dotenv** | Variables d'environnement |
| **uuid** | Génération d'identifiants uniques |

### Frontend
| Techno | Rôle |
|--------|------|
| **React 18** | Framework UI |
| **Vite** | Build tool ultra-rapide |
| **React Router v6** | Navigation SPA |
| **Tailwind CSS v3** | Styling utilitaire |
| **Axios** | Client HTTP |
| **Recharts** | Graphiques et charts |
| **react-hot-toast** | Notifications toast |
| **lucide-react** | Icônes SVG |
| **date-fns** | Manipulation des dates |

---

## 📁 Structure du projet

```
eco-garbage-app/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js              # Pool de connexions MySQL
│   │   │   └── initDb.js          # Script d'initialisation BDD + données de départ
│   │   ├── controllers/
│   │   │   ├── authController.js       # Register, Login, Profile
│   │   │   ├── requestController.js    # CRUD demandes de collecte
│   │   │   ├── adminController.js      # Dashboard, users, rapports
│   │   │   └── miscController.js       # Notifications, paiements, notes, réclamations, collecteur
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT middleware + guard par rôle
│   │   ├── routes/
│   │   │   └── index.js           # Toutes les routes API
│   │   └── server.js              # Point d'entrée Express
│   ├── uploads/                   # Dossier pour les fichiers uploadés (créé automatiquement)
│   ├── .env.example               # Template des variables d'environnement
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/index.jsx        # Composants réutilisables (Modal, Table, Spinner…)
│   │   │   └── layout/
│   │   │       ├── PublicLayout.jsx    # Layout pages publiques (navbar + footer)
│   │   │       └── DashboardLayout.jsx # Layout dashboard (sidebar + topbar)
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Contexte d'authentification global
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   └── RegisterPage.jsx
│   │   │   ├── user/
│   │   │   │   ├── Dashboard.jsx       # Tableau de bord utilisateur
│   │   │   │   ├── NewRequest.jsx      # Création d'une demande
│   │   │   │   ├── MyRequests.jsx      # Liste des demandes
│   │   │   │   ├── RequestDetail.jsx   # Détail + timeline + notation
│   │   │   │   ├── Payments.jsx        # Historique paiements
│   │   │   │   ├── Complaints.jsx      # Réclamations
│   │   │   │   ├── Notifications.jsx   # Centre de notifications
│   │   │   │   └── Profile.jsx         # Profil + changement mot de passe
│   │   │   ├── collector/
│   │   │   │   ├── Dashboard.jsx       # Dashboard collecteur + toggle dispo
│   │   │   │   ├── Tasks.jsx           # Liste des tâches filtrées
│   │   │   │   └── TaskDetail.jsx      # Détail tâche + actions de statut
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.jsx       # KPIs + récents + top collecteurs
│   │   │   │   ├── Users.jsx           # Gestion utilisateurs + suspension
│   │   │   │   ├── Requests.jsx        # Toutes les collectes + assignation
│   │   │   │   ├── Categories.jsx      # CRUD catégories de déchets
│   │   │   │   ├── Complaints.jsx      # Réponse aux réclamations
│   │   │   │   └── Reports.jsx         # Graphiques Recharts (line, bar, pie)
│   │   │   └── LandingPage.jsx         # Page d'accueil publique
│   │   ├── services/
│   │   │   └── api.js             # Client Axios + tous les appels API
│   │   ├── styles/
│   │   │   └── index.css          # Tailwind + classes custom
│   │   ├── App.jsx                # Routeur principal + guards
│   │   └── main.jsx               # Point d'entrée React
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

---

## ✅ Prérequis

Assurez-vous d'avoir installé sur votre machine :

- **Node.js** v18 ou supérieur → [nodejs.org](https://nodejs.org)
- **npm** v9 ou supérieur (inclus avec Node.js)
- **MySQL** v8 ou supérieur → [mysql.com](https://dev.mysql.com/downloads/)
- **Git** → [git-scm.com](https://git-scm.com)

Vérifiez les versions :
```bash
node --version   # v18.x.x ou supérieur
npm --version    # 9.x.x ou supérieur
mysql --version  # 8.x.x
```

---

## ⚙️ Installation & Configuration

### 1. Extraire le projet

Décompressez le fichier ZIP et accédez au dossier :
```bash
unzip eco-garbage-app.zip
cd eco-garbage-app
```

### 2. Configurer le backend

```bash
cd backend
cp .env.example .env
```

Ouvrez le fichier `.env` et renseignez vos valeurs :
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=VOTRE_MOT_DE_PASSE_MYSQL
DB_NAME=eco_garbage_db

JWT_SECRET=changez_ce_secret_avec_une_longue_chaine_aleatoire_securisee
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:5173
```

> ⚠️ **Important** : Changez impérativement `JWT_SECRET` pour une vraie valeur sécurisée en production.

### 3. Installer les dépendances backend

```bash
# Depuis le dossier backend/
npm install
```

### 4. Initialiser la base de données

Assurez-vous que MySQL est démarré, puis exécutez :
```bash
npm run db:init
```

Ce script va :
- Créer la base de données `eco_garbage_db`
- Créer toutes les tables (users, pickup_requests, waste_categories, payments…)
- Insérer les catégories de déchets par défaut (9 catégories)
- Insérer les zones de service (Yaoundé, Abidjan)
- Créer le compte administrateur par défaut

### 5. Configurer le frontend

```bash
cd ../frontend
```

Le frontend est déjà configuré pour pointer vers `http://localhost:5000` via le proxy Vite.  
Aucun fichier `.env` n'est nécessaire en développement.

### 6. Installer les dépendances frontend

```bash
# Depuis le dossier frontend/
npm install
```

---

## 🚀 Lancer le projet en développement

Ouvrez **deux terminaux** côte à côte :

### Terminal 1 — Backend API
```bash
cd eco-garbage-app/backend
npm run dev
```
Output attendu :
```
🚀 Serveur EcoGarbage démarré sur http://localhost:5000
📋 Mode: development
✅ Base de données MySQL connectée
```

### Terminal 2 — Frontend React
```bash
cd eco-garbage-app/frontend
npm run dev
```
Output attendu :
```
  VITE v5.x.x  ready in 300 ms
  ➜  Local:   http://localhost:5173/
```

Ouvrez votre navigateur sur **http://localhost:5173** 🎉

---

## 👥 Rôles et accès

| Rôle | Accès | Description |
|------|-------|-------------|
| `user` | `/dashboard/*` | Particuliers et entreprises qui demandent des collectes |
| `collector` | `/collector/*` | Agents qui exécutent les collectes |
| `admin` | `/admin/*` | Administrateurs qui supervisent toute la plateforme |

### Compte admin par défaut
```
Email    : admin@eco-garbage.com
Password : Admin1234!
```

> ⚠️ **Changez ce mot de passe immédiatement en production !**

### Créer un compte utilisateur ou collecteur
Rendez-vous sur **http://localhost:5173/register** et sélectionnez le rôle souhaité.

---

## 📡 Routes API — Documentation

Base URL : `http://localhost:5000/api`

### 🔐 Authentification

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| POST | `/auth/register` | Inscription (user/collector) | ❌ |
| POST | `/auth/login` | Connexion | ❌ |
| GET | `/auth/me` | Profil de l'utilisateur connecté | ✅ |
| PUT | `/auth/profile` | Modifier son profil | ✅ |
| PUT | `/auth/password` | Changer son mot de passe | ✅ |

#### Exemple — Register
```json
POST /api/auth/register
{
  "name": "Jean Dupont",
  "email": "jean@exemple.com",
  "phone": "+237600000001",
  "password": "MotDePasse123",
  "role": "user"
}
```

#### Exemple — Login
```json
POST /api/auth/login
{
  "email": "admin@eco-garbage.com",
  "password": "Admin1234!"
}
// Réponse : { success: true, data: { token: "...", user: {...} } }
```

### 📋 Demandes de collecte

| Méthode | Route | Description | Rôle |
|---------|-------|-------------|------|
| GET | `/requests` | Lister les demandes | user/collector/admin |
| POST | `/requests` | Créer une demande | user |
| GET | `/requests/:uuid` | Détail d'une demande | user/collector/admin |
| PUT | `/requests/:uuid/status` | Mettre à jour le statut | collector/admin |
| PUT | `/requests/:uuid/assign` | Assigner un collecteur | admin |
| DELETE | `/requests/:uuid` | Annuler une demande | user |

#### Exemple — Créer une demande
```json
POST /api/requests
Headers: Authorization: Bearer <token>
{
  "category_id": 1,
  "service_type": "immediate",
  "address": "123 Rue Bastos, Yaoundé",
  "quantity_estimate": "3 sacs",
  "notes": "Portail bleu, sonner 2 fois"
}
```

#### Paramètres de filtre (GET /requests)
```
?status=pending       # Filtrer par statut
?page=1&limit=10      # Pagination
```

### 🔔 Notifications

| Méthode | Route | Description | Rôle |
|---------|-------|-------------|------|
| GET | `/notifications` | Lister les notifications | ✅ tous |
| PUT | `/notifications/read-all` | Tout marquer lu | ✅ tous |

### ⭐ Évaluations

| Méthode | Route | Description | Rôle |
|---------|-------|-------------|------|
| POST | `/ratings` | Évaluer un collecteur | user |

```json
POST /api/ratings
{
  "request_uuid": "uuid-de-la-demande",
  "score": 5,
  "comment": "Très professionnel !"
}
```

### 💬 Réclamations

| Méthode | Route | Description | Rôle |
|---------|-------|-------------|------|
| GET | `/complaints/mine` | Mes réclamations | user |
| POST | `/complaints` | Créer une réclamation | user/collector |

### 💳 Paiements

| Méthode | Route | Description | Rôle |
|---------|-------|-------------|------|
| GET | `/payments` | Mes paiements | user |
| POST | `/payments/pay` | Enregistrer un paiement | user |

### 🚛 Collecteur

| Méthode | Route | Description | Rôle |
|---------|-------|-------------|------|
| GET | `/collector/tasks` | Mes tâches assignées | collector |
| GET | `/collector/stats` | Mes statistiques | collector |
| PUT | `/collector/availability` | Changer disponibilité | collector |

### 🛡️ Administration

| Méthode | Route | Description | Rôle |
|---------|-------|-------------|------|
| GET | `/admin/dashboard` | KPIs et données admin | admin |
| GET | `/admin/users` | Lister les utilisateurs | admin |
| PUT | `/admin/users/:id/status` | Suspendre/Activer un compte | admin |
| GET | `/admin/requests` | Toutes les collectes | admin |
| GET | `/admin/complaints` | Toutes les réclamations | admin |
| PUT | `/admin/complaints/:uuid` | Répondre à une réclamation | admin |
| GET | `/admin/reports` | Rapports analytiques | admin |
| GET | `/admin/categories` | Lister les catégories | admin |
| POST | `/admin/categories` | Créer une catégorie | admin |
| PUT | `/admin/categories/:id` | Modifier une catégorie | admin |

#### Paramètres rapports
```
GET /api/admin/reports?period=week    # 7 jours
GET /api/admin/reports?period=month   # 30 jours (défaut)
GET /api/admin/reports?period=year    # 365 jours
```

### 🏷️ Catégories (public)

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/categories` | Lister les catégories actives | ❌ |

---

## 🖥️ Pages frontend

### Pages publiques
| Route | Page |
|-------|------|
| `/` | Landing page (hero, services, tarifs, témoignages) |
| `/login` | Connexion |
| `/register` | Inscription (sélection de rôle) |

### Dashboard utilisateur
| Route | Page |
|-------|------|
| `/dashboard` | KPIs, demandes récentes, actions rapides |
| `/dashboard/new-request` | Formulaire de création de demande |
| `/dashboard/requests` | Liste de toutes mes demandes avec filtres |
| `/dashboard/requests/:uuid` | Détail, timeline, notation, annulation |
| `/dashboard/payments` | Historique des paiements |
| `/dashboard/complaints` | Mes réclamations + création |
| `/dashboard/notifications` | Centre de notifications |
| `/dashboard/profile` | Modifier profil + changer mot de passe |

### Dashboard collecteur
| Route | Page |
|-------|------|
| `/collector` | KPIs, toggle disponibilité, tâches récentes |
| `/collector/tasks` | Liste de mes tâches avec filtres par statut |
| `/collector/tasks/:uuid` | Détail tâche + actions (En route / Arrivé / Complété / Signaler) |
| `/collector/notifications` | Notifications |
| `/collector/profile` | Profil |

### Dashboard admin
| Route | Page |
|-------|------|
| `/admin` | KPIs globaux, demandes récentes, top collecteurs |
| `/admin/users` | Gestion des utilisateurs (filtres, suspension) |
| `/admin/requests` | Toutes les collectes + assignation manuelle |
| `/admin/categories` | CRUD catégories de déchets |
| `/admin/complaints` | Réclamations + réponses admin |
| `/admin/reports` | Graphiques analytiques (LineChart, BarChart, PieChart) |
| `/admin/notifications` | Notifications |
| `/admin/profile` | Profil admin |

---

## 🔧 Variables d'environnement

### Backend (.env)

```env
# ── Serveur ──────────────────────────────
PORT=5000
NODE_ENV=development         # development | production

# ── Base de données ───────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mdp
DB_NAME=eco_garbage_db

# ── JWT ───────────────────────────────────
# Générez un secret fort : openssl rand -hex 64
JWT_SECRET=votre_secret_jwt_ultra_long_et_securise
JWT_EXPIRES_IN=7d            # 1h | 24h | 7d

# ── CORS ─────────────────────────────────
FRONTEND_URL=http://localhost:5173

# ── Uploads ──────────────────────────────
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880        # 5 MB en bytes
```

---

## 🌐 Déploiement en production

### Option 1 — Railway (Backend) + Vercel (Frontend)

#### Backend sur Railway
1. Créez un compte sur [railway.app](https://railway.app)
2. Créez un nouveau projet → "Deploy from GitHub"
3. Ajoutez un plugin **MySQL** dans Railway
4. Configurez les variables d'environnement dans Railway (copiez depuis `.env.example`)
5. Dans les variables Railway, mettez `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` avec les valeurs générées par Railway
6. Définissez `FRONTEND_URL` avec l'URL de votre frontend Vercel
7. Après déploiement, exécutez `npm run db:init` via le shell Railway

```bash
# Commande de démarrage en production
npm start
```

#### Frontend sur Vercel
1. Créez un compte sur [vercel.com](https://vercel.com)
2. Importez le dossier `frontend/`
3. Framework preset : **Vite**
4. Ajoutez la variable d'environnement :
   ```
   VITE_API_URL=https://votre-backend.railway.app
   ```
5. Dans `frontend/src/services/api.js`, remplacez `baseURL: '/api'` par `baseURL: import.meta.env.VITE_API_URL + '/api'`

### Option 2 — VPS (Contabo / Hostinger)

#### Prérequis VPS
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm mysql-server nginx git
```

#### Backend
```bash
cd /var/www/eco-garbage-app/backend
cp .env.example .env
# Éditez .env avec vos valeurs de production
npm install --production
npm run db:init

# PM2 pour garder le process actif
npm install -g pm2
pm2 start src/server.js --name eco-garbage-api
pm2 startup && pm2 save
```

#### Frontend
```bash
cd /var/www/eco-garbage-app/frontend
npm install
npm run build
# Les fichiers sont dans dist/
```

#### Nginx config
```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    # Frontend
    location / {
        root /var/www/eco-garbage-app/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads
    location /uploads {
        proxy_pass http://localhost:5000/uploads;
    }
}
```

```bash
sudo systemctl reload nginx
# Optionnel : Certbot pour HTTPS
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

---

## 🧪 Compte de test

Après initialisation de la base de données, les comptes suivants sont disponibles :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | `admin@eco-garbage.com` | `Admin1234!` |

Pour tester les rôles **Utilisateur** et **Collecteur**, créez des comptes via la page `/register`.

---

## 🗄️ Schéma de la base de données

### Tables principales

```
users               → Tous les comptes (user / collector / admin)
collector_profiles  → Profil étendu des collecteurs
waste_categories    → Types de déchets avec tarifs
service_areas       → Zones géographiques desservies
pickup_requests     → Demandes de collecte (cœur du système)
payments            → Transactions financières
ratings             → Évaluations des collecteurs
complaints          → Réclamations des utilisateurs
notifications       → Alertes et messages in-app
```

### Cycle de vie d'une demande

```
pending → approved → assigned → on_way → in_progress → completed
                                                     ↘ cancelled / failed
```

---

## 🤝 Contribuer

1. Forkez le projet
2. Créez une branche : `git checkout -b feature/nouvelle-fonctionnalite`
3. Committez : `git commit -m "feat: description de la fonctionnalité"`
4. Pushez : `git push origin feature/nouvelle-fonctionnalite`
5. Ouvrez une Pull Request

---

## 📄 Licence

Ce projet est sous licence MIT — vous êtes libre de l'utiliser, le modifier et le distribuer.

---

## 👨‍💻 Développeur

<div align="center">

**Xhris Dior**  
Développeur Fullstack  
🌐 [xhris84.netlify.app](https://xhris84.netlify.app/)

*Développé avec ❤️ pour EcoGarbage*

</div>

---

*Pour toute question ou support, visitez [xhris84.netlify.app](https://xhris84.netlify.app/)*
