/**
 * 构建期资源标签处理：
 *  - `extractAssetTags`：从 buildHtmlPlugin 编译产物中提取注入的
 *    `<script type="module" crossorigin>` / `<link rel="stylesheet" crossorigin>` 标签。
 *  - `removeEntryTagsFromTemplate`：对齐 Vite buildHtmlPlugin 的 transform 行为，
 *    从原始模板源码中移除已被编译的入口 script / link 标签。
 *  - `injectAssetTagsIntoTemplate`：把提取的标签注入**原始模板源码**（先移除
 *    旧入口标签），保留 `<%= title %>` / `#{variable}` 等模板语法供服务端渲染。
 */
import {
  HAML_EXTS,
  htmlTagsToIndentSyntax,
  parseAttrs,
  TEACUP_LIKE_EXTS
} from './indent-syntax';
import { logger, PLUGIN_NAME } from './logger';

/** 缩进式模板引擎扩展名（Pug / Haml / Slim 等，不能直接塞原始 HTML 标签） */
const INDENT_BASED_EXTS = new Set([
  '.pug', '.jade',
  '.haml', '.haml-coffee', '.hamlet',
  '.slim', '.slm',
  '.teacup',
  '.react',
  '.ractive'
]);

/** 缩进式模板中 head 声明的正则锚点，供多种引擎复用同一匹配器 */
const HEAD_FALLBACK_INDICATORS: RegExp[] = [
  /(^|\n)[ \t]*head\b/, // Pug / Jade / Slim
  /(^|\n)[ \t]*%head\b/, // Haml
  /(^|\n)[ \t]*:title\b/ // Teacup / Ractive（fallback）
];


/** 返回从 `lineStartIdx` 起始的行的结束索引（`\n` 位置，末行返回 length） */
function findLineEnd(source: string, lineStartIdx: number): number {
  const nl = source.indexOf('\n', lineStartIdx);
  return nl === -1 ? source.length : nl;
}


/** 扫描 head 声明行之后首个非空行，返回其前导空白（无子节点时返回 ''） */
function detectChildIndent(source: string, headLineEnd: number): string {
  let pos = headLineEnd + 1;
  while (pos < source.length) {
    const lineEnd = findLineEnd(source, pos);
    const line = source.slice(pos, lineEnd);
    if (line.trim() === '') {
      pos = lineEnd + 1;
      continue;
    }
    const [, ws] = /^([ \t]*)/.exec(line)!;
    return ws;
  }
  return '';
}


/** 给 `text` 的每一非空行加上 `indent` 前缀 */
function prependIndentPerLine(text: string, indent: string): string {
  return text
    .split('\n')
    .map((l) => (l.length === 0 ? '' : indent + l))
    .join('\n');
}


/**
 * 从编译后的 HTML 中提取 buildHtmlPlugin 注入的资源标签。
 * buildHtmlPlugin 生成的 script / link 标签始终带 `crossorigin` 属性，
 * 以此与用户手写的标签区分。未匹配到时返回 null。
 */
export function extractAssetTags(html: string): string | null {
  const tags: string[] = [];

  const scriptRE = /<script\s+[^>]*type="module"[^>]*crossorigin[^>]*>\s*<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRE.exec(html)) !== null) {
    tags.push(match[0]);
  }

  const linkRE = /<link\s+[^>]*rel="stylesheet"[^>]*crossorigin[^>]*>/gi;
  while ((match = linkRE.exec(html)) !== null) {
    tags.push(match[0]);
  }

  return tags.length > 0 ? tags.join('\n') : null;
}

export interface InjectArgs {
  /** 模板中的占位符字符串；命中则替换为资源标签 */
  injectPlaceholder?: string;
  /** 模板文件扩展名（含点，如 `.ejs` / `.pug`） */
  extension: string;
  /** 模板文件绝对路径，仅用于日志 */
  templatePath: string;
  /** 判断 URL 是否指向 publicDir 资源（Vite 保留不删，此处同样保留） */
  isPublicFile?: (url: string) => boolean;
}

/**
 * 对齐 Vite `isExcludedUrl`：`#` 锚点、外部协议（http/https/data 等）、
 * 协议相对（`//`）的 URL 不参与构建，原标签保留。
 */
function isExcludedUrl(url: string): boolean {
  return url.startsWith('#') || url.startsWith('//') || /^[a-z][\w+.-]*:/i.test(url);
}

