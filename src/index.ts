export const VAULT_VOICE_PRODUCT_ID = 'digital.modula.vault-notes.voice' as const
export const VAULT_VOICE_VERSION = '0.1.0' as const
export const VAULT_VOICE_TARGET_PRODUCT_ID = 'digital.modula.vault-notes' as const

export type RecordingState = 'IDLE' | 'RECORDING' | 'SAVED' | 'FAILED'
export type TranscriptionState = 'QUEUED' | 'WAITING_FOR_CONNECTION' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'

export type SavedRecording = {
  id: string
  noteId: string
  mimeType: string
  durationMs: number
  bytes: Blob
  createdAt: string
}

export interface MediaCaptureAdapter {
  readonly platform: 'web' | 'ios' | 'android'
  isSupported(): boolean
  start(): Promise<void>
  stop(noteId: string): Promise<SavedRecording>
}

export interface TranscriptionProvider {
  readonly providerId: string
  transcribe(recording: SavedRecording): Promise<{text: string; language?: string}>
}

export class VaultVoiceError extends Error {
  constructor(readonly code: 'CAPTURE_UNSUPPORTED' | 'CAPTURE_FAILED' | 'TRANSCRIPTION_PROVIDER_UNAVAILABLE' | 'WAITING_FOR_CONNECTION' | 'INVALID_STATE', message: string) {
    super(message)
    this.name = 'VaultVoiceError'
  }
}

export class BrowserMediaRecorderAdapter implements MediaCaptureAdapter {
  readonly platform = 'web' as const
  private recorder?: MediaRecorder
  private stream?: MediaStream
  private chunks: Blob[] = []
  private startedAt = 0

  isSupported() {
    return typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== 'undefined'
  }

  async start() {
    if (!this.isSupported()) throw new VaultVoiceError('CAPTURE_UNSUPPORTED', 'Audio capture is unavailable on this platform')
    this.stream = await navigator.mediaDevices.getUserMedia({audio: true})
    this.chunks = []
    this.recorder = new MediaRecorder(this.stream)
    this.recorder.addEventListener('dataavailable', event => {
      if (event.data.size) this.chunks.push(event.data)
    })
    this.startedAt = Date.now()
    this.recorder.start()
  }

  async stop(noteId: string) {
    const recorder = this.recorder
    if (!recorder || recorder.state === 'inactive') throw new VaultVoiceError('INVALID_STATE', 'No recording is active')
    await new Promise<void>((resolve, reject) => {
      recorder.addEventListener('stop', () => resolve(), {once: true})
      recorder.addEventListener('error', () => reject(new VaultVoiceError('CAPTURE_FAILED', 'Audio recording failed')), {once: true})
      recorder.stop()
    })
    this.stream?.getTracks().forEach(track => track.stop())
    const mimeType = recorder.mimeType || 'audio/webm'
    const saved = {id: crypto.randomUUID(), noteId, mimeType, durationMs: Date.now() - this.startedAt, bytes: new Blob(this.chunks, {type: mimeType}), createdAt: new Date().toISOString()}
    this.recorder = undefined
    this.stream = undefined
    return saved
  }
}

export class VaultVoiceService {
  constructor(private readonly capture: MediaCaptureAdapter, private readonly transcription?: TranscriptionProvider, private readonly online: () => boolean = () => true) {}

  startRecording() {
    return this.capture.start()
  }

  stopAndAttach(noteId: string) {
    if (!noteId.trim()) throw new VaultVoiceError('INVALID_STATE', 'A note ID is required')
    return this.capture.stop(noteId)
  }

  async transcribe(recording: SavedRecording) {
    if (!this.online()) throw new VaultVoiceError('WAITING_FOR_CONNECTION', 'Recording saved. Transcription waiting for connection.')
    if (!this.transcription) throw new VaultVoiceError('TRANSCRIPTION_PROVIDER_UNAVAILABLE', 'Transcription provider unavailable')
    return this.transcription.transcribe(recording)
  }
}
