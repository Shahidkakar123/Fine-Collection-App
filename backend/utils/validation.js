const dns = require('dns').promises;

const EMAIL_REGEX = /^(?!.*\.\.)(?!.*\.$)(?!.*@.*@)[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function validatePassword(password) {
  const normalized = String(password || '').trim();

  if (normalized.length < 6) {
    return { valid: false, normalized, message: 'Password must be at least 6 characters long.' };
  }

  if (!/[A-Za-z]/.test(normalized)) {
    return { valid: false, normalized, message: 'Password must contain at least one letter.' };
  }

  if (!/\d/.test(normalized)) {
    return { valid: false, normalized, message: 'Password must contain at least one number.' };
  }

  return { valid: true, normalized };
}

function validateFinePayload(payload = {}) {
  const normalized = {
    userId: payload.userId,
    name: String(payload.name || '').trim(),
    description: String(payload.description || '').trim(),
    category: String(payload.category || '').trim(),
    value: payload.value,
  };

  if (!normalized.userId) {
    return { valid: false, message: 'User reference is required.' };
  }

  if (!normalized.name) {
    return { valid: false, message: 'Fine name is required.' };
  }

  if (!normalized.category) {
    return { valid: false, message: 'Fine category is required.' };
  }

  if (normalized.category.toLowerCase() === 'other' && !normalized.description) {
    return { valid: false, message: 'Description is required when category is Other.' };
  }

  const numericValue = Number(normalized.value);
  if (!Number.isFinite(numericValue)) {
    return { valid: false, message: 'Fine value must be a valid number.' };
  }

  if (numericValue <= 0) {
    return { valid: false, message: 'Fine value must be positive.' };
  }

  if (numericValue > 999999) {
    return { valid: false, message: 'Fine value cannot exceed 999999.' };
  }

  return { valid: true, normalized };
}

async function validateEmailAddress(email, options = {}) {
  const normalized = normalizeEmail(email);
  const checkDomain = options.checkDomain !== false;

  if (!EMAIL_REGEX.test(normalized)) {
    return { valid: false, normalized, message: 'Please enter a valid email address.' };
  }

  if (!checkDomain) {
    return { valid: true, normalized };
  }

  const domain = normalized.split('@')[1];
  try {
    const records = await dns.resolveMx(domain);
    if (!records || records.length === 0) {
      return { valid: false, normalized, message: 'Please use an email address from a valid public domain.' };
    }

    return { valid: true, normalized };
  } catch (error) {
    return { valid: false, normalized, message: 'We could not verify that email domain. Please use a standard provider email.' };
  }
}

module.exports = { EMAIL_REGEX, normalizeEmail, validatePassword, validateFinePayload, validateEmailAddress };
