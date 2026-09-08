# Security Policy

## Reporting a Vulnerability

Please do not open a public GitHub issue for security vulnerabilities.

Report vulnerabilities to [hello@desourcelabs.com](mailto:hello@desourcelabs.com).

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
- `@desource/context7-widget-angular`
- `@desource/context7-widget-nuxt`
- `@desource/context7-widget-react`
- `@desource/context7-widget-svelte`
- `@desource/context7-widget-vue`
- Hosted script behavior documented by this repository

Out of scope:

- Social engineering
- Denial of service without a practical application security impact
- Vulnerabilities in third-party dependencies that should be reported upstream
- Context7 hosted backend behavior, which is operated by Context7

## Security Notes

The widget renders model-provided Markdown through a shared escaping renderer. Core places the result in an open shadow
root; the Vue, React, Svelte, and Angular packages place the same trusted output in native framework DOM. The Nuxt
module uses the Vue renderer. Please report any HTML injection, unsafe link, or rendering-boundary bypass.

Chat requests go directly from the visitor's browser to `https://context7.com/api/v2/widget/chat`; DeSource Labs does
not proxy them. Each request includes the configured library id and the current conversation messages (message id,
role, and content). Do not submit secrets or personal data that should not be processed by Context7, and review
Context7's own terms and privacy practices for backend retention and model processing.

The client does not add analytics, cookies, or persistent browser storage. Conversation state stays in the live
widget's memory and is cleared by `reset()`. Integrating applications can listen to the public events and may forward
their payloads elsewhere, so their own telemetry and privacy notices remain the integrator's responsibility.

Applications using a Content Security Policy should allow `https://context7.com` in `connect-src`.
