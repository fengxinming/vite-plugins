import { getHash } from './getHash';


const FLATTEN_ID_HASH_LENGTH = 8;
const FLATTEN_ID_MAX_FILE_LENGTH = 170;
const limitFlattenIdLength = (
  id: string,
  limit: number = FLATTEN_ID_MAX_FILE_LENGTH,
): string => {
  if (id.length <= limit) {
    return id;
  }
  return `${id.slice(0, limit - (FLATTEN_ID_HASH_LENGTH + 1))}_${getHash(id)}`;
};


const replaceSlashOrColonRE = /[/:]/g;
const replaceDotRE = /\./g;
const replaceNestedIdRE = /\s*>\s*/g;
const replaceHashRE = /#/g;
export function flattenId(id: string): string {
  const flatId = limitFlattenIdLength(
    id
      .replace(replaceSlashOrColonRE, '_')
      .replace(replaceDotRE, '__')
      .replace(replaceNestedIdRE, '___')
      .replace(replaceHashRE, '____'),
  );
  return flatId;
}
