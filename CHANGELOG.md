# Changelog

## [1.0.0] - 2026-08-17

- Initial release.
- Native session-header chip (top-right, `conversation.session.header.utilities`) themed with `--dsw-alias-*` variables.
- Peak determination per DeepSeek's official peak/valley pricing (effective 2026-08-17): daily 09:00–12:00 / 14:00–18:00 Beijing time; off-peak = half price.
- Live Beijing clock (Asia/Shanghai), countdown to next transition, ×2/off-peak pricing hint.
- Click to expand a detail popover: peak windows, `HH:MM:SS` countdown, phase progress bar.
- Persistent install via profile `cordis.patch.yml` (survives dsh web restarts).
- Zero runtime dependencies; plain-JS build (`src/` → `lib/`).
