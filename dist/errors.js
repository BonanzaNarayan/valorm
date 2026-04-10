// ─── Issue & Error Types ──────────────────────────────────────────────────────
export class ValidationError extends Error {
    issues;
    constructor(issues) {
        const summary = issues
            .map(i => (i.path.length ? `[${i.path.join(".")}] ${i.message}` : i.message))
            .join("; ");
        super(summary);
        this.name = "ValidationError";
        this.issues = issues;
    }
    // Pretty-print for debugging
    format() {
        const out = {};
        for (const issue of this.issues) {
            const key = issue.path.length ? issue.path.join(".") : "_root";
            (out[key] ??= []).push(issue.message);
        }
        return out;
    }
}
export function addIssue(ctx, message, received) {
    ctx.issues.push({ path: [...ctx.path], message, received });
}
//# sourceMappingURL=errors.js.map