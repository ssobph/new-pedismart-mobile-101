const { withAndroidManifest, withAppBuildGradle } = require('@expo/config-plugins');

const withReactNativeMaps = (config, { apiKey }) => {
  // Add Google Maps API key to Android manifest
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    
    if (!androidManifest.manifest.application) {
      androidManifest.manifest.application = [{}];
    }
    
    const application = androidManifest.manifest.application[0];
    
    if (!application['meta-data']) {
      application['meta-data'] = [];
    }
    
    // Add Google Maps API key
    application['meta-data'].push({
      $: {
        'android:name': 'com.google.android.geo.API_KEY',
        'android:value': apiKey,
      },
    });
    
    return config;
  });

  // Add Google Play Services to build.gradle
  config = withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes('implementation "com.google.android.gms:play-services-maps"')) {
      config.modResults.contents = config.modResults.contents.replace(
        /dependencies\s*{/,
        `dependencies {
    implementation "com.google.android.gms:play-services-maps:18.1.0"`
      );
    }
    return config;
  });

  return config;
};

module.exports = withReactNativeMaps;
