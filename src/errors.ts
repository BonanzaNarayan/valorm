// ─── Issue & Error Types ──────────────────────────────────────────────────────

export interface ValidationIssue {
  path: (string | number)[];  // e.g. ["user", "address", "zip"]
  message: string;
  received?: unknown;
}

export class ValidationError extends Error {
  readonly issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    const summary = issues
      .map(i => (i.path.length ? `[${i.path.join(".")}] ${i.message}` : i.message))
      .join("; ");
    super(summary);
    this.name = "ValidationError";
    this.issues = issues;
  }

  // Pretty-print for debugging
  format(): Record<string, string[]> {
    const out: Record<string, string[]> = {};
    for (const issue of this.issues) {
      const key = issue.path.length ? issue.path.join(".") : "_root";
      (out[key] ??= []).push(issue.message);
    }
    return out;
  }
}

// ─── SafeParse Result ─────────────────────────────────────────────────────────

export type SafeParseSuccess<T> = { success: true; data: T };
export type SafeParseError = { success: false; error: ValidationError };
export type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseError;

// ─── Internal parse context ───────────────────────────────────────────────────

export interface ParseContext {
  path: (string | number)[];
  issues: ValidationIssue[];
}

export function addIssue(
  ctx: ParseContext,
  message: string,
  received?: unknown
): void {
  ctx.issues.push({ path: [...ctx.path], message, received });
}