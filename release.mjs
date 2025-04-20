import { readdir, readFile } from 'node:fs/promises';
import { EOL } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { spawn } from 'cross-spawn';
import { request } from 'undici';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const [,, packageName] = process.argv;

async function getLatestVersion(pkgName) {
  const { body } = await request(`https://registry.npmjs.org/${pkgName}`);

  const pkg = await body.json();
  if (pkg.error) {
    console.error(`Package '${pkgName}' not found!`);
    return null;
  }
  return pkg['dist-tags'].latest;
}

function release(pkg) {
  return new Promise((resolve, reject) => {
    const { name } = pkg;
    const tag = /\d+\.\d+\.\d+-([a-z]+)\.\d+/.exec(name);
    const args = [
      'publish',
      '--filter',
      packageName,
      '--no-git-checks',
      '--tag',
      tag ? tag[1] : 'latest'
    ];
    const child = spawn('pnpm', args);
    let err = '';
    child.stderr.on('data', (data) => {
      err += data;
    });
    child.on('close', (code) => {
      if (code === 0) {
        console.info(`'${name}' released successfully!`);
        resolve();
      }
      else {
        reject(new Error(`'${name}' release failed!${EOL}${err}`));
      }
    });
  });
}
async function run() {
  const packagesDir = join(__dirname, 'packages');
  const fileList = await readdir(packagesDir);
  await Promise.all(fileList.map((pkgName) => (async () => {
    const latestVersion = await getLatestVersion(pkgName);
    const pkg = JSON.parse(await readFile(join(packagesDir, pkgName, 'package.json'), 'utf-8'));
    if (pkg.version !== latestVersion) {
      return release(pkg);
    }

    console.info(`'${pkgName}' is up to date!`);
  })()));
}

run().catch((err) => {
  console.error(err);
});
