import { normalizePath } from 'vite';

export default function normalize(str) {
  return normalizePath(str);
}
