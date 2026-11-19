import axios from 'axios';
import { createMockAdapter } from 'vite-plugin-mock-data/axios-adapter';

/**
 * 产物端（静态页面）mock 入口。
 *
 * 被 config 9 / config 10 的 `build.rolldownOptions.input` 引用，用来验证 `mockIn`
 * 真的把 `./mock` 目录的代码编进了产物——页面入口若只写原生 fetch，产物里不会出现
 * 任何 mock 代码，产物断言的“含 mock 数据”就永远测不到东西。
 *
 * 浏览器打开产物页时，这个入口通过 axios adapter 请求 mock 接口并把结果写进 DOM。
 * 前缀用 axios `baseURL` 表达（'/app' + '/api/users' 运行时拼成 '/app/api/users'），
 * 不在代码里写死带前缀的完整路径：带前缀的路径只由客户端运行时的 normalizeRoutes（withBase）
 * 拼出，静态产物里 `base` 与无前缀 route key 各自独立。
 */
const api = axios.create({
  adapter: createMockAdapter(),
  baseURL: '/app'
});

const output = document.querySelector('#output');

api.get('/api/users')
  .then((res) => {
    if (output) {
      output.textContent = JSON.stringify(res.data, null, 2);
    }
  })
  .catch((error: unknown) => {
    if (output) {
      output.textContent = String(error);
    }
  });
