# Version Lock - DO NOT UPGRADE

## Critical Versions - LOCKED

These versions are **LOCKED** and must **NOT** be changed:

- **Expo SDK**: `52.0.49` (DO NOT UPGRADE)
- **React**: `18.3.1` (DO NOT UPGRADE)
- **React Native**: `0.76.9` (DO NOT UPGRADE)

## Why These Versions Are Locked

After extensive troubleshooting, these specific versions were found to be the only stable configuration that:

1. ✅ Successfully builds on EAS Build cloud service
2. ✅ Runs on Android devices without crashes
3. ✅ Has no AndroidX/support library conflicts
4. ✅ Compatible with all project dependencies

## Previous Failed Configurations

- **Expo SDK 54** (React Native 0.81.x): Missing `libreact_featureflagsjni.so` library - React Native packaging bug
- **Expo SDK 52** with old dependencies: AndroidX duplicate class errors from `react-native-chart-kit`

## Build Configuration

**Working EAS Build Profile**: `preview`

```bash
eas build --platform android --profile preview
```

## Warning to Future Developers

⚠️ **DO NOT run**:
- `expo upgrade`
- `npm update`
- `npx expo install --fix`

These commands will break the working configuration.

## Package.json Lock

All dependency versions in `package.json` use **exact versions** (no `^` or `~` prefixes) to prevent accidental upgrades during `npm install`.

---

**Last Working Build**: February 6, 2026
**Build ID**: 3b6de58f-9090-48fd-afb5-d28bb6d8be34
