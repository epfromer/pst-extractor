const { readFile } = require('node:fs/promises')
const { join } = require('node:path')

let configuration

module.exports = {
  processAsync: async (sourceText, sourcePath) => {
    const babel = await import('@babel/core')
    configuration ??= JSON.parse(
      await readFile(join(__dirname, '../babel-jest-options.json'), 'utf8')
    )
    const result = await babel.transformAsync(sourceText, {
      ...configuration,
      filename: sourcePath,
      sourceMaps: 'inline'
    })
    return { code: result?.code ?? sourceText }
  }
}
