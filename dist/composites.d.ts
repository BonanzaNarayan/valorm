import { Schema } from "./schema.js";
import { type ParseContext } from "./errors.js";
type SchemaShape = Record<string, Schema<any>>;
type Infer<S extends SchemaShape> = {
    [K in keyof S]: S[K] extends Schema<infer T> ? T : never;
};
export declare class ObjectSchema<S extends SchemaShape> extends Schema<Infer<S>> {
    readonly shape: S;
    private _strip;
    private _strict;
    constructor(shape: S);
    /** Fail if unknown keys are present */
    strict(): this;
    /** Pass unknown keys through as-is */
    passthrough(): this;
    /** Build a new schema from a subset of keys */
    pick<K extends keyof S>(...keys: K[]): ObjectSchema<Pick<S, K>>;
    /** Build a new schema without certain keys */
    omit<K extends keyof S>(...keys: K[]): ObjectSchema<Omit<S, K>>;
    /** Make all fields optional */
    partial(): ObjectSchema<{
        [K in keyof S]: Schema<Infer<S>[K] | undefined>;
    }>;
    /** Merge with another object schema */
    merge<S2 extends SchemaShape>(other: ObjectSchema<S2>): ObjectSchema<S & S2>;
    /** Extend with additional fields */
    extend<S2 extends SchemaShape>(extra: S2): ObjectSchema<S & S2>;
    _parse(value: unknown, ctx: ParseContext): Infer<S> | undefined;
}
export declare class ArraySchema<T> extends Schema<T[]> {
    private readonly _element;
    private _minLen?;
    private _maxLen?;
    constructor(_element: Schema<T>);
    get element(): Schema<T>;
    min(n: number, msg?: string): this;
    max(n: number, msg?: string): this;
    nonempty(msg?: string): this;
    length(n: number): this;
    _parse(value: unknown, ctx: ParseContext): T[] | undefined;
}
type TupleSchemas = [Schema<unknown>, ...Schema<unknown>[]];
type TupleOutput<T extends TupleSchemas> = {
    [K in keyof T]: T[K] extends Schema<infer U> ? U : never;
};
export declare class TupleSchema<T extends TupleSchemas> extends Schema<TupleOutput<T>> {
    private readonly _items;
    constructor(_items: T);
    _parse(value: unknown, ctx: ParseContext): TupleOutput<T> | undefined;
}
export declare class RecordSchema<V> extends Schema<Record<string, V>> {
    private readonly _value;
    constructor(_value: Schema<V>);
    _parse(value: unknown, ctx: ParseContext): Record<string, V> | undefined;
}
type UnionSchemas = [Schema<unknown>, Schema<unknown>, ...Schema<unknown>[]];
type UnionOutput<T extends UnionSchemas> = T[number] extends Schema<infer U> ? U : never;
export declare class UnionSchema<T extends UnionSchemas> extends Schema<UnionOutput<T>> {
    private readonly _options;
    constructor(_options: T);
    _parse(value: unknown, ctx: ParseContext): UnionOutput<T> | undefined;
}
export declare class DiscriminatedUnionSchema<K extends string, T extends ObjectSchema<Record<K, Schema<string | number>>>> extends Schema<T extends Schema<infer U> ? U : never> {
    private readonly _discriminator;
    private readonly _options;
    constructor(_discriminator: K, _options: T[]);
    _parse(value: unknown, ctx: ParseContext): (T extends Schema<infer U> ? U : never) | undefined;
}
export declare class IntersectionSchema<A, B> extends Schema<A & B> {
    private readonly _left;
    private readonly _right;
    constructor(_left: Schema<A>, _right: Schema<B>);
    _parse(value: unknown, ctx: ParseContext): (A & B) | undefined;
}
export {};
//# sourceMappingURL=composites.d.ts.map