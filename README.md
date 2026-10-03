# PrepPilot AI — Frontend

A static, responsive frontend based on the supplied ERD.

## ERD → Frontend mapping
- User → `profile.html`, authentication pages
- Resume → `resume.html`
- JobRole → `jobs.html`
- InterviewSession → `interview.html` + `interview-room.html`
- Question → interview room question flow
- Response → recording/answer UI
- SpeechAnalysis + BehaviorAnalysis → `reports.html`
- CodingSubmission → `coding.html`
- PerformanceReport → `reports.html`
- Notification → `notifications.html`
- Admin → `admin.html`
- LearningResource → `resources.html`

## Run
Open `index.html` in a browser. No build step is required.

## Notes
This is frontend-only. Forms, login, recording and coding execution are simulated with JavaScript/localStorage. A real backend/API can later replace the mock data and actions.

## Real camera and microphone
The interview room now uses the browser MediaDevices API and MediaRecorder. Voice mode captures microphone audio; video mode captures camera + microphone and provides a local preview/replay. For permissions to work, run the folder through `http://localhost` (for example with VS Code Live Server) or deploy it over HTTPS. Opening `interview-room.html` directly as `file://` is not supported by many browsers.
