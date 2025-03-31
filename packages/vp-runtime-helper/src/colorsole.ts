import picocolors from 'picocolors';

export const colorsole = {} as Record<keyof Omit<typeof picocolors, 'createColors'>, (...args: any[]) => void>;
Object.entries(picocolors).forEach(([key, value]) => {
  colorsole[key] = (text: string) => {
    // eslint-disable-next-line no-console
    console.log(value(text));
  };
});
