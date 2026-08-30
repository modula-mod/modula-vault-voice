#!/usr/bin/env node
import {writeFileSync} from 'node:fs'
import {vaultNotesStandard21ManifestFixture} from '@modula/module-fixtures'
import {createDefaultModuleSectionVersions, manifestChecksum} from '@modula/module-standard'

const id = 'digital.modula.vault-notes.voice'
const targetId = 'digital.modula.vault-notes'
const version = '0.3.0'
const sourceCommit = process.argv[2] ?? '0000000000000000000000000000000000000000'
const standard = replaceProduct(vaultNotesStandard21ManifestFixture, 'digital.modula.vault-notes', id)

Object.assign(standard, {
  id,
  slug: 'vault-voice',
  name: 'Vault Voice',
  description: 'Offline-capable audio recording and governed transcription add-on for Vault Notes.',
  moduleVersion: version,
  publisher: {id: 'modula', name: 'Modula', website: 'https://modula.digital', supportUrl: 'https://modula.digital/support'},
  compatibility: {host: '^1.0.0', runtime: '^1.0.0', standard: '^2.1.0', platforms: ['ios', 'android', 'web', 'server']},
  permissions: permissions().map(({permission, ...item}) => ({id: permission, ...item, required: true, policyMode: item.risk === 'high' ? 'require-confirmation' : 'observe'})),
  capabilities: [
    {id: 'files', required: true, reason: 'Capture, attach, and play user-controlled audio through host platform adapters.'},
    {id: 'offline', required: true, reason: 'Save recordings locally before optional transcription.'},
    {id: 'functions', required: true, reason: 'Expose declared Vault Voice actions.'},
    {id: 'services', required: true, reason: 'Invoke a configured transcription provider through Greenfield.'},
    {id: 'ui-contributions', required: true, reason: 'Publish declarative recording and attachment actions.'},
    {id: 'jobs', required: true, reason: 'Run bounded transcription jobs.'},
  ],
  records: [], views: [], actions: [], functions: functions(), settings: [], events: [], automations: [], search: [], ai: [],
  migrations: {dataSchemaVersion: '1.0.0', steps: []},
  release: {repository: 'modula-mod/modula-vault-voice', commitSha: sourceCommit, checksum: '0'.repeat(64), licenseEvidence: ['LICENSE', 'README.md', 'SECURITY.md'], signing: {signed: false}, channel: 'stable', reviewStatus: 'approved', securityAdvisories: []},
  backend: backend(),
  extensionProduct: extensionProduct(),
})
standard.identity = {version: '2.1.0', metadata: {moduleId: id, publisherId: 'modula'}}
standard.dependencyGraph = {version: '2.1.0', requires: [{moduleId: targetId, versionRange: '>=1.2.0 <2.0.0', reason: 'Vault Voice extends Vault Notes through public contracts.', capabilityIds: ['notes.attachments.create', 'notes.update']}], optional: [], recommended: [], conflicts: [], replaces: [], provides: [{id: `${id}.capture`, title: 'Vault Voice media capture', version, kind: 'service'}]}
standard.serviceRegistry = {version: '2.1.0', items: [{id: `${id}.service`, title: 'Vault Voice transcription service', kind: 'custom', version, contract: `${id}.service.v1`, permissions: ['notes.attachments.read', 'transcription.request'], capabilities: ['vault.voice.transcribe'], inputSchemaRef: 'schemas/transcription-request.schema.json', outputSchemaRef: 'schemas/transcription-result.schema.json', timeoutMs: 30000, rateLimitPerMinute: 20, invocationDepthLimit: 2}]}
standard.jobRegistry = {version: '2.1.0', items: [{id: `${id}.job.transcription`, title: 'Vault Voice transcription', kind: 'queue', functionId: `${id}.function.transcribe`, retryPolicy: {maximumAttempts: 3, backoff: 'exponential'}, pausedByDefault: false}]}
standard.storageModel = {version: '2.1.0', items: [{id: `${id}.storage.recordings`, title: 'Vault Voice recordings and transcripts', version: '1.0.0', kind: 'blob-storage', scope: 'account', quotaBytes: 100_000_000, retention: 'extension-owned', encrypted: true, exportSupported: true, deletionSupported: true}]}
standard.widgetRegistry = {version: '2.1.0', items: []}
standard.navigationRegistry = {version: '2.1.0', items: []}
standard.uiContributions = {version: '2.1.0', items: []}
standard.eventBus = {version: '2.1.0', items: []}
standard.capabilityDiscovery = {version: '2.1.0', supportsBackend: true, supportsWidgets: false}
standard.permissionModel = {version: '2.1.0', categories: {data: standard.permissions.filter(item => item.id.startsWith('notes.')), media: standard.permissions.filter(item => item.id.startsWith('media.'))}}
standard.versioning = {version: '2.1.0', moduleVersion: version, standardVersion: '2.1.0', manifestVersion: '2.1.0'}
standard.compatibilityMatrix = {version: '2.1.0', moduleStandardVersion: '^2.1.0', runtimeVersion: '^1.0.0', platforms: ['ios', 'android', 'web', 'server']}
standard.marketplace = {...standard.marketplace, version: '2.1.0', repository: 'modula-mod/modula-vault-voice', backendMode: 'module-managed', aiSupport: false, downloads: 0}
standard.engineReadiness = {version: '2.1.0', engines: ['declarative-ui', 'functions', 'media']}

