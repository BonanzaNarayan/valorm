import { Schema } from "./schema";
import { ParseContext, addIssue } from "./errors";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SchemaShape = Record<string, Schema<any>>;
type Infer<S extends SchemaShape> = { [K in keyof S]: S[K] extends Schema<infer T> ? T : never };
type Partial<S extends SchemaShape> = { [K in keyof S]?: S[K] extends Schema<infer T> ? T : never };

// ─── Object ───────────────────────────────────────────────────────────────────

export class ObjectSchema<S extends SchemaShape> extends Schema<Infer<S>> {
  readonly shape: S;
  private _strip = true;   // strip unknown keys by default (like Zod's "strip" mode)
  private _strict = false; // fail on unknown keys

  constructor(shape: S) {
    super();
    this.shape = shape;
  }

  /** Fail if unknown keys are present */
  strict(): this {
    this._strict = true;
    this._strip = false;
    return this;
  }

  /** Pass unknown keys through as-is */
  passthrough(): this {
    this._strip = false;
    return this;
  }

  /** Build a new schema from a subset of keys */
  pick<K extends keyof S>(...keys: K[]): ObjectSchema<Pick<S, K>> {
    const newShape = {} as Pick<S, K>;
    for (const k of keys) newShape[k] = this.shape[k];
    return new ObjectSchema(newShape);
  }

  /** Build a new schema without certain keys */
  omit<K extends keyof S>(...keys: K[]): ObjectSchema<Omit<S, K>> {
    const newShape = { ...this.shape } as Omit<S, K>;
    for (const k of keys) delete (newShape as Record<string, unknown>)[k as string];
    return new ObjectSchema(newShape as SchemaShape & Omit<S, K>);
  }

  /** Make all fields optional */
  partial(): ObjectSchema<{ [K in keyof S]: Schema<Infer<S>[K] | undefined> }> {
    const newShape: SchemaShape = {};
    for (const key in this.shape) {
      newShape[key] = this.shape[key].optional() as Schema<unknown>;
    }
    return new ObjectSchema(newShape as { [K in keyof S]: Schema<Infer<S>[K] | undefined> });
  }

  /** Merge with another object schema */
  merge<S2 extends SchemaShape>(other: ObjectSchema<S2>): ObjectSchema<S & S2> {
    return new ObjectSchema({ ...this.shape, ...other.shape } as S & S2);
  }

  /** Extend with additional fields */
  extend<S2 extends SchemaShape>(extra: S2): ObjectSchema<S & S2> {
    return new ObjectSchema({ ...this.shape, ...extra } as S & S2);
  }

  _parse(value: unknown, ctx: ParseContext): Infer<S> | undefined {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      addIssue(ctx, `Expected object, received ${Array.isArray(value) ? "array" : typeof value}`, value);
      return undefined;
    }

    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};

    // Check for unknown keys in strict mode
    if (this._strict) {
      for (const key of Object.keys(input)) {
        if (!(key in this.shape)) {
          addIssue(ctx, `Unknown key "${key}"`, key);
        }
      }
      if (ctx.issues.length > 0) return undefined;
    }

    // Validate each defined key
    for (const key in this.shape) {
      ctx.path.push(key);
      const result = this.shape[key]._parse(input[key], ctx);
      ctx.path.pop();
      if (result !== undefined) output[key] = result;
    }

    // Passthrough: include extra keys not in shape
    if (!this._strip && !this._strict) {
      for (const key of Object.keys(input)) {
        if (!(key in this.shape)) output[key] = input[key];
      }
    }

    return ctx.issues.length > 0 ? undefined : (output as Infer<S>);
  }
}

// ─── Array ────────────────────────────────────────────────────────────────────

export class ArraySchema<T> extends Schema<T[]> {
  private _minLen?: number;
  private _maxLen?: number;

  constructor(private readonly _element: Schema<T>) {
    super();
  }

  get element(): Schema<T> { return this._element; }

  min(n: number, msg?: string): this {
    this._minLen = n;
    return this;
  }

  max(n: number, msg?: string): this {
    this._maxLen = n;
    return this;
  }

  nonempty(msg?: string): this {
    return this.min(1);
  }

  length(n: number): this {
    return this.min(n).max(n);
  }

  _parse(value: unknown, ctx: ParseContext): T[] | undefined {
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

    const output: T[] = [];
    for (let i = 0; i < value.length; i++) {
      ctx.path.push(i);
      const result = this._element._parse(value[i], ctx);
      ctx.path.pop();
      if (result !== undefined) output.push(result);
    }

    return ctx.issues.length > 0 ? undefined : output;
  }
}

