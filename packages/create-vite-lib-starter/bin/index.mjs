#!/usr/bin/env node

import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateStarter } from 'cs-runtime-helper';
import { ensureDir } from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cwd = resolve('.');
const targetDir = resolve(process.argv[2] || '.');

async function run() {
  if (targetDir !== cwd) {
    await ensureDir(targetDir);
  }

  const templateDir = resolve(__dirname, '..');
  const packageName = basename(targetDir);

  const startTime = Date.now();
  await generateStarter(templateDir, targetDir, {
    name: packageName,
    version: '1.0.0',
    files: [
      'dist'
    ],
    dependencies: {}
  });
  console.info(`Generated '${packageName}' in ${(Date.now() - startTime)} ms.`);
}

run();
