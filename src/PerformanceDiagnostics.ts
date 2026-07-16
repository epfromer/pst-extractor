export interface PerformanceDiagnostics {
  readCalls: number
  bytesRead: number
  cacheHits: number
  cacheMisses: number
  evictions: number
  copies: number
  decompressions: number
  yields: number
}

const diagnosticsKey = Symbol.for('pst-extractor.performance-diagnostics')
const enabled = process.env.PST_EXTRACTOR_BENCHMARK === '1'

type DiagnosticName = keyof PerformanceDiagnostics

export function recordDiagnostic(name: DiagnosticName, value = 1): void {
  if (!enabled) return
  const scope = globalThis as typeof globalThis & {
    [diagnosticsKey]?: PerformanceDiagnostics
  }
  const diagnostics = (scope[diagnosticsKey] ??= {
    readCalls: 0,
    bytesRead: 0,
    cacheHits: 0,
    cacheMisses: 0,
    evictions: 0,
    copies: 0,
    decompressions: 0,
    yields: 0
  })
  diagnostics[name] += value
}
