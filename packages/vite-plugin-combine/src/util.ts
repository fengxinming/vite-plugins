import figlet from 'figlet';

function banner(text: string, opts?: any): void {
  // eslint-disable-next-line no-console
  console.log(figlet.textSync(text, opts));
}

export { banner };
