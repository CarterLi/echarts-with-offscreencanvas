class ValueWrapper {
    constructor(value) {
        this.value = value;
    }
}
function* iterateObject(obj) {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            yield [key, obj[key]];
        }
    }
}
export function stringify(value) {
    const date2json = Date.prototype.toJSON; // trap
    Date.prototype.toJSON = function toJSON() {
        return { '\0dt': new ValueWrapper(+this) };
    };
    const json = JSON.stringify(value, (key, val) => {
        if (!val)
            return val;
        if (key.startsWith('\0')) {
            if (val instanceof ValueWrapper) {
                return val.value;
            }
            return undefined;
        }
        if (typeof val === 'number') {
            if (Number.isNaN(val) || !Number.isFinite(val)) {
                return { '\0num': new ValueWrapper(val + '') };
            }
            else {
                return val;
            }
        }
        if (typeof val === 'object') {
            const type = Object.prototype.toString.call(val).slice(8, -1);
            switch (type) {
                case 'Error':
                    return { '\0err': new ValueWrapper([val.name, val.message, val.stack]) };
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
                    return { '\0arr': new ValueWrapper([type, Array.from(val)]) };
            }
        }
        if (typeof val === 'function') {
            return { '\0fn': new ValueWrapper(val + '') };
        }
        return val;
    });
    Date.prototype.toJSON = date2json;
    return json;
}
export function parse(json) {
    return JSON.parse(json, (key, obj) => {
        if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
            for (const [type, data] of iterateObject(obj)) {
                if (type.charCodeAt(0) === 0) {
                    switch (type.slice(0)) {
                        case 'dt': return new Date(data);
                        case 'fn': {
                            const matched = /^function (\w+)\(\) { \[native code\] }$/.exec(data);
                            if (matched)
                                return self[matched[1]];
                            // eslint-disable-next-line @typescript-eslint/no-implied-eval
                            return new Function('"use strict"\nreturn ' + data)();
                        }
                        case 'num': return +data;
                        case 'err': {
                            const [name, message, stack] = data;
                            const error = new self[name](message);
                            error.stack = stack;
                            return error;
                        }
                        case 'arr': return new self[data[0]](data[1]);
                    }
                }
                return obj;
            }
        }
        return obj;
    });
}
//# sourceMappingURL=SafeJson.js.map