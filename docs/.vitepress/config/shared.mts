import { defineConfig } from "vitepress";
import { groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons';

import pkg from '../../../package.json' with { type: 'json' };

// Redirect middleware used in BOTH dev (vite configureServer) AND production (preview).
// It handles three categories of legacy routing issues — ordered carefully because
// rules #2 and #3 both inspect Referer but operate on different path prefixes.
//
// Rule 1 (old-broken-url → correct URL, unconditional 301):
//   Fix the legacy URLs that earlier docs builds accidentally published. This is
//   what caused the user's 404 at /legacy/en/guide/introduction.
//     /legacy/en/*        →  /legacy/*          (EN: we moved files under docs/en/legacy/)
//     /zh/legacy/zh/*     →  /zh/legacy/*       (ZH: mirror of the same bug)
//
// Rule 2 (stay-in-legacy when navigating via shared top nav):
//   VitePress only has one global themeConfig.nav / navPlugins dropdown — so when
//   the user is reading a legacy page and clicks 指南 / Guide / 插件列表 / Plugins
//   the top nav still points to /guide or /plugins/vite-plugin-view/quick-start
//   (NEW docs) which means they suddenly drop out of the archive. That is exactly
//   the user's on-going complaint ("从历史版本的指引页点击链接又跳转到了新页面").
//   So if Referer shows they came from a legacy page we rewrite the shared-top-nav
//   targets into their /legacy/ counterparts — 301 so bookmarks + future clicks
//   learn the correct legacy URL.
//   Exclusions (intentional "escape hatches" — we must NOT trap the user inside
//   legacy forever):
//     • site home      /     +  /zh/          → allow (hero CTA "返回首页")
//     • plugins root   /plugins/  + /zh/plugins/  → allow (explicit banner CTA)
//     • guide root if no subpath? /guide /zh/guide   → still re-write (top nav
//       "Guide" from legacy should show legacy intro, not new intro).
//
// Rule 3 (fallback safety — if a legacy page somehow contains a hardcoded
// /legacy/en/* or /zh/legacy/zh/* link inside its body, the unconditional rule
// #1 already captured those — no extra work needed here).
function legacyCompatRedirectPlugin() {
  /**
   * Strip querystring + hash, split a URL into pathname vs the rest.
   * @param {string} rawUrl req.url from Node http
   */
  function split(rawUrl) {
    const [pathname, ...rest] = (rawUrl || '').split('?');
    return { pathname, qs: rest.join('?') };
  }
  function withQs(target, qs) {
    return qs ? `${target}?${qs}` : target;
  }
  function rule1_FixWrongPublishedUrl(url) {
    const { pathname, qs } = split(url);
    let t = null;
    if (pathname.startsWith('/legacy/en/')) t = '/legacy/' + pathname.slice('/legacy/en/'.length);
    else if (pathname === '/legacy/en') t = '/legacy/';
    else if (pathname.startsWith('/zh/legacy/zh/')) t = '/zh/legacy/' + pathname.slice('/zh/legacy/zh/'.length);
    else if (pathname === '/zh/legacy/zh') t = '/zh/legacy/';
    return t ? withQs(t, qs) : null;
  }
  function refererIsLegacy(referer) {
    if (!referer) return false;
    try {
      const u = new URL(referer);
      return u.pathname.startsWith('/legacy/') || u.pathname.startsWith('/zh/legacy/');
    } catch {
      // Broken referer string — treat as not-legacy to be safe.
      return false;
    }
  }
  function rule2_StayInLegacyFromSharedTopNav(url, referer) {
    if (!refererIsLegacy(referer)) return null;
    const { pathname, qs } = split(url);
    // Explicit escape hatches — user clicked a CTA whose URL carries ?latest=1 marker
    // (banners inside legacy docs that say "go to latest docs of this specific plugin")
    // or exactly matches the site-home / plugins-root shortcuts that every legacy
    // page's banner advertises.
    if (qs && /(^|&)latest=1(&|$)/.test(qs)) return null;
    const ESCAPE = new Set(['/', '/zh/', '/plugins/', '/zh/plugins/']);
    if (ESCAPE.has(pathname)) return null;
    // Map /guide/<rest> → /legacy/guide/<rest>
    if (pathname.startsWith('/guide/')) return withQs('/legacy/guide/' + pathname.slice('/guide/'.length), qs);
    if (pathname === '/guide') return withQs('/legacy/guide/introduction', qs);
    // Map /zh/guide/<rest> → /zh/legacy/guide/<rest>
    if (pathname.startsWith('/zh/guide/')) return withQs('/zh/legacy/guide/' + pathname.slice('/zh/guide/'.length), qs);
    if (pathname === '/zh/guide') return withQs('/zh/legacy/guide/introduction', qs);
    // Map /plugins/vite-plugin-*/<rest> → /legacy/plugins/vite-plugin-*/<rest>
    const enPlugin = /^\/plugins\/(vite-plugin-[a-zA-Z0-9-]+\/.*)$/;
    const m1 = pathname.match(enPlugin);
    if (m1) return withQs('/legacy/plugins/' + m1[1], qs);
    // Map /zh/plugins/vite-plugin-*/<rest> → /zh/legacy/plugins/vite-plugin-*/<rest>
    const zhPlugin = /^\/zh\/plugins\/(vite-plugin-[a-zA-Z0-9-]+\/.*)$/;
    const m2 = pathname.match(zhPlugin);
    if (m2) return withQs('/zh/legacy/plugins/' + m2[1], qs);
    // Anything else — leave untouched (e.g. /assets/*, /api/*, homepage, etc.)
    return null;
  }
  function onRequest(req, res, next) {
    const referer = req.headers && (req.headers.referer || req.headers.Referer);
    const to = rule1_FixWrongPublishedUrl(req.url) || rule2_StayInLegacyFromSharedTopNav(req.url, referer);
    if (!to) return next && next();
    res.statusCode = 301;
    res.setHeader('Location', to);
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.end('Moved Permanently: ' + to);
    return undefined;
  }
  return {
    name: 'vite-plugins-docs-legacy-redirects',
    configureServer(server) { server.middlewares.use((req, res, next) => onRequest(req, res, next)); },
    configurePreviewServer(server) { server.middlewares.use((req, res, next) => onRequest(req, res, next)); },
  };
}

export const shared = defineConfig({
  title: pkg.name,
  rewrites: {
    'en/:rest*': ':rest*'
  },
  base: process.env.BASE_URL || '/',
  lastUpdated: true,
  cleanUrls: true,

  markdown: {
    math: true,
    codeTransformers: [
      // We use `[!!code` in demo to prevent transformation, here we revert it back.
      {
        postprocess(code) {
          return code.replace(/\[\!\!code/g, '[!code')
        }
      }
    ],
    config(md) {
      // TODO: remove when https://github.com/vuejs/vitepress/issues/4431 is fixed
      const fence = md.renderer.rules.fence!
      md.renderer.rules.fence = function (tokens, idx, options, env, self) {
        const { localeIndex = 'root' } = env
        const codeCopyButtonTitle = (() => {
          switch (localeIndex) {
            case 'zh':
              return '复制代码'
            default:
              return 'Copy code'
          }
        })()
        return fence(tokens, idx, options, env, self).replace(
          '<button title="Copy Code" class="copy"></button>',
          `<button title="${codeCopyButtonTitle}" class="copy"></button>`
        )
      }
      md.use(groupIconMdPlugin)
    }
  },

  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/fengxinming/vite-plugins.git' }
    ]
  },

  vite: {
    plugins: [
      groupIconVitePlugin() as any,
      legacyCompatRedirectPlugin(),
    ]
  }
})
