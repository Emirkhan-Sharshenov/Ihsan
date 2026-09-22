const { withAppBuildGradle } = require('expo/config-plugins');

// Signs release builds with the upload key when android/keystore.properties exists
// (the file and the .jks live outside git). Without it, release builds fall back to the
// debug key, which is fine for testing but rejected by Google Play.
const SIGNING_CONFIG = `
        release {
            def keystorePropertiesFile = rootProject.file('keystore.properties')
            if (keystorePropertiesFile.exists()) {
                def keystoreProperties = new Properties()
                keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
`;

module.exports = function withUploadSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;
    if (!gradle.includes("rootProject.file('keystore.properties')")) {
      gradle = gradle.replace(/(signingConfigs \{\n)/, `$1${SIGNING_CONFIG}`);
    }
    // Only the release build type inside buildTypes { } is switched over.
    const marker = 'buildTypes {';
    const at = gradle.indexOf(marker);
    if (at !== -1) {
      const head = gradle.slice(0, at);
      const tail = gradle
        .slice(at)
        .replace(
          /(release \{[\s\S]*?)signingConfig signingConfigs\.debug/,
          `$1signingConfig rootProject.file('keystore.properties').exists() ? signingConfigs.release : signingConfigs.debug`,
        );
      gradle = head + tail;
    }
    cfg.modResults.contents = gradle;
    return cfg;
  });
};
