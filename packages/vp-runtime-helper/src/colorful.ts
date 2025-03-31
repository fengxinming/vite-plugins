import picocolors from 'picocolors';

export const colorful = {} as Record<keyof Omit<typeof picocolors, 'createColors'>, (...args: any[]) => void>;
Object.entries(picocolors).forEach(([key, value]) => {
  colorful[key] = (text: string) => {
    // eslint-disable-next-line no-console
    console.log(value(text));
  };
});
