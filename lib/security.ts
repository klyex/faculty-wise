/**
 * Security helper to encrypt/decrypt payloads sent between the client and server.
 * This prevents casual network sniffing, payload manipulation, and prompt exposure in the network tab.
 */

const SECRET_KEY = process.env.NEXT_PUBLIC_API_ENCRYPTION_KEY || "FacultyWiseSecurePayloadKey2026_x89!";

/**
 * Encrypts a JSON-serializable object into an obfuscated Hex string.
 */
export function encryptPayload(data: any): string {
  const jsonStr = JSON.stringify(data);
  let result = "";
  for (let i = 0; i < jsonStr.length; i++) {
    const charCode = jsonStr.charCodeAt(i);
    const keyChar = SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
    // XOR and convert to hex padded to 2 characters
    const cipherChar = (charCode ^ keyChar).toString(16).padStart(2, "0");
    result += cipherChar;
  }
  return result;
}

/**
 * Decrypts an obfuscated Hex string back into the original JSON object.
 */
export function decryptPayload(hexStr: string): any {
  if (!hexStr || hexStr.length % 2 !== 0) {
    throw new Error("Invalid payload format");
  }
  let result = "";
  for (let i = 0; i < hexStr.length; i += 2) {
    const hexChar = hexStr.substring(i, i + 2);
    const charCode = parseInt(hexChar, 16);
    const keyChar = SECRET_KEY.charCodeAt((i / 2) % SECRET_KEY.length);
    result += String.fromCharCode(charCode ^ keyChar);
  }
  return JSON.parse(result);
}
