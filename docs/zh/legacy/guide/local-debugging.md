
::: danger 这是 Vite 1.x – 6.x 旧版文档归档 / This is Vite 1.x – 6.x legacy archive
- 本文档对应插件版本：**vite-plugin-view ≤ 4.x、vite-plugin-external ≤ 7.x、vite-plugin-build-chunk ≤ 4.x 等旧发行版**。
- 适用打包器：Rollup / esbuild（Vite 6 及之前的默认组合）。**不支持 Vite 8+ 的 Rolldown 打包器**，Vite 7/8+ 用户请立即返回新文档。
- 本目录内容已冻结，不再维护。遇到新功能/新字段请查看最新文档：
  - 中文新文档：<a href="/zh/plugins/">/zh/plugins/</a>
  - English new docs：<a href="/plugins/">/plugins/</a>
:::
# 本地调试

## 安装

使用 `npm run deps` 安装项目依赖：

```bash
npm run deps
```

## 脚本命令

项目中包含多个 npm 脚本命令，用于不同的开发和构建任务：

- `deps`: 清理并安装依赖。
- `clean`: 清理 `node_modules` 目录。
- `eslint`: 运行 ESLint 进行代码格式化和 linting。
- `build:packages`: 并行构建所有插件包。
- `build:examples`: 并行构建所有示例项目。
- `prepare`: 安装 Husky 钩子。
- `docs:dev`: 启动项目文档开发服务器。
- `docs:preview`: 预览项目文档。
- `docs:build`: 生成项目文档。

## 目录结构

```
vite-plugins/
├── examples/          # 示例项目
├── packages/          # 插件包
│   ├── vite-plugin-combine/
│   ├── vite-plugin-cp/
│   ├── vite-plugin-external/
│   ├── vite-plugin-hook-use/
│   ├── vite-plugin-include-css/
│   ├── vite-plugin-mock-data/
│   ├── vite-plugin-reverse-proxy/
│   └── vite-plugin-separate-importer/
├── package.json       # 项目配置文件
└── README.md          # 英文 README
```

## 示例项目

项目中包含多个示例项目，展示如何使用这些插件：

* [vite3 demo](https://github.com/fengxinming/vite-plugins/tree/main/examples/vite3-demo)
* [vite4 demo](https://github.com/fengxinming/vite-plugins/tree/main/examples/vite4-demo)
* [vite5 demo](https://github.com/fengxinming/vite-plugins/tree/main/examples/vite5-demo)
* [vite6 demo](https://github.com/fengxinming/vite-plugins/tree/main/examples/vite6-demo)