import { Schema } from "./schema.js";
import { addIssue } from "./errors.js";
// ─── Object ───────────────────────────────────────────────────────────────────
export class ObjectSchema extends Schema {
    shape;
    _strip = true; // strip unknown keys by default (like Zod's "strip" mode)
    _strict = false; // fail on unknown keys
    constructor(shape) {
        super();
        this.shape = shape;
    }
    /** Fail if unknown keys are present */
    strict() {
        this._strict = true;
        this._strip = false;
        return this;
    }
    /** Pass unknown keys through as-is */
    passthrough() {
        this._strip = false;
        return this;
    }
    /** Build a new schema from a subset of keys */
    pick(...keys) {
        const newShape = {};
        for (const k of keys)
            newShape[k] = this.shape[k];
        return new ObjectSchema(newShape);
    }
    /** Build a new schema without certain keys */
    omit(...keys) {
        const newShape = { ...this.shape };
        for (const k of keys)
            delete newShape[k];
        return new ObjectSchema(newShape);
    }
    /** Make all fields optional */
    partial() {
        const newShape = {};
        for (const key in this.shape) {
            newShape[key] = this.shape[key].optional();
        }
        return new ObjectSchema(newShape);
    }
    /** Merge with another object schema */
    merge(other) {
        return new ObjectSchema({ ...this.shape, ...other.shape });
    }
    /** Extend with additional fields */
    extend(extra) {
        return new ObjectSchema({ ...this.shape, ...extra });
    }
    _parse(value, ctx) {
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
            addIssue(ctx, `Expected object, received ${Array.isArray(value) ? "array" : typeof value}`, value);
            return undefined;
        }
        const input = value;
        const output = {};
        // Check for unknown keys in strict mode
        if (this._strict) {
            for (const key of Object.keys(input)) {
                if (!(key in this.shape)) {
                    addIssue(ctx, `Unknown key "${key}"`, key);
                }
            }
            if (ctx.issues.length > 0)
                return undefined;
        }
        // Validate each defined key
        for (const key in this.shape) {
            ctx.path.push(key);
            const result = this.shape[key]._parse(input[key], ctx);
            ctx.path.pop();
            if (result !== undefined)
                output[key] = result;
        }
        // Passthrough: include extra keys not in shape
        if (!this._strip && !this._strict) {
            for (const key of Object.keys(input)) {
                if (!(key in this.shape))
                    output[key] = input[key];
            }
        }
        return ctx.issues.length > 0 ? undefined : output;
    }
}
// ─── Array ────────────────────────────────────────────────────────────────────
export class ArraySchema extends Schema {
    _element;
    _minLen;
    _maxLen;
    constructor(_element) {
        super();
        this._element = _element;
    }
    get element() { return this._element; }
    min(n, msg) {
        this._minLen = n;
        return this;
    }
    max(n, msg) {
        this._maxLen = n;
        return this;
    }
    nonempty(msg) {
        return this.min(1);
    }
    length(n) {
        return this.min(n).max(n);
    }
    _parse(value, ctx) {
        if (!Array.isArray(value)) {
            addIssue(ctx, `Expected array, received ${typeof value}`, value);
            return undefined;
        }
        if (this._minLen !== undefined && value.length < this._minLen) {
            addIssue(ctx, `Array must have at least ${this._minLen} item(s)`, value);
            return undefined;
        }
        if (this._maxLen !== undefined && value.length > this._maxLen) {
            addIssue(ctx, `Array must have at most ${this._maxLen} item(s)`, value);
            return undefined;
        }
        const output = [];
        for (let i = 0; i < value.length; i++) {
            ctx.path.push(i);
            const result = this._element._parse(value[i], ctx);
            ctx.path.pop();
            if (result !== undefined)
                output.push(result);
        }
        return ctx.issues.length > 0 ? undefined : output;
    }
}
export class TupleSchema extends Schema {
    _items;
    constructor(_items) {
        super();
        this._items = _items;
    }
    _parse(value, ctx) {
        if (!Array.isArray(value)) {
            addIssue(ctx, `Expected tuple (array), received ${typeof value}`, value);
            return undefined;
        }
        if (value.length !== this._items.length) {
            addIssue(ctx, `Expected ${this._items.length} items, received ${value.length}`, value);
            return undefined;
        }
        const output = [];
        for (let i = 0; i < this._items.length; i++) {
            ctx.path.push(i);
            const result = this._items[i]._parse(value[i], ctx);
            ctx.path.pop();
            if (result !== undefined)
                output.push(result);
        }
        return ctx.issues.length > 0 ? undefined : output;
    }
}
// ─── Record ───────────────────────────────────────────────────────────────────
export class RecordSchema extends Schema {
    _value;
    constructor(_value) {
        super();
        this._value = _value;
    }
    _parse(value, ctx) {
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
            addIssue(ctx, `Expected object, received ${typeof value}`, value);
            return undefined;
        }
        const input = value;
        const output = {};
        for (const key of Object.keys(input)) {
            ctx.path.push(key);
            const result = this._value._parse(input[key], ctx);
            ctx.path.pop();
            if (result !== undefined)
                output[key] = result;
        }
        return ctx.issues.length > 0 ? undefined : output;
    }
}
export class UnionSchema extends Schema {
    _options;
    constructor(_options) {
        super();
        this._options = _options;
    }
    _parse(value, ctx) {
        // Try each option — return first one that passes with zero issues
        for (const schema of this._options) {
            const tempCtx = { path: [...ctx.path], issues: [] };
            const result = schema._parse(value, tempCtx);
            if (tempCtx.issues.length === 0 && result !== undefined) {
                return result;
            }
        }
        addIssue(ctx, `Value did not match any union member`, value);
        return undefined;
    }
}
// ─── Discriminated Union ─────────────────────────────────────────────────────
export class DiscriminatedUnionSchema extends Schema {
    _discriminator;
    _options;
    constructor(_discriminator, _options) {
        super();
        this._discriminator = _discriminator;
        this._options = _options;
    }
    _parse(value, ctx) {
        if (typeof value !== "object" || value === null) {
            addIssue(ctx, `Expected object, received ${typeof value}`, value);
            return undefined;
        }
        const input = value;
        const discValue = input[this._discriminator];
        for (const schema of this._options) {
            const discSchema = schema.shape[this._discriminator];
            const tempCtx = { path: [], issues: [] };
            discSchema._parse(discValue, tempCtx);
            if (tempCtx.issues.length === 0) {
                return schema._parse(value, ctx);
            }
        }
        addIssue(ctx, `No matching variant for discriminator "${this._discriminator}" = "${discValue}"`, value);
        return undefined;
    }
}
// ─── Intersection (a & b) ─────────────────────────────────────────────────────
export class IntersectionSchema extends Schema {
    _left;
    _right;
    constructor(_left, _right) {
        super();
        this._left = _left;
        this._right = _right;
    }
    _parse(value, ctx) {
        const left = this._left._parse(value, ctx);
        const right = this._right._parse(value, ctx);
        if (ctx.issues.length > 0)
            return undefined;
        return { ...left, ...right };
    }
}
//# sourceMappingURL=composites.js.map