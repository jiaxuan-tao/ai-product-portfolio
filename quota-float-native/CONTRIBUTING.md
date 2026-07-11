# Contributing

Thanks for helping improve Quota Float Native.

## Before Opening Issues

Do not paste tokens, account IDs, raw backend responses, local auth paths, or screenshots containing personal data.

## Development

```bash
npm install
npm run test
cargo test --manifest-path src-tauri/Cargo.toml
npm run build
```

Use `npm run tauri dev` for desktop testing. Browser preview uses mock data and cannot verify real quota reads.

## Pull Requests

- Keep changes small and focused.
- Preserve the privacy boundary documented in `PRIVACY.md`.
- Do not add telemetry or raw response logging.
- Add or update tests when changing quota parsing, snapshot merging, or formatting.
