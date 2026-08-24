#!/usr/bin/env node
import {createHash} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

const root = process.cwd()
const version = '0.1.0'
const releaseDir = join(root, 'release')
mkdirSync(releaseDir, {recursive: true})
execFileSync('pnpm', ['build'], {cwd: root, stdio: 'inherit'})
execFileSync('pnpm', ['pack', '--pack-destination', releaseDir], {cwd: root, stdio: 'inherit'})
const packageFile = `modula-vault-voice-${version}.tgz`
const commit = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim()
const provenance = {productId: 'digital.modula.vault-notes.voice', kind: 'addon', version, repository: 'modula-mod/modula-vault-voice', releaseTag: `vault-voice-v${version}`, releaseCommit: commit, packageFile, packageChecksum: sha256(readFileSync(join(releaseDir, packageFile))), manifestChecksum: sha256(readFileSync(join(root, 'modula.module.json'))), greenfieldManifestChecksum: JSON.parse(readFileSync(join(root, 'module.manifest.json'), 'utf8')).integrity.manifestSha256, standardReleaseTag: 'mms-v2.1.0', standardReleaseCommit: 'd5a99a4bf1dec789b4d96df5182ae3a95a87f3d7', generatedAt: new Date().toISOString()}
writeFileSync(join(releaseDir, `vault-voice-v${version}.provenance.json`), `${JSON.stringify(provenance, null, 2)}\n`)
console.log(JSON.stringify(provenance, null, 2))
function sha256(value) { return createHash('sha256').update(value).digest('hex') }
