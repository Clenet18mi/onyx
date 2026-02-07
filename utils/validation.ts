// ============================================
// ONYX - Validation des données
// ============================================

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateAmount(amount: number, context: string = 'montant'): void {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new ValidationError(`${context} : nombre invalide`);
  }
  if (amount < 0) {
    throw new ValidationError(`${context} : ne peut pas être négatif`);
  }
  if (amount > 999_999_999) {
    throw new ValidationError(`${context} : montant trop élevé (max 999 999 999)`);
  }
}

export function validateDate(date: Date | string, context: string = 'date'): void {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!(d instanceof Date) || isNaN(d.getTime())) {
    throw new ValidationError(`${context} : date invalide`);
  }
  if (d.getFullYear() < 1900) {
    throw new ValidationError(`${context} : date trop ancienne`);
  }
  const maxFuture = new Date();
  maxFuture.setFullYear(maxFuture.getFullYear() + 10);
  if (d > maxFuture) {
    throw new ValidationError(`${context} : date trop lointaine dans le futur`);
  }
}

export function validateId(id: string, context: string = 'ID'): void {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new ValidationError(`${context} : ID vide ou invalide`);
  }
  if (id.length > 100) {
    throw new ValidationError(`${context} : ID trop long`);
  }
}

interface ValidateStringOptions {
  minLength?: number;
  maxLength?: number;
  required?: boolean;
}

export function validateString(
  str: string,
  context: string = 'texte',
  options: ValidateStringOptions = {}
): void {
  const { minLength = 0, maxLength = 1000, required = false } = options;
  if (required && (!str || str.trim() === '')) {
    throw new ValidationError(`${context} : champ obligatoire`);
  }
  if (str != null && str.length < minLength) {
    throw new ValidationError(`${context} : minimum ${minLength} caractères`);
  }
  if (str != null && str.length > maxLength) {
    throw new ValidationError(`${context} : maximum ${maxLength} caractères`);
  }
}
