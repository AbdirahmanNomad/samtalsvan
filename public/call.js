const socket = io();
let peerConnection = null;
let localStream = null;
let currentRoomId = null;
let isInitiator = false;
let targetPeerId = null;

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' }
];

const icons = {
  video: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`,
  phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`,
  hangup: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path><line x1="23" y1="1" x2="1" y2="23"></line></svg>`,
  copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
  fullscreen: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>`,
  exitFullscreen: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
};

function render(html) {
  document.getElementById('app').innerHTML = html;
}

async function getMediaDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return {
      cameras: devices.filter(d => d.kind === 'videoinput'),
      microphones: devices.filter(d => d.kind === 'audioinput')
    };
  } catch (err) {
    console.error('Error getting devices:', err);
    return { cameras: [], microphones: [] };
  }
}

async function getLocalStream(cameraId, micId) {
  const constraints = {
    video: cameraId ? { deviceId: { exact: cameraId } } : { facingMode: 'user' },
    audio: micId ? { deviceId: { exact: micId } } : true
  };
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (err) {
    console.error('Error getting media:', err);
    throw err;
  }
}

function createPeerConnection() {
  const pc = new RTCPeerConnection({
    iceServers: ICE_SERVERS
  });
  
  pc.onicecandidate = (event) => {
    if (event.candidate && targetPeerId) {
      socket.emit('ice-candidate', {
        targetPeerId,
        candidate: event.candidate
      });
    }
  };
  
  pc.ontrack = (event) => {
    console.log('Received remote track');
    const remoteVideo = document.getElementById('remoteVideo');
    if (remoteVideo) {
      remoteVideo.srcObject = event.streams[0];
    }
  };
  
  pc.onconnectionstatechange = () => {
    console.log('Connection state:', pc.connectionState);
    if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
      showCallEnded();
    }
  };
  
  return pc;
}

async function createOffer(peerId) {
  targetPeerId = peerId;
  
  if (!peerConnection) {
    peerConnection = createPeerConnection();
    
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });
  }
  
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  
  socket.emit('offer', {
    targetPeerId: peerId,
    offer
  });
}

async function handleOffer(data) {
  const { offer, fromPeerId } = data;
  targetPeerId = fromPeerId;
  
  if (!peerConnection) {
    peerConnection = createPeerConnection();
    
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });
  }
  
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  
  socket.emit('answer', {
    targetPeerId: fromPeerId,
    answer
  });
  
  showCallUI();
}

async function handleAnswer(data) {
  const { answer } = data;
  if (peerConnection) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    showCallUI();
  }
}

async function handleIceCandidate(data) {
  const { candidate } = data;
  if (peerConnection) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
}

function endCall() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  
  targetPeerId = null;
  
  window.location.href = window.location.pathname;
}

