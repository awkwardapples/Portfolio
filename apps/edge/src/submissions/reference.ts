/**
 * Submission references (spec Q.3): "JL-" and eight random base32
 * characters, never a sequential id, so a reference reveals nothing about
 * how many enquiries there have been.
 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ0123456789'; // Crockford-style: no I, L, O or U

export function newReference(
  random: (bytes: Uint8Array) => Uint8Array = (b) => crypto.getRandomValues(b),
): string {
  const bytes = random(new Uint8Array(8));
  let out = 'JL-';
  for (const byte of bytes) out += ALPHABET[byte % 32];
  return out;
}

export const REFERENCE_PATTERN = /^JL-[0-9A-HJKMNP-TV-Z]{8}$/;
