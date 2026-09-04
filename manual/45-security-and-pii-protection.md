# Security and PII Protection

Feedback Kitchen implements multi-layered privacy and security safeguards to ensure personally identifiable information (PII) is protected against data breaches, accidental leakage, and unauthorized access.

![PII scrubbing and security architecture](images/ch45-security-boundaries.png)

### Client-side architectural isolation

Because Feedback Kitchen is delivered as a static client-side web application:

- **Zero Server-Side Attack Surface:** The application has no central database, no persistent user sessions, and no server-side user credentials susceptible to SQL injection or credential stuffing.
- **Origin Sandboxing:** All local data (`localStorage`) is protected by browser same-origin policies, inaccessible to external scripts or third-party web domains.

### Automated client-side PII scrubbing

When using the optional AI Feedback Wording Assistant, the client-side scrubbing engine (`scrubPII`) sanitises all outgoing prompt payloads before network transmission:

| PII Category | Scrubbing Logic | Handled Edge Cases |
|---|---|---|
| **Student Names** | Replaces full names, given names, and surnames with generic syntactic tokens. | Recognises macrons (e.g. *Māori*), diacritics, apostrophes (e.g. *D'Angelo*, *O'Connor*), and hyphenated names. |
| **Student ID Numbers** | Redacts numeric and alphanumeric institutional student identifiers. | Matches standard university ID regex patterns. |
| **Email Addresses** | Replaces email strings with placeholder tokens. | Matches standard RFC-5322 email patterns. |

Only de-identified assessment criteria, rubric descriptors, letter grades, and anonymised feedback text are transmitted to the `/api/garnish` proxy.

### Moderation k-anonymity enforcement

To protect student anonymity during external examiner audits, the **Moderation Export** engine enforces *k*-anonymity:

- **Cohort Size Gate:** Exports are blocked if the cohort contains fewer than 15 students (*n* < 15), preventing re-identification via small sample size.
- **Identity Erasure:** Replaces all student and marker identities with pseudonymous labels (`Student 01`, `Student 02`).

### API proxy security and rate limiting

The serverless proxy endpoint (`/api/garnish.js`) implements:

- **Strict CORS Filtering:** Restricts incoming requests to authorized origins via `FK_ALLOWED_ORIGINS`.
- **Per-IP Rate Limiting:** Enforces an in-memory rate limit (20 requests per IP per minute) to prevent denial-of-service and API abuse.
