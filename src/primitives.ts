import { Schema } from "./schema";
import { ParseContext, addIssue } from "./errors";

// ─── String ───────────────────────────────────────────────────────────────────

export class StringSchema extends Schema<string> {
  private _rules: Array<{ check: (v: string) => boolean; message: string }> = [];
  private _coerce = false;
  private _trim = false;

  /** Coerce non-string values to string via String() */
  coerce(): this {
    this._coerce = true;
    return this;
  }

  /** Trim whitespace before validation */
  trim(): this {
    this._trim = true;
    return this;
  }

  min(len: number, msg?: string): this {
    this._rules.push({
      check: (v) => v.length >= len,
      message: msg ?? `Must be at least ${len} characters`,
    });
    return this;
  }

  max(len: number, msg?: string): this {
    this._rules.push({
      check: (v) => v.length <= len,
      message: msg ?? `Must be at most ${len} characters`,
    });
    return this;
  }

  length(len: number, msg?: string): this {
    this._rules.push({
      check: (v) => v.length === len,
      message: msg ?? `Must be exactly ${len} characters`,
    });
    return this;
  }

  email(msg?: string): this {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this._rules.push({
      check: (v) => re.test(v),
      message: msg ?? "Must be a valid email address",
    });
    return this;
  }

  url(msg?: string): this {
    this._rules.push({
      check: (v) => { try { new URL(v); return true; } catch { return false; } },
      message: msg ?? "Must be a valid URL",
    });
    return this;
  }

  uuid(msg?: string): this {
    const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    this._rules.push({
      check: (v) => re.test(v),
      message: msg ?? "Must be a valid UUID",
    });
    return this;
  }

  regex(pattern: RegExp, msg?: string): this {
    this._rules.push({
      check: (v) => pattern.test(v),
      message: msg ?? `Must match pattern ${pattern}`,
    });
    return this;
  }

  startsWith(prefix: string, msg?: string): this {
    this._rules.push({
      check: (v) => v.startsWith(prefix),
      message: msg ?? `Must start with "${prefix}"`,
    });
    return this;
  }

  endsWith(suffix: string, msg?: string): this {
    this._rules.push({
      check: (v) => v.endsWith(suffix),
      message: msg ?? `Must end with "${suffix}"`,
    });
    return this;
  }

  nonempty(msg?: string): this {
    return this.min(1, msg ?? "Must not be empty");
  }

  _parse(value: unknown, ctx: ParseContext): string | undefined {
    let val: unknown = this._coerce ? String(value) : value;
    if (typeof val !== "string") {
      addIssue(ctx, `Expected string, received ${typeof val}`, val);
      return undefined;
    }
    if (this._trim && typeof val === "string") val = val.trim();
    for (const rule of this._rules) {
      if (!rule.check(val)) {
        addIssue(ctx, rule.message, val);
        return undefined;
      }
    }
    return val;
  }
}

// ─── Number ───────────────────────────────────────────────────────────────────

export class NumberSchema extends Schema<number> {
  private _rules: Array<{ check: (v: number) => boolean; message: string }> = [];
  private _coerce = false;

  coerce(): this {
    this._coerce = true;
    return this;
  }

  min(n: number, msg?: string): this {
    this._rules.push({ check: (v) => v >= n, message: msg ?? `Must be >= ${n}` });
    return this;
  }

  max(n: number, msg?: string): this {
    this._rules.push({ check: (v) => v <= n, message: msg ?? `Must be <= ${n}` });
    return this;
  }

  gt(n: number, msg?: string): this {
    this._rules.push({ check: (v) => v > n, message: msg ?? `Must be > ${n}` });
    return this;
  }

  lt(n: number, msg?: string): this {
    this._rules.push({ check: (v) => v < n, message: msg ?? `Must be < ${n}` });
    return this;
  }

  int(msg?: string): this {
    this._rules.push({
      check: (v) => Number.isInteger(v),
      message: msg ?? "Must be an integer",
    });
    return this;
  }

  positive(msg?: string): this {
    this._rules.push({ check: (v) => v > 0, message: msg ?? "Must be positive" });
    return this;
  }

