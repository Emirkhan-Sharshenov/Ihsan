const { withAndroidManifest } = require('expo/config-plugins');

// expo-audio ships a media-playback foreground service (lock screen controls) and a microphone
// recording service. The app uses neither — playback only happens while a surah screen is open —
// but their presence makes Google Play demand a foreground-service declaration with a demo video.
// The manifest merger removes them when the app manifest lists them with tools:node="remove".
const SERVICES = ['expo.modules.audio.service.AudioControlsService', 'expo.modules.audio.service.AudioRecordingService'];
const PERMISSIONS = ['android.permission.FOREGROUND_SERVICE', 'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK', 'android.permission.FOREGROUND_SERVICE_MICROPHONE'];

module.exports = function withoutAudioServices(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.$['xmlns:tools'] = manifest.$['xmlns:tools'] ?? 'http://schemas.android.com/tools';

    const application = manifest.application?.[0];
    if (application) {
      application.service = (application.service ?? []).filter((s) => !SERVICES.includes(s.$['android:name']));
      for (const name of SERVICES) {
        application.service.push({ $: { 'android:name': name, 'tools:node': 'remove' } });
      }
    }

    manifest['uses-permission'] = (manifest['uses-permission'] ?? []).filter((p) => !PERMISSIONS.includes(p.$['android:name']));
    for (const name of PERMISSIONS) {
      manifest['uses-permission'].push({ $: { 'android:name': name, 'tools:node': 'remove' } });
    }
    return cfg;
  });
};
