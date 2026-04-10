// ─── Re-exports ───────────────────────────────────────────────────────────────
export { ValidationError } from "./errors.js";
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
export const v = {
    // ── Primitives ────────────────────────────────────────────────────────────
    string: () => new StringSchema(),
    number: () => new NumberSchema(),
    boolean: () => new BooleanSchema(),
    date: () => new DateSchema(),
    literal: (value) => new LiteralSchema(value),
    enum: (values) => new EnumSchema(values),
    any: () => new AnySchema(),
    unknown: () => new UnknownSchema(),
    never: () => new NeverSchema(),
    // ── Composites ────────────────────────────────────────────────────────────
    object: (shape) => new ObjectSchema(shape),
    array: (element) => new ArraySchema(element),
    tuple: (items) => new TupleSchema(items),
    record: (valueSchema) => new RecordSchema(valueSchema),
    union: (options) => new UnionSchema(options),
    discriminatedUnion: (discriminator, options) => new DiscriminatedUnionSchema(discriminator, options),
    intersection: (left, right) => new IntersectionSchema(left, right),
};
//# sourceMappingURL=index.js.map