import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const allowed = new Set([
  '0BSD',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  'MIT',
  'Unlicense'
])
const { stdout } = await execFileAsync(
  'pnpm',
  ['licenses', 'list', '--json', '--prod'],
  { maxBuffer: 10 * 1024 * 1024 }
)
const report = JSON.parse(stdout)
const rejected = Object.keys(report).filter((license) => !allowed.has(license))
if (rejected.length > 0) {
  throw new Error(
    `Production dependency licenses require review: ${rejected.join(', ')}`
  )
}
console.log(`License check passed: ${Object.keys(report).join(', ')}`)