/** 括号式模板（HTML 语法）：移除 `<script type="module">` / `<link rel="stylesheet">` 入口标签 */
function stripHtmlEntryTags(
  src: string,
  shouldRemove: (url: string | null) => boolean,
): string {
  let removed = 0;

  // `<script type="module">`：内联（src 为 null）或本地 src 均被 Vite 移除；
  // 带 vite-ignore 的保留（Vite 仅删属性不删标签）
  src = src.replace(
    /[ \t]*<script\b([^>]*)>[\s\S]*?<\/script>[ \t]*\n?/gi,
    (match, attrStr: string) => {
      const attrs = parseAttrs(attrStr);
      if (attrs.type !== 'module' || 'vite-ignore' in attrs) {
        return match;
      }
      if (shouldRemove(attrs.src ?? null)) {
        removed++;
        return '';
      }
      return match;
    },
  );

  // `<link rel="stylesheet">`：本地且无 media / disabled 时被 Vite 移除（转 import）
  src = src.replace(
    /[ \t]*<link\b([^>]*?)\/?>[ \t]*\n?/gi,
    (match, attrStr: string) => {
      const attrs = parseAttrs(attrStr);
      if (
        attrs.rel !== 'stylesheet'
        || 'media' in attrs
        || 'disabled' in attrs
      ) {
        return match;
      }
      if (shouldRemove(attrs.href ?? null)) {
        removed++;
        return '';
      }
      return match;
    },
  );

  if (removed > 0) {
    logger.debug(`removeEntryTags: stripped ${removed} entry tag(s) from HTML-syntax template`);
  }
  return src;
}

/** Haml 属性形式：`:key => "val"` 或 `key: "val"`，仅提取键值对 */
function parseHamlAttrs(fragment: string): Record<string, string> {
  const result: Record<string, string> = {};
  const re = /:?([\w-]+)\s*(?:=>|:)\s*(?:"([^"]*)"|'([^']*)')/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(fragment)) !== null) {
    result[m[1].toLowerCase()] = m[2] ?? m[3] ?? '';
  }
  return result;
}

