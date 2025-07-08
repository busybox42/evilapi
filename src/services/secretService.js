const crypto = require('crypto');
const { secretManagement } = require('../config/secureConfig');

// In-memory store for secrets. In a real application, you would use a database.
const secrets = {};
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY = Buffer.from(secretManagement.encryptionKey, 'hex');

// Generate a random ID
const generateId = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Encrypt text
const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
};

// Decrypt text
const decrypt = (encryptedText) => {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
};

// Create a new secret
const createSecret = (text, expiresIn, maxViews) => {
  const id = generateId();
  const maxViewsInt = parseInt(maxViews, 10) || 1;
  console.log(`[DEBUG] Creating secret ${id} with maxViews=${maxViewsInt}`);
  
  const secret = {
    text: encrypt(text),
    expiresIn: Date.now() + expiresIn * 1000,
    maxViews: maxViewsInt,
    views: 0
  };
  secrets[id] = secret;
  
  console.log(`[DEBUG] Initial state for ${id}:`, {
    maxViews: secret.maxViews,
    views: secret.views,
    expiresIn: new Date(secret.expiresIn).toISOString()
  });
  
  return id;
};

// Get a secret
const getSecret = (id) => {
  console.log(`\n[DEBUG] Getting secret ${id}`);
  const secret = secrets[id];

  if (!secret) {
    console.log(`[DEBUG] Secret ${id} not found in store`);
    return null;
  }

  console.log(`[DEBUG] Current state for ${id}:`, {
    currentViews: secret.views,
    maxViews: secret.maxViews,
    expiresIn: new Date(secret.expiresIn).toISOString()
  });

  if (Date.now() > secret.expiresIn) {
    console.log(`[DEBUG] Secret ${id} expired`);
    delete secrets[id];
    return null;
  }

  const maxViews = parseInt(secret.maxViews, 10);
  const currentViews = parseInt(secret.views, 10) || 0;  // Ensure it's a number
  const viewsRemaining = maxViews - currentViews;

  console.log(`[DEBUG] Before increment: views=${currentViews}, max=${maxViews}, remaining=${viewsRemaining}`);

  // If already used up all views, delete and return null
  if (viewsRemaining <= 0) {
    console.log(`[DEBUG] No views remaining for ${id}, deleting`);
    delete secrets[id];
    return null;
  }

  const decryptedText = decrypt(secret.text);
  if (decryptedText === null) {
    console.log(`[DEBUG] Decryption failed for ${id}, deleting`);
    delete secrets[id];
    return null;
  }

  // Only increment after we know we can return the secret
  secret.views = currentViews + 1;
  const remainingAfterThis = maxViews - secret.views;

  console.log(`[DEBUG] After increment: views=${secret.views}, max=${maxViews}, remaining=${remainingAfterThis}`);

  if (remainingAfterThis <= 0) {
    console.log(`[DEBUG] Last view used for ${id}, will delete`);
    delete secrets[id];
  }

  return {
    text: decryptedText,
    deleted: remainingAfterThis <= 0,
    viewsRemaining: remainingAfterThis
  };
};

// service for secret management

module.exports = {
  createSecret,
  getSecret,
}; 