const greenfield = {
  manifestVersion: 2, moduleId: id, name: 'Vault Voice', description: 'Offline-capable audio and transcription add-on for Vault Notes.', version, standardVersion: '2.1.0', sectionVersions: createDefaultModuleSectionVersions('2.1.0'),
  publisher: {publisherId: 'modula', displayName: 'Modula', website: 'https://modula.digital'},
  source: {provider: 'github', repository: 'modula-mod/modula-vault-voice', commit: sourceCommit, manifestPath: 'module.manifest.json', releaseTag: `vault-voice-v${version}`, releaseAssetName: `modula-vault-voice-${version}.tgz`},
  license: {status: 'firstParty', evidenceIds: ['LICENSE', 'README.md', 'SECURITY.md']}, trust: {requestedLevel: 'firstParty'},
  compatibility: {minimumGreenfieldVersion: '0.1.0', minimumModulaHostVersion: '0.1.0', protocolVersions: ['greenfield.v1'], platforms: ['ios', 'android', 'web', 'server'], nativeCapabilities: ['microphone', 'audio-playback']},
  permissions: permissions(), dependencies: [{moduleId: targetId, versionRange: '>=1.2.0 <2.0.0', optional: false, reason: 'Vault Voice extends Vault Notes.'}],
  contributions: {
    functions: functions().map(item => ({id: `${item.id}.registration`, title: item.title, functionId: item.id, mode: item.id.endsWith('.record') || item.id.endsWith('.play') ? 'hostNative' : 'remoteHttp', inputSchemaRef: 'schemas/vault-voice-request.schema.json', outputSchemaRef: 'schemas/vault-voice-result.schema.json', executionRequired: true})),
    tools: [{id: `${id}.tool.record`, title: 'Record Voice Note', toolId: `${id}.tool.record`, functionId: `${id}.function.record`, surfaces: ['composer-tools', 'vault-notes']}],
    jobs: [{id: `${id}.job.transcription`, title: 'Vault Voice transcription', jobType: 'vault-voice.transcription.v1', mode: 'backgroundJob'}],
  },
  backend: backend(), integrity: {manifestSha256: '', releaseSha256: '0'.repeat(64)}, extensionProduct: extensionProduct(),
}
greenfield.integrity.manifestSha256 = manifestChecksum({...greenfield, integrity: {...greenfield.integrity, manifestSha256: ''}})
writeJson('modula.module.json', standard)
writeJson('module.manifest.json', greenfield)

