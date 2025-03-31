function toPath(deepKey: string): string[] {
  const result: string[] = [];
  const length = deepKey.length;

  if (length === 0) {
    return result;
  }

  let index = 0;
  let key = '';
  let quoteChar = '';
  let bracket = false;

  // Leading dot
  if (deepKey.charCodeAt(0) === 46) {
    result.push('');
    index++;
  }

  while (index < length) {
    const char = deepKey[index];

    if (quoteChar) {
      if (char === '\\' && index + 1 < length) {
        // Escape character
        index++;
        key += deepKey[index];
      }
      else if (char === quoteChar) {
        // End of quote
        quoteChar = '';
      }
      else {
        key += char;
      }
    }
    else if (bracket) {
      if (char === '"' || char === "'") {
        // Start of quoted string inside brackets
        quoteChar = char;
      }
      else if (char === ']') {
        // End of bracketed segment
        bracket = false;
        result.push(key);
        key = '';
      }
      else {
        key += char;
      }
    }
    else if (char === '[') {
      // Start of bracketed segment
      bracket = true;
      if (key) {
        result.push(key);
        key = '';
      }
    }
    else if (char === '.') {
      if (key) {
        result.push(key);
        key = '';
      }
    }
    else {
      key += char;
    }

    index++;
  }

  if (key) {
    result.push(key);
  }

  return result;
}

function toKey(value: any): string {
  const whatType = typeof value;
  if (whatType === 'string' || whatType === 'symbol') {
    return value;
  }

  if (Object.is(value.valueOf(), -0)) {
    return '-0';
  }

  return value.toString();
}

export function isDeepKey(key: PropertyKey): boolean {
  switch (typeof key) {
    case 'number':
    case 'symbol': {
      return false;
    }
    case 'string': {
      return key.includes('.') || key.includes('[') || key.includes(']');
    }
  }
}


function getWithPath(object: any, path: readonly PropertyKey[], defaultValue: any): any {
  if (path.length === 0 || object == null) {
    return defaultValue;
  }

  let lastPath: PropertyKey;
  let lastObject: Record<PropertyKey, any> = object;
  let current: Record<string, any> | void | null = null;
  const len = path.length - 1;
  let index = 0;

  const next = (givenValue: any): void => {
    lastPath = path[index];
    current = lastObject[lastPath];
    if (current == null) {
      current = givenValue;
      lastObject[lastPath] = current;
    }
  };

  for (; index < len; index++) {
    next({});
    lastObject = current as never;
  }

  if (index === len) {
    next(defaultValue);
  }

  return current;
}

export function getValue<T = any>(object: any, path: PropertyKey | readonly PropertyKey[], defaultValue?: any): T {
  if (object == null) {
    return defaultValue;
  }

  switch (typeof path) {
    case 'string': {
      const result = object[path];

      if (result === void 0) {
        if (isDeepKey(path)) {
          return getValue(object, toPath(path), defaultValue);
        }
        // Set default value
        object[path] = defaultValue;
        return defaultValue;
      }

      return result;
    }

    case 'number':
    case 'symbol': {
      if (typeof path === 'number') {
        path = toKey(path);
      }

      const result = object[path as PropertyKey];

      if (result === void 0) {
        // Set default value
        object[path as PropertyKey] = defaultValue;
        return defaultValue;
      }

      return result;
    }
    default: {
      if (Array.isArray(path)) {
        return getWithPath(object, path, defaultValue);
      }

      if (Object.is(path?.valueOf(), -0)) {
        path = '-0';
      }
      else {
        path = String(path);
      }

      const result = object[path];

      if (result === void 0) {
        // Set default value
        object[path] = defaultValue;
        return defaultValue;
      }

      return result;
    }
  }
}
