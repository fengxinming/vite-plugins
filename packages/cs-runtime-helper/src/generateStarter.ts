import { readdirSync, readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { EOL } from 'node:os';
import { join, resolve } from 'node:path';

import { copy } from 'fs-extra';

const filters = [
  'bin',
  'dist',
  'node_modules',
  'package.json'
];

export async function generateStarter(
  templateDir: string,
  targetDir: string,
  pkg: Record<string, unknown>
): Promise<void> {
  templateDir = resolve(templateDir);
  targetDir = resolve(targetDir);

  const files = readdirSync(templateDir);
  await Promise.all(files.reduce((acc, file) => {
    if (!filters.includes(file)) {
      const targetPath = join(targetDir, file.startsWith('_') ? `.${file.slice(1)}` : file);
      acc.push(copy(join(templateDir, file), targetPath));
    }
    return acc;
  }, [] as Array<Promise<void>>));

  const pkgJson = JSON.parse(
    readFileSync(join(templateDir, 'package.json'), 'utf-8'),
  );
  delete pkgJson.bin;

  for (const [key, value] of Object.entries(pkg)) {
    pkgJson[key] = value;
  }

  await writeFile(join(targetDir, 'package.json'), `${JSON.stringify(pkgJson, null, 2)}${EOL}`, 'utf-8');
}
