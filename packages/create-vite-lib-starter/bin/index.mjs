#!/usr/bin/env node

import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ensureDir } from 'fs-extra';
import { generateStarter } from 'vp-runtime-helper';

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

  await generateStarter(templateDir, targetDir, {
    name: packageName,
    dependencies: {}
  });
}

run();
