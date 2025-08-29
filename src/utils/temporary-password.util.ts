/**
 * Utilitaire pour générer des mots de passe temporaires sécurisés
 */

/**
 * Génère un mot de passe temporaire sécurisé
 * - Longueur : 12 caractères
 * - Contient : majuscules, minuscules, chiffres et symboles
 * - Facilement lisible (évite les caractères ambigus comme 0, O, l, I)
 */
export function generateTemporaryPassword(): string {
  // Caractères disponibles (évite les confusions visuelles)
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Sans I, O
  const lowercase = 'abcdefghijkmnpqrstuvwxyz'; // Sans l, o
  const numbers = '23456789'; // Sans 0, 1
  const symbols = '!@#$%&*+-=?';

  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  
  // Assurer au moins un caractère de chaque type
  password += getRandomChar(uppercase);
  password += getRandomChar(lowercase);
  password += getRandomChar(numbers);
  password += getRandomChar(symbols);
  
  // Compléter avec des caractères aléatoires
  for (let i = 4; i < 12; i++) {
    password += getRandomChar(allChars);
  }
  
  // Mélanger le mot de passe pour éviter un pattern prévisible
  return shuffleString(password);
}

/**
 * Récupère un caractère aléatoire d'une chaîne
 */
function getRandomChar(chars: string): string {
  return chars.charAt(Math.floor(Math.random() * chars.length));
}

/**
 * Mélange les caractères d'une chaîne
 */
function shuffleString(str: string): string {
  const array = str.split('');
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array.join('');
}

/**
 * Valide qu'un mot de passe respecte les critères de sécurité
 */
export function validateTemporaryPassword(password: string): boolean {
  if (password.length < 8) return false;
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%&*+\-=?]/.test(password);
  
  return hasUppercase && hasLowercase && hasNumber && hasSymbol;
}