function permissions() {
  return [
    {permission: 'notes.attachments.read', reason: 'Read only the recording selected for playback or transcription.', risk: 'low'},
    {permission: 'notes.attachments.create', reason: 'Attach a user-created recording to the selected note.', risk: 'medium'},
    {permission: 'notes.update', reason: 'Insert a user-approved transcript into the selected note.', risk: 'medium'},
    {permission: 'notes.editor.contribute', reason: 'Register declared recording and transcript commands.', risk: 'low'},
    {permission: 'notes.actions.contribute', reason: 'Register declared note actions.', risk: 'low'},
    {permission: 'media.audio.capture', reason: 'Capture audio only after an explicit user action.', risk: 'high'},
    {permission: 'media.audio.playback', reason: 'Play a selected Vault Voice recording.', risk: 'low'},
    {permission: 'transcription.request', reason: 'Submit an explicitly selected recording to an approved provider.', risk: 'high'},
  ]
}
function functions() {
  return [
    fn('record', 'Record audio', ['media.audio.capture', 'notes.attachments.create'], true),
    fn('play', 'Play recording', ['notes.attachments.read', 'media.audio.playback']),
    fn('transcribe', 'Transcribe recording', ['notes.attachments.read', 'transcription.request']),
    fn('insert-transcript', 'Insert transcript into note', ['notes.update'], true),
  ]
}
function fn(key, title, requestedPermissions, writes = false) {
  return {id: `${id}.function.${key}`, title, inputSchema: {type: 'object', required: ['noteId'], properties: {noteId: {type: 'string'}, recordingId: {type: 'string'}}}, outputSchema: {type: 'object', properties: {recordingId: {type: 'string'}, text: {type: 'string'}, state: {type: 'string'}}}, permissions: requestedPermissions, aiCallable: false, automationCallable: false, idempotent: key !== 'record', sideEffects: writes ? ['record-write-after-confirmation'] : [], timeoutMs: key === 'transcribe' ? 30000 : 15000, rateLimit: {windowSeconds: 60, maxCalls: 20}, audit: {event: 'extension.action.invoked', includeInput: false, includeOutput: false}, confirmationPolicy: {required: writes, risk: writes ? 'medium' : 'low'}}
}
function extensionProduct() {
  const target = point => `${targetId}.${point}`
  return {version, kind: 'addon', targets: [{productId: targetId, versionRange: '>=1.2.0 <2.0.0', requiredCapabilities: ['notes.attachments.read', 'notes.attachments.create', 'notes.update', 'notes.editor.contribute'], requiredExtensionPoints: [target('editor.attachment'), target('note.actions'), target('composer.tool')]}], extensionPoints: [], contributions: [
    contribution('record', 'Record audio', 'editor.attachment', target('editor.attachment'), 'record', 'media.audio.capture', false),
    contribution('play', 'Play recording', 'menu.item', target('note.actions'), 'play', 'media.audio.playback', false),
    contribution('transcribe', 'Transcribe', 'background.action', target('note.after-save'), 'transcribe', 'transcription.request', true),
    contribution('insert-transcript', 'Insert transcript', 'editor.command', target('editor.command'), 'insert-transcript', 'notes.update', false),
    contribution('composer-record', 'Record Voice Note', 'composer.tool', target('composer.tool'), 'record', 'media.audio.capture', false),
  ], retention: {defaultMode: 'KEEP_DATA', supportsUserChoice: true, metadataNamespace: id}, graphPolicy: {maxDepth: 8, maxNodes: 128}}
}
function contribution(key, title, kind, extensionPoint, functionKey, requiredCapability, requiresOnline) {
  return {id: `${id}.contribution.${key}`, title, kind, extensionPoint, functionId: `${id}.function.${functionKey}`, requiredCapability, availability: {platforms: ['ios', 'android', 'web'], requiresOnline, requiredCapabilities: []}, priority: 100}
}
function backend() {
  const actions = ['transcribe'].map(key => ({actionId: `${id}.function.${key}`, title: key, method: 'POST', path: `/v1/actions/${key}`, inputSchema: 'schemas/transcription-request.schema.json', outputSchema: 'schemas/transcription-result.schema.json', permissions: ['notes.attachments.read', 'transcription.request'], idempotent: true, timeoutMs: 30000, sideEffects: 'internal-write', confirmation: 'user'}))
  return {mode: 'module-managed', protocolVersion: '1.0.0', endpoints: {baseUrlStrategy: 'registry', apiVersion: '1.0.0', discoveryPath: '/.well-known/modula-module.json', healthPath: '/v1/health', capabilitiesPath: '/v1/capabilities', actionsPath: '/v1/actions', allowedHosts: ['vault-voice.modula.digital']}, authentication: {strategy: 'greenfield-signed-jwt', tokenExchangeRequired: true, audience: 'modula-vault-voice', tokenTtlSeconds: 120, sessionExchangePath: '/v1/session/exchange'}, trust: {publisherId: 'modula', allowedOrigins: ['https://vault-voice.modula.digital']}, data: {primaryStore: 'module-backend', categories: [{id: 'vault-voice-recordings', description: 'Extension-owned recording metadata, transcription jobs, and transcripts.', location: 'module-backend', classification: 'restricted', exportable: true, deletable: true}], exportSupported: true, deletionSupported: true, backupResponsibility: 'publisher'}, deployment: {ownership: 'modula-hosted', multiTenant: true, selfHostingSupported: false}, actions}
}
function replaceProduct(value, from, to) { return JSON.parse(JSON.stringify(value).split(from).join(to)) }
function writeJson(path, value) { writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`) }
