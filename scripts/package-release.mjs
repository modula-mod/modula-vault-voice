#!/usr/bin/env node
import {createHash} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

const root = process.cwd()
const releaseDir = join(root, 'release')
mkdirSync(releaseDir, {recursive: true})
execFileSync('pnpm', ['build'], {cwd: root, stdio: 'inherit'})
const packageJson = readJson('package.json')
const product = readJson('modula.product.json')
const greenfield = readJson('module.manifest.json')
const version = product.identity.version
if (packageJson.version !== version || greenfield.version !== version) throw new Error('Release versions disagree.')
execFileSync('pnpm', ['pack', '--pack-destination', releaseDir], {cwd: root, stdio: 'inherit'})
const packageFile = `modula-vault-voice-${version}.tgz`
const frontendBytes = readFileSync(join(root, product.frontend.artifact.path))
const frontendChecksum = sha256(frontendBytes)
if (frontendChecksum !== product.frontend.artifact.sha256 || frontendChecksum !== product.release.provenance.frontendSha256) throw new Error('Frontend provenance mismatch.')
const commit = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim()
const provenance = {
  productId: product.identity.id, kind: product.identity.kind, version, mpsVersion: product.productStandard, moduleStandardVersion: '2.1.0',
  repository: 'modula-mod/modula-vault-voice', releaseTag: `vault-voice-v${version}`, releaseCommit: commit, packageFile,
  packageChecksum: sha256(readFileSync(join(releaseDir, packageFile))),
  productManifestChecksum: sha256(readFileSync(join(root, 'modula.product.json'))),
  standardManifestChecksum: sha256(readFileSync(join(root, 'modula.module.json'))),
  greenfieldManifestChecksum: greenfield.integrity.manifestSha256,
  frontendArtifact: product.frontend.artifact.path, frontendChecksum,
  standardReleaseTag: 'mms-v2.1.0', standardReleaseCommit: 'd5a99a4bf1dec789b4d96df5182ae3a95a87f3d7',
  transcriptionProviderState: 'NOT_CONFIGURED', fakeTranscript: false, channel: product.release.channel, generatedAt: new Date().toISOString(),
}
writeFileSync(join(releaseDir, `vault-voice-v${version}.provenance.json`), `${JSON.stringify(provenance, null, 2)}\n`)
console.log(JSON.stringify(provenance, null, 2))
function readJson(path) { return JSON.parse(readFileSync(join(root, path), 'utf8')) }
function sha256(value) { return createHash('sha256').update(value).digest('hex') }
