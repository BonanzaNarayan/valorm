export interface ValidationIssue {
    path: (string | number)[];
    message: string;
    received?: unknown;
}
export declare class ValidationError extends Error {
    readonly issues: ValidationIssue[];
    constructor(issues: ValidationIssue[]);
    format(): Record<string, string[]>;
}
export type SafeParseSuccess<T> = {
    success: true;
    data: T;
};
export type SafeParseError = {
    success: false;
    error: ValidationError;
};
export type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseError;
export interface ParseContext {
    path: (string | number)[];
    issues: ValidationIssue[];
}
export declare function addIssue(ctx: ParseContext, message: string, received?: unknown): void;
//# sourceMappingURL=errors.d.ts.map