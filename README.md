# Vault Voice

Canonical MPS source: `modula.product.json` (1.0-RC). Published ID stays `digital.modula.vault-notes.voice`.

Vault Voice is the independently released `digital.modula.vault-notes.voice` add-on for Vault Notes. It contributes recording, playback, attachment, and transcription actions through Module Standard 2.1 extension points.

The browser adapter uses the platform `MediaRecorder` API and can capture locally without a network. Native clients supply an approved host media-capture adapter; this repository does not scatter SwiftUI or Jetpack Compose imports through feature code. Transcription is provider-neutral. Without a configured provider, recordings remain saved and the job reports `TRANSCRIPTION_PROVIDER_UNAVAILABLE` or `WAITING_FOR_CONNECTION` honestly.

Run `pnpm verify` before release. Generated packages and provenance are created with `pnpm release:package`.
