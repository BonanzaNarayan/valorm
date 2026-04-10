import { type SafeParseResult, type ParseContext } from "./errors.js";
export declare abstract class Schema<T = any> {
    abstract _parse(value: unknown, ctx: ParseContext): T | undefined;
    parse(value: unknown): T;
    safeParse(value: unknown): SafeParseResult<T>;
    optional(): OptionalSchema<T>;
    nullable(): NullableSchema<T>;
    refine(check: (val: T) => boolean, message: string | ((val: T) => string)): RefinedSchema<T>;
    transform<U>(fn: (val: T) => U): TransformSchema<T, U>;
    default(defaultValue: T | (() => T)): DefaultSchema<T>;
}
export declare class OptionalSchema<T> extends Schema<T | undefined> {
    readonly _inner: Schema<T>;
    constructor(_inner: Schema<T>);
    _parse(value: unknown, ctx: ParseContext): T | undefined;
}
export declare class NullableSchema<T> extends Schema<T | null> {
    readonly _inner: Schema<T>;
    constructor(_inner: Schema<T>);
    _parse(value: unknown, ctx: ParseContext): T | null;
}
export declare class RefinedSchema<T> extends Schema<T> {
    private _inner;
    private _check;
    private _message;
    constructor(_inner: Schema<T>, _check: (val: T) => boolean, _message: string | ((val: T) => string));
    _parse(value: unknown, ctx: ParseContext): T | undefined;
}
export declare class TransformSchema<T, U> extends Schema<U> {
    private _inner;
    private _fn;
    constructor(_inner: Schema<T>, _fn: (val: T) => U);
    _parse(value: unknown, ctx: ParseContext): U | undefined;
}
export declare class DefaultSchema<T> extends Schema<T> {
    private _inner;
    private _default;
    constructor(_inner: Schema<T>, _default: T | (() => T));
    _parse(value: unknown, ctx: ParseContext): T | undefined;
}
//# sourceMappingURL=schema.d.ts.map