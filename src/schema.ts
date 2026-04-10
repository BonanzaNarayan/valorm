import {
  ValidationError,
  type SafeParseResult,
  type ParseContext,
  addIssue,
} from "./errors.js";

// ─── Base Schema ──────────────────────────────────────────────────────────────
// Using `any` in SchemaShape allows Schema<string> to be assignable to Schema<any>,
// avoiding TypeScript's strict contravariance errors through refine()'s _check param.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class Schema<T = any> {
  abstract _parse(value: unknown, ctx: ParseContext): T | undefined;

  parse(value: unknown): T {
    const ctx: ParseContext = { path: [], issues: [] };
    const result = this._parse(value, ctx);
    if (ctx.issues.length > 0) throw new ValidationError(ctx.issues);
    return result as T;
  }

  safeParse(value: unknown): SafeParseResult<T> {
    try {
      const data = this.parse(value);
      return { success: true, data };
    } catch (err) {
      if (err instanceof ValidationError) return { success: false, error: err };
      throw err;
    }
  }

  optional(): OptionalSchema<T> {
    return new OptionalSchema(this);
  }

  nullable(): NullableSchema<T> {
    return new NullableSchema(this);
  }

  refine(
    check: (val: T) => boolean,
    message: string | ((val: T) => string)
  ): RefinedSchema<T> {
    return new RefinedSchema(this, check, message);
  }

  transform<U>(fn: (val: T) => U): TransformSchema<T, U> {
    return new TransformSchema(this, fn);
  }

  default(defaultValue: T | (() => T)): DefaultSchema<T> {
    return new DefaultSchema(this, defaultValue);
  }
}

export class OptionalSchema<T> extends Schema<T | undefined> {
  constructor(readonly _inner: Schema<T>) { super(); }
  _parse(value: unknown, ctx: ParseContext): T | undefined {
    if (value === undefined) return undefined;
    return this._inner._parse(value, ctx);
  }
}

export class NullableSchema<T> extends Schema<T | null> {
  constructor(readonly _inner: Schema<T>) { super(); }
  _parse(value: unknown, ctx: ParseContext): T | null {
    if (value === null) return null;
    const r = this._inner._parse(value, ctx);
    return r === undefined ? null : r;
  }
}

export class RefinedSchema<T> extends Schema<T> {
  constructor(
    private _inner: Schema<T>,
    private _check: (val: T) => boolean,
    private _message: string | ((val: T) => string)
  ) { super(); }

  _parse(value: unknown, ctx: ParseContext): T | undefined {
    const r = this._inner._parse(value, ctx);
    if (r === undefined || ctx.issues.length > 0) return undefined;
    if (!this._check(r)) {
      addIssue(ctx, typeof this._message === "function" ? this._message(r) : this._message, r);
      return undefined;
    }
    return r;
  }
}

export class TransformSchema<T, U> extends Schema<U> {
  constructor(private _inner: Schema<T>, private _fn: (val: T) => U) { super(); }
  _parse(value: unknown, ctx: ParseContext): U | undefined {
    const r = this._inner._parse(value, ctx);
    if (r === undefined || ctx.issues.length > 0) return undefined;
    return this._fn(r);
  }
}

export class DefaultSchema<T> extends Schema<T> {
  constructor(private _inner: Schema<T>, private _default: T | (() => T)) { super(); }
  _parse(value: unknown, ctx: ParseContext): T | undefined {
    const resolved = value === undefined
      ? (typeof this._default === "function" ? (this._default as () => T)() : this._default)
      : value;
    return this._inner._parse(resolved, ctx);
  }
}