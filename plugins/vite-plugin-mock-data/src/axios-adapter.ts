import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import { request } from 'vite-plugin-mock-data/mock-client';

export function createMockAdapter(): AxiosAdapter {
  return async function mockAdapter(
    config: InternalAxiosRequestConfig
  ): Promise<AxiosResponse> {
    // `axios.getUri(config)` 已把 baseURL / params（query）序列化进 url，
    // 因此不再单独传 query，避免与 url 内的查询串重复。
    const res = await request({
      url: axios.getUri(config),
      method: (config.method ?? 'GET').toUpperCase(),
      body: config.data,
      headers: axios.AxiosHeaders.from(config.headers).normalize(true)
      // MockResponse 与 AxiosResponse 结构不完全一致（缺 config / request），
      // 由下方手工补齐；此处必须断言否则类型报错，无法隐式兼容。
    }) as AxiosResponse;

    res.config = config;
    res.request = null;

    // 与 axios 内置 adapter 的 settle() 语义一致：非 2xx 且 validateStatus
    // 不允许时必须拒绝，否则调用方的 catch / 拦截器永远不触发。
    const { status } = res;
    const validateStatus = config.validateStatus
      ?? ((s: number) => s >= 200 && s < 300);
    if (!validateStatus(status)) {
      throw new axios.AxiosError(
        `Request failed with status code ${status}`,
        status >= 500 ? axios.AxiosError.ERR_BAD_RESPONSE : axios.AxiosError.ERR_BAD_REQUEST,
        config,
        null,
        res
      );
    }

    return res;
  };
}
