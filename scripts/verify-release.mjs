#!/usr/bin/env node
import {createHash} from 'node:crypto'
import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs'
import {join} from 'node:path'
import {validateModulaModuleManifest} from '@modula/module-validator'

const failures = []
const packageJson = readJson('package.json')
const product = readJson('modula.product.json')
const standard = readJson('modula.module.json')
const greenfield = readJson('module.manifest.json')
const check = (condition, message) => condition ? console.log(`PASS ${message}`) : (failures.push(message), console.error(`FAIL ${message}`))
const validation = validateModulaModuleManifest(standard)
check(validation.valid, `Standard 2.1 manifest validates${validation.valid ? '' : `: ${validation.issues.map(issue => `${issue.code} ${issue.path}`).join('; ')}`}`)
check(product.identity.id === 'digital.modula.vault-notes.voice' && product.identity.version === packageJson.version, 'Vault Voice MPS identity matches package')
check(standard.moduleVersion === packageJson.version && greenfield.version === packageJson.version, 'compatibility versions match package')
check(standard.extensionProduct?.kind === 'addon' && standard.extensionProduct.targets?.[0]?.productId === 'digital.modula.vault-notes', 'Vault Notes target declared')
check(standard.extensionProduct.contributions.some(item => item.kind === 'editor.attachment'), 'audio attachment contribution declared')
check(standard.extensionProduct.contributions.some(item => item.kind === 'editor.command'), 'transcript editor command declared')
check(!standard.permissions.some(item => item.id === 'notes.delete'), 'note deletion capability absent')
check(greenfield.backend?.endpoints?.baseUrlStrategy === 'registry' && !JSON.stringify(greenfield.backend).includes('http://'), 'transcription origin is registry-governed')
check(greenfield.backend?.authentication?.tokenExchangeRequired === true && greenfield.backend.authentication.tokenTtlSeconds <= 900, 'short-lived Greenfield assertion required')
check(packageJson.files.includes('frontend/frontend.manifest.json') && !packageJson.files.includes('frontend'), 'release package includes only the compiled frontend')

const frontendPath = product.frontend?.artifact?.path
check(product.frontend?.mode === 'host-contribution' && frontendPath === 'frontend/frontend.manifest.json' && existsSync(frontendPath), 'product-owned host contribution artifact exists')
if (frontendPath && existsSync(frontendPath)) {
  const bytes = readFileSync(frontendPath)
  const frontend = JSON.parse(bytes.toString('utf8'))
  const hash = createHash('sha256').update(bytes).digest('hex')
  check(hash === product.frontend.artifact.sha256 && hash === product.release.provenance.frontendSha256, 'frontend hash and provenance match')
  check(frontend.productId === product.identity.id && frontend.releaseVersion === packageJson.version && frontend.mode === 'host-contribution', 'frontend identity and mode match')
  for (const declaration of product.contributions) check(frontend.contributions.some(item => item.id === declaration.id && item.target === declaration.target), `frontend contribution matches MPS declaration: ${declaration.id}`)
  check(frontend.actions.some(item => item.id.endsWith('.function.record') && item.family === 'capability.invoke' && item.capability === 'audio.capture@1'), 'record action uses generic native audio capability')
  check(frontend.views.some(view => view.id === 'settings') && frontend.settings?.viewId === 'settings', 'Vault Voice owns its settings and permission explanation')
  const unavailable = frontend.views.find(view => view.id === 'settings')?.states?.capabilityUnavailable?.text
  check(typeof unavailable === 'string' && unavailable.includes('No transcription provider is configured') && unavailable.includes('not fabricate a transcript'), 'provider unavailable UI is honest')
  check(frontend.routes === undefined && frontend.entry === undefined, 'add-on does not invent a standalone app')
}

const text = JSON.stringify({product, standard, greenfield}) + collectText('src') + collectText('scripts')
for (const prohibited of ['SELECT * FROM vault_notes', 'greenfield session bearer', 'accessToken', 'refreshToken', 'customSql', 'remoteEntry', 'componentCode', 'dangerouslySetInnerHTML', 'rawJs', 'rawHtml']) check(!text.includes(prohibited), `prohibited construct absent: ${prohibited}`)
check(text.includes('WAITING_FOR_CONNECTION'), 'offline transcription state is explicit')
check(text.includes('TRANSCRIPTION_PROVIDER_UNAVAILABLE'), 'missing provider runtime state is explicit')
if (failures.length) process.exit(1)
console.log('Vault Voice release verifier passed')

function readJson(path) { return JSON.parse(readFileSync(path, 'utf8')) }
function collectText(dir) {
  let result = ''
  for (const entry of readdirSync(dir)) {
    if (entry === 'verify-release.mjs') continue
    const path = join(dir, entry)
    const stat = statSync(path)
    result += stat.isDirectory() ? collectText(path) : /\.(json|ts|md|mjs)$/.test(entry) ? readFileSync(path, 'utf8') : ''
  }
  return result
}
