#!/usr/bin/env node
import {readFileSync, readdirSync, statSync} from 'node:fs'
import {join} from 'node:path'
import {validateModulaModuleManifest} from '@modula/module-validator'

const failures = []
const standard = JSON.parse(readFileSync('modula.module.json', 'utf8'))
const greenfield = JSON.parse(readFileSync('module.manifest.json', 'utf8'))
const check = (condition, message) => condition ? console.log(`PASS ${message}`) : (failures.push(message), console.error(`FAIL ${message}`))
const validation = validateModulaModuleManifest(standard)
check(validation.valid, `Standard 2.1 manifest validates${validation.valid ? '' : `: ${validation.issues.map(issue => `${issue.code} ${issue.path}`).join('; ')}`}`)
check(standard.extensionProduct?.kind === 'addon' && standard.extensionProduct.targets?.[0]?.productId === 'digital.modula.vault-notes', 'Vault Notes target declared')
check(standard.extensionProduct.contributions.some(item => item.kind === 'editor.attachment'), 'audio attachment contribution declared')
check(standard.extensionProduct.contributions.some(item => item.kind === 'editor.command'), 'transcript editor command declared')
check(!standard.permissions.some(item => item.id === 'notes.delete'), 'note deletion capability absent')
check(greenfield.backend?.endpoints?.baseUrlStrategy === 'registry' && !JSON.stringify(greenfield.backend).includes('http://'), 'transcription origin is registry-governed')
check(greenfield.backend?.authentication?.tokenExchangeRequired === true && greenfield.backend.authentication.tokenTtlSeconds <= 900, 'short-lived Greenfield assertion required')
const text = JSON.stringify({standard, greenfield}) + collectText('src') + collectText('scripts')
for (const prohibited of ['SELECT * FROM vault_notes', 'greenfield session bearer', 'accessToken', 'refreshToken', 'customSql', 'remoteEntry', 'componentCode', 'dangerouslySetInnerHTML']) check(!text.includes(prohibited), `prohibited construct absent: ${prohibited}`)
check(text.includes('WAITING_FOR_CONNECTION'), 'offline transcription state is explicit')
check(text.includes('TRANSCRIPTION_PROVIDER_UNAVAILABLE'), 'missing provider state is explicit')
if (failures.length) process.exit(1)
console.log('Vault Voice release verifier passed')
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
