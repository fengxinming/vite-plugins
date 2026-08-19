import { get, merge, set } from 'lodash';

/**
 * 演示 plugin-separate-importer 将 lodash 批量导入拆分：
 *   import { get, set, merge } from 'lodash'
 *   → import get from 'lodash/get' + import set from 'lodash/set' + ...
 */
export function transform(obj: any) {
  const val = get(obj, 'a.b.c');
  set(obj, 'x.y', val);
  return merge({}, obj);
}
