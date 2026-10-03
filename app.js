
document.addEventListener('DOMContentLoaded', () => {
  const current = location.pathname.split('/').pop() || 'index.html';

  // Shared sidebar for application pages
  const sidebar = document.querySelector('.sidebar');
  if (sidebar && !sidebar.innerHTML.trim()) {
    sidebar.innerHTML = `
      <a class="brand" href="dashboard.html"><span class="brand-mark">P</span><span>PrepPilot <b>AI</b></span></a>
      <div class="side-label">WORKSPACE</div>
      <nav>
        <a href="dashboard.html">⌂ <span>Dashboard</span></a>
        <a href="resume.html">▣ <span>My Resume</span></a>
        <a href="jobs.html">◈ <span>Job Roles</span></a>
        <a href="interview.html">◉ <span>Interviews</span></a>
        <a href="coding.html">⌘ <span>Coding Practice</span></a>
        <a href="reports.html">◒ <span>Performance</span></a>
        <a href="resources.html">▤ <span>Learning</span></a>
      </nav>
      <div class="side-label">ACCOUNT</div>
      <nav>
        <a href="notifications.html">♢ <span>Notifications</span><em class="badge">3</em></a>
        <a href="profile.html">○ <span>Profile</span></a>
        <a href="admin.html">⚙ <span>Admin</span></a>
      </nav>
      <button class="side-logout" data-logout>↪ Sign out</button>`;
  }
  document.querySelectorAll('.sidebar a').forEach(a => {
    if (a.getAttribute('href') === current) a.classList.add('active');
  });

  // Simple localStorage profile
  const user = JSON.parse(localStorage.getItem('prepPilotUser') || 'null');
  document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user?.name || 'Candidate');
  const profileName = document.getElementById('profileName');
  if (profileName) profileName.value = user?.name || '';

  const toast = (message) => {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = message; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
  };
  document.querySelectorAll('[data-toast]').forEach(btn => btn.addEventListener('click', () => toast(btn.dataset.toast)));

  document.querySelectorAll('[data-logout]').forEach(btn => btn.addEventListener('click', () => {
    localStorage.removeItem('prepPilotUser');
    location.href = 'index.html';
  }));

  const login = document.getElementById('loginForm');
  if (login) login.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const old = JSON.parse(localStorage.getItem('prepPilotUser') || '{}');
    localStorage.setItem('prepPilotUser', JSON.stringify({name: old.name || email.split('@')[0], email}));
    location.href = 'dashboard.html';
  });

  const register = document.getElementById('registerForm');
  if (register) register.addEventListener('submit', e => {
    e.preventDefault();
    localStorage.setItem('prepPilotUser', JSON.stringify({
      name: document.getElementById('regName').value,
      role: document.getElementById('regRole').value,
      email: document.getElementById('regEmail').value
    }));
    location.href = 'dashboard.html';
  });

  const profile = document.getElementById('profileForm');
  if (profile) profile.addEventListener('submit', e => {
    e.preventDefault();
    const old = JSON.parse(localStorage.getItem('prepPilotUser') || '{}');
    localStorage.setItem('prepPilotUser', JSON.stringify({...old, name: profileName.value}));
    toast('Profile saved successfully');
    setTimeout(() => location.reload(), 800);
  });

  const resumeInput = document.getElementById('resumeInput');
  if (resumeInput) resumeInput.addEventListener('change', () => {
    if (resumeInput.files[0]) toast(`${resumeInput.files[0].name} selected — demo upload complete`);
  });

  document.querySelectorAll('.mode').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.mode').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    localStorage.setItem('prepPilotInterviewType', btn.dataset.mode);
  }));

  const startInterview = document.getElementById('startInterview');
  if (startInterview) {
    const params = new URLSearchParams(location.search);
    const requested = params.get('type');
    const saved = requested || localStorage.getItem('prepPilotInterviewType') || 'voice';
    document.querySelectorAll('.mode').forEach(b => b.classList.toggle('selected', b.dataset.mode === saved));
    localStorage.setItem('prepPilotInterviewType', saved);
    const roleSelect = document.getElementById('roleSelect');
    if (roleSelect) {
      const savedRole = localStorage.getItem('prepPilotInterviewRole');
      if (savedRole) roleSelect.value = savedRole;
      roleSelect.addEventListener('change', () => localStorage.setItem('prepPilotInterviewRole', roleSelect.value));
      localStorage.setItem('prepPilotInterviewRole', roleSelect.value);
    }
  }

  // Interview room: real camera/microphone capture with MediaDevices + MediaRecorder
  const questions = [
    'What is the difference between let, const and var in JavaScript?',
    'Explain how React state and props are different.',
    'How would you optimize a slow web page?',
    'Tell me about a project where you solved a difficult problem.',
    'How does REST API integration work in a frontend application?',
    'What is event bubbling and how can you use event delegation?',
    'How do you make a website responsive?',
    'Explain the difference between synchronous and asynchronous code.',
    'How do you handle errors in a production application?',
    'Why should we hire you for this role?'
  ];
  let qIndex = 0;
  let mediaStream = null;
  let mediaRecorder = null;
  let chunks = [];
  let recording = false;
  let secondsLeft = 1200;
  let timerHandle = null;
  const isRoom = !!document.getElementById('previewVideo');

  if (isRoom) {
    const qEl = document.getElementById('question');
    const qNum = document.getElementById('qNum');
    const qProgress = document.getElementById('qProgress');
    const next = document.getElementById('nextBtn');
    const skip = document.getElementById('skipBtn');
    const record = document.getElementById('recordBtn');
    const enable = document.getElementById('enableBtn');
    const recordText = document.getElementById('recordText');
    const recordHint = document.getElementById('recordHint');
    const deviceState = document.getElementById('deviceState');
    const preview = document.getElementById('previewVideo');
    const audioPlayback = document.getElementById('audioPlayback');
    const videoPlayback = document.getElementById('videoPlayback');
    const voiceVisual = document.getElementById('voiceVisual');
    const micStatus = document.getElementById('micStatus');
    const cameraStatus = document.getElementById('cameraStatus');
    const mode = localStorage.getItem('prepPilotInterviewType') || 'voice';

    document.getElementById('modeLabel').textContent = mode === 'video' ? 'VIDEO INTERVIEW' : 'VOICE INTERVIEW';
    document.getElementById('sessionLabel').textContent = `${localStorage.getItem('prepPilotInterviewRole') || 'Frontend Developer'} · ${mode === 'video' ? 'Video' : 'Voice'} Interview`;
    if (mode === 'video') {
      preview.hidden = false;
      voiceVisual.hidden = true;
      enable.textContent = '🎥 Enable Camera & Microphone';
      recordHint.textContent = 'Your camera preview is local to this browser. Nothing is uploaded by this frontend demo.';
    } else {
      preview.hidden = true;
      voiceVisual.hidden = false;
    }

    const updateTimer = () => {
      const m = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
      const sec = String(secondsLeft % 60).padStart(2, '0');
      document.getElementById('timer').textContent = `${m}:${sec}`;
      if (secondsLeft > 0) secondsLeft--;
    };
    updateTimer();
    timerHandle = setInterval(updateTimer, 1000);

    function renderQuestion() {
      qEl.textContent = questions[qIndex];
      qNum.textContent = qIndex + 1;
      qProgress.style.width = `${(qIndex + 1) * 10}%`;
      recordText.textContent = mediaStream ? 'Ready to record your answer' : (mode === 'video' ? 'Enable camera and microphone to begin' : 'Enable your microphone to begin');
      record.disabled = !mediaStream;
      record.textContent = '● Start Recording';
      recording = false;
    }

    async function enableDevices() {
      if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        deviceState.textContent = 'Camera/microphone require HTTPS or localhost. Do not open this page directly as file://.';
        deviceState.classList.add('error');
        return;
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        deviceState.textContent = 'This browser does not support camera/microphone access.';
        deviceState.classList.add('error');
        return;
      }
      try {
        enable.disabled = true;
        deviceState.textContent = 'Requesting permission…';
        const constraints = mode === 'video'
          ? { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: { echoCancellation: true, noiseSuppression: true } }
          : { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } };
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (mode === 'video') preview.srcObject = mediaStream;
        const hasMic = mediaStream.getAudioTracks().length > 0;
        const hasCamera = mediaStream.getVideoTracks().length > 0;
        micStatus.textContent = hasMic ? 'Ready' : 'Unavailable';
        cameraStatus.textContent = hasCamera ? 'Ready' : 'Not needed';
        micStatus.className = hasMic ? 'device-ok' : 'device-error';
        cameraStatus.className = hasCamera ? 'device-ok' : '';
        deviceState.textContent = mode === 'video' ? 'Camera + microphone connected' : 'Microphone connected';
        record.disabled = false;
        enable.textContent = '✓ Devices Enabled';
        enable.classList.remove('btn-primary');
        enable.classList.add('btn-success');
        renderQuestion();
      } catch (err) {
        enable.disabled = false;
        deviceState.classList.add('error');
        if (err.name === 'NotAllowedError') deviceState.textContent = 'Permission denied. Click the camera/lock icon in Chrome’s address bar and allow Camera + Microphone, then try again.';
        else if (err.name === 'NotFoundError') deviceState.textContent = 'No camera or microphone was found. Connect a device and try again.';
        else deviceState.textContent = `Could not access devices: ${err.message}`;
      }
    }

    function preferredMimeType() {
      const candidates = mode === 'video'
        ? ['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm']
        : ['audio/webm;codecs=opus','audio/webm'];
      return candidates.find(type => MediaRecorder.isTypeSupported(type)) || '';
    }

    function startRecording() {
      if (!mediaStream) return;
      chunks = [];
      const mimeType = preferredMimeType();
      try {
        mediaRecorder = mimeType ? new MediaRecorder(mediaStream, { mimeType }) : new MediaRecorder(mediaStream);
      } catch (err) {
        deviceState.textContent = `Recording is not supported in this browser: ${err.message}`;
        return;
      }
      mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      mediaRecorder.onstop = () => {
        const type = mode === 'video' ? 'video/webm' : 'audio/webm';
        const blob = new Blob(chunks, { type });
        const url = URL.createObjectURL(blob);
        if (mode === 'video') {
          videoPlayback.src = url;
          videoPlayback.hidden = false;
        } else {
          audioPlayback.src = url;
          audioPlayback.hidden = false;
        }
        const key = `prepPilotResponse_${qIndex + 1}`;
        localStorage.setItem(key, JSON.stringify({ question: questions[qIndex], mode, recordedAt: new Date().toISOString(), size: blob.size }));
        recordText.textContent = 'Answer recorded ✓';
        recordHint.textContent = 'You can replay your answer below or move to the next question.';
      };
      mediaRecorder.start(250);
      recording = true;
      record.textContent = '■ Stop Recording';
      record.classList.remove('btn-light');
      record.classList.add('btn-primary');
      recordText.textContent = 'Recording your answer…';
      deviceState.textContent = mode === 'video' ? 'Recording camera + microphone' : 'Recording microphone';
    }

    function stopRecording() {
      if (!mediaRecorder || mediaRecorder.state === 'inactive') return;
      mediaRecorder.stop();
      recording = false;
      record.textContent = '● Start Recording';
      record.classList.remove('btn-primary');
      record.classList.add('btn-light');
      deviceState.textContent = 'Recording stopped — answer saved in this browser session';
    }

    enable.addEventListener('click', enableDevices);
    record.addEventListener('click', () => recording ? stopRecording() : startRecording());
    [next, skip].forEach(btn => btn.addEventListener('click', () => {
      if (recording) stopRecording();
      qIndex++;
      if (qIndex >= questions.length) {
        if (timerHandle) clearInterval(timerHandle);
        mediaStream?.getTracks().forEach(track => track.stop());
        location.href = 'reports.html';
      } else {
        if (audioPlayback) { audioPlayback.pause(); audioPlayback.removeAttribute('src'); audioPlayback.hidden = true; }
        if (videoPlayback) { videoPlayback.pause(); videoPlayback.removeAttribute('src'); videoPlayback.hidden = true; }
        renderQuestion();
      }
    }));
    window.addEventListener('beforeunload', () => {
      if (timerHandle) clearInterval(timerHandle);
      mediaStream?.getTracks().forEach(track => track.stop());
    });
    renderQuestion();
    // Request devices immediately so the interview room behaves like a real interview app.
    enableDevices();
  }

  const runCode = document.getElementById('runCode');
  runCode?.addEventListener('click', () => {
    const result = document.getElementById('execResult');
    result.textContent = '✓ Tests passed: 3/3 — 42 ms';
    result.style.color = '#159a68';
  });

  const markRead = document.getElementById('markRead');
  markRead?.addEventListener('click', () => {
    document.querySelectorAll('.notification.unread').forEach(n => n.classList.remove('unread'));
    toast('All notifications marked as read');
  });

  const jobSearch = document.getElementById('jobSearch');
  jobSearch?.addEventListener('input', () => {
    const term = jobSearch.value.toLowerCase();
    document.querySelectorAll('.job-card').forEach(card => {
      card.style.display = card.textContent.toLowerCase().includes(term) ? '' : 'none';
    });
  });

  // Make segmented difficulty buttons interactive
  document.querySelectorAll('.segmented button').forEach(btn => btn.addEventListener('click', () => {
    btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  }));
});

// small toast styles inserted from JS so CSS remains reusable
const style = document.createElement('style');
style.textContent = `.toast{position:fixed;right:22px;bottom:22px;background:#172033;color:#fff;padding:12px 16px;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.2);opacity:0;transform:translateY(10px);transition:.2s;z-index:99;font-size:13px}.toast.show{opacity:1;transform:none}`;
document.head.appendChild(style);