  negative(msg?: string): this {
    this._rules.push({ check: (v) => v < 0, message: msg ?? "Must be negative" });
    return this;
  }

  nonnegative(msg?: string): this {
    this._rules.push({ check: (v) => v >= 0, message: msg ?? "Must be >= 0" });
    return this;
  }

  multipleOf(n: number, msg?: string): this {
    this._rules.push({
      check: (v) => v % n === 0,
      message: msg ?? `Must be a multiple of ${n}`,
    });
    return this;
  }

  _parse(value: unknown, ctx: ParseContext): number | undefined {
    const val = this._coerce ? Number(value) : value;
    if (typeof val !== "number" || isNaN(val)) {
      addIssue(ctx, `Expected number, received ${typeof val}`, value);
      return undefined;
    }
    for (const rule of this._rules) {
      if (!rule.check(val)) {
        addIssue(ctx, rule.message, val);
        return undefined;
      }
    }
    return val;
  }
}

// ─── Boolean ─────────────────────────────────────────────────────────────────

export class BooleanSchema extends Schema<boolean> {
  private _coerce = false;

  coerce(): this {
    this._coerce = true;
    return this;
  }

  _parse(value: unknown, ctx: ParseContext): boolean | undefined {
    if (this._coerce) {
      if (value === "true" || value === 1) return true;
      if (value === "false" || value === 0) return false;
    }
    if (typeof value !== "boolean") {
      addIssue(ctx, `Expected boolean, received ${typeof value}`, value);
      return undefined;
    }
    return value;
  }
}

// ─── Date ─────────────────────────────────────────────────────────────────────

export class DateSchema extends Schema<Date> {
  private _min?: Date;
  private _max?: Date;

  min(date: Date, msg?: string): this {
    this._min = date;
    return this;
  }

  max(date: Date, msg?: string): this {
    this._max = date;
    return this;
  }

  _parse(value: unknown, ctx: ParseContext): Date | undefined {
    let date: Date;
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === "string" || typeof value === "number") {
      date = new Date(value);
    } else {
      addIssue(ctx, `Expected Date, received ${typeof value}`, value);
      return undefined;
    }

    if (isNaN(date.getTime())) {
      addIssue(ctx, "Invalid date", value);
      return undefined;
    }

    if (this._min && date < this._min) {
      addIssue(ctx, `Date must be after ${this._min.toISOString()}`, value);
      return undefined;
    }
    if (this._max && date > this._max) {
      addIssue(ctx, `Date must be before ${this._max.toISOString()}`, value);
      return undefined;
    }
    return date;
  }
}

// ─── Literal ─────────────────────────────────────────────────────────────────

export class LiteralSchema<T extends string | number | boolean | null> extends Schema<T> {
  constructor(private readonly _value: T) {
    super();
  }

  _parse(value: unknown, ctx: ParseContext): T | undefined {
    if (value !== this._value) {
      addIssue(ctx, `Expected literal "${this._value}", received "${value}"`, value);
      return undefined;
    }
    return value as T;
  }
}

// ─── Enum ─────────────────────────────────────────────────────────────────────

export class EnumSchema<T extends string> extends Schema<T> {
  constructor(private readonly _values: readonly T[]) {
    super();
  }

  _parse(value: unknown, ctx: ParseContext): T | undefined {
    if (!this._values.includes(value as T)) {
      addIssue(
        ctx,
        `Expected one of [${this._values.map((v) => `"${v}"`).join(", ")}], received "${value}"`,
        value
      );
      return undefined;
    }
    return value as T;
  }
}

// ─── Any / Unknown ────────────────────────────────────────────────────────────

export class AnySchema extends Schema<unknown> {
  _parse(value: unknown, _ctx: ParseContext): unknown {
    return value;
  }
}

export class UnknownSchema extends Schema<unknown> {
  _parse(value: unknown, _ctx: ParseContext): unknown {
    return value;
  }
}

// ─── Never ────────────────────────────────────────────────────────────────────

export class NeverSchema extends Schema<never> {
  _parse(value: unknown, ctx: ParseContext): never | undefined {
    addIssue(ctx, "Expected never — no value is allowed here", value);
    return undefined;
  }
}