import { writeFile } from 'node:fs/promises'

await writeFile(
  new URL('../dist/cjs/package.json', import.meta.url),
  `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`
)
