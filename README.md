# 🚀 Valorm

**Valorm** is a lightweight, TypeScript-first validation library for turning unknown data into safe, typed data.

Think of it like:

> “Take messy input → validate it → get clean, typed output.”

---

## 🪶 Why Valorm?

Valorm is built for modern apps that need validation without bloat.

### 🪶 Lightweight Alternative to Zod

* Tiny bundle size (~2.6KB gzipped)
* Minimal runtime overhead
* No unnecessary abstractions

---

### ⚡ Fast Validation for Modern Apps

* Optimized parsing pipeline
* Efficient runtime checks
* Great for frontend + serverless environments

---

### 🧩 Minimal, Yet Powerful

Valorm gives you only what you actually need:

* Chainable schemas
* Strong TypeScript inference
* Safe parsing APIs
* Flexible composition

Nothing extra. Nothing heavy.

---

## 📦 Installation

```bash
npm install valorm
# or
pnpm add valorm
# or
bun add valorm
```

---

## ⚡ Quick Start

### TypeScript

```ts
import { v, Infer } from "valorm";

const UserSchema = v.object({
  id: v.string().uuid(),
  email: v.string().trim().email(),
  age: v.number().int().nonnegative().optional(),
  isAdmin: v.boolean().default(false),
});

type User = Infer<typeof UserSchema>;

const user = UserSchema.parse({
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "  user@example.com  ",
});

console.log(user);
```

---

### JavaScript

```js
import { v } from "valorm";

const UserSchema = v.object({
  email: v.string().email(),
});

const result = UserSchema.safeParse({ email: "bad-email" });

if (!result.success) {
  console.log(result.error.issues);
}
```

---

## 🧠 Core Concepts

### `parse()`

* Returns validated data
* Throws on failure

```ts
schema.parse(data);
```

---

### `safeParse()`

* Never throws
* Returns structured result

```ts
const result = schema.safeParse(data);

if (!result.success) {
  console.log(result.error);
}
```

---

### `Infer`

Extracts the TypeScript type from a schema.

```ts
type User = Infer<typeof UserSchema>;
```

---

## 🔤 Primitive Schemas

### `v.string()`

```ts
v.string().min(3).max(20).email();
```

Methods:

* `coerce()`
* `trim()`
* `min()`, `max()`, `length()`
* `email()`, `url()`, `uuid()`
* `regex()`
* `startsWith()`, `endsWith()`
* `nonempty()`

---

### `v.number()`

```ts
v.number().int().positive();
```

Methods:

* `coerce()`
* `min()`, `max()`, `gt()`, `lt()`
* `int()`, `positive()`, `negative()`, `nonnegative()`
* `multipleOf()`

---

### `v.boolean()`

```ts
v.boolean().coerce();
```

Supports:

* `"true"`, `"false"`
* `1`, `0`

---

### `v.date()`

```ts
v.date().min(new Date("2026-01-01"));
```

Accepts:

* Date
* string
* timestamp

---

### `v.literal(value)`

```ts
v.literal("admin");
```

---

### `v.enum([...])`

```ts
v.enum(["draft", "published"] as const);
```

---

### `v.any()` / `v.unknown()`

Accepts anything.

---

### `v.never()`

Always fails validation.

---

## 🧩 Object & Complex Schemas

### `v.object()`

```ts
const User = v.object({
  id: v.string(),
  email: v.string().email(),
});
```

---

### Modes

* default → strips unknown keys
* `strict()` → throws on unknown keys
* `passthrough()` → keeps unknown keys

---

### Utilities

```ts
User.pick("id");
User.omit("email");
User.partial();
User.extend({ age: v.number() });
User.merge(OtherSchema);
```

---

### Arrays

```ts
v.array(v.string()).min(1).max(10);
```

---

### Tuples

```ts
v.tuple([v.number(), v.number()]);
```

---

### Records

```ts
v.record(v.number());
```

---

### Unions

```ts
v.union([v.string(), v.number()]);
```

---

### Discriminated Unions

```ts
v.discriminatedUnion("type", [
  v.object({ type: v.literal("a") }),
  v.object({ type: v.literal("b") }),
]);
```

---

### Intersections

```ts
v.intersection(A, B);
```

---

## 🔧 Shared Modifiers

Works on all schemas:

### `optional()`

```ts
v.string().optional();
```

### `nullable()`

```ts
v.string().nullable();
```

### `default()`

```ts
v.number().default(10);
```

### `refine()`

```ts
v.number().refine(n => n % 2 === 0, "Must be even");
```

### `transform()`

```ts
v.string().transform(s => s.toUpperCase());
```

---

## ❌ Error Handling

```ts
import { ValidationError } from "valorm";

try {
  schema.parse(data);
} catch (err) {
  if (err instanceof ValidationError) {
    console.log(err.issues);
  }
}
```

---

### Issue Shape

```ts
{
  path: (string | number)[];
  message: string;
  received?: unknown;
}
```

---

## 📊 Benchmarks

Comparison with Zod:

### Bundle Size

| Library | Gzipped       |
| ------- | ------------- |
| Valorm  | **~2.6KB 🪶** |
| Zod     | ~59KB         |

---

### Performance (Conceptual)

| Operation         | Valorm        | Zod       |
| ----------------- | ------------- | --------- |
| Simple validation | ⚡ Fast        | ⚡ Fast    |
| Object parsing    | ⚡ Lightweight | ⚡ Heavier |
| Cold start        | 🪶 Low impact | 📈 Higher |

---

### Summary

* 🪶 Smaller footprint
* ⚡ Fast validation
* 🧩 Minimal API
* 🚀 Modern app focused

---

## 🔥 Full Example

```ts
const Post = v.object({
  title: v.string().min(3),
  body: v.string().min(20),
  status: v.enum(["draft", "published"]).default("draft"),
  tags: v.array(v.string()).default(() => []),
});

const result = Post.safeParse({
  title: "Hello",
  body: "This is a valid post body...",
});

if (result.success) {
  console.log(result.data);
}
```

---

## ⚠️ Current Notes

* Object schemas strip unknown keys by default
* `nullable()` behavior may evolve
* Some custom messages still improving (WIP)

---

## 📦 Exports

* `v` → schema builder
* `Schema` → base class
* `ValidationError`
* `Infer<T>`

---

## 🛠 Development

```bash
npm run build
npm run typecheck
```

---

## 🧭 Final Thoughts

Valorm is built for:

* ⚡ speed
* 🧠 clarity
* 😎 developer experience

If you know Zod, you’ll feel right at home — just lighter, faster, and simpler.

---

## 🚀 Philosophy

> Do less. Stay fast. Keep it simple.