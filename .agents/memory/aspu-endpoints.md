---
name: ASPU correct endpoint URLs
description: Real ASPU API endpoint URLs discovered from app.js — several differ from what the old worker used
---

**Why:** The old worker had wrong ASPU URLs for 5 endpoints, causing those pages to always return empty data.

**Verified working endpoints (tested with real credentials):**
- Dashboard: `api/students/dashboard/dashboard`
- Announcements: `api/students/dashboard/announcements`
- Personal profile: `api/students/profiles/personal`
- Academic profile: `api/students/profiles/academic`
- Financial profile: `api/students/profiles/financial`
- Warnings: `api/students/profiles/warnings`
- **Statement account: `api/students/profiles/statement-account`** (NOT `profiles/statement`)
- **E-payments: `api/students/profiles/e-payments`** (NOT `profiles/epayments`)
- Banks: `api/students/profiles/banks`
- Grades all semesters: `api/students/grades/transcript-semesters`
- **Grades current semester: `api/students/grades/transcript-current-semester`** (real endpoint, no need to extract from transcript)
- Grades status: `api/students/grades/status`
- Lectures: `api/students/calendar/lectures-table`
- Exams: `api/students/calendar/exam-table`
- Academic calendar: `api/students/calendar/academic-calendar`
- Calendar events: `api/students/calendar/events`
- Remaining courses: `api/students/registration/remaining-courses`
- Opened courses: `api/students/registration/opened-courses`
- Available courses: `api/students/registration/available-courses`
- **Registration rules: `api/students/registration/registration-rules`** (NOT `registration/rules`)
- **Registration submit: `api/students/registration/store-student-queue`** (NOT `registration/submit`)
- Window one requests: `api/students/window-one/requests`
- **Settings: `api/students/settings/settings`** (NOT `students/settings`)

**404 on ASPU (don't use):**
- `api/students/smart-campus/internships`
- Services (library, transportation, bookstore) return 500 for this student
- Course content returns 500 for this student
