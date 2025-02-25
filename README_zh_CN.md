# vite-plugins

> `vite-plugins` 是一个包含多个自定义插件的集合，用于增强 Vite 构建工具的功能。

## [English](./README.md) | 中文

## 插件列表

### [vite-plugin-combine](packages/vite-plugin-combine)

**功能**: 组合多个文件生成一个主文件，并根据配置导出这些文件的内容。支持命名导出、默认导出和无导出三种模式。

### [vite-plugin-cp](packages/vite-plugin-cp)

**功能**: 复制文件到指定目录。

### [vite-plugin-external](packages/vite-plugin-external)

**功能**: 排除指定模块依赖，支持开发运行时和打包后的 bundle 文件。

### [vite-plugin-hook-use](packages/vite-plugin-hook-use)

**功能**: 显示 `vite` 调用 hook 函数的顺序和次数。

### [vite-plugin-include-css](packages/vite-plugin-include-css)

**功能**: 打包 CSS 代码到一个 JS 文件中。

### [vite-plugin-mock-data](packages/vite-plugin-mock-data)

**功能**: 配置本地 mock 数据。

### [vite-plugin-reverse-proxy](packages/vite-plugin-reverse-proxy)

**功能**: 配合 Chrome 插件 [XSwitch](https://chrome.google.com/webstore/detail/xswitch/idkjhjggpffolpidfkikidcokdkdaogg) 将线上资源代理到本地调试。

### [vite-plugin-separate-importer](packages/vite-plugin-separate-importer)

**功能**: 将原来从一个源模块批量导入内容变成分批从源模块下导入单个文件。

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
- `docs`: 生成项目文档。

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
├── .eslintignore      # ESLint 忽略文件
├── .eslintrc.js       # ESLint 配置文件
├── .husky/            # Husky 配置目录
├── .lintstagedrc.js   # lint-staged 配置文件
├── package.json       # 项目配置文件
├── README.md          # 英文 README
├── README_zh-CN.md    # 中文 README
└── typedoc.json       # TypeDoc 配置文件
```

## 示例项目

项目中包含多个示例项目，展示如何使用这些插件：

- [vite3-demo](./examples/vite3-demo)
- [vite4-demo](./examples/vite4-demo)
- [vite5-demo](./examples/vite5-demo)
- [vite6-demo](./examples/vite6-demo)

## 贡献

欢迎贡献代码！请确保你的代码符合项目规范，并通过所有测试用例。

## 许可证

MIT