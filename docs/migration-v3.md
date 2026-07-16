# Migrating to pst-extractor 3.0

## Runtime

Version 3 requires Node.js 24.12 or newer. CI and the supported development
toolchain use Node.js 24.18.0 and pnpm 11.9.0. Node.js 22 is no longer tested.

## Package loading

The package now has explicit ESM and CommonJS exports. Existing CommonJS code
continues to use `require('pst-extractor')`; ESM code uses normal named imports.
Declarations resolve from the same public surface for both consumers.

## Async API

`AsyncPSTFile.open()` no longer copies an entire PST into memory. Path and
custom-reader sources are accessed through asynchronous positional reads, a
per-file LRU cache, deduplicated in-flight page reads, and asynchronous zlib.
The default cache limit is 64 MiB. Applications can tune it with
`limits.maxCacheBytes`; `Infinity` explicitly selects an unbounded cache.

`close()` is idempotent, prevents new work, aborts active reads, waits for
active operations to settle, and then releases an owned reader. Continue to
prefer attachment `chunks()` or `createReadStream()` over `readBuffer()`.

The synchronous `PSTFile` and object classes, including public `Long` values,
remain available. Version 3 does not require migrating synchronous callers.

## Tooling for contributors

ESLint and `@typescript-eslint` were replaced by Oxlint 1.74 with native
TypeScript-7 type analysis. Prettier remains an independent formatting check.
Builds use TypeScript 7.0.2; Babel 8 is used only by Jest.
