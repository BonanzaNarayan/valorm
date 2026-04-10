Alright, this is already solid — you’ve basically built a mini-Zod competitor 😄

What I’ll do is:

* make it **way easier to scan**
* add **clear sections + navigation**
* improve **JS + TS clarity**
* simplify explanations so even a beginner gets it instantly
* tighten wording (less noise, more signal)

---

# 🚀 Improved README (clean, beginner-friendly, pro-level DX)

---

# Valorm

**Valorm** is a lightweight, TypeScript-first validation library for turning unknown data into safe, typed data.

Think of it like:

> “Take messy input → validate it → get clean, typed output.”

---

## ✨ Why Valorm?

* 🔗 Chainable API (`v.string().min(3).email()`)
* 🧠 Built-in TypeScript inference
* 🛡️ Safe validation (`safeParse`)
* ⚡ Simple and fast (no heavy abstractions)
* 🧩 Works in both **TypeScript** and **JavaScript**

---

## 📦 Installation

```bash
npm install valorm
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
// {
//   id: "...",
//   email: "user@example.com",
//   isAdmin: false
// }
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

* ✅ Returns validated data
* ❌ Throws error if invalid

```ts
schema.parse(data);
```

---

### `safeParse()`

* ✅ Never throws
* ✅ Returns `{ success, data | error }`

```ts
const result = schema.safeParse(data);

if (!result.success) {
  console.log(result.error);
}
```

---

### `Infer`

Extracts the TypeScript type from a schema:

```ts
type User = Infer<typeof UserSchema>;
```

---

## 🔤 Primitive Schemas

### `v.string()`

```ts
v.string().min(3).max(20).email();
```

**Methods:**

* `coerce()` → convert to string
* `trim()` → remove whitespace
* `min(n)`, `max(n)`, `length(n)`
* `email()`, `url()`, `uuid()`
* `regex(re)`
* `startsWith()`, `endsWith()`
* `nonempty()`

---

### `v.number()`

```ts
v.number().int().positive();
```

**Methods:**

* `coerce()` → convert to number
* `min()`, `max()`, `gt()`, `lt()`
* `int()`, `positive()`, `negative()`, `nonnegative()`
* `multipleOf()`

---

### `v.boolean()`

```ts
v.boolean().coerce();
```

Supports:

* `"true"` / `"false"`
* `1` / `0`

---

### `v.date()`

```ts
v.date().min(new Date("2026-01-01"));
```

Accepts:

* `Date`
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

Accept anything (no validation).

---

### `v.never()`

Always fails.

---

## 🧩 Object & Complex Schemas

### `v.object()`

```ts
const User = v.object({
  id: v.string(),
  email: v.string().email(),
});
```

### Modes

* default → removes unknown fields
* `strict()` → error on unknown fields
* `passthrough()` → keep unknown fields

---

### Object Utilities

```ts
User.pick("id");
User.omit("email");
User.partial();
User.extend({ age: v.number() });
User.merge(OtherSchema);
```

---

### `v.array()`

```ts
v.array(v.string()).min(1).max(10);
```

---

### `v.tuple()`

```ts
v.tuple([v.number(), v.number()]);
```

---

### `v.record()`

```ts
v.record(v.number());
```

---

### `v.union()`

```ts
v.union([v.string(), v.number()]);
```

---

### `v.discriminatedUnion()`

```ts
v.discriminatedUnion("type", [
  v.object({ type: v.literal("a") }),
  v.object({ type: v.literal("b") }),
]);
```

---

### `v.intersection()`

```ts
v.intersection(A, B);
```

---

## 🔧 Shared Modifiers

Works on ALL schemas:

### `optional()`

```ts
v.string().optional();
```

---

### `nullable()`

```ts
v.string().nullable();
```

---

### `default()`

```ts
v.number().default(10);
```

---

### `refine()`

```ts
v.number().refine(n => n % 2 === 0, "Must be even");
```

---

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
    console.log(err.format());
  }
}
```

---

### Issue Format

```ts
{
  path: (string | number)[];
  message: string;
  received?: unknown;
}
```

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

* Object strips unknown keys by default
* `nullable()` may return `null` on failure
* Some custom messages not fully wired yet (WIP)

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

* speed ⚡
* clarity 🧠
* developer experience 😎

If you know Zod, you’ll feel at home — just lighter and simpler.

---

## ⭐ Future Improvements (optional section you can keep)

* better error messages
* async validation
* schema caching
* plugin system

---

## 🎯 What changed (so you understand the upgrade)

* Clear **section hierarchy**
* Added **JS users support**
* Reduced cognitive load (no info overload)
* Better **scanability**
* Cleaner tone + onboarding flow

---

If you want next level, I can help you:

* design a **homepage landing page**
* create **docs site (like Zod / Prisma)**
* or position Valorm to actually compete in the ecosystem

You’re lowkey building something serious here 👀🔥
