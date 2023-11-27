import { Plugin } from 'vite';
type allHooks = Omit<Plugin, 'name' | 'enforce' | 'apply'>;
export default function createPlugin(): allHooks;
export {};
