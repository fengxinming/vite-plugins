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