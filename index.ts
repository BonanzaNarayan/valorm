// ─── Re-exports ───────────────────────────────────────────────────────────────
export { ValidationError, SafeParseResult } from "./src/errors";
export { Schema } from "./src/schema";

// ─── Factories ────────────────────────────────────────────────────────────────
import { StringSchema } from "./src/primitives";
import { NumberSchema } from "./src/primitives";
import { BooleanSchema } from "./src/primitives";
import { DateSchema } from "./src/primitives";
import { LiteralSchema } from "./src/primitives";
import { EnumSchema } from "./src/primitives";
import { AnySchema } from "./src/primitives";
import { UnknownSchema } from "./src/primitives";
import { NeverSchema } from "./src/primitives";

import { ObjectSchema } from "./src/composites";
import { ArraySchema } from "./src/composites";
import { TupleSchema } from "./src/composites";
import { RecordSchema } from "./src/composites";
import { UnionSchema } from "./src/composites";
import { IntersectionSchema } from "./src/composites";
import { DiscriminatedUnionSchema } from "./src/composites";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SchemaShape = Record<string, import("./src/schema").Schema<any>>;

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

  array: <T>(element: import("./src/schema").Schema<T>) =>
    new ArraySchema(element),

  tuple: <T extends [import("./src/schema").Schema<unknown>, ...import("./src/schema").Schema<unknown>[]]>(
    items: T
  ) => new TupleSchema(items),

  record: <V>(valueSchema: import("./src/schema").Schema<V>) =>
    new RecordSchema(valueSchema),

  union: <T extends [import("./src/schema").Schema<unknown>, import("./src/schema").Schema<unknown>, ...import("./src/schema").Schema<unknown>[]]>(
    options: T
  ) => new UnionSchema(options),

  discriminatedUnion: <
    K extends string,
    T extends ObjectSchema<Record<K, import("./src/schema").Schema<string | number>>>
  >(discriminator: K, options: T[]) =>
    new DiscriminatedUnionSchema(discriminator, options),

  intersection: <A, B>(
    left: import("./src/schema").Schema<A>,
    right: import("./src/schema").Schema<B>
  ) => new IntersectionSchema(left, right),
};

// ─── Infer helper (like Zod's z.infer<typeof schema>) ────────────────────────
export type Infer<T extends import("./src/schema").Schema<unknown>> =
  T extends import("./src/schema").Schema<infer U> ? U : never;