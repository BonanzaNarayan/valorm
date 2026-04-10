import { ValidationError, addIssue, } from "./errors.js";
// ─── Base Schema ──────────────────────────────────────────────────────────────
// Using `any` in SchemaShape allows Schema<string> to be assignable to Schema<any>,
// avoiding TypeScript's strict contravariance errors through refine()'s _check param.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Schema {
    parse(value) {
        const ctx = { path: [], issues: [] };
        const result = this._parse(value, ctx);
        if (ctx.issues.length > 0)
            throw new ValidationError(ctx.issues);
        return result;
    }
    safeParse(value) {
        try {
            const data = this.parse(value);
            return { success: true, data };
        }
        catch (err) {
            if (err instanceof ValidationError)
                return { success: false, error: err };
            throw err;
        }
    }
    optional() {
        return new OptionalSchema(this);
    }
    nullable() {
        return new NullableSchema(this);
    }
    refine(check, message) {
        return new RefinedSchema(this, check, message);
    }
    transform(fn) {
        return new TransformSchema(this, fn);
    }
    default(defaultValue) {
        return new DefaultSchema(this, defaultValue);
    }
}
export class OptionalSchema extends Schema {
    _inner;
    constructor(_inner) {
        super();
        this._inner = _inner;
    }
    _parse(value, ctx) {
        if (value === undefined)
            return undefined;
        return this._inner._parse(value, ctx);
    }
}
export class NullableSchema extends Schema {
    _inner;
    constructor(_inner) {
        super();
        this._inner = _inner;
    }
    _parse(value, ctx) {
        if (value === null)
            return null;
        const r = this._inner._parse(value, ctx);
        return r === undefined ? null : r;
    }
}
export class RefinedSchema extends Schema {
    _inner;
    _check;
    _message;
    constructor(_inner, _check, _message) {
        super();
        this._inner = _inner;
        this._check = _check;
        this._message = _message;
    }
    _parse(value, ctx) {
        const r = this._inner._parse(value, ctx);
        if (r === undefined || ctx.issues.length > 0)
            return undefined;
        if (!this._check(r)) {
            addIssue(ctx, typeof this._message === "function" ? this._message(r) : this._message, r);
            return undefined;
        }
        return r;
    }
}
export class TransformSchema extends Schema {
    _inner;
    _fn;
    constructor(_inner, _fn) {
        super();
        this._inner = _inner;
        this._fn = _fn;
    }
    _parse(value, ctx) {
        const r = this._inner._parse(value, ctx);
        if (r === undefined || ctx.issues.length > 0)
            return undefined;
        return this._fn(r);
    }
}
export class DefaultSchema extends Schema {
    _inner;
    _default;
    constructor(_inner, _default) {
        super();
        this._inner = _inner;
        this._default = _default;
    }
    _parse(value, ctx) {
        const resolved = value === undefined
            ? (typeof this._default === "function" ? this._default() : this._default)
            : value;
        return this._inner._parse(resolved, ctx);
    }
}
//# sourceMappingURL=schema.js.map