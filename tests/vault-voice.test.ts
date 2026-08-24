import {describe, expect, it} from 'vitest'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {validateModulaModuleManifest} from '@modula/module-validator'
import {VaultVoiceService, type MediaCaptureAdapter, type SavedRecording} from '../src/index.js'

const root = new URL('..', import.meta.url).pathname
const recording: SavedRecording = {id: 'recording-1', noteId: 'note-1', mimeType: 'audio/webm', durationMs: 1000, bytes: new Blob(['audio']), createdAt: '2026-08-24T00:00:00.000Z'}
const capture: MediaCaptureAdapter = {platform: 'web', isSupported: () => true, start: async () => undefined, stop: async () => recording}

describe('Vault Voice service', () => {
  it('records and attaches through a platform adapter without requiring a network', async () => {
    const service = new VaultVoiceService(capture, undefined, () => false)
    await service.startRecording()
    await expect(service.stopAndAttach('note-1')).resolves.toEqual(recording)
  })

  it('retains a recording and reports offline transcription honestly', async () => {
    await expect(new VaultVoiceService(capture, undefined, () => false).transcribe(recording)).rejects.toMatchObject({code: 'WAITING_FOR_CONNECTION'})
  })

  it('reports a missing transcription provider honestly', async () => {
    await expect(new VaultVoiceService(capture).transcribe(recording)).rejects.toMatchObject({code: 'TRANSCRIPTION_PROVIDER_UNAVAILABLE'})
  })

  it('uses a real configured provider contract', async () => {
    const provider = {providerId: 'test-transcriber', transcribe: async () => ({text: 'Project Atlas transcript'})}
    await expect(new VaultVoiceService(capture, provider).transcribe(recording)).resolves.toEqual({text: 'Project Atlas transcript'})
  })
})

describe('Vault Voice Standard 2.1 manifest', () => {
  it('validates and contributes only declared Vault Notes contracts', () => {
    const manifest = JSON.parse(readFileSync(join(root, 'modula.module.json'), 'utf8'))
    const result = validateModulaModuleManifest(manifest)
    expect(result.valid, result.issues.map(issue => `${issue.code} ${issue.path}`).join('\n')).toBe(true)
    expect(manifest.extensionProduct.kind).toBe('addon')
    expect(manifest.extensionProduct.targets[0].productId).toBe('digital.modula.vault-notes')
    expect(manifest.permissions.map((item: {id: string}) => item.id)).not.toContain('notes.delete')
  })
})
