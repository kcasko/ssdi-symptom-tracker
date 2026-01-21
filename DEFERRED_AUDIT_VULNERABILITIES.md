# Deferred npm Audit Vulnerabilities (Last Updated: 2026-01-21)

This document tracks known npm audit vulnerabilities that are present due to Expo and its transitive dependencies. These issues are not currently fixable without breaking changes or upgrading Expo, which would be a breaking change.

## Summary Table

| Vulnerability | Package/Dependency         | Risk Level | Reachable at Runtime? | Recommendation         |
|---------------|---------------------------|------------|----------------------|-----------------------|
| Template Injection | send <0.19.0                | Moderate   | No                   | Defer, dev/build only |
| File Overwrite & Symlink | tar <=7.5.3           | High       | No                   | Defer, dev/build only |
| Prototype Pollution | xml2js <0.5.0               | Moderate   | No                   | Defer, dev/build only |
| XML Parsing Issues  | xmldom                      | Critical   | No                   | Defer, dev/build only |
| Others             | (transitive, dev/build)     | Low-Mod    | No                   | Defer, dev/build only |

## Details

### 1. send <0.19.0

- **Risk:** Template injection (potential XSS)
- **Used by:** @expo/cli (dev tool, not bundled in production)
- **Actual Risk:** Not reachable from runtime user input; only used during development/build.
- **Action:** Defer. Safe to ignore until Expo updates its dependencies.

### 2. xml2js <0.5.0

- **Risk:** Prototype pollution
- **Used by:** @expo/config-plugins (dev/build tool, not bundled in production)
- **Actual Risk:** Not reachable from runtime user input; only used during build/config.
- **Action:** Defer. Safe to ignore until Expo/@react-native-voice/voice update dependencies.

### 3. xmldom

- **Risk:** XML parsing issues (multiple root nodes, misinterpretation)
- **Used by:** @expo/plist (dev/build tool, not bundled in production)
- **Actual Risk:** Not reachable from runtime user input; only used during build/config.
- **Action:** Defer. Safe to ignore until Expo/@react-native-voice/voice update dependencies.

### 4. Other vulnerabilities

- **Risk:** All are transitive, dev/build-time only, not reachable from runtime user input.
- **Action:** Defer. No action needed.

## Policy

- **Do NOT run `npm audit fix --force`.**
- **Do NOT upgrade Expo or @react-native-voice/voice** unless official compatibility is confirmed.
- **No major version bumps or speculative fixes.**

## Next Steps

- Monitor Expo and plugin releases for dependency updates.
- Re-run `npm audit` after each Expo upgrade cycle.
- Update this document as vulnerabilities are resolved upstream.

---

*This document is maintained to provide security review context for auditors and future maintainers. All deferred vulnerabilities are currently not exploitable in the runtime app.*
