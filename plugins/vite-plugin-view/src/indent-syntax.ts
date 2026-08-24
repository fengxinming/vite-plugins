/**
 * 将 buildHtmlPlugin 注入的 HTML 资源标签转换为缩进式模板引擎的原生语法。
 *
 * Pug / Haml / Slim 等引擎对空白敏感，`<script src="x">` 这类原始 HTML 标签
 * 要么编译失败、要么被当作纯文本输出。这里把标签重写为引擎自己的属性形式：
 *   - Pug / Jade：`script(type="module", crossorigin, src="/a.js")`
 *   - Haml：`%script{type:"module", crossorigin:"", src:"/a.js"}`
 *   - Slim / Slm：与 Pug 相同写法（保守输出，Slim 兼容）
 *   - Teacup / React 类（编程式 DSL）：直接返回原始 HTML
 *   - 未知缩进扩展名：fallback 到 Pug 风格（最广泛兼容）
 *
 * 注：故意用正则解析而不引入 HTML parser——buildHtmlPlugin 产出的标签集合
 * 很小且形式固定，正则更便宜，也规避了 Rolldown 转译的特殊字符问题。
 */

/** Teacup / React 类引擎：接受字面量 HTML 片段，无需转换 */
export const TEACUP_LIKE_EXTS = new Set(['.teacup', '.react', '.ractive']);

/** Haml 族扩展名：使用 `%tag{attrs}` 语法 */
export const HAML_EXTS = new Set(['.haml', '.haml-coffee', '.hamlet']);


/**
 * Haml 风格：`%tagName{:attr1 => "val1", :attr2 => "", :attr3 => "val3"}`。
 * Haml 中属性存在即为真，因此布尔 `crossorigin` 输出为 `:crossorigin => ""`。
 */
function hamlTag(tagName: string, attrs: Record<string, string>): string {
  const parts = Object.entries(attrs).map(([k, v]) =>
    `:${k} => "${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  );
  return parts.length > 0 ? `%${tagName}{${parts.join(', ')}}` : `%${tagName}`;
}


/**
 * 解析 HTML 属性字符串为普通对象。布尔属性（如 `crossorigin`）映射为空串，
 * 由各引擎渲染器决定写法。
 */
export function parseAttrs(attrFragment: string): Record<string, string> {
  const result: Record<string, string> = {};
  const re = /([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attrFragment)) !== null) {
    const key = m[1].toLowerCase();
    result[key] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return result;
}


/**
 * Pug / Jade / Slim 风格：`tagName(attr1="val1", attr2, attr3="val3")`。
 * 布尔属性不带 `=` 输出，与 Vite 默认的 `<script crossorigin>` 一致。
 */
function pugLikeTag(tagName: string, attrs: Record<string, string>): string {
  const parts = Object.entries(attrs).map(([k, v]) =>
    (v === '' ? k : `${k}="${v.replace(/"/g, '&quot;')}"`)
  );
  return parts.length > 0 ? `${tagName}(${parts.join(', ')})` : tagName;
}


/**
 * Convert one or more HTML `<script>` / `<link>` tags into the target
 * indent-based template engine's native syntax.
 *
 * @param htmlTags  buildHtmlPlugin 产出的标签（带 crossorigin、JS 带 type="module"）
 * @param extension 模板文件扩展名（含点，如 `.pug`）
 */
export function htmlTagsToIndentSyntax(htmlTags: string, extension: string): string {
  if (TEACUP_LIKE_EXTS.has(extension)) {
    return htmlTags;
  }

  const isHaml = HAML_EXTS.has(extension);
  const out: string[] = [];

  const scriptRE = /<script\b([^>]*)>\s*<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = scriptRE.exec(htmlTags)) !== null) {
    const attrs = parseAttrs(m[1]);
    out.push(isHaml ? hamlTag('script', attrs) : pugLikeTag('script', attrs));
  }

  const linkRE = /<link\b([^>]*)\/?>/gi;
  while ((m = linkRE.exec(htmlTags)) !== null) {
    const attrs = parseAttrs(m[1]);
    out.push(isHaml ? hamlTag('link', attrs) : pugLikeTag('link', attrs));
  }

  return out.join('\n');
}

