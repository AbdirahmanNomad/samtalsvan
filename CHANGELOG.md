# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- OpenRelay TURN server support for NAT traversal
- GDPR compliance endpoints (`GET /api/user/data`, `DELETE /api/user/data`)
- Health check endpoints (`/health`, `/health/ready`, `/health/live`)
- Rate limiting on all API endpoints
- Security headers with Helmet middleware
- Input validation with Joi
- Configuration management via `config.js`
- Docker support with Dockerfile

### Changed
- Improved CSP headers to allow inline event handlers
- Rooms now persist for 2 hours instead of being deleted immediately when empty
- Updated dependencies to latest stable versions

### Fixed
- Delete button now shows trash icon instead of hangup icon
- Chat panel moved to left side to not cover local video

## [1.0.0] - 2024-03-21

### Added
- WebRTC video calling with one-click start
- QR code sharing for easy mobile access
- Contact cards for elderly-initiated calls
- Printable contact cards with Swedish design
- Multiple contacts management
- Swedish yellow (#fecb00) and blue (#005293) color scheme
- Audio ringtone for incoming calls
- Mute/unmute microphone control
- Camera on/off toggle
- Camera switch (front/back) for mobile
- Call duration timer
- Network quality indicator
- Speaker toggle
- Fullscreen mode
- Text chat during calls
- Photo sharing (up to 5MB)
- Voice messages (up to 1 minute)
- Call scheduling with reminders
- Auto-reconnect on connection drop
- Date/Time widget (Swedish & English)
- Local storage for contacts and schedules
- Bilingual interface (Swedish & English)

### Security
- XSS protection with output escaping
- Token-based authorization for contact deletion
- Secure random generation with crypto.randomInt
- Content Security Policy headers

[Unreleased]: https://github.com/AbdirahmanNomad/samtalsvan/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/AbdirahmanNomad/samtalsvan/releases/tag/v1.0.0
