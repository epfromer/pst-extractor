# ADR-20260716-node24-async-random-access

## Kontext

The version-2 async API avoided synchronous filesystem calls but loaded every
PST into one `Buffer` and delegated parsing to the synchronous object family.
Large archives therefore duplicated file-sized memory and blocked zlib work.
The package also had one CommonJS build and an ESLint/TypeScript toolchain that
did not exercise TypeScript 7.

## Problemdefinition

Version 3 needs bounded-memory asynchronous I/O without breaking the public
synchronous API or its `Long` values, while supporting ESM and CommonJS and a
single TypeScript-7 production compiler.

## Kriterienkatalog

- no synchronous I/O or zlib in asynchronous operations;
- bounded peak memory and reader backpressure;
- public API compatibility;
- deterministic TypeScript-7 builds and validation;
- low implementation duplication and measurable performance.

## Top 3 Varianten

### 1) Cache-backed parser bridge (gewählt)

Keep I/O-free parser functions and satisfy their positional accesses from an
asynchronously filled, file-local page cache. A cache miss suspends and retries
the operation; legacy fallback blocks preserve retry signals.

### 2) Independent asynchronous parser hierarchy

Duplicate every B-tree, table, property, and object parser with async methods.

### 3) Whole-file buffer with worker threads

Retain materialization and move parsing to workers to reduce event-loop delay.

## Tabellarische Gegenüberstellung

| Kriterium           | Gewicht | Variante 1 | Variante 2 | Variante 3 |
| ------------------- | ------: | ---------: | ---------: | ---------: |
| Bounded memory      |      30 |          5 |          5 |          1 |
| API compatibility   |      25 |          5 |          3 |          5 |
| Maintainability     |      20 |          4 |          1 |          3 |
| Event-loop behavior |      15 |          4 |          4 |          4 |
| Delivery risk       |      10 |          4 |          1 |          3 |

## Gewichtete Bewertung

On a five-point scale the weighted totals are 4.55, 3.20, and 3.05 for
variants 1, 2, and 3 respectively.

## Begründete Entscheidung

Variant 1 is selected. Parser code remains I/O-free and shared, while all file
access, read deduplication, LRU eviction, and zlib scheduling live at the async
boundary. TypeScript emits ESM, CommonJS, and declarations in separate passes.
Oxlint owns lint and type diagnostics; Prettier remains independent.

## Konsequenzen

Parser catch blocks must never consume cache/decompression retry signals.
Operations that mutate cursors must only advance after required pages are
available. Cache and lifecycle tests protect this invariant. Node.js 22 and
TypeScript versions before 7 are unsupported in version 3.
