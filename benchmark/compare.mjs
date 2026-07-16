import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const root = resolve(new URL('..', import.meta.url).pathname)
const harness = resolve(root, 'benchmark/async-vs-sync.mjs')
const baselineCommit = 'ecff0b5f627ac9b933194d1ed4e2b598f858dc4a'
const quick = process.argv.includes('--quick')
const warmups = quick ? 1 : 5
const rounds = quick ? 3 : 20
const fixture = resolve(root, 'src/__tests__/testdata/enron.pst')
const scenarios = [
  { name: 'path-c1', reader: 'path', concurrency: 1, attachments: false },
  { name: 'path-c4', reader: 'path', concurrency: 4, attachments: false },
  { name: 'buffer-c1', reader: 'buffer', concurrency: 1, attachments: false },
  { name: 'attachments-c1', reader: 'path', concurrency: 1, attachments: true }
]
const temporary = await mkdtemp(join(tmpdir(), 'pst-extractor-benchmark-'))
const baselineRoot = join(temporary, 'baseline')
const raw = { environment: {}, scenarios: {} }

function percentile(values, fraction) {
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[
    Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)
  ]
}

function geometricMean(values) {
  return Math.exp(
    values.reduce((sum, value) => sum + Math.log(value), 0) / values.length
  )
}

function summarize(samples) {
  const durations = samples.map((sample) => sample.durationMs)
  const counts = samples[0].counts
  const medianMs = percentile(durations, 0.5)
  return {
    medianMs,
    p95Ms: percentile(durations, 0.95),
    throughput: counts.messages / (medianMs / 1000),
    attachmentThroughput: counts.attachmentBytes / (medianMs / 1000),
    eventLoopP99Ms: percentile(
      samples.map((sample) => sample.eventLoopP99Ms),
      0.5
    ),
    peakRssMiB: percentile(
      samples.map((sample) => sample.peakRssMiB),
      0.5
    ),
    counts
  }
}

function bootstrapRatio(baseline, target, iterations = 2000) {
  let state = 0x9e3779b9
  const randomIndex = (length) => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) % length
  }
  const ratios = []
  for (let iteration = 0; iteration < iterations; iteration++) {
    const baselineSample = []
    const targetSample = []
    for (let index = 0; index < baseline.length; index++) {
      baselineSample.push(baseline[randomIndex(baseline.length)])
      targetSample.push(target[randomIndex(target.length)])
    }
    ratios.push(percentile(targetSample, 0.5) / percentile(baselineSample, 0.5))
  }
  return [percentile(ratios, 0.025), percentile(ratios, 0.975)]
}

async function command(file, args, cwd = root) {
  return execFileAsync(file, args, {
    cwd,
    maxBuffer: 20 * 1024 * 1024,
    env: { ...process.env, CI: '1', PST_EXTRACTOR_BENCHMARK: '1' }
  })
}

async function sample(packageRoot, variant, scenario) {
  const args = [
    harness,
    fixture,
    '--iterations',
    '1',
    '--warmup',
    String(warmups),
    '--concurrency',
    String(scenario.concurrency),
    '--reader',
    scenario.reader,
    '--package-root',
    packageRoot,
    '--worker',
    variant,
    ...(scenario.attachments ? ['--stream-attachments'] : [])
  ]
  const { stdout } = await command(process.execPath, args)
  const line = stdout
    .split('\n')
    .find((entry) => entry.startsWith('PST_BENCHMARK_RESULT='))
  if (!line) throw new Error('Benchmark worker returned no result')
  const result = JSON.parse(line.slice('PST_BENCHMARK_RESULT='.length))
  return {
    ...result.samples[0],
    peakRssMiB: result.peakRssMiB,
    diagnostics: result.diagnostics
  }
}

