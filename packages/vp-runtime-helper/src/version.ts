import { readFileSync, statSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';

import { version } from 'vite';

function getClosestFilePath(fileName: string, path?: string): string | null {
  if (!path) {
    path = process.cwd();
  }

  // Check if the current path is the root directory
  const pathObj = parse(path);
  if (pathObj.root === path) {
    return null;
  }

  try {
    const state = statSync(path);

    // Check if the current path is a directory
    if (state.isDirectory()) {
      const filePath = join(path, fileName);

      try {
        // Check if the filePath is a file
        if (!statSync(filePath).isDirectory()) {
          return filePath;
        }
      }
      catch (e) {
        // Error: ENOENT: no such file or directory
        if ((e as any).code === 'ENOENT') {
          // Recursively search for the file in the parent directory
          return getClosestFilePath(fileName, join(path, '..'));
        }

        return null;
      }

      // Recursively search for the file in the parent directory if the current path is a file
      return getClosestFilePath(fileName, join(path, '..'));
    }

    // Check if the current path is a file
    return getClosestFilePath(fileName, dirname(path));
  }
  catch (e) {
    // Error: ENOENT: no such file or directory
    return null;
  }
}

function getClosestPkg(path?: string): Record<string, any> | null {
  const filePath = getClosestFilePath('package.json', path);

  if (filePath) {
    const pkg = readFileSync(filePath, 'utf-8');
    return JSON.parse(pkg);
  }
  return null;
}

export function getRuntimeVersion(): string {
  const { argv } = process;
  let vitePath = argv[1];

  // It might not be vite
  if (!/(\\|\/)vite(\\|\/)/.test(vitePath)) {
    vitePath = join(process.cwd(), 'node_modules', 'vite');
  }

  const pkg = getClosestPkg(vitePath);
  return pkg ? pkg.version : version;
}
