import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { performance, monitorEventLoopDelay } from 'node:perf_hooks'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

const execFileAsync = promisify(execFile)
const require = createRequire(import.meta.url)
const RESULT_PREFIX = 'PST_BENCHMARK_RESULT='

function parseArguments(argv) {
  const options = {
    fixture: 'src/__tests__/testdata/enron.pst',
    iterations: 5,
    warmup: 1,
    concurrency: 2,
    streamAttachments: false,
    reader: 'path',
    packageRoot: resolve('.'),
    worker: undefined
  }
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index]
    if (argument === '--iterations') options.iterations = Number(argv[++index])
    else if (argument === '--warmup') options.warmup = Number(argv[++index])
    else if (argument === '--concurrency')
      options.concurrency = Number(argv[++index])
    else if (argument === '--stream-attachments')
      options.streamAttachments = true
    else if (argument === '--reader') options.reader = argv[++index]
    else if (argument === '--package-root')
      options.packageRoot = resolve(argv[++index])
    else if (argument === '--worker') options.worker = argv[++index]
    else if (!argument.startsWith('--')) options.fixture = argument
    else throw new Error(`Unknown argument: ${argument}`)
  }
  for (const name of ['iterations', 'warmup', 'concurrency']) {
    if (
      !Number.isSafeInteger(options[name]) ||
      options[name] < (name === 'warmup' ? 0 : 1)
    ) {
      throw new Error(
        `${name} must be ${name === 'warmup' ? 'a non-negative' : 'a positive'} integer`
      )
    }
  }
  options.fixture = resolve(options.fixture)
  if (!['path', 'buffer'].includes(options.reader)) {
    throw new Error('reader must be path or buffer')
  }
  return options
}

function emptyCounts() {
  return {
    folders: 0,
    messages: 0,
    attachments: 0,
    bodyBytes: 0,
    attachmentBytes: 0,
    skippedErrors: 0
  }
}

function addCounts(target, source) {
  for (const key of Object.keys(target)) target[key] += source[key]
  return target
}

function traverseSyncFolder(folder, PSTMessage, streamAttachments) {
  const counts = emptyCounts()
  counts.folders++
  let childFolders = []
  try {
    if (folder.hasSubfolders) childFolders = folder.getSubFolders()
  } catch (error) {
    throw new Error('Synchronous folder traversal failed', { cause: error })
  }
  for (const childFolder of childFolders) {
    addCounts(
      counts,
      traverseSyncFolder(childFolder, PSTMessage, streamAttachments)
    )
  }
  try {
    let child = folder.getNextChild()
    while (child !== null) {
      if (child instanceof PSTMessage) {
        counts.messages++
        counts.bodyBytes += Buffer.byteLength(child.body)
        for (let index = 0; index < child.numberOfAttachments; index++) {
          const attachment = child.getAttachment(index)
          counts.attachments++
          counts.attachmentBytes += attachment.filesize
          if (streamAttachments) {
            const input = attachment.fileInputStream
            if (input) {
              const buffer = Buffer.alloc(64 * 1024)
              while (input.read(buffer) > 0) {
                // Consume the data to benchmark attachment materialization.
              }
            }
          }
        }
      }
      child = folder.getNextChild()
    }
  } catch (error) {
    throw new Error('Synchronous message traversal failed', { cause: error })
  }
  return counts
}

async function traverseAsyncFolder(folder, AsyncPSTMessage, streamAttachments) {
  const counts = emptyCounts()
  counts.folders++
  try {
    if (folder.hasSubfolders) {
      for await (const childFolder of folder.subFolders()) {
        addCounts(
          counts,
          await traverseAsyncFolder(
            childFolder,
            AsyncPSTMessage,
            streamAttachments
          )
        )
      }
    }
  } catch (error) {
    throw new Error('Asynchronous folder traversal failed', { cause: error })
  }
  try {
    for await (const child of folder.children()) {
      if (child instanceof AsyncPSTMessage) {
        counts.messages++
        counts.bodyBytes += Buffer.byteLength(await child.getBody())
        for (let index = 0; index < child.numberOfAttachments; index++) {
          const attachment = await child.getAttachment(index)
          counts.attachments++
          counts.attachmentBytes += attachment.filesize
          if (streamAttachments) {
            for await (const _chunk of attachment.chunks()) {
              // Consume the data to benchmark attachment streaming.
            }
          }
        }
      }
    }
  } catch (error) {
    throw new Error('Asynchronous message traversal failed', { cause: error })
  }
  return counts
}

async function measure(operation) {
  const histogram = monitorEventLoopDelay({ resolution: 1 })
  histogram.enable()
  await new Promise((resolveTimer) => setTimeout(resolveTimer, 5))
  let timerDelayMs = 0
  const timerStarted = performance.now()
  const timer = new Promise((resolveTimer) => {
    setTimeout(() => {
      timerDelayMs = performance.now() - timerStarted
      resolveTimer()
    }, 0)
  })
  const started = performance.now()
  const counts = await operation()
  const durationMs = performance.now() - started
  await timer
  await new Promise((resolveTimer) => setTimeout(resolveTimer, 5))
  histogram.disable()
  return {
    durationMs,
    timerDelayMs,
    eventLoopP99Ms: histogram.percentile(99) / 1e6,
    counts
  }
}

