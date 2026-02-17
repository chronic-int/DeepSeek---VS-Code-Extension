import * as crypto from 'crypto';

/**
 * Generates a random code verifier for PKCE.
 */
export function generateCodeVerifier(): string {
    return base64UrlEncode(crypto.randomBytes(32));
}

/**
 * Generates an S256 code challenge from a code verifier.
 */
export function generateCodeChallenge(verifier: string): string {
    const hash = crypto.createHash('sha256').update(verifier).digest();
    return base64UrlEncode(hash);
}

/**
 * Encodes a buffer or string to Base64URL (RFC 4648).
 */
function base64UrlEncode(source: Buffer | string): string {
    let base64 = typeof source === 'string' ? Buffer.from(source).toString('base64') : source.toString('base64');
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
