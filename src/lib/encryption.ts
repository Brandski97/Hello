// Client-side encryption utilities using Web Crypto API

interface EncryptionResult {
  encryptedData: string;
  iv: string;
  salt: string;
}

interface DecryptionParams {
  encryptedData: string;
  iv: string;
  salt: string;
  passphrase: string;
}

// Derive encryption key from passphrase using PBKDF2
async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    passphraseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

// Encrypt data using AES-GCM
export async function encryptData(
  data: string,
  passphrase: string,
): Promise<EncryptionResult> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Derive key from passphrase
  const key = await deriveKey(passphrase, salt);

  // Encrypt the data
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    dataBuffer,
  );

  return {
    encryptedData: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(salt),
  };
}

// Decrypt data using AES-GCM
export async function decryptData(params: DecryptionParams): Promise<string> {
  const { encryptedData, iv, salt, passphrase } = params;

  // Convert base64 strings back to ArrayBuffers
  const encryptedBuffer = base64ToArrayBuffer(encryptedData);
  const ivBuffer = base64ToArrayBuffer(iv);
  const saltBuffer = base64ToArrayBuffer(salt);

  // Derive key from passphrase
  const key = await deriveKey(passphrase, new Uint8Array(saltBuffer));

  try {
    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(ivBuffer),
      },
      key,
      encryptedBuffer,
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    throw new Error("Decryption failed - invalid passphrase or corrupted data");
  }
}

// Utility functions for base64 conversion
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate a secure random passphrase
export function generateSecurePassphrase(): string {
  const words = [
    "Apple",
    "Bridge",
    "Castle",
    "Dragon",
    "Eagle",
    "Forest",
    "Garden",
    "Harbor",
    "Island",
    "Jungle",
    "Knight",
    "Lighthouse",
    "Mountain",
    "Ocean",
    "Palace",
    "Quest",
    "River",
    "Sunset",
    "Tower",
    "Universe",
    "Valley",
    "Waterfall",
    "Xenon",
    "Yacht",
    "Zenith",
  ];

  const selectedWords = [];
  for (let i = 0; i < 4; i++) {
    const randomIndex =
      crypto.getRandomValues(new Uint32Array(1))[0] % words.length;
    selectedWords.push(words[randomIndex]);
  }

  // Add random numbers to make it more secure
  const randomNumbers = crypto.getRandomValues(new Uint32Array(2));
  const num1 = randomNumbers[0] % 100;
  const num2 = randomNumbers[1] % 100;

  return `${selectedWords.join("-")}-${num1}-${num2}`;
}

// Validate passphrase strength
export function validatePassphrase(passphrase: string): {
  isValid: boolean;
  message: string;
} {
  if (passphrase.length < 12) {
    return {
      isValid: false,
      message: "Passphrase must be at least 12 characters long",
    };
  }

  // Check if it's a generated passphrase (contains hyphens and has good length)
  const isGeneratedStyle = passphrase.includes("-") && passphrase.length >= 15;

  if (isGeneratedStyle) {
    // For generated passphrases, just check length and basic structure
    return { isValid: true, message: "Passphrase is strong" };
  }

  // For custom passphrases, apply stricter validation
  if (!/[a-z]/.test(passphrase)) {
    return {
      isValid: false,
      message: "Passphrase must contain lowercase letters",
    };
  }

  if (!/[A-Z]/.test(passphrase)) {
    return {
      isValid: false,
      message: "Passphrase must contain uppercase letters",
    };
  }

  if (!/[0-9]/.test(passphrase)) {
    return { isValid: false, message: "Passphrase must contain numbers" };
  }

  return { isValid: true, message: "Passphrase is strong" };
}
