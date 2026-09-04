# Security and PII Protection

Feedback Kitchen implements multi-layered privacy and security safeguards to ensure personally identifiable information (PII) is protected against data breaches, accidental leakage, and unauthorized access.

### Client-side architectural isolation

Because Feedback Kitchen is delivered as a static client-side web application:

- **Zero Server-Side Attack Surface:** The application has no central database, no persistent user sessions, and no server-side user credentials susceptible to SQL injection or credential stuffing.
- **Origin Sandboxing:** All local data (`localStorage`) is protected by browser same-origin policies, inaccessible to external scripts or third-party web domains.

### Automated client-side PII scrubbing

When using the optional AI Feedback Wording Assistant, the client-side scrubbing engine (`scrubPII`) sanitises all outgoing prompt payloads before network transmission:

| PII Category | Scrubbing Logic | Handled Edge Cases |
|---|---|---|
| **Student Names** | Takes the name in the Student field, and each whitespace-separated part of it, and replaces every occurrence with `[REDACTED]`. Longest match first, so *John Smith* goes before *John*. | Unicode-aware word boundaries, so macrons (*Ngāti*), diacritics (*Renée*), apostrophes (*O'Brien*) and hyphenated surnames (*Smith-Jones*) match correctly. |
| **Student ID Numbers** | Replaces the ID in the Student ID field wherever it appears. | Any ID, in any format, because the value is taken from the field rather than matched by pattern. |
| **Email Addresses** | Replaces anything matching a conventional email pattern with `[REDACTED]`, as a safety net. | Ordinary addresses. |

Understand the boundary this draws. The scrubber removes **the identifiers of the student you are marking**, because those are the values it has. It is not a general PII detector: another student's name or ID typed into your notes is not recognised and would be sent. Keep third-party identifiers out of the Marker's Notes field.

What reaches the `/api/garnish` proxy is the assessment criteria, rubric descriptors, letter grades and feedback prose, with those identifiers removed.

### Moderation k-anonymity enforcement

To protect student anonymity during external examiner audits, the **Moderation Export** engine enforces *k*-anonymity:

- **Cohort Size Gate:** Exports are blocked if the cohort contains fewer than 15 students (*n* < 15), preventing re-identification via small sample size.
- **Identity Erasure:** Rows are shuffled and relabelled `R001`, `R002` and so on, and markers become `T1`, `T2`, or `T_other` where they marked fewer than five students in the cohort.

### API proxy security and rate limiting

The serverless proxy endpoint (`/api/garnish.js`) implements:

- **Strict CORS Filtering:** Restricts incoming requests to authorized origins via `FK_ALLOWED_ORIGINS`.
- **Per-IP Rate Limiting:** Enforces an in-memory rate limit (20 requests per IP per minute) to prevent denial-of-service and API abuse.
