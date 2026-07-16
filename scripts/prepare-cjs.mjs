import { cp, mkdir, writeFile } from 'node:fs/promises'

const target = new URL('../.build/cjs-src/', import.meta.url)
await mkdir(target, { recursive: true })
await cp(new URL('../src/', import.meta.url), target, {
  recursive: true,
  filter: (source) => !source.includes('__tests__')
})
await writeFile(new URL('package.json', target), '{"type":"commonjs"}\n')