function toggleFullscreen() {
  const container = document.querySelector('.video-container');
  
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    if (container.requestFullscreen) {
      container.requestFullscreen();
    } else if (container.webkitRequestFullscreen) {
      container.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function updateFullscreenButton() {
  const btn = document.getElementById('fullscreenBtn');
  if (btn) {
    btn.innerHTML = `<span class="icon">${isFullscreen() ? icons.exitFullscreen : icons.fullscreen}</span>`;
  }
}

document.addEventListener('fullscreenchange', updateFullscreenButton);
document.addEventListener('webkitfullscreenchange', updateFullscreenButton);

function showCallUI() {
  render(`
    <div class="video-container">
      <video id="remoteVideo" class="remote-video" autoplay playsinline></video>
      <video id="localVideo" class="local-video" autoplay playsinline muted></video>
      <div class="status-bar">
        <span class="status-text">Samtal pågår / Call in progress</span>
      </div>
      <div class="call-controls">
        <button id="fullscreenBtn" class="btn btn-icon btn-small fullscreen-btn" onclick="window.toggleFullscreen()" aria-label="Fullskärm / Fullscreen">
          <span class="icon">${icons.fullscreen}</span>
        </button>
        <button class="btn btn-danger end-call-btn" onclick="window.endCall()">
          <span class="icon">${icons.hangup}</span>
          <span>Avsluta / End</span>
        </button>
      </div>
    </div>
  `);
  
  const localVideo = document.getElementById('localVideo');
  if (localVideo && localStream) {
    localVideo.srcObject = localStream;
  }
}

function showCallEnded() {
  render(`
    <div class="container">
      <div class="card">
        <div class="call-ended-icon">
          ${icons.hangup}
        </div>
        <h1 class="title">Samtalet avslutat</h1>
        <p class="subtitle">Samtalet har avslutats</p>
        <p class="subtitle" style="margin-top: 0;">The call has ended</p>
        <button class="btn btn-primary" onclick="window.location.reload()" style="margin-top: 24px;">
          <span class="icon">${icons.phone}</span>
          <span>Nytt samtal / New call</span>
        </button>
      </div>
    </div>
  `);
}

function showWaitingUI(roomId, link, qrCode) {
  render(`
    <div class="container">
      <div class="card">
        <div class="logo">
          <div class="logo-icon">
            ${icons.video}
          </div>
        </div>
        <h1 class="title">Samtalsvän</h1>
        <p class="subtitle">Väntar på deltagare...</p>
        <p class="subtitle" style="margin-top: 0;">Waiting for participant...</p>
        <div class="waiting-dots"><span></span><span></span><span></span></div>
        
        <div class="link-box" id="linkBox">
          ${link}
        </div>
        
        <button class="btn btn-primary btn-copy" onclick="window.copyLink()">
          <span class="icon">${icons.copy}</span>
          <span>Kopiera länk / Copy link</span>
        </button>
        
        <img src="${qrCode}" alt="QR Code" class="qr-code" />
        
        <p class="share-hint">
          Skanna QR-koden med din mobilkamera<br>eller dela länken ovan
        </p>
        <p class="share-hint" style="margin-top: 4px; color: #7a7a8e;">
          Scan the QR code with your phone camera<br>or share the link above
        </p>
        
        <button class="btn btn-danger btn-secondary" onclick="window.endCall()" style="margin-top: 32px;">
          <span class="icon">${icons.hangup}</span>
          <span>Avbryt / Cancel</span>
        </button>
        
        <div class="advanced-section">
          <button class="advanced-toggle" onclick="window.toggleAdvanced()">
            <span class="icon icon-small">${icons.settings}</span>
            <span>Avancerat / Advanced</span>
          </button>
          <div id="advancedContent" style="display: none; margin-top: 20px;">
            <label class="label-block">
              Kamera / Camera
              <select id="cameraSelect" class="device-select">
                <option value="">Standard / Default</option>
              </select>
            </label>
            <label class="label-block">
              Mikrofon / Microphone
              <select id="micSelect" class="device-select">
                <option value="">Standard / Default</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>
  `);
  
  window.shareLink = link;
  socket.emit('join', roomId);
}

function showJoiningUI() {
  render(`
    <div class="container">
      <div class="card">
        <div class="logo">
          <div class="logo-icon">
            ${icons.video}
          </div>
        </div>
        <h1 class="title">Samtalsvän</h1>
        <p class="subtitle">Ansluter till samtal...</p>
        <p class="subtitle" style="margin-top: 0;">Connecting to call...</p>
        <div class="waiting-dots"><span></span><span></span><span></span></div>
        
        <div class="advanced-section">
          <button class="advanced-toggle" onclick="window.toggleAdvanced()">
            <span class="icon icon-small">${icons.settings}</span>
            <span>Avancerat / Advanced</span>
          </button>
          <div id="advancedContent" style="display: none; margin-top: 20px;">
            <label class="label-block">
              Kamera / Camera
              <select id="cameraSelect" class="device-select">
                <option value="">Standard / Default</option>
              </select>
            </label>
            <label class="label-block">
              Mikrofon / Microphone
              <select id="micSelect" class="device-select">
                <option value="">Standard / Default</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>
  `);
}

function showStartUI() {
  render(`
    <div class="container">
      <div class="card">
        <div class="logo">
          <div class="logo-icon">
            ${icons.video}
          </div>
        </div>
        <h1 class="title">Samtalsvän</h1>
        <p class="subtitle">Videosamtal för alla</p>
        <p class="subtitle" style="margin-top: 0;">Video calls for everyone</p>
        
        <button id="startCallBtn" class="btn btn-primary" onclick="window.startCall()" style="margin-top: 32px;">
          <span class="icon">${icons.video}</span>
          <span>Starta videosamtal</span>
        </button>
        <p style="color: #8a8a9e; margin-top: 8px; font-size: 0.95rem;">Start video call</p>
        
        <div class="advanced-section">
          <button class="advanced-toggle" onclick="window.toggleAdvanced()">
            <span class="icon icon-small">${icons.settings}</span>
            <span>Avancerat / Advanced</span>
          </button>
          <div id="advancedContent" style="display: none; margin-top: 20px;">
            <label class="label-block">
              Kamera / Camera
              <select id="cameraSelect" class="device-select">
                <option value="">Standard / Default</option>
              </select>
            </label>
            <label class="label-block">
              Mikrofon / Microphone
              <select id="micSelect" class="device-select">
                <option value="">Standard / Default</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>
  `);
}

function showError(message) {
  render(`
    <div class="container">
      <div class="card">
        <div class="call-ended-icon">
          <span style="color: #d32f2f; font-size: 40px;">!</span>
        </div>
        <h1 class="title">Fel / Error</h1>
        <div class="error-box">
          <p>${message}</p>
        </div>
        <button class="btn btn-primary" onclick="window.location.reload()" style="margin-top: 24px;">
          <span class="icon">${icons.phone}</span>
          <span>Försök igen / Try again</span>
        </button>
      </div>
    </div>
  `);
}

window.toggleAdvanced = async function() {
  const content = document.getElementById('advancedContent');
  if (content) {
    const isVisible = content.style.display !== 'none';
    content.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
      const devices = await getMediaDevices();
      const cameraSelect = document.getElementById('cameraSelect');
      const micSelect = document.getElementById('micSelect');
      
      if (cameraSelect) {
        cameraSelect.innerHTML = '<option value="">Standard / Default</option>' +
          devices.cameras.map(d => `<option value="${d.deviceId}">${d.label || 'Kamera ' + d.deviceId.slice(0, 8)}</option>`).join('');
      }
      
      if (micSelect) {
        micSelect.innerHTML = '<option value="">Standard / Default</option>' +
          devices.microphones.map(d => `<option value="${d.deviceId}">${d.label || 'Mikrofon ' + d.deviceId.slice(0, 8)}</option>`).join('');
      }
    }
  }
};

window.copyLink = async function() {
  try {
    await navigator.clipboard.writeText(window.shareLink);
    const btn = document.querySelector('.btn-copy');
    if (btn) {
      const originalHTML = btn.innerHTML;
      btn.innerHTML = `<span class="icon">${icons.check}</span><span>Kopierat! / Copied!</span>`;
      btn.style.background = '#2e7d32';
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.background = '';
      }, 2000);
    }
  } catch (err) {
    alert('Länk: ' + window.shareLink);
  }
};