try {
  await command('git', [
    'worktree',
    'add',
    '--detach',
    baselineRoot,
    baselineCommit
  ])
  await command('pnpm', ['install', '--frozen-lockfile'], baselineRoot)
  await command('pnpm', ['run', 'build'], baselineRoot)
  await command('pnpm', ['run', 'build'], root)

  const { stdout: targetCommit } = await command('git', ['rev-parse', 'HEAD'])
  const { stdout: targetDiff } = await command('git', [
    'diff',
    '--binary',
    'HEAD'
  ])
  const fixtureData = await readFile(fixture)
  raw.environment = {
    node: process.version,
    platform: `${process.platform}-${process.arch}`,
    baselineCommit,
    targetCommit: targetDiff
      ? `${targetCommit.trim()}+dirty:${createHash('sha256').update(targetDiff).digest('hex').slice(0, 12)}`
      : targetCommit.trim(),
    fixture,
    fixtureSha256: createHash('sha256').update(fixtureData).digest('hex'),
    warmups,
    rounds
  }

  for (const scenario of scenarios) {
    raw.scenarios[scenario.name] = {}
    for (const variant of ['sync', 'async']) {
      const baseline = []
      const target = []
      for (let round = 0; round < rounds; round++) {
        const order =
          round % 2 === 0
            ? [
                [baselineRoot, baseline],
                [root, target]
              ]
            : [
                [root, target],
                [baselineRoot, baseline]
              ]
        for (const [packageRoot, output] of order) {
          output.push(await sample(packageRoot, variant, scenario))
        }
      }
      const expected = JSON.stringify(baseline[0].counts)
      if (
        baseline.some((entry) => JSON.stringify(entry.counts) !== expected) ||
        target.some((entry) => JSON.stringify(entry.counts) !== expected) ||
        baseline[0].counts.skippedErrors !== 0
      ) {
        throw new Error(
          `${scenario.name}/${variant} produced mismatched counters or parser errors`
        )
      }
      raw.scenarios[scenario.name][variant] = { baseline, target }
    }
  }

  const failures = []
  const summaries = {}
  const throughputRatios = { sync: [], async: [] }
  for (const scenario of scenarios) {
    summaries[scenario.name] = {}
    for (const variant of ['sync', 'async']) {
      const values = raw.scenarios[scenario.name][variant]
      const baseline = summarize(values.baseline)
      const target = summarize(values.target)
      const throughputRatio = target.throughput / baseline.throughput
      const p95Ratio = target.p95Ms / baseline.p95Ms
      const interval = bootstrapRatio(
        values.baseline.map((entry) => 1000 / entry.durationMs),
        values.target.map((entry) => 1000 / entry.durationMs)
      )
      throughputRatios[variant].push(throughputRatio)
      summaries[scenario.name][variant] = {
        baseline,
        target,
        throughputRatio,
        p95Ratio,
        throughputRatio95CI: interval
      }
      if (interval[1] < 0.97)
        failures.push(`${scenario.name}/${variant}: throughput regression`)
      if (p95Ratio > 1.05)
        failures.push(`${scenario.name}/${variant}: p95 regression`)
      if (
        target.peakRssMiB >
        Math.max(baseline.peakRssMiB * 1.05, baseline.peakRssMiB + 8)
      ) {
        failures.push(`${scenario.name}/${variant}: RSS regression`)
      }
    }
  }
  if (geometricMean(throughputRatios.sync) < 1)
    failures.push('sync geometric throughput below baseline')
  if (geometricMean(throughputRatios.async) < 1.05)
    failures.push('async geometric throughput gain below 5%')
  const parallel = summaries['path-c4'].async
  if (parallel.target.peakRssMiB / parallel.baseline.peakRssMiB > 0.75) {
    failures.push('parallel async RSS reduction below 25%')
  }
  if (parallel.target.eventLoopP99Ms / parallel.baseline.eventLoopP99Ms > 0.8) {
    failures.push('parallel async event-loop p99 reduction below 20%')
  }

  raw.summaries = summaries
  raw.failures = failures
  const results = resolve(root, 'benchmark/results')
  await mkdir(results, { recursive: true })
  const id = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')
  await writeFile(
    resolve(results, `${id}.json`),
    `${JSON.stringify(raw, null, 2)}\n`
  )
  const rows = scenarios.flatMap((scenario) =>
    ['sync', 'async'].map((variant) => {
      const value = summaries[scenario.name][variant]
      return `| ${scenario.name} | ${variant} | ${value.baseline.medianMs.toFixed(2)} | ${value.target.medianMs.toFixed(2)} | ${(value.throughputRatio * 100 - 100).toFixed(1)}% | ${value.baseline.peakRssMiB.toFixed(1)} | ${value.target.peakRssMiB.toFixed(1)} |`
    })
  )
  const markdown = `# Benchmark ${id}\n\n- Baseline: \`${baselineCommit}\`\n- Target: \`${raw.environment.targetCommit}\`\n- Node: ${process.version}\n- Fixture SHA-256: \`${raw.environment.fixtureSha256}\`\n- Warm-ups / rounds: ${warmups} / ${rounds}\n\n| Scenario | API | Baseline ms | Target ms | Throughput delta | Baseline RSS MiB | Target RSS MiB |\n|---|---|---:|---:|---:|---:|---:|\n${rows.join('\n')}\n\n## Gates\n\n${failures.length === 0 ? 'All acceptance gates passed.' : failures.map((failure) => `- FAIL: ${failure}`).join('\n')}\n`
  await writeFile(resolve(results, `${id}.md`), markdown)
  console.log(markdown)
  if (failures.length > 0 && !quick) process.exitCode = 1
} finally {
  await command('git', ['worktree', 'remove', '--force', baselineRoot]).catch(
    () => undefined
  )
  await rm(temporary, { recursive: true, force: true })
}
