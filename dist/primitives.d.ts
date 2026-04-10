import { Schema } from "./schema.js";
import { type ParseContext } from "./errors.js";
export declare class StringSchema extends Schema<string> {
    private _rules;
    private _coerce;
    private _trim;
    /** Coerce non-string values to string via String() */
    coerce(): this;
    /** Trim whitespace before validation */
    trim(): this;
    min(len: number, msg?: string): this;
    max(len: number, msg?: string): this;
    length(len: number, msg?: string): this;
    email(msg?: string): this;
    url(msg?: string): this;
    uuid(msg?: string): this;
    regex(pattern: RegExp, msg?: string): this;
    startsWith(prefix: string, msg?: string): this;
    endsWith(suffix: string, msg?: string): this;
    nonempty(msg?: string): this;
    _parse(value: unknown, ctx: ParseContext): string | undefined;
}
export declare class NumberSchema extends Schema<number> {
    private _rules;
    private _coerce;
    coerce(): this;
    min(n: number, msg?: string): this;
    max(n: number, msg?: string): this;
    gt(n: number, msg?: string): this;
    lt(n: number, msg?: string): this;
    int(msg?: string): this;
    positive(msg?: string): this;
    negative(msg?: string): this;
    nonnegative(msg?: string): this;
    multipleOf(n: number, msg?: string): this;
    _parse(value: unknown, ctx: ParseContext): number | undefined;
}
export declare class BooleanSchema extends Schema<boolean> {
    private _coerce;
    coerce(): this;
    _parse(value: unknown, ctx: ParseContext): boolean | undefined;
}
export declare class DateSchema extends Schema<Date> {
    private _min?;
    private _max?;
    min(date: Date, msg?: string): this;
    max(date: Date, msg?: string): this;
    _parse(value: unknown, ctx: ParseContext): Date | undefined;
}
export declare class LiteralSchema<T extends string | number | boolean | null> extends Schema<T> {
    private readonly _value;
    constructor(_value: T);
    _parse(value: unknown, ctx: ParseContext): T | undefined;
}
export declare class EnumSchema<T extends string> extends Schema<T> {
    private readonly _values;
    constructor(_values: readonly T[]);
    _parse(value: unknown, ctx: ParseContext): T | undefined;
}
export declare class AnySchema extends Schema<unknown> {
    _parse(value: unknown, _ctx: ParseContext): unknown;
}
export declare class UnknownSchema extends Schema<unknown> {
    _parse(value: unknown, _ctx: ParseContext): unknown;
}
export declare class NeverSchema extends Schema<never> {
    _parse(value: unknown, ctx: ParseContext): never | undefined;
}
//# sourceMappingURL=primitives.d.ts.map