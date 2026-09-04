# Institutional and Kiosk Deployments

Universities, polytechnics, and school faculties often deploy Feedback Kitchen across computer laboratories, shared marking hubs, and managed faculty laptops.

### Managing shared lab workstations

In teaching labs where multiple tutors use the same physical terminals throughout the day:

1. **Ephemeral Browser Profiles:** Configure lab computers with guest browsing profiles or reboot restoration software (such as Deep Freeze) so that browser local storage purges automatically when a marker logs out.
2. **Mandatory Marker Switching:** Instruct markers to use the **Switch marker** button in the top bar upon completing a marking block to clear in-progress session state.
3. **Post-Export Purge Policy:** Enforce a standard policy requiring markers to click **Export cohort (Excel)** followed immediately by **Clear cohort** before leaving the workstation.

### Pre-configuring institutional default scorers

To deploy standardized assessment scorers across a departmental fleet:

- The course coordinator authors the official master scorer in `builder.html` and exports `<CourseCode>_Master.json`.
- Place the JSON file in the course's shared cloud drive or LMS resource repository.
- Tutors open the local or hosted instance of Feedback Kitchen, click **Upload**, and load the master file in one step.

### Institutional grading policy alignment

When setting up scorers for university-wide adoption:

- Ensure the appropriate regional grade preset is configured in Step 2 of the builder (e.g. *NZ University* for New Zealand institutions, *Australian Honours* for Australian universities, or *UK Degree Classification* for British universities).
- Verify that penalty deduction schedules match published faculty calendar policies (e.g. 10% deduction per day up to 3 days, automatic fail thereafter).
- Standardise criterion percentage weights to ensure fair, audited grading across all tutorial streams.

### Dedicated marking kiosk setups

For high-volume marking workshops or oral examination stations:

- Launch Chrome or Edge in kiosk or app mode:
  ```bash
  chromium --app=https://marking.stephendmann.com/
  ```
- This launches Feedback Kitchen in a dedicated, distraction-free application window without browser URL bars or bookmark clutter.
