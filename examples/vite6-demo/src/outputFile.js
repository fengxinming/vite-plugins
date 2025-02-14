import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { writeFile, mkdir } from 'node:fs/promises';

export async function outputFile(file, data, options = 'utf-8') {
  const dir = dirname(file);

  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  return writeFile(file, data, options);
}
