const encoder = new TextEncoder();

function base64urlEncode(str: string | Uint8Array): string {
  const binary = typeof str === "string" ? encoder.encode(str) : str;
  let base64 = btoa(String.fromCharCode(...binary));
  return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64urlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return atob(base64);
}

const JWT_SECRET = process.env.JWT_SECRET || "development-secret-key-at-least-32-chars-long";

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const keyData = encoder.encode(secret);
  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Sign a payload into a JWT using Web Crypto HMAC-SHA256.
 */
export async function signToken(payload: Record<string, any>, expiresInSeconds: number = 3600 * 24): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(fullPayload));
  const dataToSign = encoder.encode(`${encodedHeader}.${encodedPayload}`);

  const key = await getCryptoKey(JWT_SECRET);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, dataToSign);
  const signatureBytes = new Uint8Array(signatureBuffer);
  const encodedSignature = base64urlEncode(signatureBytes);

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

/**
 * Verify a JWT and return the decoded payload if valid and not expired.
 */
export async function verifyToken(token: string): Promise<Record<string, any> | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const dataToVerify = encoder.encode(`${encodedHeader}.${encodedPayload}`);

  try {
    const key = await getCryptoKey(JWT_SECRET);
    const signatureBytes = new Uint8Array(
      Array.from(base64urlDecode(encodedSignature), (c) => c.charCodeAt(0))
    );
    const isValid = await crypto.subtle.verify("HMAC", key, signatureBytes, dataToVerify);
    if (!isValid) return null;

    const payload = JSON.parse(base64urlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) {
      return null;
    }
    return payload;
  } catch (e) {
    return null;
  }
}
