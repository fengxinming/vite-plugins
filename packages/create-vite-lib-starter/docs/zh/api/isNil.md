[**create-vite-lib-starter**](entry.md)

***

[create-vite-lib-starter](entry.md) / isNil

# isNil

## 函数

### default()

> **default**(`value`): value is undefined \| null

定义于: isNil.ts:20

Checks if `value` is `null` or `undefined`.

#### 参数

##### value

`unknown`

The value to check.

#### 返回

value is undefined \| null

Returns `true` if `value` is nullish, else `false`.

#### 示例

```ts
isNil(null)
// => true

isNil(void 0)
// => true

isNil(NaN)
//=> false
```
