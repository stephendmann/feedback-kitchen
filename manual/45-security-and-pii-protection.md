# What protects student information

Feedback Kitchen protects student information mostly by not having it. There is no server holding marks, no account to compromise, and no database to breach, because the marking happens in your browser and the data stays there. The parts that need active protection are the two places where anything leaves: the wording assistant, and the moderation export.

This chapter is about where the boundaries actually sit, including where they stop.

## Why there is so little to attack

The application is static files. No login, no session, no server-side store of anything you type. The usual questions an institutional security review asks, about credential handling, injection into a marks database, or what happens when the vendor is breached, have no surface here to land on.

Your data sits in this browser's local storage for this origin, which the browser keeps from other sites by the same-origin policy. That is real protection against another website reading it. It is not protection against another person using your computer, and it is not encryption. A laptop holding a marked cohort should be treated like a bag holding the marked scripts. Chapter 37 covers shared machines specifically.

## What the wording assistant strips, and what it does not

The wording assistant is the one feature that sends text off the device, and only when you invoke it. Before anything goes, `scrubPII` rewrites the prompt.

It takes the name in the **Student** field and the value in **Student ID**, and replaces every occurrence of either with `[REDACTED]`. It also takes each part of the name separately, so a first name alone is caught, and it matches longest first so that "John Smith" is replaced before "John". The matching is Unicode-aware, which matters more here than it sounds: macrons, diacritics, apostrophes and hyphens are all treated as part of a name, so Ngāti, Renée, O'Brien and Smith-Jones are matched properly rather than half-redacted. Anything shaped like an email address is replaced as a safety net.

Now the limit, because it is the part that changes what you should type.

The scrubber removes the identifiers **of the student currently on screen**, because those are the only values it has. It has no pattern for student IDs in general and no list of people at your institution. Another student's name in your notes, a tutor's name, a reference to a complainant or a classmate, will not be recognised, and will be sent.

So the rule is about your own habits rather than the software: keep other people's identifiers out of **Marker's Notes** when you use the assistant. Write "the co-author" rather than the co-author's name. What reaches the proxy is then the criteria, the rubric descriptors, the grades and the prose.

The proxy itself restricts which origins may call it, through `FK_ALLOWED_ORIGINS`, and rate limits each IP address to 20 requests a minute.

## The moderation export, and its floor of fifteen

The moderation pack is built for people who need to check marking consistency without knowing whose work they are looking at.

It refuses to build at all for a cohort under fifteen students. That floor is not caution for its own sake. In a class of eight, a moderator who knows the tutorial group can often work out who a row belongs to by elimination, and no amount of removing names prevents it. Below fifteen, use the ordinary cohort workbook and accept that it is not anonymous.

Above the floor, rows are shuffled before they are labelled, so the order carries no trace of who was marked first. Rows become `R001`, `R002`, and markers become `T1`, `T2`, with any marker who handled fewer than five scripts collapsed into `T_other` so that a small teaching load cannot be picked out.

One identity survives on purpose. The manifest records the name and role of the coordinator who opted the paper in, because a moderation pack has to say who authorised its release. No student identity survives anywhere in the file.

Chapter 24 covers what the pack contains sheet by sheet, and chapter 35 covers the wider privacy architecture these two features sit inside.
