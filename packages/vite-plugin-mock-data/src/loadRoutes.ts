
import { readFileSync } from 'node:fs';
import { unlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, parse } from 'node:path';

import { glob } from 'tinyglobby';
import { transformWithEsbuild } from 'vite';

import { logger, PLUGIN_NAME } from './logger';
import { RouteConfig } from './typings';

async function getRoute(filename: string): Promise<RouteConfig | undefined> {
  logger.debug('Load mock file:', filename);

  // eslint-disable-next-line prefer-const
  let { ext, dir, name } = parse(filename);
  const isTs = ext === '.ts' || ext === '.mts';
  if (isTs) {
    const { code } = await transformWithEsbuild(readFileSync(filename, 'utf-8'), filename, {
      loader: 'ts',
      target: 'esnext'
    });
    filename = join(dir, `${name}-${PLUGIN_NAME}.mjs`);
    ext = '.mjs';
    await writeFile(filename, code);
  }

  let config: RouteConfig | undefined;
  switch (ext) {
    case '.js':
      config = createRequire(import.meta.url)(filename);
      break;
    case '.mjs':
      config = (await import(filename)).default;
      if (isTs) {
        await unlink(filename);
      }
      break;
    case '.json':
      config = JSON.parse(readFileSync(filename, 'utf-8'));
      break;
  }
  return config;
}

export default async function loadRoutes(dir: string, routes: RouteConfig[]): Promise<void> {
  const paths = await glob(`${dir}/**/*.{js,mjs,json,ts,mts}`, { absolute: true });
  const configs = await Promise.all(paths.map(getRoute));
  for (const config of configs) {
    if (config) {
      routes.push(config);
    }
  }
}
