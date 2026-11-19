declare module '@scope/*' {
  const content: any;
  export default content;
  export const foo: any;
}

/**
 * SFC 的类型面。
 *
 * 没有 vue-language-tools（tsc 拿不到真实 props/emits），这里按官方脚手架的写法
 * 把任意 .vue 的默认导出声明成 DefineComponent：`import VueApp from './VueApp.vue'`
 * 才有类型，`createApp(VueApp)` 才能过 tsc。
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent;
  export default component;
}
