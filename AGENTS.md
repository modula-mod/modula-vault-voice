# Vault Voice — agent instructions

- Product ID (published, immutable): `digital.modula.vault-notes.voice`
- Kind: addon
- Family: `digital.modula.vault`
- Native: microphone, with a human-readable reason
- Transcription: capability `voice.transcribe` via Greenfield. Honest unavailable when NOT_CONFIGURED. No fake transcripts.
- Secrets: requirement ID `engine.voice.transcribe` only
- No Greenfield core special cases
- Vault Voice contributions, settings, and permission UI belong under `frontend/`; never add Voice-specific rendering branches to `modula-latest`.
- Native capture is requested through the generic versioned audio capability; do not ship downloadable native implementation code.
- Do not mutate `vault-voice-v0.2.0` or earlier immutable tags.

Canonical: `modula.product.json`. MPS 1.0-RC.
