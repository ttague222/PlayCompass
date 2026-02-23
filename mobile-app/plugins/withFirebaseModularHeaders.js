/**
 * Custom Expo config plugin to fix Firebase non-modular header errors on iOS.
 *
 * When using useFrameworks: "static" with @react-native-firebase, Xcode fails
 * with "-Wnon-modular-include-in-framework-module" errors because RNFBApp
 * imports React headers that aren't modular-safe in static framework mode.
 *
 * This plugin patches the Podfile to:
 * 1. Set $RNFirebaseAsStaticFramework = true
 * 2. Set CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES
 *    for ALL pod targets (not just project-level)
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

      // 1. Add $RNFirebaseAsStaticFramework = true before use_react_native!
      if (!podfile.includes("$RNFirebaseAsStaticFramework")) {
        podfile = podfile.replace(
          /use_react_native!/,
          `$RNFirebaseAsStaticFramework = true\n  use_react_native!`
        );
      }

      // 2. Add CLANG fix inside post_install block (target-level for all targets)
      //    Previous attempt used regex on react_native_post_install() which spans
      //    multiple lines and didn't match. post_install do |installer| is always
      //    on a single line, so this regex reliably matches.
      if (
        !podfile.includes(
          "CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES"
        )
      ) {
        const clangFix = [
          "",
          "    # Fix: Allow non-modular headers in Firebase static frameworks (Expo SDK 54)",
          "    installer.pods_project.targets.each do |target|",
          "      target.build_configurations.each do |bc|",
          '        bc.build_settings["CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES"] = "YES"',
          "      end",
          "    end",
        ].join("\n");

        podfile = podfile.replace(
          /post_install do \|installer\|/,
          `post_install do |installer|${clangFix}`
        );
      }

      fs.writeFileSync(podfilePath, podfile, "utf8");
      return config;
    },
  ]);
}

module.exports = withFirebaseModularHeaders;
