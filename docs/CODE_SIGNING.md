# Code signing (not yet set up)

The desktop build currently ships **unsigned**: `electron-builder.yml` has
`identity: null` (macOS) and no Windows signing config. Combined with
auto-update publishing to GitHub Releases, this means:

- **macOS**: Gatekeeper will warn/block the `.dmg` on first launch ("app is
  damaged" / "unidentified developer") unless the user right-click → Open.
- **Windows**: SmartScreen will warn on the `.exe` installer.
- **Auto-update integrity rests on HTTPS alone**, not a code signature —
  `electron-updater` downloads and installs new versions without verifying
  a signing certificate, since there isn't one.

None of this blocks local development or manual installs; it's a
before-wider-distribution concern.

## To sign macOS builds

1. Enroll in the Apple Developer Program and create a **Developer ID
   Application** certificate.
2. Export it as a `.p12` file, base64-encode it, and set as CI secrets:
   - `CSC_LINK` — base64 `.p12` contents (or a URL to the file)
   - `CSC_KEY_PASSWORD` — the `.p12` export password
3. For notarization (required for Gatekeeper to trust it), also set:
   - `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`
4. In `electron-builder.yml`, set `mac.identity` to the certificate name (or
   remove the line — electron-builder auto-detects it from `CSC_LINK`), and
   set `mac.hardenedRuntime: true` + `mac.gatekeeperAssess: true`.
5. electron-builder notarizes automatically when the `APPLE_*` env vars are
   present (via `@electron/notarize`, bundled since electron-builder v24).

## To sign Windows builds

1. Obtain a code-signing certificate (EV or standard) from a CA.
2. Set CI secrets `WIN_CSC_LINK` (base64 `.pfx` or URL) and
   `WIN_CSC_KEY_PASSWORD`.
3. No `electron-builder.yml` changes needed — electron-builder signs
   automatically once those env vars are present.

## Wiring into CI

Add the secrets above to the repo's GitHub Actions secrets, then pass them
as `env:` on the "Package" step in `.github/workflows/build-mac.yml` /
`build-win.yml` (electron-builder reads them directly from the environment —
no other workflow changes required).
