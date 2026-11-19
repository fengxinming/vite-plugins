/**
 * 示例 16 的页面入口 — 只引用被 importmap 名单覆盖的两个依赖。
 *
 * lodash / dayjs 在 vite.config.16.mts 里以 CDN URL 形态 external，且开了
 * importmap 开关：模块里留下的是裸说明符（dev 经 vite 包成 /@id/<说明符>），
 * 地址完全由插件注入的 <script type="importmap"> 提供。
 *
 * 故意不引用 @babel/core：它在浏览器里要靠 esm.sh 的 ?bundle 才跑得起来
 * （见示例 3 的说明），而本示例要证的是"裸说明符 + 一张表"这条最短链路。
 */
import dayjs from 'dayjs';
import _ from 'lodash';

const merged = _.merge({ name: 'vite-plugin-external' }, { version: _.VERSION });
const stamp = dayjs('2026-11-06').format('YYYY/MM/DD');

document.querySelector('#app')!.innerHTML = `
  <p>${merged.name}@${merged.version}</p>
  <p>lodash.merge + dayjs.format → ${stamp}</p>
`;