// ─── Tuple ────────────────────────────────────────────────────────────────────

type TupleSchemas = [Schema<unknown>, ...Schema<unknown>[]];
type TupleOutput<T extends TupleSchemas> = {
  [K in keyof T]: T[K] extends Schema<infer U> ? U : never;
};

export class TupleSchema<T extends TupleSchemas> extends Schema<TupleOutput<T>> {
  constructor(private readonly _items: T) {
    super();
  }

  _parse(value: unknown, ctx: ParseContext): TupleOutput<T> | undefined {
    if (!Array.isArray(value)) {
      addIssue(ctx, `Expected tuple (array), received ${typeof value}`, value);
      return undefined;
    }
    if (value.length !== this._items.length) {
      addIssue(ctx, `Expected ${this._items.length} items, received ${value.length}`, value);
      return undefined;
    }

    const output: unknown[] = [];
    for (let i = 0; i < this._items.length; i++) {
      ctx.path.push(i);
      const result = this._items[i]._parse(value[i], ctx);
      ctx.path.pop();
      if (result !== undefined) output.push(result);
    }

    return ctx.issues.length > 0 ? undefined : (output as TupleOutput<T>);
  }
}

// ─── Record ───────────────────────────────────────────────────────────────────

export class RecordSchema<V> extends Schema<Record<string, V>> {
  constructor(private readonly _value: Schema<V>) {
    super();
  }

  _parse(value: unknown, ctx: ParseContext): Record<string, V> | undefined {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      addIssue(ctx, `Expected object, received ${typeof value}`, value);
      return undefined;
    }

    const input = value as Record<string, unknown>;
    const output: Record<string, V> = {};

    for (const key of Object.keys(input)) {
      ctx.path.push(key);
      const result = this._value._parse(input[key], ctx);
      ctx.path.pop();
      if (result !== undefined) output[key] = result;
    }

    return ctx.issues.length > 0 ? undefined : output;
  }
}

// ─── Union (a | b | c) ────────────────────────────────────────────────────────

type UnionSchemas = [Schema<unknown>, Schema<unknown>, ...Schema<unknown>[]];
type UnionOutput<T extends UnionSchemas> = T[number] extends Schema<infer U> ? U : never;

export class UnionSchema<T extends UnionSchemas> extends Schema<UnionOutput<T>> {
  constructor(private readonly _options: T) {
    super();
  }

  _parse(value: unknown, ctx: ParseContext): UnionOutput<T> | undefined {
    // Try each option — return first one that passes with zero issues
    for (const schema of this._options) {
      const tempCtx: ParseContext = { path: [...ctx.path], issues: [] };
      const result = schema._parse(value, tempCtx);
      if (tempCtx.issues.length === 0 && result !== undefined) {
        return result as UnionOutput<T>;
      }
    }
    addIssue(ctx, `Value did not match any union member`, value);
    return undefined;
  }
}

// ─── Discriminated Union ─────────────────────────────────────────────────────

export class DiscriminatedUnionSchema<
  K extends string,
  T extends ObjectSchema<Record<K, Schema<string | number>>>
> extends Schema<T extends Schema<infer U> ? U : never> {
  constructor(
    private readonly _discriminator: K,
    private readonly _options: T[]
  ) {
    super();
  }

  _parse(value: unknown, ctx: ParseContext): (T extends Schema<infer U> ? U : never) | undefined {
    if (typeof value !== "object" || value === null) {
      addIssue(ctx, `Expected object, received ${typeof value}`, value);
      return undefined;
    }

    const input = value as Record<string, unknown>;
    const discValue = input[this._discriminator];

    for (const schema of this._options) {
      const discSchema = schema.shape[this._discriminator];
      const tempCtx: ParseContext = { path: [], issues: [] };
      discSchema._parse(discValue, tempCtx);
      if (tempCtx.issues.length === 0) {
        return schema._parse(value, ctx) as (T extends Schema<infer U> ? U : never);
      }
    }

    addIssue(ctx, `No matching variant for discriminator "${this._discriminator}" = "${discValue}"`, value);
    return undefined;
  }
}

// ─── Intersection (a & b) ─────────────────────────────────────────────────────

export class IntersectionSchema<A, B> extends Schema<A & B> {
  constructor(
    private readonly _left: Schema<A>,
    private readonly _right: Schema<B>
  ) {
    super();
  }

  _parse(value: unknown, ctx: ParseContext): (A & B) | undefined {
    const left = this._left._parse(value, ctx);
    const right = this._right._parse(value, ctx);
    if (ctx.issues.length > 0) return undefined;
    return { ...(left as object), ...(right as object) } as A & B;
  }
}