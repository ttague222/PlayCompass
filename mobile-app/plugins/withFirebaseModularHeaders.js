/**
 * Custom Expo config plugin to fix Firebase non-modular header errors on iOS.
 *
 * When using useFrameworks: "static" with @react-native-firebase, Xcode fails
 * with "-Wnon-modular-include-in-framework-module" errors because RNFBApp
 * imports React headers that aren't modular-safe in static framework mode.
 *
 * This plugin patches the Podfile post_install hook to set
 * CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES,
 * which relaxes the strict modular header check.
 *
 * See: https://github.com/expo/expo/issues/39607
 * See: https://github.com/invertase/react-native-firebase/issues/8657
 */
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

function withFirebaseModularHeaders(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );
      let podfile = fs.readFileSync(podfilePath, "utf8");

      // Add CLANG setting to allow non-modular includes in framework modules
      const clangFix = `
    # Fix: Allow non-modular headers in Firebase static frameworks (Expo SDK 54)
    installer.pods_project.build_configurations.each do |config|
      config.build_settings["CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES"] = "YES"
    end`;

      // Insert after react_native_post_install to ensure it runs during pod install
      if (!podfile.includes("CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES")) {
        podfile = podfile.replace(
          /react_native_post_install\(installer.*\)/,
          `$&\n${clangFix}`
        );
        fs.writeFileSync(podfilePath, podfile, "utf8");
      }

      return config;
    },
  ]);
}

module.exports = withFirebaseModularHeaders;
