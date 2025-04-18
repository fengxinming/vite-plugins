import crypto from 'node:crypto';

const hash
  = (crypto as any).hash
  ?? ((
    algorithm: string,
    data: crypto.BinaryLike,
    outputEncoding: crypto.BinaryToTextEncoding,
  ) => crypto.createHash(algorithm).update(data).digest(outputEncoding));

export function getHash(text: Buffer | string, length = 8): string {
  const h = hash('sha256', text, 'hex').substring(0, length);
  if (length <= 64) {
    return h;
  }
  return h.padEnd(length, '_');
}
