# Security Policy

## Reporting a Vulnerability

Please do not open a public GitHub issue for security vulnerabilities.

Report vulnerabilities to [hello@desource-labs.org](mailto:hello@desource-labs.org).

Include:

1. A clear description
2. Affected package and version
3. Impact
4. Reproduction steps
5. Proof of concept, if available
6. Suggested fix, if available

## Response Timeline

- Initial response: within 48 hours
- Status update: within 5 business days
- Fix timeline: depends on severity

## Scope

In scope:

- `@desource/context7-widget`
- `@desource/context7-widget-vue`
- Hosted script behavior documented by this repository

Out of scope:

- Social engineering
- Denial of service without a practical application security impact
- Vulnerabilities in third-party dependencies that should be reported upstream
- Context7 hosted backend behavior, which is operated by Context7/Upstash

## Security Notes

The widget renders model-provided markdown inside an open shadow root and uses an explicit markdown renderer. Please
report any HTML injection or unsafe rendering behavior.

The widget calls `https://context7.com/api/v2/widget/chat`; applications should allow that origin in `connect-src` when
using a Content Security Policy.
