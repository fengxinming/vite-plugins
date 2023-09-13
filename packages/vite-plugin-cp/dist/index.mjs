import { isAbsolute, join, parse, relative } from 'node:path';
import { statSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { pathExists, mkdirs, copy } from 'fs-extra';
import { globby } from 'globby';

function makeCopy(transform) {
    return transform
        ? function (from, to) {
            return readFile(from)
                .then((buf) => transform(buf, from))
                .then((data) => {
                const { dir } = parse(to);
                return pathExists(dir).then((itDoes) => {
                    if (!itDoes) {
                        return mkdirs(dir);
                    }
                }).then(() => {
                    return writeFile(to, data);
                });
            });
        }
        : copy;
}
function transformName(name, rename) {
    if (typeof rename === 'function') {
        return rename(name) || name;
    }
    return rename || name;
}
function createPlugin(opts) {
    const { hook = 'writeBundle', enforce, targets, cwd = process.cwd(), globbyOptions } = opts || {};
    const plugin = {
        name: 'vite:cp'
    };
    if (enforce) {
        plugin.enforce = enforce;
    }
    if (!Array.isArray(targets) || !targets.length) {
        return plugin;
    }
    const toAbsolutePath = (pth) => {
        if (!isAbsolute(pth)) {
            pth = join(cwd, pth);
        }
        return pth;
    };
    let called = false;
    plugin[hook] = async function () {
        // copy once
        if (called) {
            return;
        }
        called = true;
        const startTime = Date.now();
        await Promise.all(targets.map(({ src, dest, rename, flatten, transform }) => {
            dest = toAbsolutePath(dest);
            const cp = makeCopy(transform);
            const glob = (pattern) => {
                let notFlatten = false;
                try {
                    notFlatten = statSync(pattern).isDirectory() && flatten === false;
                }
                catch (e) { }
                return globby(pattern, globbyOptions).then((matchedPaths) => {
                    if (!matchedPaths.length) {
                        throw new Error(`Could not find files with "${pattern}"`);
                    }
                    return matchedPaths.map((matchedPath) => {
                        matchedPath = toAbsolutePath(matchedPath);
                        const outputToDest = notFlatten
                            ? function (matchedPath) {
                                const tmp = parse(relative(pattern, matchedPath));
                                return cp(matchedPath, join(dest, tmp.dir, transformName(tmp.base, rename)));
                            }
                            : function (matchedPath) {
                                return cp(matchedPath, join(dest, transformName(parse(matchedPath).base, rename)));
                            };
                        return outputToDest(matchedPath);
                    });
                });
            };
            if (typeof src === 'string') {
                return glob(src);
            }
            else if (Array.isArray(src)) {
                return Promise.all(src.map(glob));
            }
            return null;
        }));
        console.info(`Done in ${Number((Date.now() - startTime) / 1000).toFixed(1)}s`);
    };
    return plugin;
}

export { createPlugin as default };
