# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Samtalsvan seriously. If you have discovered a security vulnerability, please report it responsibly.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via:

1. **Email**: Send details to [hello@abdirahman.net](mailto:hello@abdirahman.net)
2. **Subject Line**: Use `[SECURITY] Samtalsvan Vulnerability Report`

### What to Include

Please include the following information in your report:

- Type of vulnerability (e.g., XSS, CSRF, injection)
- Full path or URL where the vulnerability was discovered
- Steps to reproduce the issue
- Proof of concept or exploit code (if available)
- Impact assessment
- Your name/handle (optional, for credit in advisory)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Triage**: Within 7 days
- **Fix Development**: Depends on severity
- **Disclosure**: After fix is released

### Disclosure Policy

We follow responsible disclosure:

1. Report received and acknowledged
2. Vulnerability confirmed and severity assessed
3. Fix developed and tested
4. Release prepared with security advisory
5. CVE requested (if applicable)
6. Public disclosure after release

### Security Measures

Samtalsvan implements the following security measures:

- **Input Validation**: All user inputs validated with Joi schemas
- **XSS Protection**: Output escaping with `escapeHtml()` and `escapeJs()`
- **Rate Limiting**: Request limits on all endpoints
- **Security Headers**: Helmet middleware with CSP, HSTS, etc.
- **Token-based Auth**: Secure tokens for sensitive operations
- **Crypto Random**: Secure random generation for codes and tokens
- **No Data Storage**: Video calls are peer-to-peer, not stored on servers

### Known Security Considerations

- **TURN Servers**: For production, configure your own TURN servers. The default STUN servers may not work behind symmetric NAT.
- **HTTPS Required**: WebRTC requires HTTPS in production for camera/microphone access.
- **CORS**: Configure `CORS_ORIGIN` environment variable in production to restrict allowed origins.

### Security Updates

Security updates will be announced via:
- GitHub Security Advisories
- CHANGELOG.md
- Release notes

### Credits

Security researchers who responsibly disclose vulnerabilities will be credited (with permission) in:
- Security advisory
- CHANGELOG.md
- Release notes

Thank you for helping keep Samtalsvan and our users safe!
