// This file is a helper to silence TypeScript errors in VS Code
// when the Deno extension is not installed or active.
// It does not affect the actual runtime execution in Supabase.

declare const Deno: {
    env: {
        get(key: string): string | undefined;
    };
};

declare module "std/http/server.ts" {
    export const serve: (handler: (req: Request) => Promise<Response>) => void;
}
