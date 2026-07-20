const BIO_KEY = 'our-space-biometric-id';

function bufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToBuffer(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(pad);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function supportsBiometric() {
  return (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === 'function'
  );
}

export function hasCredential() {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(BIO_KEY);
}

export function clearCredential() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(BIO_KEY);
}

export async function registerCredential(user) {
  if (!supportsBiometric()) throw new Error('Biometric authentication is not supported on this device.');

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = new TextEncoder().encode(user.uid);
  const publicKey = {
    challenge,
    rp: { name: 'Our Space', id: window.location.hostname },
    user: {
      id: userId,
      name: user.email || user.uid,
      displayName: user.displayName || 'Our Space user',
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },
      { type: 'public-key', alg: -257 },
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
    },
    timeout: 60000,
  };

  const cred = await navigator.credentials.create({ publicKey });
  if (!cred) throw new Error('No credential was created.');

  localStorage.setItem(BIO_KEY, bufferToBase64url(cred.rawId));
  return true;
}

export async function authenticateCredential() {
  if (!supportsBiometric()) throw new Error('Biometric authentication is not supported.');
  if (!hasCredential()) throw new Error('No biometric credential is registered.');

  const storedId = localStorage.getItem(BIO_KEY);
  const rawId = base64urlToBuffer(storedId);
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const publicKey = {
    challenge,
    rpId: window.location.hostname,
    allowCredentials: [{ id: rawId, type: 'public-key', transports: ['internal'] }],
    userVerification: 'required',
    timeout: 60000,
  };

  const cred = await navigator.credentials.get({ publicKey });
  return !!cred;
}
