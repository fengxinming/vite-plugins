# vite8-separate-importer

演示 `vite-plugin-separate-importer`：将批量导入拆分为单文件导入。

## 示例

| 配置 | 说明 |
|------|------|
| `vite.config.1.mts` | antd 按需引入（importFrom + insertFrom） |
| `vite.config.2.mts` | lodash 自定义拆分（手动 kebab-case 转换） |

## 运行

```bash
pnpm build --config vite.config.1.mts
```
