module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: '24.18' }, modules: 'commonjs' }],
    '@babel/preset-typescript'
  ]
}
