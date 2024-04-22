import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export function outputFileSync(file, data, options = 'utf-8') {
  const dir = dirname(file);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  return writeFileSync(file, data, options);
}