async function runWorker(options) {
  const { AsyncPSTFile, AsyncPSTMessage, PSTFile, PSTMessage } = require(
    options.packageRoot
  )
  const syncOperation = () => {
    const total = emptyCounts()
    for (let index = 0; index < options.concurrency; index++) {
      const source =
        options.reader === 'buffer'
          ? readFileSync(options.fixture)
          : options.fixture
      const pst = new PSTFile(source)
      try {
        addCounts(
          total,
          traverseSyncFolder(
            pst.getRootFolder(),
            PSTMessage,
            options.streamAttachments
          )
        )
      } finally {
        pst.close()
      }
    }
    return total
  }
  const asyncOperation = async () => {
    const results = await Promise.all(
      Array.from({ length: options.concurrency }, async () => {
        const source =
          options.reader === 'buffer'
            ? await readFile(options.fixture)
            : options.fixture
        const pst = await AsyncPSTFile.open(source)
        try {
          return await traverseAsyncFolder(
            await pst.getRootFolder(),
            AsyncPSTMessage,
            options.streamAttachments
          )
        } finally {
          await pst.close()
        }
      })
    )
    return results.reduce(addCounts, emptyCounts())
  }
  const operation = options.worker === 'sync' ? syncOperation : asyncOperation
  for (let index = 0; index < options.warmup; index++) await operation()
  const samples = []
  for (let index = 0; index < options.iterations; index++)
    samples.push(await measure(operation))
  return {
    variant: options.worker,
    samples,
    peakRssMiB: process.resourceUsage().maxRSS / 1024
  }
}

function percentile(values, percentage) {
  const ordered = [...values].sort((left, right) => left - right)
  return ordered[
    Math.min(ordered.length - 1, Math.ceil(ordered.length * percentage) - 1)
  ]
}

function summarize(result) {
  const durations = result.samples.map((sample) => sample.durationMs)
  const medianMs = percentile(durations, 0.5)
  const counts = result.samples[0].counts
  return {
    medianMs,
    p95Ms: percentile(durations, 0.95),
    messagesPerSecond: counts.messages / (medianMs / 1000),
    timerDelayP95Ms: percentile(
      result.samples.map((sample) => sample.timerDelayMs),
      0.95
    ),
    eventLoopP99Ms: percentile(
      result.samples.map((sample) => sample.eventLoopP99Ms),
      0.95
    ),
    peakRssMiB: result.peakRssMiB,
    counts
  }
}

async function runCoordinator(options) {
  const commonArguments = [
    options.fixture,
    '--iterations',
    String(options.iterations),
    '--warmup',
    String(options.warmup),
    '--concurrency',
    String(options.concurrency),
    ...(options.streamAttachments ? ['--stream-attachments'] : []),
    '--reader',
    options.reader,
    '--package-root',
    options.packageRoot
  ]
  const results = {}
  for (const variant of ['sync', 'async']) {
    const { stdout } = await execFileAsync(
      process.execPath,
      [
        new URL(import.meta.url).pathname,
        ...commonArguments,
        '--worker',
        variant
      ],
      { maxBuffer: 10 * 1024 * 1024 }
    )
    const resultLine = stdout
      .split('\n')
      .find((line) => line.startsWith(RESULT_PREFIX))
    if (!resultLine)
      throw new Error(`Benchmark worker ${variant} returned no result`)
    results[variant] = summarize(
      JSON.parse(resultLine.slice(RESULT_PREFIX.length))
    )
  }
  const workload = results.sync.counts
  if (JSON.stringify(workload) !== JSON.stringify(results.async.counts)) {
    throw new Error(
      `Sync and async traversed different workloads: ${JSON.stringify({ sync: workload, async: results.async.counts })}`
    )
  }
  if (workload.skippedErrors !== 0) {
    throw new Error(
      `Benchmark encountered ${workload.skippedErrors} unexpected parser error(s)`
    )
  }
  console.log(`Fixture: ${options.fixture}`)
  console.log(
    `Workload per sample: ${options.concurrency} archive(s), ${workload.folders} folders, ` +
      `${workload.messages} messages, ${workload.attachments} attachments, ` +
      `${workload.skippedErrors} skipped parser error(s)`
  )
  console.log(
    `Warm-up: ${options.warmup}; measured iterations: ${options.iterations}`
  )
  console.table({
    sync: {
      medianMs: results.sync.medianMs.toFixed(2),
      p95Ms: results.sync.p95Ms.toFixed(2),
      messagesPerSecond: results.sync.messagesPerSecond.toFixed(1),
      timerDelayP95Ms: results.sync.timerDelayP95Ms.toFixed(2),
      eventLoopP99Ms: results.sync.eventLoopP99Ms.toFixed(2),
      peakRssMiB: results.sync.peakRssMiB.toFixed(1)
    },
    async: {
      medianMs: results.async.medianMs.toFixed(2),
      p95Ms: results.async.p95Ms.toFixed(2),
      messagesPerSecond: results.async.messagesPerSecond.toFixed(1),
      timerDelayP95Ms: results.async.timerDelayP95Ms.toFixed(2),
      eventLoopP99Ms: results.async.eventLoopP99Ms.toFixed(2),
      peakRssMiB: results.async.peakRssMiB.toFixed(1)
    }
  })
  console.log(
    `Async/sync median ratio: ${(results.async.medianMs / results.sync.medianMs).toFixed(2)}x; ` +
      `throughput ratio: ${(results.async.messagesPerSecond / results.sync.messagesPerSecond).toFixed(2)}x`
  )
}

const options = parseArguments(process.argv.slice(2))
if (options.worker) {
  if (!['sync', 'async'].includes(options.worker))
    throw new Error('worker must be sync or async')
  console.log(RESULT_PREFIX + JSON.stringify(await runWorker(options)))
} else {
  await runCoordinator(options)
}
