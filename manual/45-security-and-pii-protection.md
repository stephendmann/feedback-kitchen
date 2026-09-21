# What protects student information

Feedback Kitchen protects student information mostly by not having it. There is no server holding marks, no account to compromise, and no database to breach, because the marking happens in your browser and the data stays there. The parts that need active protection are the two places where material actually leaves the device: the wording assistant, and PDF import. The moderation export needs care for a different reason: it produces a file you then hand to someone, but generating it sends nothing anywhere.

This chapter is about where the boundaries actually sit, including where they stop.

## Why there is so little to attack

The application is static files. No account to sign in to, no session on a server, no server-side store of anything you type. Most of what an institutional security review asks about, injection into a marks database or what happens when the vendor is breached, has no surface here to land on.

Credential handling is the exception, and it is worth stating plainly because a review will ask. Supporters unlock the wording assistant and the PDF converter with a Ko-fi username and password. Those are held in this browser as ordinary text, in local storage under `SA_FK_USER` and `SA_FK_PASS`, and copied into session storage so the converter picks them up within the same session. They are sent with each assistant request so the proxy can authorise it. They guard a small paid feature rather than student data, and no student work depends on them, but they are not encrypted and they sit on the same device as the cohort. Use a password you do not use anywhere else.

One point a security review usually asks next: the supporter password authorises you against Feedback Kitchen's own proxy, and stops there. The proxy calls Anthropic with a server-side key of its own, so your Ko-fi password is never forwarded to Anthropic and is not an AI vendor credential.

Your data sits in this browser's local storage for this origin, which the browser keeps from other sites by the same-origin policy. That is real protection against another website reading it. It is not protection against another person using your computer, and it is not encryption. A laptop holding a marked cohort should be treated like a bag holding the marked scripts. Chapter 37 covers shared machines specifically.

One local store is easy to forget. If you use the wording assistant, the last twenty runs are kept in this browser under `SA_AI_LOG`, and depending on which path you used an entry can hold the scrubbed prompt or the current student's name. Nothing sends it anywhere, but it is student-related material sitting on the device after you have finished with the student. **Clear log** in the assistant panel removes it, and **↺ New student** clears it as well.

## What the wording assistant strips, and what it does not

The wording assistant sends text off the device, and only when you invoke it. Before anything goes, `scrubPII` rewrites the prompt.

It takes the name in the **Student** field and the value in **Student ID**, and replaces every occurrence of either with `[REDACTED]`. It also takes each part of the name separately, so a first name alone is caught, and it matches longest first so that "John Smith" is replaced before "John". The matching is Unicode-aware, which matters more here than it sounds: macrons, diacritics, apostrophes and hyphens are all treated as part of a name, so Ngāti, Renée, O'Brien and Smith-Jones are matched properly rather than half-redacted. Anything shaped like an email address is replaced as a safety net.

Now the limit, because it is the part that changes what you should type.

The scrubber removes the identifiers **of the student currently on screen**, because those are the only values it has. It has no pattern for student IDs in general and no list of people at your institution. Another student's name in your notes, a tutor's name, a reference to a complainant or a classmate, will not be recognised, and will be sent.

So the rule is about your own habits rather than the software: keep other people's identifiers out of **Marker's notes** when you use the assistant. Write "the co-author" rather than the co-author's name. What reaches the proxy is then the criteria, the rubric descriptors, the grades and the prose.

The proxy itself restricts which origins may call it, through `FK_ALLOWED_ORIGINS`, and rate limits each IP address to 20 requests a minute.

## What PDF import sends, which is the whole document

PDF import is the second feature that leaves the device, and it is the blunter of the two. There is no scrubber here. When you import a rubric, the file is sent whole, as `pdfBase64`, together with its filename and, on the second step, the assessment title you picked. Feedback Kitchen's proxy passes the document straight to Anthropic for reading.

So the rule is simple: import course documents, not student work. A marking guide or an assignment brief is what this is for. A PDF holding student submissions, names, or ID numbers should not go through it unless your institution has approved that use, because nothing in the pipeline will strip them.

Two smaller points. The filename travels with the file and is written to the proxy's request log along with your IP address, so avoid putting a student name or ID in the filename of anything you upload. And the log records that a request happened, not what the document said.

## The moderation export, and its floor of fifteen

The moderation pack is built for people who need to check marking consistency without knowing whose work they are looking at.

It refuses to build at all for a cohort under fifteen students. That floor is not caution for its own sake. In a class of eight, a moderator who knows the tutorial group can often work out who a row belongs to by elimination, and no amount of removing names prevents it. Below fifteen, use the ordinary cohort workbook and accept that it is not anonymous.

Above the floor, rows are shuffled before they are labelled, so the order carries no trace of who was marked first. Rows become `R001`, `R002`, and markers become `T1`, `T2`, with any marker who handled fewer than five scripts collapsed into `T_other` so that a small teaching load cannot be picked out.

One identity survives on purpose. The manifest records the name and role of the coordinator who opted the paper in, because a moderation pack has to say who authorised its release. No student identity survives anywhere in the file.

Chapter 24 covers what the pack contains sheet by sheet, and chapter 35 covers the wider privacy architecture these two features sit inside.
