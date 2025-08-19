# Test API Endpoints

Ce fichier contient des exemples de requêtes pour tester l'API.

## 🚀 Tests avec curl ou Postman

### 1. Test de santé de l'API
```bash
curl -X GET http://localhost:3000/api
```

### 2. Inscription d'un nouvel utilisateur
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "John Doe",
    "age": 25,
    "gender": "male",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 3. Connexion
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 4. Connexion en tant qu'admin (créé par le seed)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123456"
  }'
```

### 5. Récupérer le profil utilisateur (avec token)
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. Lister tous les utilisateurs (avec token)
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 7. Lister les utilisateurs avec pagination et filtres
```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=5&gender=male&role=USER" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 8. Mettre à jour son profil
```bash
curl -X PATCH http://localhost:3000/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "fullname": "John Smith",
    "age": 26
  }'
```

### 9. Renouveler le token d'accès
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### 10. Déconnexion
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### 11. Mot de passe oublié
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

### 12. Réinitialiser le mot de passe
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "RESET_TOKEN_FROM_CONSOLE",
    "password": "newpassword123"
  }'
```

## 📱 Tests avec JavaScript/Fetch

### Exemple complet d'utilisation
```javascript
const API_BASE = 'http://localhost:3000/api';

// 1. Inscription
async function register() {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullname: 'Jane Doe',
      age: 28,
      gender: 'female',
      email: 'jane@example.com',
      password: 'password123'
    })
  });
  return response.json();
}

// 2. Connexion
async function login(email, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
}

// 3. Récupérer le profil
async function getProfile(token) {
  const response = await fetch(`${API_BASE}/users/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

// 4. Utilisation
(async () => {
  try {
    // S'inscrire
    const registerResult = await register();
    console.log('Registration:', registerResult);
    
    // Se connecter
    const loginResult = await login('jane@example.com', 'password123');
    console.log('Login:', loginResult);
    
    // Récupérer le profil
    const profile = await getProfile(loginResult.accessToken);
    console.log('Profile:', profile);
  } catch (error) {
    console.error('Error:', error);
  }
})();
```

## 🔐 Rôles et Permissions

### Utilisateur Standard (USER)
- ✅ Voir son profil
- ✅ Modifier son profil
- ✅ Lister les utilisateurs
- ❌ Créer d'autres utilisateurs
- ❌ Modifier d'autres utilisateurs
- ❌ Supprimer des utilisateurs

### Modérateur (MODERATOR)
- ✅ Toutes les permissions USER
- ✅ Modifier d'autres utilisateurs
- ❌ Créer d'autres utilisateurs
- ❌ Supprimer des utilisateurs

### Administrateur (ADMIN)
- ✅ Toutes les permissions
- ✅ Créer des utilisateurs
- ✅ Modifier tous les utilisateurs
- ✅ Supprimer des utilisateurs

## 📊 Structure des Réponses

### Réponse d'inscription/connexion
```json
{
  "user": {
    "id": "64a1b2c3d4e5f6789abcdef0",
    "fullname": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "age": 25,
    "gender": "male",
    "avatar": null,
    "isActive": true,
    "createdAt": "2023-08-19T20:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": "15m"
}
```

### Réponse liste d'utilisateurs
```json
{
  "users": [
    {
      "id": "64a1b2c3d4e5f6789abcdef0",
      "fullname": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "age": 25,
      "gender": "male",
      "isActive": true,
      "createdAt": "2023-08-19T20:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```
