# Valorm

Valorm is a lightweight TypeScript-first validation library for parsing unknown input into safe, typed data.

It gives you:
- Chainable schema builders (`v.string().min(3)`, `v.object({...})`, etc.)
- Runtime validation with clear error paths
- Type inference with `Infer<typeof schema>`
- Safe parsing (`safeParse`) and throwing parsing (`parse`)

## Installation

```bash
npm install valorm
```

## Quick Start

```ts
import { v, Infer } from "valorm";

const UserSchema = v.object({
  id: v.string().uuid(),
  email: v.string().trim().email(),
  age: v.number().int().nonnegative().optional(),
  isAdmin: v.boolean().default(false),
});

type User = Infer<typeof UserSchema>;

const input = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "  user@example.com  ",
};

const user = UserSchema.parse(input);
// user is typed as User
// user.email === "user@example.com"
// user.isAdmin === false
```

## Core Concepts

### `parse`
`schema.parse(value)` returns parsed data or throws `ValidationError`.

### `safeParse`
`schema.safeParse(value)` never throws.

```ts
const result = v.number().positive().safeParse(-3);

if (!result.success) {
  console.log(result.error.issues);
}
```

### `Infer`
`Infer<typeof schema>` extracts the TypeScript output type.

## Primitive Schemas

### `v.string()`
Methods:
- `coerce()` convert input with `String(value)` before validation
- `trim()` trim whitespace before rules
- `min(n)`, `max(n)`, `length(n)`
- `email()`, `url()`, `uuid()`
- `regex(re)`
- `startsWith(prefix)`, `endsWith(suffix)`
- `nonempty()`

```ts
const Username = v.string().trim().min(3).max(20);
```

### `v.number()`
Methods:
- `coerce()` convert with `Number(value)`
- `min(n)`, `max(n)`, `gt(n)`, `lt(n)`
- `int()`, `positive()`, `negative()`, `nonnegative()`
- `multipleOf(n)`

```ts
const Port = v.number().coerce().int().min(1).max(65535);
```

### `v.boolean()`
Methods:
- `coerce()` supports: `"true" | 1 => true`, `"false" | 0 => false`

```ts
const Flag = v.boolean().coerce();
```

### `v.date()`
Accepts `Date`, date strings, or timestamps.
Methods:
- `min(date)`
- `max(date)`

```ts
const EventDate = v.date().min(new Date("2026-01-01"));
```

### `v.literal(value)`
Matches exactly one literal (`string | number | boolean | null`).

```ts
const Role = v.literal("admin");
```

### `v.enum(values)`
Validates one of a readonly string list.

```ts
const Status = v.enum(["draft", "published", "archived"] as const);
```

### `v.any()` / `v.unknown()`
Both pass through any input unchanged (`unknown` output type).

### `v.never()`
Always fails validation.

## Composite Schemas

### `v.object(shape)`
Validates object fields based on a schema shape.

```ts
const User = v.object({
  id: v.string(),
  email: v.string().email(),
});
```

Object modes:
- Default mode strips unknown keys
- `strict()` fails on unknown keys
- `passthrough()` keeps unknown keys

Shape utilities:
- `pick(...keys)`
- `omit(...keys)`
- `partial()` (all fields optional)
- `merge(otherObjectSchema)`
- `extend(extraShape)`

### `v.array(elementSchema)`
Methods:
- `min(n)`, `max(n)`, `length(n)`, `nonempty()`

```ts
const Tags = v.array(v.string().nonempty()).max(10);
```

### `v.tuple([schemaA, schemaB, ...])`
Validates fixed-length tuples with positional types.

```ts
const Point2D = v.tuple([v.number(), v.number()]);
```

### `v.record(valueSchema)`
Validates dictionary-like objects (`Record<string, V>`).

```ts
const Scores = v.record(v.number().min(0));
```

### `v.union([a, b, ...])`
Tries each schema and returns the first successful match.

```ts
const Id = v.union([v.string().uuid(), v.number().int().positive()]);
```

### `v.discriminatedUnion(discriminator, options)`
Optimized union for object variants.

```ts
const Payment = v.discriminatedUnion("type", [
  v.object({ type: v.literal("card"), last4: v.string().length(4) }),
  v.object({ type: v.literal("bank"), iban: v.string().min(10) }),
]);
```

### `v.intersection(left, right)`
Requires both schemas to pass and merges outputs.

```ts
const A = v.object({ id: v.string() });
const B = v.object({ active: v.boolean() });
const AB = v.intersection(A, B);
```

## Shared Schema Modifiers

All schemas inherit these methods:

### `optional()`
Allows `undefined`.

### `nullable()`
Allows `null`.

### `refine(check, message)`
Adds custom validation logic.

```ts
const Even = v.number().refine((n) => n % 2 === 0, "Must be even");
```

### `transform(fn)`
Maps parsed value to a new output type.

```ts
const UserId = v.string().uuid().transform((id) => id.toUpperCase());
```

### `default(valueOrFactory)`
If input is `undefined`, substitutes default value before parsing.

```ts
const Limit = v.number().int().min(1).default(20);
```

## Error Handling

`ValidationError` includes `issues` with precise paths.

```ts
import { ValidationError } from "valorm";

try {
  UserSchema.parse({ email: "not-an-email" });
} catch (err) {
  if (err instanceof ValidationError) {
    console.log(err.issues);
    console.log(err.format());
  }
}
```

Issue shape:

```ts
interface ValidationIssue {
  path: (string | number)[];
  message: string;
  received?: unknown;
}
```

## End-to-End Example

```ts
import { v, Infer } from "valorm";

const CreatePostSchema = v.object({
  title: v.string().trim().min(3),
  body: v.string().min(20),
  status: v.enum(["draft", "published"] as const).default("draft"),
  tags: v.array(v.string().trim().nonempty()).max(5).default(() => []),
  publishedAt: v.date().optional(),
});

type CreatePostInput = Infer<typeof CreatePostSchema>;

const result = CreatePostSchema.safeParse({
  title: "  Hello world  ",
  body: "This is a long enough body for validation.",
});

if (result.success) {
  const post: CreatePostInput = result.data;
  console.log(post);
} else {
  console.error(result.error.format());
}
```

## Notes and Current Behavior

- Object schemas strip unknown keys by default.
- `nullable()` currently converts inner parse failure into `null`.
- `DateSchema.min()` and `DateSchema.max()` ignore custom message arguments and use built-in messages.
- `ArraySchema.nonempty(msg?)` currently ignores the custom message argument.

## API Surface

Valorm exports:
- `v` (schema factory object)
- `Schema` (base abstract class)
- `ValidationError`
- `SafeParseResult`
- `Infer<TSchema>`

## Development

From the package directory:

```bash
npx tsc --noEmit index.ts
```

This validates types for the current source layout.
