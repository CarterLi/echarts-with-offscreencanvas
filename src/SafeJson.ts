class ValueWrapper {
  constructor(public value: any) {}
}

function* iterateObject(obj: object) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      yield [key, obj[key]] as [string, any];
    }
  }
}

export function stringify(value: any) {
  const date2json = Date.prototype.toJSON; // trap
  Date.prototype.toJSON = function toJSON() {
    return { '\0dt': new ValueWrapper(+this) } as any;
  };
  const json = JSON.stringify(value, (key, value) => {
    if (!value) return value;
    if (key.startsWith('\0')) {
      if (value instanceof ValueWrapper) {
        return value.value;
      }
      return undefined;
    }

    if (typeof value === 'number') {
      if (Number.isNaN(value) || !Number.isFinite(value)) {
        return { '\0num': new ValueWrapper(value + '') };
      } else {
        return value;
      }
    }
    if (typeof value === 'object') {
      const type: string = Object.prototype.toString.call(value).slice(8, -1);
      switch (type) {
        case 'Function':
          return { '\0fn': new ValueWrapper(value + '') };

        case 'Error':
          return { '\0err': new ValueWrapper([value.name, value.message, value.stack]) };

        case 'Int8Array':
        case 'Uint8Array':
        case 'Uint8ClampedArray':
        case 'Int16Array':
        case 'Uint16Array':
        case 'Int32Array':
        case 'Uint32Array':
        case 'Float32Array':
        case 'Float64Array':
        case 'Map':
        case 'Set':
          return { '\0arr': new ValueWrapper([type, Array.from(value)]) }
      }
    }
    return value;
  });
  Date.prototype.toJSON = date2json;
  return json;
}

export function parse(json: string) {
  return JSON.parse(json, (key, obj) => {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      for (const [type, data] of iterateObject(obj)) {
        if (type.charCodeAt(0) === 0) {
          switch (type.slice(0)) {
            case 'dt': return new Date(data);
            case 'fn': {
              const matched = /^function (\w+)\(\) { \[native code\] }$/.exec(data);
              if (matched) return self[matched[1]];
              return new Function('"use strict"\nreturn ' + data)() as Function;
            }
            case 'num': return +data;
            case 'err': {
              const [name, message, stack] = data as [string, string, string];
              const error: Error = new self[name](message);
              error.stack = stack;
              return error;
            }
            case 'arr': return new (self[data[0]] as any)(data[1]);
          }
        }
        return obj;
      }
    }
    return obj;
  });
}
