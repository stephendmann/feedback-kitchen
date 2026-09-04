# FAQ

This chapter addresses frequently asked questions regarding grading calculations, data privacy, offline usage, and team coordination in Feedback Kitchen.

![Frequently asked questions](images/ch43-faq.png)

### General and pedagogical questions

**Does Feedback Kitchen use AI to read or grade student papers?**  
No. Feedback Kitchen is not an autograder. Every mark, override, and feedback edit is authored and decided by human academic judgement. The application automates the mechanical assembly of pre-written rubric descriptors and grade templates.

**How does Feedback Kitchen calculate the overall grade?**  
Each criterion's score (either its default grade-band midpoint or a manual override) is multiplied by its percentage weight. The sum of these weighted contributions produces the total score out of 100, which maps to the suggested overall letter grade.

**Can I override a calculated score if professional judgement warrants it?**  
Yes. You can enter an override score on individual criteria to fine-tune points, or enter a target letter grade in **Grade Override** (`#grade-override`) to bump a borderline student to the band minimum.

### Privacy and data security

**Where is student data stored during marking?**  
All student names, ID numbers, criteria scores, feedback drafts, and marker notes are stored in your browser's private local storage (`localStorage`) on your physical computer. No student data is transmitted to an external server.

**Does using the AI wording assistant expose student identity?**  
No. Before any prompt is sent to `/api/garnish`, a client-side PII scrubbing engine automatically strips student names, IDs, macrons, and hyphenated surnames. Only de-identified assessment text reaches the proxy.

### Team marking and file management

**How do I share a rubric with my marking team?**  
Open the scorer in the builder and click **Export JSON** on Step 6. Email the resulting `.json` file to your tutors. Each tutor imports the file via `upload.html` to mark against identical rubric standards.

**Are my personal feedback snippets shared when I export a scorer?**  
No. Scorer JSON files contain assessment configuration only. Personal snippets remain in your private local browser storage and are never included in scorer exports.

**Can I run Feedback Kitchen completely offline?**  
Yes. Once cached by your browser or served from a local folder, all marking features, formula calculations, Excel workbook exports, and Moodle CSV generators operate without an active internet connection.
