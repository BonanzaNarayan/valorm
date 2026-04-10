import { Schema } from "./schema.js";
import { addIssue } from "./errors.js";
// ─── String ───────────────────────────────────────────────────────────────────
export class StringSchema extends Schema {
    _rules = [];
    _coerce = false;
    _trim = false;
    /** Coerce non-string values to string via String() */
    coerce() {
        this._coerce = true;
        return this;
    }
    /** Trim whitespace before validation */
    trim() {
        this._trim = true;
        return this;
    }
    min(len, msg) {
        this._rules.push({
            check: (v) => v.length >= len,
            message: msg ?? `Must be at least ${len} characters`,
        });
        return this;
    }
    max(len, msg) {
        this._rules.push({
            check: (v) => v.length <= len,
            message: msg ?? `Must be at most ${len} characters`,
        });
        return this;
    }
    length(len, msg) {
        this._rules.push({
            check: (v) => v.length === len,
            message: msg ?? `Must be exactly ${len} characters`,
        });
        return this;
    }
    email(msg) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        this._rules.push({
            check: (v) => re.test(v),
            message: msg ?? "Must be a valid email address",
        });
        return this;
    }
    url(msg) {
        this._rules.push({
            check: (v) => { try {
                new URL(v);
                return true;
            }
            catch {
                return false;
            } },
            message: msg ?? "Must be a valid URL",
        });
        return this;
    }
    uuid(msg) {
        const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        this._rules.push({
            check: (v) => re.test(v),
            message: msg ?? "Must be a valid UUID",
        });
        return this;
    }
    regex(pattern, msg) {
        this._rules.push({
            check: (v) => pattern.test(v),
            message: msg ?? `Must match pattern ${pattern}`,
        });
        return this;
    }
    startsWith(prefix, msg) {
        this._rules.push({
            check: (v) => v.startsWith(prefix),
            message: msg ?? `Must start with "${prefix}"`,
        });
        return this;
    }
    endsWith(suffix, msg) {
        this._rules.push({
            check: (v) => v.endsWith(suffix),
            message: msg ?? `Must end with "${suffix}"`,
        });
        return this;
    }
    nonempty(msg) {
        return this.min(1, msg ?? "Must not be empty");
    }
    _parse(value, ctx) {
        let val = this._coerce ? String(value) : value;
        if (typeof val !== "string") {
            addIssue(ctx, `Expected string, received ${typeof val}`, val);
            return undefined;
        }
        // ✅ Now TS knows val is string
        let str = val;
        if (this._trim)
            str = str.trim();
        for (const rule of this._rules) {
            if (!rule.check(str)) {
                addIssue(ctx, rule.message, str);
                return undefined;
            }
        }
        return str;
    }
}
// ─── Number ───────────────────────────────────────────────────────────────────
export class NumberSchema extends Schema {
    _rules = [];
    _coerce = false;
    coerce() {
        this._coerce = true;
        return this;
    }
    min(n, msg) {
        this._rules.push({ check: (v) => v >= n, message: msg ?? `Must be >= ${n}` });
        return this;
    }
    max(n, msg) {
        this._rules.push({ check: (v) => v <= n, message: msg ?? `Must be <= ${n}` });
        return this;
    }
    gt(n, msg) {
        this._rules.push({ check: (v) => v > n, message: msg ?? `Must be > ${n}` });
        return this;
    }
    lt(n, msg) {
        this._rules.push({ check: (v) => v < n, message: msg ?? `Must be < ${n}` });
        return this;
    }
    int(msg) {
        this._rules.push({
            check: (v) => Number.isInteger(v),
            message: msg ?? "Must be an integer",
        });
        return this;
    }
    positive(msg) {
        this._rules.push({ check: (v) => v > 0, message: msg ?? "Must be positive" });
        return this;
    }
    negative(msg) {
        this._rules.push({ check: (v) => v < 0, message: msg ?? "Must be negative" });
        return this;
    }
    nonnegative(msg) {
        this._rules.push({ check: (v) => v >= 0, message: msg ?? "Must be >= 0" });
        return this;
    }
    multipleOf(n, msg) {
        this._rules.push({
            check: (v) => v % n === 0,
            message: msg ?? `Must be a multiple of ${n}`,
        });
        return this;
    }
    _parse(value, ctx) {
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
export class BooleanSchema extends Schema {
    _coerce = false;
    coerce() {
        this._coerce = true;
        return this;
    }
    _parse(value, ctx) {
        if (this._coerce) {
            if (value === "true" || value === 1)
                return true;
            if (value === "false" || value === 0)
                return false;
        }
        if (typeof value !== "boolean") {
            addIssue(ctx, `Expected boolean, received ${typeof value}`, value);
            return undefined;
        }
        return value;
    }
}
// ─── Date ─────────────────────────────────────────────────────────────────────
export class DateSchema extends Schema {
    _min;
    _max;
    min(date, msg) {
        this._min = date;
        return this;
    }
    max(date, msg) {
        this._max = date;
        return this;
    }
    _parse(value, ctx) {
        let date;
        if (value instanceof Date) {
            date = value;
        }
        else if (typeof value === "string" || typeof value === "number") {
            date = new Date(value);
        }
        else {
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
export class LiteralSchema extends Schema {
    _value;
    constructor(_value) {
        super();
        this._value = _value;
    }
    _parse(value, ctx) {
        if (value !== this._value) {
            addIssue(ctx, `Expected literal "${this._value}", received "${value}"`, value);
            return undefined;
        }
        return value;
    }
}
// ─── Enum ─────────────────────────────────────────────────────────────────────
export class EnumSchema extends Schema {
    _values;
    constructor(_values) {
        super();
        this._values = _values;
    }
    _parse(value, ctx) {
        if (!this._values.includes(value)) {
            addIssue(ctx, `Expected one of [${this._values.map((v) => `"${v}"`).join(", ")}], received "${value}"`, value);
            return undefined;
        }
        return value;
    }
}
// ─── Any / Unknown ────────────────────────────────────────────────────────────
export class AnySchema extends Schema {
    _parse(value, _ctx) {
        return value;
    }
}
export class UnknownSchema extends Schema {
    _parse(value, _ctx) {
        return value;
    }
}
// ─── Never ────────────────────────────────────────────────────────────────────
export class NeverSchema extends Schema {
    _parse(value, ctx) {
        addIssue(ctx, "Expected never — no value is allowed here", value);
        return undefined;
    }
}
//# sourceMappingURL=primitives.js.map