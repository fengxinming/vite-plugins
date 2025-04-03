import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function outputFile(file, data, options = 'utf-8') {
  const dir = dirname(file);

  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  return writeFile(file, data, options);
}
