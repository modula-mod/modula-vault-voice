import {Button, ErrorState, Field, Form, Metadata, Text, action, defineFrontend, screen, useCapability, useSettings} from "@modula/product-ui";

const record = action({id: "digital.modula.vault-notes.voice.function.record", family: "capability.invoke", label: "Record audio", commandId: "audio.capture", capability: "audio.capture@1"});
const play = action({id: "digital.modula.vault-notes.voice.function.play", family: "capability.invoke", label: "Play recording", commandId: "audio.playback", capability: "audio.playback@1"});
const transcribe = action({id: "digital.modula.vault-notes.voice.function.transcribe", family: "function.invoke", label: "Transcribe", functionId: "digital.modula.vault-notes.voice.function.transcribe"});
const insertTranscript = action({id: "digital.modula.vault-notes.voice.function.insert-transcript", family: "function.invoke", label: "Insert transcript", functionId: "digital.modula.vault-notes.voice.function.insert-transcript"});
const saveSettings = action({id: "saveVoiceSettings", family: "settings.update", label: "Save Voice preferences", settingsKey: "vaultVoice.preferences"});

function VoiceSettings() {
  const preferences = useSettings({id: "preferences", key: "vaultVoice.preferences"});
  const transcriptionProvider = useCapability({id: "transcriptionProvider", capability: "voice.transcribe"});
  const audioCapture = useCapability({id: "audioCapture", capability: "audio.capture@1"});
  return <Form accessibility={{label: "Vault Voice settings", role: "form"}}><Text label="Microphone access is requested only after you choose Record. The host controls the native permission prompt and audio capture." /><Metadata label="Microphone capability" binding={audioCapture} /><Metadata label="Transcription provider status" binding={transcriptionProvider} /><Field binding={preferences} field={{id: "autoOfferTranscription", type: "boolean", label: "Offer transcription after recording"}} /><Field binding={preferences} field={{id: "keepOriginalAudio", type: "boolean", label: "Keep original audio after transcription"}} /><Button label="Save Voice preferences" action={saveSettings} /></Form>;
}

export default defineFrontend({
  mode: "host-contribution",
  hostRuntime: {versionRange: ">=1.0.0 <2.0.0"},
  screens: [screen("settings", "settings", "Vault Voice settings", VoiceSettings, {states: {capabilityUnavailable: <ErrorState label="No transcription provider is configured. Recordings remain available, and Vault Voice will not fabricate a transcript." accessibility={{role: "status"}} />, permissionDenied: <ErrorState label="Microphone permission is required only to record new audio. Existing recordings remain available." accessibility={{role: "status"}} />, error: <ErrorState label="Vault Voice settings are unavailable" accessibility={{role: "status"}} />}})],
  actions: [record, play, transcribe, insertTranscript, saveSettings],
  contributions: [
    {id: "digital.modula.vault-notes.voice.contribution.record", target: "digital.modula.vault-notes/editor.attachment@1", action: record, component: <Button label="Record audio" action={record} />, requiredPermissions: ["microphone.capture", "notes.attachments.create"], requiredCapabilities: ["audio.capture@1"]},
    {id: "digital.modula.vault-notes.voice.contribution.play", target: "digital.modula.vault-notes/note.actions@1", action: play, component: <Button label="Play recording" action={play} />, requiredPermissions: ["notes.attachments.read"], requiredCapabilities: ["audio.playback@1"]},
    {id: "digital.modula.vault-notes.voice.contribution.transcribe", target: "digital.modula.vault-notes/note.after-save@1", action: transcribe, component: <Button label="Transcribe" action={transcribe} />, requiredPermissions: ["notes.attachments.read"], requiredCapabilities: ["voice.transcribe"]},
    {id: "digital.modula.vault-notes.voice.contribution.insert-transcript", target: "digital.modula.vault-notes/editor.command@1", action: insertTranscript, component: <Button label="Insert transcript" action={insertTranscript} />, requiredPermissions: ["notes.update"]},
    {id: "digital.modula.vault-notes.voice.contribution.composer-record", target: "digital.modula.vault-notes/composer.tool@1", action: record, component: <Button label="Record Voice Note" action={record} />, requiredPermissions: ["microphone.capture", "notes.attachments.create"], requiredCapabilities: ["audio.capture@1"]},
  ],
  settings: {viewId: "settings"},
  capabilities: {optional: ["audio.capture@1", "audio.playback@1"]},
  platformRequirements: {platforms: ["ios", "android", "web"]},
  accessibility: {declaration: "host-baseline-with-product-semantics", screenReader: true, scalableText: true, keyboardNavigation: true, reduceMotion: true},
});
