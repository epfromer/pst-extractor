import { execFile } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const root = new URL('..', import.meta.url)
const temporary = await mkdtemp(join(tmpdir(), 'pst-extractor-smoke-'))
let tarball

try {
  const { stdout } = await execFileAsync('pnpm', ['pack', '--json'], {
    cwd: root
  })
  const packResult = JSON.parse(stdout)
  const filename = Array.isArray(packResult)
    ? packResult[0].filename
    : packResult.filename
  tarball = join(new URL(root).pathname, filename)
  await writeFile(
    join(temporary, 'package.json'),
    JSON.stringify({
      type: 'module',
      dependencies: { 'pst-extractor': tarball },
      devDependencies: { '@types/node': '^24.10.0' }
    })
  )
  await execFileAsync('pnpm', ['install', '--ignore-scripts'], {
    cwd: temporary
  })

  await writeFile(
    join(temporary, 'consumer.mjs'),
    "import { AsyncPSTFile, PSTFile } from 'pst-extractor'\nif (typeof PSTFile !== 'function') throw new Error('ESM import failed')\nconst pst = await AsyncPSTFile.open(process.argv[2])\nif (!(await pst.getRootFolder()).hasSubfolders) throw new Error('PST traversal failed')\nawait pst.close()\n"
  )
  await writeFile(
    join(temporary, 'consumer.cjs'),
    "const { PSTFile } = require('pst-extractor')\nif (typeof PSTFile !== 'function') throw new Error('CJS require failed')\n"
  )
  const fixturePath = new URL(
    '../src/__tests__/testdata/enron.pst',
    import.meta.url
  ).pathname
  await execFileAsync(process.execPath, ['consumer.mjs', fixturePath], {
    cwd: temporary
  })
  await execFileAsync(process.execPath, ['consumer.cjs'], { cwd: temporary })

  await writeFile(
    join(temporary, 'consumer.ts'),
    "import { AsyncPSTFile, PSTFile } from 'pst-extractor'\nvoid AsyncPSTFile\nvoid PSTFile\n"
  )
  await writeFile(
    join(temporary, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        target: 'ES2024',
        lib: ['ES2024', 'ESNext.Disposable'],
        types: ['node']
      }
    })
  )
  await execFileAsync(join(new URL(root).pathname, 'node_modules/.bin/tsc'), [
    '-p',
    join(temporary, 'tsconfig.json')
  ])
} finally {
  if (tarball) await rm(tarball, { force: true })
  await rm(temporary, { recursive: true, force: true })
}
