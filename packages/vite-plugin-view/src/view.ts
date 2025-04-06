import { existsSync } from 'node:fs';

import engineSource from 'consolidate';
import prettyHTML from 'pretty';
import { ResolvedConfig } from 'vite';

import { logger } from './logger';
import { Options } from './typings';

export default class View {
  engine: string;
  extension: string;
  engineOptions?: Record<string, any>;
  pretty?: boolean;
  // cwd: string;
  // cacheDir: string;
  constructor(
    { engine, engineOptions, extension, pretty }: Options
  ) {
    if (!engine) {
      throw new Error('"options.engine" is required.');
    }
    this.engine = engine;
    this.extension = extension || `.${engine}`;
    this.engineOptions = engineOptions;
    this.pretty = pretty;
  }

  getTemplate(filePath: string): string | undefined {
    const templatePath = filePath.replace('.html', this.extension);
    if (existsSync(templatePath)) {
      return templatePath;
    }
  }

  async render(filePath: string, config: ResolvedConfig): Promise<string> {
    const { engine } = this;
    const engineRender = engineSource[engine];

    if (!engineRender) {
      throw new Error(`Engine "${engine}" is not supported.`);
    }

    logger.debug(`Current engine is "${engine}".`);

    let html = await engineRender(filePath, Object.assign(
      { cache: false, filename: filePath },
      this.engineOptions,
      config
    ));

    // pug模板准备移除这个"pretty"属性，官方不建议使用它，
    // 我们额外增加一个"pretty"属性强行美化模板
    if (this.pretty) {
      html = prettyHTML(html);
    }

    logger.debug(`"${filePath}" has been rendered.`);
    return html;
  }
}
