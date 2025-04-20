import { readdir, readFile } from 'node:fs/promises';
import { EOL } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { spawn } from 'cross-spawn';
import picocolors from 'picocolors';
import { request } from 'undici';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const recordMap = new Map();
class Info {
  constructor(name) {
    this.messages = [];
    this.name = name;
  }
  info(message) {
    this.messages.push(picocolors.green(`[${this.name}] - ${message}`));
  }
  error(message) {
    this.messages.push(picocolors.red(`[${this.name}] - ${message}`));
  }
}

async function getLatestVersion(pkgName) {
  const { body } = await request(`https://registry.npmjs.org/${pkgName}`);

  const pkg = await body.json();
  if (pkg.error) {
    recordMap.get(pkgName).error(`Package '${pkgName}' not found!`);
    return null;
  }
  const { latest } = pkg['dist-tags'];
  recordMap.get(pkgName).info(`Latest version is '${latest}'.`);
  return latest;
}

function release(pkg, currentDir) {
  return new Promise((resolve, reject) => {
    const { name } = pkg;
    const tag = /\d+\.\d+\.\d+-([a-z]+)\.\d+/.exec(name);
    const args = [
      'publish',
      '--no-git-checks',
      '--tag',
      tag ? tag[1] : 'latest'
    ];
    const child = spawn('pnpm', args, { cwd: currentDir });
    let err = '';
    child.stderr.on('data', (data) => {
      err += data;
    });
    child.stderr.on('error', (err) => {
      reject(err);
    });
    child.on('error', (err) => {
      reject(err);
    });
    child.on('close', (code) => {
      if (code === 0) {
        recordMap.get(name).info(`'${name}@${pkg.version}' released successfully!`);
        resolve();
      }
      else {
        reject(new Error(`'${name}' release failed! ${code}${EOL}${err}`));
      }
    });
  });
}
async function run() {
  const packagesDir = join(__dirname, 'packages');
  return Promise.all(
    (await readdir(packagesDir)).map((pkgName) => (async () => {
      const info = new Info(pkgName);
      recordMap.set(pkgName, info);

      const latestVersion = await getLatestVersion(pkgName);
      const packageDir = join(packagesDir, pkgName);
      const pkgPath = join(packageDir, 'package.json');
      const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'));

      if (pkg.version !== latestVersion) {
        info.info(`Start to release '${pkgName} '...`);
        await release(pkg, packageDir);
      }
      else {
        info.info(`'${pkgName}@${pkg.version}' is up to date!`);
      }

      return info;
    })())
  );
}

run().then(
  (infos) => {
    for (const info of infos) {
      console.info(info.messages.join(EOL) + EOL);
    }
  },
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
