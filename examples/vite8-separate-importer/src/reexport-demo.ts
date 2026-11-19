/**
 * 演示 plugin-separate-importer 拆分 named re-export：
 *   export { get, set } from 'lodash'
 *   → export { default as get } from 'lodash/get' + export { default as set } from 'lodash/set'
 *
 * 含 renamed re-export：
 *   export { merge as mergeDeep } from 'lodash'
 *   → export { default as mergeDeep } from 'lodash/merge'
 */
export { get, set } from 'lodash';
export { merge as mergeDeep } from 'lodash';
