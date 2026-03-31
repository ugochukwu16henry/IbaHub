import { createHash, randomBytes } from 'crypto';

export function randomState(): string {
  return randomBytes(24).toString('hex');
}

export function generateCodeVerifier(): string {
  return randomBytes(32).toString('base64url');
}

export function codeChallengeS256(verifier: string): string {
  const hash = createHash('sha256').update(verifier).digest();
  return Buffer.from(hash).toString('base64url');
}
