// ─── Re-exports ───────────────────────────────────────────────────────────────
export { ValidationError,  type SafeParseResult } from "./errors.js";
export { Schema } from "./schema.js";

// ─── Factories ────────────────────────────────────────────────────────────────
import { StringSchema } from "./primitives.js";
import { NumberSchema } from "./primitives.js";
import { BooleanSchema } from "./primitives.js";
import { DateSchema } from "./primitives.js";
import { LiteralSchema } from "./primitives.js";
import { EnumSchema } from "./primitives.js";
import { AnySchema } from "./primitives.js";
import { UnknownSchema } from "./primitives.js";
import { NeverSchema } from "./primitives.js";

import { ObjectSchema } from "./composites.js";
import { ArraySchema } from "./composites.js";
import { TupleSchema } from "./composites.js";
import { RecordSchema } from "./composites.js";
import { UnionSchema } from "./composites.js";
import { IntersectionSchema } from "./composites.js";
import { DiscriminatedUnionSchema } from "./composites.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SchemaShape = Record<string, import("./schema.js").Schema<any>>;

export const v = {
  // ── Primitives ────────────────────────────────────────────────────────────
  string: () => new StringSchema(),
  number: () => new NumberSchema(),
  boolean: () => new BooleanSchema(),
  date: () => new DateSchema(),

  literal: <T extends string | number | boolean | null>(value: T) =>
    new LiteralSchema(value),

  enum: <T extends string>(values: readonly T[]) =>
    new EnumSchema<T>(values),

  any: () => new AnySchema(),
  unknown: () => new UnknownSchema(),
  never: () => new NeverSchema(),

  // ── Composites ────────────────────────────────────────────────────────────
  object: <S extends SchemaShape>(shape: S) =>
    new ObjectSchema(shape),

  array: <T>(element: import("./schema.js").Schema<T>) =>
    new ArraySchema(element),

  tuple: <T extends [import("./schema.js").Schema<unknown>, ...import("./schema.js").Schema<unknown>[]]>(
    items: T
  ) => new TupleSchema(items),

  record: <V>(valueSchema: import("./schema.js").Schema<V>) =>
    new RecordSchema(valueSchema),

  union: <T extends [import("./schema.js").Schema<unknown>, import("./schema.js").Schema<unknown>, ...import("./schema.js").Schema<unknown>[]]>(
    options: T
  ) => new UnionSchema(options),

  discriminatedUnion: <
    K extends string,
    T extends ObjectSchema<Record<K, import("./schema.js").Schema<string | number>>>
  >(discriminator: K, options: T[]) =>
    new DiscriminatedUnionSchema(discriminator, options),

  intersection: <A, B>(
    left: import("./schema.js").Schema<A>,
    right: import("./schema.js").Schema<B>
  ) => new IntersectionSchema(left, right),
};

// ─── Infer helper (like Zod's z.infer<typeof schema>) ────────────────────────
export type Infer<T extends import("./schema.js").Schema<unknown>> = T extends import("./schema.js").Schema<infer U> ? U : never;
export default v;