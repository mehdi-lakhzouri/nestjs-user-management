# 🔐 User Management Backend API

API backend professionnel développé avec **NestJS** et **MongoDB** pour la gestion complète des utilisateurs avec authentification sécurisée, système 2FA, et gestion d'avatars.

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-v11-red.svg)](https://nestjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v8+-green.svg)](https://mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5+-blue.svg)](https://typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

## ✨ Fonctionnalités

### 🔐 Authentification & Sécurité
- **Inscription/Connexion** sécurisée avec validation email
- **Authentification à deux facteurs (2FA)** avec codes OTP
- **JWT tokens** (access + refresh) avec rotation automatique
- **Système de rôles** : USER, ADMIN, MODERATOR
- **Mot de passe oublié** avec réinitialisation sécurisée
- **Hashage bcrypt** avec 12 rounds de sécurité

### 👤 Gestion des Utilisateurs
- **CRUD complet** avec permissions basées sur les rôles
- **Pagination et filtrage** avancé des utilisateurs
- **Upload d'avatars** avec validation et redimensionnement
- **Profils utilisateurs** avec informations complètes
- **Gestion des mots de passe temporaires**

### 📧 Système de Communication
- **Envoi d'emails** automatisé avec templates HTML
- **Codes OTP** pour vérification et 2FA
- **Notifications** de sécurité et changements de compte

### 🏗️ Architecture & DevOps
- **Architecture modulaire** NestJS avec séparation des responsabilités
- **Validation robuste** avec class-validator et DTO
- **Documentation Swagger/OpenAPI** interactive
- **Déploiement Docker** multi-stage optimisé
- **Tests e2e** avec Jest et couverture de code

## � Démarrage Rapide

### Prérequis
- **Node.js** v20+ ([télécharger](https://nodejs.org/))
- **MongoDB** local ou cloud ([MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Git** ([télécharger](https://git-scm.com/))

### Installation Locale

1. **Cloner le repository**
   ```bash
   git clone https://github.com/mehdi-lakhzouri/nestjs-user-management.git
   cd nestjs-user-management
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration de l'environnement**
   ```bash
   cp .env.example .env
   ```
   
   **⚠️ Important** : Modifiez les variables dans `.env` :
   ```bash
   # Database
   MONGODB_URI=mongodb://localhost:27017/user-management
   
   # JWT Secrets (changez ces valeurs !)
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
   
   # Email SMTP (configurez votre fournisseur)
   SMTP_HOST=smtp.gmail.com
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

4. **Démarrer l'application**
   ```bash
   # Mode développement avec hot-reload
   npm run start:dev
   
   # Mode production
   npm run build && npm run start:prod
   ```

### Déploiement Docker

```bash
# Build et démarrage avec Docker Compose
docker-compose up -d

# Ou construction manuelle
docker build -t user-management-api .
docker run -p 3000:3000 --env-file .env user-management-api
```

## 📚 Documentation & Utilisation

### Accès à la Documentation
Une fois l'application démarrée, accédez aux ressources suivantes :

- **📖 Documentation Swagger** : [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **🔗 API Base URL** : [http://localhost:3000/api](http://localhost:3000/api)
- **📁 Fichiers statiques** : [http://localhost:3000/api/uploads](http://localhost:3000/api/uploads)

## 🌐 Endpoints API

### 🔐 Authentification (`/api/auth`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/register` | Inscription utilisateur | ❌ |
| `POST` | `/register-with-avatar` | Inscription avec avatar | ❌ |
| `POST` | `/login-with-otp` | Connexion avec 2FA | ❌ |
| `POST` | `/verify-otp-complete-login` | Validation OTP et finalisation connexion | ❌ |
| `POST` | `/verify-email` | Vérification email après inscription | ❌ |
| `POST` | `/resend-verification-otp` | Renvoyer code de vérification | ❌ |
| `POST` | `/refresh` | Renouveler le token d'accès | ❌ |
| `POST` | `/logout` | Déconnexion utilisateur | ✅ |
| `POST` | `/logout-all` | Déconnexion de tous les appareils | ✅ |
| `POST` | `/forgot-password` | Demande de réinitialisation | ❌ |
| `POST` | `/reset-password` | Réinitialisation mot de passe | ❌ |
| `POST` | `/change-password` | Changement mot de passe | ✅ |

### 👥 Utilisateurs (`/api/users`)

| Méthode | Endpoint | Description | Rôle Requis |
|---------|----------|-------------|-------------|
| `GET` | `/` | Liste des utilisateurs (pagination/filtres) | USER+ |
| `GET` | `/profile` | Profil utilisateur actuel | USER+ |
| `GET` | `/:id` | Utilisateur par ID | USER+ |
| `POST` | `/` | Créer un utilisateur | ADMIN |
| `PATCH` | `/profile` | Modifier son profil | USER+ |
| `PATCH` | `/:id` | Modifier un utilisateur | ADMIN/MOD |
| `DELETE` | `/:id` | Supprimer un utilisateur | ADMIN |
| `POST` | `/avatar` | Upload avatar utilisateur | USER+ |
| `POST` | `/:id/avatar` | Upload avatar pour un utilisateur | ADMIN/MOD |
| `DELETE` | `/avatar` | Supprimer son avatar | USER+ |

### � Exemples d'utilisation

#### Inscription avec 2FA
```bash
# 1. Inscription
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "Jean Dupont",
    "age": 30,
    "gender": "male",
    "email": "jean@example.com",
    "password": "MonMotDePasse123!"
  }'

# 2. Vérification email (OTP reçu par email)
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jean@example.com",
    "otp": "123456"
  }'
```

#### Connexion avec 2FA
```bash
# 1. Initier la connexion
curl -X POST http://localhost:3000/api/auth/login-with-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jean@example.com",
    "password": "MonMotDePasse123!"
  }'

# 2. Finaliser avec OTP (reçu par email)
curl -X POST http://localhost:3000/api/auth/verify-otp-complete-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jean@example.com",
    "otp": "654321",
    "sessionToken": "session_token_from_step1"
  }'
```

#### Upload d'avatar
```bash
curl -X POST http://localhost:3000/api/users/avatar \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "avatar=@/path/to/avatar.jpg"
```

#### Gestion des utilisateurs (Admin)
```bash
# Lister avec filtres et pagination
curl -X GET "http://localhost:3000/api/users?page=1&limit=10&role=USER&gender=female" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Créer un utilisateur
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "fullname": "Nouvel Utilisateur",
    "age": 25,
    "gender": "other",
    "email": "nouveau@example.com",
    "role": "USER"
  }'
```

## � Modèle de Données

### 👤 Utilisateur (User)
```typescript
{
  id: string;                    // ID unique MongoDB
  fullname: string;              // Nom complet (requis)
  age: number;                   // Âge (1-120, requis)
  gender: 'male'|'female'|'other'; // Genre (requis)
  email: string;                 // Email unique (requis, indexé)
  password: string;              // Mot de passe hashé (bcrypt)
  role: 'USER'|'ADMIN'|'MODERATOR'; // Rôle (défaut: USER)
  isActive: boolean;             // Compte actif (défaut: true)
  isEmailVerified: boolean;      // Email vérifié (défaut: false)
  lastLogin?: Date;              // Dernière connexion
  avatar?: string;               // URL de l'avatar uploadé
  refreshTokens: string[];       // Liste des refresh tokens actifs
  mustChangePassword: boolean;   // Changement de mot de passe requis
  createdAt: Date;               // Date de création (auto)
  updatedAt: Date;               // Date de modification (auto)
}
```

### 🔐 Code OTP (Otp)
```typescript
{
  userId: string;                // Référence utilisateur
  otpHash: string;              // Hash du code OTP
  expiresAt: Date;              // Date d'expiration (4 min)
  attempts: number;             // Tentatives restantes (3)
  used: boolean;                // Code utilisé
  type: 'login'|'password-reset'|'2fa'; // Type d'OTP
  createdAt: Date;              // Date de création
}
```

### 🔑 Session 2FA (TwoFaSession)
```typescript
{
  sessionToken: string;         // Token de session unique
  userId: string;              // Référence utilisateur
  expiresAt: Date;             // Expiration (10 min)
  used: boolean;               // Session utilisée
  createdAt: Date;             // Date de création
}
```

## 🛡️ Sécurité & Conformité

### 🔒 Mesures de Sécurité Implémentées
- **Hashage des mots de passe** : bcrypt avec 12 rounds de salage
- **JWT sécurisés** : Access tokens (1h) + Refresh tokens (7j) avec rotation
- **Authentification 2FA** : Codes OTP temporaires (4 min) envoyés par email
- **Protection CORS** : Configuration stricte des origines autorisées
- **Validation des entrées** : class-validator pour tous les DTO
- **Rate limiting** : Protection contre les attaques de force brute
- **Utilisateur Docker non-root** : Sécurité du conteneur renforcée

### 🛡️ Permissions par Rôle

| Action | USER | MODERATOR | ADMIN |
|--------|------|-----------|-------|
| Voir son profil | ✅ | ✅ | ✅ |
| Modifier son profil | ✅ | ✅ | ✅ |
| Upload avatar personnel | ✅ | ✅ | ✅ |
| Lister les utilisateurs | ✅ | ✅ | ✅ |
| Voir profil d'autres utilisateurs | ✅ | ✅ | ✅ |
| Modifier autres utilisateurs | ❌ | ✅ | ✅ |
| Upload avatar pour autrui | ❌ | ✅ | ✅ |
| Créer des utilisateurs | ❌ | ❌ | ✅ |
| Supprimer des utilisateurs | ❌ | ❌ | ✅ |
| Accès logs et statistiques | ❌ | ❌ | ✅ |

## 🏗️ Architecture Technique

### 📁 Structure du Projet
```
src/
├── 🔧 config/                 # Configuration (JWT, DB, SMTP)
├── 📊 database/               # Schémas MongoDB & Models
├── 🎯 modules/                # Modules fonctionnels
│   ├── 🔐 auth/              # Authentification & 2FA
│   ├── 👤 users/             # Gestion utilisateurs
│   ├── 🖼️  avatar/            # Upload & gestion avatars
│   ├── 📧 email/             # Service d'envoi d'emails
│   └── 📋 tasks/             # Tâches programmées
├── 🛡️ common/                # Éléments partagés
│   ├── guards/               # Guards (JWT, Rôles)
│   ├── decorators/           # Décorateurs personnalisés
│   ├── filters/              # Filtres d'exceptions
│   ├── interceptors/         # Intercepteurs de réponse
│   ├── pipes/                # Pipes de validation
│   ├── middleware/           # Middlewares personnalisés
│   └── logger/               # Service de logging
├── 🔧 utils/                  # Utilitaires (passwords, UUID)
└── 📜 main.ts                # Point d'entrée application
```

### 🔄 Technologies Utilisées

#### Backend Core
- **🚀 NestJS v11** - Framework Node.js avec TypeScript
- **🗄️ MongoDB v8** - Base de données NoSQL avec Mongoose ODM
- **🔐 Passport JWT** - Authentification par tokens
- **📧 Nodemailer** - Envoi d'emails transactionnels
- **🖼️ Multer** - Upload de fichiers multipart

#### Sécurité
- **🔒 bcrypt** - Hashage sécurisé des mots de passe
- **🎫 jsonwebtoken** - Génération et validation JWT
- **✅ class-validator** - Validation des données d'entrée
- **🛡️ helmet** - Headers de sécurité HTTP

#### DevOps & Outils
- **🐳 Docker** - Conteneurisation multi-stage
- **📋 Docker Compose** - Orchestration des services
- **📚 Swagger/OpenAPI** - Documentation API interactive
- **🧪 Jest** - Tests unitaires et e2e
- **📏 ESLint + Prettier** - Qualité et formatage du code

## 🧪 Tests & Qualité

### Exécution des Tests
```bash
# Tests unitaires
npm run test

# Tests avec surveillance des changements
npm run test:watch

# Tests end-to-end
npm run test:e2e

# Couverture de code
npm run test:cov

# Tests en mode debug
npm run test:debug
```

### Qualité du Code
```bash
# Linting du code
npm run lint

# Formatage automatique
npm run format

# Vérification TypeScript
npm run build
```

### 📊 Couverture de Tests
Les tests couvrent les aspects critiques :
- ✅ **Authentification** : Inscription, connexion, 2FA
- ✅ **Autorisation** : Permissions par rôles
- ✅ **Validation** : DTO et contraintes métier
- ✅ **Sécurité** : JWT, hashage, OTP
- ✅ **API Endpoints** : Réponses et codes d'erreur

## 🚀 Déploiement & Production

### 📦 Variables d'Environnement

#### Configuration Essentielle
```bash
# Application
PORT=3000
NODE_ENV=production

# Base de Données
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/user-management

# JWT & Sécurité (⚠️ CHANGEZ CES VALEURS)
JWT_SECRET=your-super-secret-jwt-key-32-chars-min
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-32-chars-min
JWT_REFRESH_EXPIRES_IN=7d

# Hashage des mots de passe
BCRYPT_ROUNDS=12

# Configuration SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password

# Frontend (pour CORS)
FRONTEND_URL=https://your-frontend-domain.com
```

### 🐳 Déploiement Docker

#### 1. Avec Docker Compose (Recommandé)
```bash
# Construction et démarrage
docker-compose up -d

# Logs en temps réel
docker-compose logs -f

# Arrêt et nettoyage
docker-compose down
```

#### 2. Docker Manuel
```bash
# Construction de l'image
docker build -t user-management-api:latest .

# Exécution du conteneur
docker run -d \
  --name user-api \
  -p 3000:3000 \
  --env-file .env \
  user-management-api:latest
```

### ☁️ Déploiement Cloud

#### Heroku
```bash
# Installation Heroku CLI et connexion
heroku login

# Création de l'application
heroku create your-app-name

# Configuration des variables d'environnement
heroku config:set MONGODB_URI=your-mongo-uri
heroku config:set JWT_SECRET=your-jwt-secret
# ... autres variables

# Déploiement
git push heroku main
```

#### AWS ECS / Azure Container Instances
```bash
# Tag et push vers votre registry
docker tag user-management-api:latest your-registry/user-management-api:latest
docker push your-registry/user-management-api:latest
```

### 🔍 Monitoring & Logs

#### Logs Application
```bash
# Logs Docker Compose
docker-compose logs -f nestjs-backend

# Logs conteneur direct
docker logs -f user-api
```

#### Health Check
```bash
# Vérification de l'état de l'API
curl http://localhost:3000/api

# Vérification de la base de données
curl http://localhost:3000/api/health
```

## 🔧 Scripts Utiles

### Package.json Scripts
```bash
# Développement
npm run start:dev      # Démarrage avec hot-reload
npm run start:debug    # Démarrage en mode debug

# Production
npm run build          # Compilation TypeScript
npm run start:prod     # Démarrage en production

# Maintenance
npm run lint           # Vérification ESLint
npm run format         # Formatage Prettier
npm run test:cov       # Tests avec couverture
```

### Scripts de Maintenance
```bash
# Nettoyage des node_modules
rm -rf node_modules package-lock.json && npm install

# Nettoyage Docker
docker system prune -a

# Mise à jour des dépendances
npm update && npm audit fix
```

## 🤝 Contribution & Développement

### 🔀 Processus de Contribution

1. **Fork & Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/nestjs-user-management.git
   cd nestjs-user-management
   ```

2. **Créer une branche de fonctionnalité**
   ```bash
   git checkout -b feature/amazing-new-feature
   ```

3. **Développement**
   ```bash
   # Installation des dépendances
   npm install
   
   # Démarrage en mode développement
   npm run start:dev
   
   # Exécution des tests
   npm run test
   npm run test:e2e
   ```

4. **Validation du code**
   ```bash
   # Vérification du style de code
   npm run lint
   npm run format
   
   # Vérification des types TypeScript
   npm run build
   ```

5. **Commit & Push**
   ```bash
   git add .
   git commit -m "feat: add amazing new feature"
   git push origin feature/amazing-new-feature
   ```

6. **Pull Request**
   - Ouvrez une Pull Request vers la branche `main`
   - Décrivez clairement les changements apportés
   - Incluez des tests pour les nouvelles fonctionnalités

### 📋 Standards de Développement

#### Convention de Commits
Suivez les [Conventional Commits](https://www.conventionalcommits.org/) :
```
feat: nouvelle fonctionnalité
fix: correction de bug
docs: mise à jour documentation
style: formatage de code
refactor: refactorisation
test: ajout/modification de tests
chore: tâches de maintenance
```

#### Structure des Modules
```typescript
// Nouvelle fonctionnalité
src/modules/my-feature/
├── dto/                    # Data Transfer Objects
│   ├── create-feature.dto.ts
│   ├── update-feature.dto.ts
│   └── index.ts
├── my-feature.controller.ts # Contrôleur REST
├── my-feature.service.ts    # Logique métier
├── my-feature.module.ts     # Configuration du module
└── __tests__/              # Tests du module
    ├── my-feature.controller.spec.ts
    └── my-feature.service.spec.ts
```

#### Standards de Code
- **TypeScript strict** : Types explicites obligatoires
- **Validation DTO** : class-validator pour toutes les entrées
- **Documentation** : JSDoc pour les méthodes publiques
- **Tests** : Couverture minimale de 80%
- **Sécurité** : Validation et sanitisation des données

### 🐛 Signalement de Bugs

#### Template d'Issue
```markdown
**Description du Bug**
Description claire et concise du problème.

**Reproduction**
Étapes pour reproduire le comportement :
1. Aller à '...'
2. Cliquer sur '....'
3. Voir l'erreur

**Comportement Attendu**
Description de ce qui devrait se passer.

**Environnement**
- OS: [e.g. Windows 11]
- Node.js: [e.g. v20.10.0]
- Version API: [e.g. v1.0.0]

**Logs/Screenshots**
Ajoutez les logs d'erreur ou captures d'écran.
```

### 💡 Demande de Fonctionnalités

#### Template de Feature Request
```markdown
**Problème Résolu**
Description claire du problème que cette fonctionnalité résoudrait.

**Solution Proposée**
Description de la solution souhaitée.

**Alternatives Considérées**
Description des alternatives envisagées.

**Contexte Additionnel**
Tout autre contexte ou captures d'écran pertinents.
```

## 📄 Licence & Légal

### 📋 Licence MIT

```
MIT License

Copyright (c) 2025 User Management API

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 🔒 Conformité & Sécurité

#### RGPD & Protection des Données
- **Chiffrement** : Toutes les données sensibles sont chiffrées
- **Droit à l'oubli** : Suppression complète des données utilisateur
- **Consentement** : Validation explicite pour l'envoi d'emails
- **Minimisation** : Collecte uniquement des données nécessaires

#### Sécurité des Données
- **Audit de sécurité** : `npm audit` régulier
- **Dépendances** : Mise à jour fréquente des packages
- **Secrets** : Gestion sécurisée des variables d'environnement
- **Logs** : Pas de données sensibles dans les logs

## 🙏 Remerciements & Crédits

### 👨‍💻 Auteur Principal
- **Mehdi Lakhzouri** - [GitHub](https://github.com/mehdi-lakhzouri) - Développement initial et maintenance

### 🔧 Technologies Utilisées
- [NestJS](https://nestjs.com/) - Framework Node.js progressif
- [MongoDB](https://www.mongodb.com/) - Base de données NoSQL
- [Passport](http://www.passportjs.org/) - Middleware d'authentification
- [Swagger](https://swagger.io/) - Documentation API
- [Docker](https://www.docker.com/) - Conteneurisation

### 📚 Ressources & Inspirations
- [NestJS Official Documentation](https://docs.nestjs.com/)
- [MongoDB Best Practices](https://www.mongodb.com/developer/products/mongodb/mongodb-schema-design-best-practices/)
- [JWT Security Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [OWASP Security Guidelines](https://owasp.org/)

---

<div align="center">
  
**⭐ Si ce projet vous aide, n'hésitez pas à lui donner une étoile ! ⭐**

[![GitHub stars](https://img.shields.io/github/stars/mehdi-lakhzouri/nestjs-user-management?style=social)](https://github.com/mehdi-lakhzouri/nestjs-user-management/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/mehdi-lakhzouri/nestjs-user-management?style=social)](https://github.com/mehdi-lakhzouri/nestjs-user-management/network/members)

---

**Développé avec ❤️ par [Mehdi Lakhzouri](https://github.com/mehdi-lakhzouri)**

</div>
