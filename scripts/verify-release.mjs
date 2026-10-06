import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve, basename } from 'node:path'
const pkg = JSON.parse(readFileSync('packages/desktop/package.json', 'utf8'))
const info = JSON.parse(readFileSync('packages/desktop/publish/version.json', 'utf8'))
assert.equal(info.version, pkg.version)
assert.match(pkg.version, /^\d+\.\d+\.\d+$/)
if (process.env.GITHUB_REF_TYPE === 'tag') assert.equal(process.env.GITHUB_REF_NAME, `v${pkg.version}`)
const config = readFileSync('packages/desktop/build-config/build-pack.cjs', 'utf8')
assert.ok(config.includes("owner: 'xxxbaiovo'") && config.includes("repo: 'open-listen'"))
assert.ok(readFileSync('packages/desktop/src/shared/update.ts', 'utf8').includes('https://github.com/xxxbaiovo/open-listen/releases/latest/download/version.json'))
if (!process.argv.includes('--source-only')) {
  const yaml = readFileSync('build/latest.yml', 'utf8')
  const file = yaml.match(/^path: (.+)$/m)?.[1]?.trim()
  const sha = yaml.match(/^sha512: (.+)$/m)?.[1]?.trim()
  assert.ok(file && sha, 'Missing updater metadata')
  assert.equal(basename(file), file)
  assert.ok(file.endsWith('-x64-Setup.exe'))
  assert.ok(file.includes(pkg.version))
  assert.ok(existsSync(resolve('build', `${file}.blockmap`)))
  assert.equal(createHash('sha512').update(readFileSync(resolve('build', file))).digest('base64'), sha)
  assert.equal(yaml.match(/^version: (.+)$/m)?.[1]?.trim(), pkg.version)
}
console.log(`Open Listen ${pkg.version}: release checks passed`)
