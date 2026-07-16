# Comparative performance benchmark

The immutable baseline is commit
`ecff0b5f627ac9b933194d1ed4e2b598f858dc4a`. Baseline and target builds must
run in separate temporary worktrees with Node.js 24.18.0, pnpm 11.9.0, the same
fixtures, OS, and benchmark controller. Each worker runs in a fresh process.

Final measurements use at least five warm-ups and 20 measured rounds with
alternating baseline/target order. Record raw samples, environment, commit IDs,
and SHA-256 fixture hashes under `benchmark/results/`. Workloads cover open and
root loading, full traversal with body access at concurrency 1 and 4, and
64-KiB attachment streaming for path and buffer readers.

A comparison is invalid if counters or parser-error counts differ. Completion
requires all of the following:

- no statistically supported throughput loss above 3% or p95 loss above 5%;
- sync and async geometric throughput means do not fall below baseline;
- async geometric throughput improves by at least 5%;
- RSS grows by neither more than 5% nor 8 MiB in any scenario;
- parallel file-based async RSS falls at least 25%;
- parallel async event-loop p99 falls at least 20%.

Use bootstrap confidence intervals for throughput decisions. Profile failed
gates with `--cpu-prof`, `--heap-prof`, GC traces, and reader/cache counters
before changing a measured hot spot.