/** 缩进式模板：按行匹配并移除 Pug / Slim / Haml 的入口 script / link 声明 */
function stripIndentEntryTags(
  src: string,
  extension: string,
  shouldRemove: (url: string | null) => boolean,
): string {
  // Teacup / React 类为编程式 DSL，语法形态不可枚举，跳过移除交由占位符方案处理
  if (TEACUP_LIKE_EXTS.has(extension)) {
    return src;
  }

  const isHaml = HAML_EXTS.has(extension);
  // Pug / Slim 括号式：`script(type="module" src="...")`；Haml：`%script{...}`
  const scriptRE = isHaml
    ? /^\s*%script\s*(?:\{([^}]*)\})?\s*$/
    : /^\s*script(?:[#.][\w-]+)*\s*\(([^)]*)\)\s*$/;
  const linkRE = isHaml
    ? /^\s*%link\s*\{([^}]*)\}\s*$/
    : /^\s*link(?:[#.][\w-]+)*\s*\(([^)]*)\)\s*$/;
  const parse = isHaml ? parseHamlAttrs : parseAttrs;

  let removed = 0;
  const lines = src.split('\n').filter((line) => {
    let match = scriptRE.exec(line);
    if (match) {
      const attrs = parse(match[1] ?? '');
      if (
        attrs.type === 'module'
        && !('vite-ignore' in attrs)
        && shouldRemove(attrs.src ?? null)
      ) {
        removed++;
        return false;
      }
      return true;
    }
    match = linkRE.exec(line);
    if (match) {
      const attrs = parse(match[1] ?? '');
      if (
        attrs.rel === 'stylesheet'
        && !('media' in attrs)
        && !('disabled' in attrs)
        && shouldRemove(attrs.href ?? null)
      ) {
        removed++;
        return false;
      }
    }
    return true;
  });

  if (removed > 0) {
    logger.debug(`removeEntryTags: stripped ${removed} entry tag line(s) from indent-syntax template`);
  }
  return lines.join('\n');
}

/**
 * 对齐 Vite `buildHtmlPlugin` 的 transform 行为，从**原始模板源码**中移除
 * 会被编译为 import / html-proxy 的入口资源标签：
 *   - `<script type="module" src="本地路径">` 与内联 `<script type="module">`
 *   - `<link rel="stylesheet" href="本地css">`（无 media / disabled）
 * 与 Vite 一致，以下情况保留：外部 / data / `#` URL、publicDir 资源、
 * 带 `vite-ignore` 的 script。若不移除，注入新资源标签后新旧标签会共存。
 */
export function removeEntryTagsFromTemplate(
  templateSource: string,
  args: Pick<InjectArgs, 'extension' | 'isPublicFile'>,
): string {
  const { extension, isPublicFile } = args;
  // src 为 null 对应内联 module script，Vite 同样会移除（转 html-proxy）
  const shouldRemove = (url: string | null): boolean =>
    url === null || (!isExcludedUrl(url) && !(isPublicFile?.(url) ?? false));

  return INDENT_BASED_EXTS.has(extension)
    ? stripIndentEntryTags(templateSource, extension, shouldRemove)
    : stripHtmlEntryTags(templateSource, shouldRemove);
}

/**
 * 将 HTML 格式的资源标签注入**原始**模板源码。注入前先按 Vite 语义移除
 * 原始入口标签（见 `removeEntryTagsFromTemplate`）。注入优先级：
 *   1. `injectPlaceholder` 命中 → 替换占位符
 *   2. 括号式模板（EJS/Nunjucks/Handlebars 等）→ `</head>` 前注入（Vite 原生行为）
 *   3. 缩进式模板 → 定位 head 声明行，以子节点同级缩进插入引擎原生语法标签
 *   4. 全部失败 → 追加到文件末尾并 WARN 提示设置 injectPlaceholder
 */
export function injectAssetTagsIntoTemplate(
  templateSource: string,
  htmlAssetTags: string,
  args: InjectArgs,
): string {
  const { injectPlaceholder, extension, templatePath } = args;
  const isIndentBased = INDENT_BASED_EXTS.has(extension);

  // 0. 与 Vite buildHtmlPlugin 对齐：编译产物里原入口标签已被删除，
  // 模板源码也必须先移除，否则注入后新旧标签共存。
  templateSource = removeEntryTagsFromTemplate(templateSource, args);

  // 1. 显式占位符
  if (injectPlaceholder && templateSource.includes(injectPlaceholder)) {
    const tagsToInsert = isIndentBased
      ? htmlTagsToIndentSyntax(htmlAssetTags, extension)
      : htmlAssetTags;
    logger.debug(
      `injectAssetTags: replacing injectPlaceholder in ${templatePath} `
      + `(${isIndentBased ? `converted to ${extension.slice(1)} syntax` : 'as-is HTML'})`,
    );
    return templateSource.replace(injectPlaceholder, tagsToInsert);
  }

  // 2. 括号式模板：注入到 </head> 前
  if (!isIndentBased && /<\/head>/i.test(templateSource)) {
    logger.debug(`injectAssetTags: bracket fallback → inject before </head> in ${templatePath}`);
    return templateSource.replace(/<\/head>/i, `${htmlAssetTags}\n</head>`);
  }

  // 3. 缩进式模板：head 锚点注入
  if (isIndentBased) {
    for (const indicator of HEAD_FALLBACK_INDICATORS) {
      const match = templateSource.match(indicator);
      if (!match) {
        continue;
      }
      // head 声明行的起始与结束位置
      const headLineStart = match.index! + match[1].length;
      const lineEndIdx = findLineEnd(templateSource, headLineStart);
      const headLine = templateSource.slice(headLineStart, lineEndIdx);

      // 检测 head 首个子节点的缩进，让生成的标签与 meta/title 同级
      const childIndent = detectChildIndent(templateSource, lineEndIdx);
      const convertedTags = htmlTagsToIndentSyntax(htmlAssetTags, extension);

      const prefix = childIndent.length > 0 ? childIndent : `${(/^[ \t]*/.exec(headLine))?.[0] ?? ''}  `;
      const indentedTags = prependIndentPerLine(convertedTags, prefix);
      logger.debug(
        `injectAssetTags: indent fallback → inject under head in ${templatePath} `
        + `(extension=${extension}, indent="${prefix.replace(/\t/g, '\\t')}")`,
      );
      return `${templateSource.slice(0, lineEndIdx)}\n${indentedTags}${templateSource.slice(lineEndIdx)}`;
    }
  }

  // 4. 全部失败：追加到末尾 + 告警
  logger.warn(
    `[${PLUGIN_NAME}] Could not determine an injection position for asset `
    + `tags in template "${templatePath}" (extension=${extension}). `
    + 'Tags will be appended to the end of the file. '
    + 'It is STRONGLY RECOMMENDED to set the `injectPlaceholder` option and '
    + 'place the exact placeholder string at the desired location in your template.',
  );
  const tagsAppended = isIndentBased
    ? htmlTagsToIndentSyntax(htmlAssetTags, extension)
    : htmlAssetTags;
  return `${templateSource + (templateSource.endsWith('\n') ? '' : '\n') + tagsAppended}\n`;
}
