# Usage Examples

Assuming the following file structure:

```
src/
  |- components/
  |     |- Button.ts
  |     |- Input.ts
  |     |- Select.ts
```

Configure the plugin as:

```typescript
pluginCombine({
  src: 'src/components/**/*.ts',
  target: 'src/index.ts',
  exports: 'named',
  nameExport: (name, filePath) => `my${name}`
})
```

This will generate the following `src/index.ts` file:

```typescript
export { default as myButton } from './components/Button';
export { default as myInput } from './components/Input';
export { default as mySelect } from './components/Select';
```