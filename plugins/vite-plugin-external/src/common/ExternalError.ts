import { PLUGIN_NAME } from './constants';

export class ExternalError extends Error {
  constructor(msg: string, opts?: ErrorOptions) {
    super(`[${PLUGIN_NAME}] ${msg}`, opts);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, new.target);
    }
  }
}
