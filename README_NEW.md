# User Management Backend API

Un backend professionnel NestJS avec MongoDB pour la gestion des utilisateurs et l'authentification.

## 🚀 Fonctionnalités

- **Authentification complète** : Inscription, connexion, refresh token, mot de passe oublié
- **Gestion des utilisateurs** : CRUD complet avec pagination et filtrage
- **Sécurité avancée** : JWT, hashage bcrypt, protection des routes par rôles
- **Validation robuste** : DTO avec class-validator
- **Documentation** : Swagger/OpenAPI intégré
- **Architecture modulaire** : Code maintenable et scalable

## 📋 Prérequis

- Node.js (v16 ou plus récent)
- MongoDB (local ou cloud)
- npm ou yarn

## 🛠️ Installation

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd user-management
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration**
   ```bash
   cp .env.example .env
   ```
   Modifiez le fichier `.env` selon vos besoins.

4. **Démarrer MongoDB** (si local)
   ```bash
   mongod
   ```

5. **Créer un utilisateur admin** (optionnel)
   ```bash
   npm run seed
   ```

6. **Démarrer l'application**
   ```bash
   # Mode développement
   npm run start:dev

   # Mode production
   npm run build
   npm run start:prod
   ```

## 🌐 API Endpoints

### Authentification (`/api/auth`)

- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh` - Renouveler le token
- `POST /api/auth/logout` - Déconnexion
- `POST /api/auth/logout-all` - Déconnexion de tous les appareils
- `POST /api/auth/forgot-password` - Mot de passe oublié
- `POST /api/auth/reset-password` - Réinitialiser le mot de passe

### Utilisateurs (`/api/users`)

- `GET /api/users` - Lister les utilisateurs (avec pagination/filtrage)
- `GET /api/users/profile` - Profil utilisateur actuel
- `GET /api/users/:id` - Utilisateur par ID
- `POST /api/users` - Créer un utilisateur (Admin)
- `PATCH /api/users/profile` - Modifier son profil
- `PATCH /api/users/:id` - Modifier un utilisateur (Admin/Moderator)
- `DELETE /api/users/:id` - Supprimer un utilisateur (Admin)

## 📚 Documentation

Une fois l'application démarrée, accédez à la documentation Swagger :
```
http://localhost:3000/api/docs
```

## 🔐 Authentification

### Inscription
```json
POST /api/auth/register
{
  "fullname": "John Doe",
  "age": 25,
  "gender": "male",
  "email": "john@example.com",
  "password": "password123",
  "avatar": "https://example.com/avatar.jpg"
}
```

### Connexion
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Utilisation du token
```bash
Authorization: Bearer <access_token>
```

## 👤 Modèle Utilisateur

```typescript
{
  fullname: string;           // Nom complet
  age: number;               // Âge (positif)
  gender: 'male'|'female'|'other'; // Genre
  email: string;             // Email unique
  password: string;          // Mot de passe hashé
  role: 'USER'|'ADMIN'|'MODERATOR'; // Rôle
  isActive: boolean;         // Statut actif
  avatar?: string;           // URL avatar
  lastLogin?: Date;          // Dernière connexion
  createdAt: Date;           // Date création
  updatedAt: Date;           // Date modification
}
```

## 🛡️ Sécurité

- **Mots de passe** : Hashage bcrypt avec 12 rounds
- **JWT** : Tokens d'accès (15min) + refresh tokens (7j)
- **Validation** : Validation stricte des entrées
- **CORS** : Configuration sécurisée
- **Guards** : Protection des routes par authentification/rôles

## 🏗️ Structure du Projet

```
src/
├── modules/              # Modules fonctionnels
│   ├── auth/            # Authentification
│   └── users/           # Gestion utilisateurs
├── common/              # Éléments réutilisables
│   ├── guards/          # Guards (JWT, rôles)
│   ├── filters/         # Filtres d'exceptions
│   ├── decorators/      # Décorateurs personnalisés
│   └── pipes/           # Pipes de validation
├── config/              # Configuration
├── database/            # Schémas MongoDB
├── utils/               # Utilitaires
└── main.ts             # Point d'entrée
```

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests e2e
npm run test:e2e

# Coverage
npm run test:cov
```

## 📦 Déploiement

1. **Build de production**
   ```bash
   npm run build
   ```

2. **Variables d'environnement**
   - Configurez les variables d'environnement en production
   - Changez les secrets JWT
   - Configurez l'URI MongoDB

3. **Démarrage**
   ```bash
   npm run start:prod
   ```

## 🔧 Variables d'Environnement

| Variable | Description | Défaut |
|----------|-------------|---------|
| `PORT` | Port de l'application | `3000` |
| `MONGODB_URI` | URI MongoDB | `mongodb://localhost:27017/user-management` |
| `JWT_SECRET` | Secret JWT access token | `your-secret-key` |
| `JWT_EXPIRES_IN` | Durée access token | `15m` |
| `JWT_REFRESH_SECRET` | Secret refresh token | `your-refresh-secret` |
| `JWT_REFRESH_EXPIRES_IN` | Durée refresh token | `7d` |
| `BCRYPT_ROUNDS` | Rounds bcrypt | `12` |

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit vos changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.