window.startCall = async function() {
  const btn = document.getElementById('startCallBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>Startar... / Starting...</span>';
  }
  
  try {
    const cameraId = document.getElementById('cameraSelect')?.value || null;
    const micId = document.getElementById('micSelect')?.value || null;
    
    localStream = await getLocalStream(cameraId, micId);
    
    const response = await fetch('/create-call', { method: 'POST' });
    const data = await response.json();
    
    currentRoomId = data.roomId;
    isInitiator = true;
    
    showWaitingUI(data.roomId, data.link, data.qrCode);
  } catch (err) {
    console.error('Error starting call:', err);
    showError('Kunde inte starta kamera/mikrofon.<br>Kontrollera behörigheter i webbläsaren.<br><br>Could not start camera/microphone.<br>Check browser permissions.');
  }
};

window.endCall = endCall;
window.toggleFullscreen = toggleFullscreen;

async function joinRoom(roomId) {
  currentRoomId = roomId;
  isInitiator = false;
  
  showJoiningUI();
  
  try {
    localStream = await getLocalStream(null, null);
    socket.emit('join', roomId);
  } catch (err) {
    console.error('Error joining room:', err);
    showError('Kunde inte komma åt kamera/mikrofon.<br>Kontrollera behörigheter i webbläsaren.<br><br>Could not access camera/microphone.<br>Check browser permissions.');
  }
}

socket.on('waiting', (data) => {
  console.log('Waiting for peer:', data.message);
});

socket.on('peer-joined', async (data) => {
  console.log('Peer joined:', data.peerId, 'isInitiator:', data.isInitiator);
  
  if (!data.isInitiator) {
    await createOffer(data.peerId);
  }
});

socket.on('offer', handleOffer);
socket.on('answer', handleAnswer);
socket.on('ice-candidate', handleIceCandidate);

socket.on('peer-left', (data) => {
  console.log('Peer left:', data.peerId);
  showCallEnded();
});

socket.on('error', (data) => {
  showError(data.message);
});

async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('room');
  
  if (roomId) {
    await joinRoom(roomId);
  } else {
    showStartUI();
  }
}

document.addEventListener('DOMContentLoaded', init);
