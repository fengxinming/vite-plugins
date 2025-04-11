[**create-vite-lib-starter**](entry.md)

***

[create-vite-lib-starter](entry.md) / isNil

# isNil

## Functions

### default()

> **default**(`value`): value is undefined \| null

Defined in: isNil.ts:20

Checks if `value` is `null` or `undefined`.

#### Parameters

##### value

`unknown`

The value to check.

#### Returns

value is undefined \| null

Returns `true` if `value` is nullish, else `false`.

#### Example

```ts
isNil(null)
// => true

isNil(void 0)
// => true

isNil(NaN)
//=> false
```
