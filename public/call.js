const socket = io();
let peerConnection = null;
let localStream = null;
let currentRoomId = null;
let isInitiator = false;
let targetPeerId = null;
let currentContactCode = null;
let isMuted = false;
let isCameraOff = false;
let isSpeakerOn = false;
let currentFacingMode = 'user';
let availableCameras = [];
let callStartTime = null;
let callTimerInterval = null;
let networkQuality = 'good';
let networkCheckInterval = null;
let chatMessages = [];
let isChatVisible = false;
let voiceRecorder = null;
let voiceChunks = [];
let isRecordingVoice = false;
let voiceRecordingStartTime = null;

let callEnded = false;

const ICE_SERVERS = window.ICE_SERVERS || [
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
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
  cloud: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>`,
  cloudRain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16" y1="13" x2="16" y2="21"></line><line x1="8" y1="13" x2="8" y2="21"></line><line x1="12" y1="15" x2="12" y2="23"></line><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path></svg>`,
  contact: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
  print: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>`,
  mic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`,
  micOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`,
  camera: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`,
  cameraOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"></path></svg>`,
  cameraSwitch: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
  speaker: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`,
  speakerOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`,
  signalHigh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h.01"></path><path d="M7 20v-4"></path><path d="M12 20v-8"></path><path d="M17 20V8"></path></svg>`,
  signalMedium: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h.01"></path><path d="M7 20v-4"></path><path d="M12 20v-8"></path></svg>`,
  signalLow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h.01"></path><path d="M7 20v-4"></path></svg>`,
  chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
  send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
  micVoice: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line><circle cx="12" cy="13" r="2" fill="currentColor"></circle></svg>`,
  play: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
  share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>`,
  sms: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
  share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`
};

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

async function shareViaWebShare(contactName, link) {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Videosamtal',
        text: `Hej! Klicka för videosamtal med ${contactName}:`,
        url: link
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.log('Share cancelled or failed:', err);
      }
    }
  }
}

function sendSMS(contactName, link) {
  const message = `Hej! Klicka för videosamtal med ${contactName}: ${link}`;
  const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
  window.location.href = smsUrl;
}

async function copyLinkToClipboard(link) {
  try {
    await navigator.clipboard.writeText(link);
    showToast('Länk kopierad! / Link copied!');
  } catch (err) {
    const textArea = document.createElement('textarea');
    textArea.value = link;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('Länk kopierad! / Link copied!');
    } catch (e) {
      showToast('Kunde inte kopiera / Could not copy');
    }
    document.body.removeChild(textArea);
  }
}

function showToast(message) {
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 82, 147, 0.95);
    color: white;
    padding: 16px 32px;
    border-radius: 8px;
    font-size: 18px;
    z-index: 10000;
    animation: fadeIn 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

window.shareViaWebShare = shareViaWebShare;
window.sendSMS = sendSMS;
window.copyLinkToClipboard = copyLinkToClipboard;

function render(html) {
  document.getElementById('app').innerHTML = html;
}

function formatDateTime() {
  const now = new Date();
  const daysSv = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
  const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthsSv = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];
  
  const daySv = daysSv[now.getDay()];
  const dayEn = daysEn[now.getDay()];
  const date = now.getDate();
  const month = monthsSv[now.getMonth()];
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  
  return {
    daySv,
    dayEn,
    date,
    month,
    time: `${hours}:${minutes}`,
    fullSv: `${daySv} ${date} ${month}`,
    fullEn: `${dayEn}, ${month.charAt(0).toUpperCase() + month.slice(1)} ${date}`
  };
}

function renderDateTimeWidget() {
  const dt = formatDateTime();
  return `
    <div class="datetime-widget">
      <div class="time-display">${dt.time}</div>
      <div class="date-display">
        <div>${dt.fullSv}</div>
        <div class="date-en">${dt.fullEn}</div>
      </div>
    </div>
  `;
}

function renderInfoBar() {
  return '';
}

let dateTimeInterval = null;

function startDateTimeUpdates() {}

async function getMediaDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(d => d.kind === 'videoinput');
    availableCameras = cameras;
    return {
      cameras,
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
    
    const devices = await navigator.mediaDevices.enumerateDevices();
    availableCameras = devices.filter(d => d.kind === 'videoinput');
    
    return stream;
  } catch (err) {
    console.error('Error getting media:', err);
    throw err;
  }
}

let reconnectionAttempts = 0;
let maxReconnectionAttempts = 3;
let isReconnecting = false;

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
    
    if (!callEnded && (pc.connectionState === 'disconnected' || pc.connectionState === 'failed')) {
      showReconnectingUI();
      attemptReconnection();
    } else if (pc.connectionState === 'connected') {
      isReconnecting = false;
      hideReconnectingUI();
      startCallTimer();
      startNetworkMonitoring();
    }
  };
  
  return pc;
}

function showReconnectingUI() {
  if (isReconnecting) return;
  isReconnecting = true;
  
  const overlay = document.getElementById('reconnectOverlay');
  if (!overlay) {
    const container = document.querySelector('.video-container');
    if (container) {
      const reconnectDiv = document.createElement('div');
      reconnectDiv.id = 'reconnectOverlay';
      reconnectDiv.className = 'reconnect-overlay';
      reconnectDiv.innerHTML = `
        <div class="reconnect-content">
          <div class="reconnect-spinner"></div>
          <p class="reconnect-text">Återansluter...</p>
          <p class="reconnect-text-en">Reconnecting...</p>
        </div>
      `;
      container.appendChild(reconnectDiv);
    }
  }
}

function hideReconnectingUI() {
  const overlay = document.getElementById('reconnectOverlay');
  if (overlay) {
    overlay.remove();
  }
}

async function attemptReconnection() {
  if (reconnectionAttempts >= maxReconnectionAttempts) {
    showCallEnded();
    return;
  }
  
  reconnectionAttempts++;
  console.log(`Reconnection attempt ${reconnectionAttempts}/${maxReconnectionAttempts}`);
  
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  
  peerConnection = createPeerConnection();
  
  if (localStream) {
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });
  }
  
  if (isInitiator) {
    try {
      const offer = await peerConnection.createOffer({ iceRestart: true });
      await peerConnection.setLocalDescription(offer);
      
      socket.emit('offer', {
        targetPeerId,
        offer
      });
    } catch (err) {
      console.error('Reconnection offer failed:', err);
      if (reconnectionAttempts >= maxReconnectionAttempts) {
        showCallEnded();
      }
    }
  }
}

async function attemptIceRestart() {
  if (reconnectionAttempts >= maxReconnectionAttempts) {
    return;
  }
  
  reconnectionAttempts++;
  console.log(`ICE restart attempt ${reconnectionAttempts}/${maxReconnectionAttempts}`);
  
  if (peerConnection && isInitiator) {
    try {
      const offer = await peerConnection.createOffer({ iceRestart: true });
      await peerConnection.setLocalDescription(offer);
      
      socket.emit('offer', {
        targetPeerId,
        offer
      });
    } catch (err) {
      console.error('ICE restart failed:', err);
    }
  }
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
  callEnded = true;
  stopCallTimer();
  stopNetworkMonitoring();
  
  if (socket && socket.connected && currentRoomId) {
    socket.emit('leave-room', currentRoomId);
  }
  
  isMuted = false;
  isCameraOff = false;
  isSpeakerOn = false;
  
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

function toggleMute() {
  if (!localStream) return;
  
  const audioTrack = localStream.getAudioTracks()[0];
  if (audioTrack) {
    isMuted = !isMuted;
    audioTrack.enabled = !isMuted;
    updateMuteButton();
  }
}

function updateMuteButton() {
  const btn = document.getElementById('muteBtn');
  if (btn) {
    btn.innerHTML = `<span class="icon">${isMuted ? icons.micOff : icons.mic}</span>`;
    btn.classList.toggle('active', isMuted);
  }
}

function toggleCamera() {
  if (!localStream) return;
  
  const videoTrack = localStream.getVideoTracks()[0];
  if (videoTrack) {
    isCameraOff = !isCameraOff;
    videoTrack.enabled = !isCameraOff;
    updateCameraButton();
    
    const localVideo = document.getElementById('localVideo');
    if (localVideo) {
      localVideo.classList.toggle('camera-off', isCameraOff);
    }
  }
}

function updateCameraButton() {
  const btn = document.getElementById('cameraBtn');
  if (btn) {
    btn.innerHTML = `<span class="icon">${isCameraOff ? icons.cameraOff : icons.camera}</span>`;
    btn.classList.toggle('active', isCameraOff);
  }
}

async function switchCamera() {
  if (!localStream || availableCameras.length < 2) return;
  
  const currentTrack = localStream.getVideoTracks()[0];
  const currentDeviceId = currentTrack?.getSettings()?.deviceId;
  
  const currentIndex = availableCameras.findIndex(cam => cam.deviceId === currentDeviceId);
  const nextIndex = (currentIndex + 1) % availableCameras.length;
  const nextCamera = availableCameras[nextIndex];
  
  try {
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: nextCamera.deviceId } },
      audio: false
    });
    
    const newVideoTrack = newStream.getVideoTracks()[0];
    newVideoTrack.enabled = !isCameraOff;
    
    if (peerConnection) {
      const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
      }
    }
    
    if (currentTrack) {
      currentTrack.stop();
    }
    
    localStream.removeTrack(currentTrack);
    localStream.addTrack(newVideoTrack);
    
    const localVideo = document.getElementById('localVideo');
    if (localVideo) {
      localVideo.srcObject = localStream;
    }
    
    currentFacingMode = nextCamera.facingMode || 'user';
    
  } catch (err) {
    console.error('Error switching camera:', err);
  }
}

function toggleSpeaker() {
  isSpeakerOn = !isSpeakerOn;
  updateSpeakerButton();
  
  const remoteVideo = document.getElementById('remoteVideo');
  if (remoteVideo) {
    if (isSpeakerOn && remoteVideo.setSinkId) {
      remoteVideo.setSinkId('default').catch(() => {});
    }
  }
}

function updateSpeakerButton() {
  const btn = document.getElementById('speakerBtn');
  if (btn) {
    btn.innerHTML = `<span class="icon">${isSpeakerOn ? icons.speaker : icons.speakerOff}</span>`;
    btn.classList.toggle('active', isSpeakerOn);
  }
}

function formatCallDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function startCallTimer() {
  callStartTime = Date.now();
  
  if (callTimerInterval) clearInterval(callTimerInterval);
  
  callTimerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
    const timerEl = document.getElementById('callTimer');
    if (timerEl) {
      timerEl.textContent = formatCallDuration(elapsed);
    }
  }, 1000);
}

function stopCallTimer() {
  if (callTimerInterval) {
    clearInterval(callTimerInterval);
    callTimerInterval = null;
  }
  callStartTime = null;
}

async function checkNetworkQuality() {
  if (!peerConnection) return;
  
  try {
    const stats = await peerConnection.getStats();
    let packetsLost = 0;
    let packetsReceived = 0;
    let roundTripTime = 0;
    let bitrate = 0;
    
    stats.forEach(report => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        packetsLost = report.packetsLost || 0;
        packetsReceived = report.packetsReceived || 0;
        
        if (report.bytesReceived && report.timestamp) {
          bitrate = report.bytesReceived;
        }
      }
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        roundTripTime = report.currentRoundTripTime || 0;
      }
    });
    
    const lossRate = packetsReceived > 0 ? (packetsLost / (packetsLost + packetsReceived)) * 100 : 0;
    const rttMs = roundTripTime * 1000;
    
    let quality = 'good';
    if (lossRate > 10 || rttMs > 500) {
      quality = 'poor';
    } else if (lossRate > 5 || rttMs > 200) {
      quality = 'medium';
    }
    
    networkQuality = quality;
    updateNetworkIndicator();
    
  } catch (err) {
    console.error('Error checking network quality:', err);
  }
}

function updateNetworkIndicator() {
  const indicator = document.getElementById('networkIndicator');
  if (!indicator) return;
  
  indicator.className = 'network-indicator';
  
  switch (networkQuality) {
    case 'good':
      indicator.innerHTML = `<span class="icon">${icons.signalHigh}</span><span class="network-label">Utmärkt</span>`;
      indicator.classList.add('quality-good');
      break;
    case 'medium':
      indicator.innerHTML = `<span class="icon">${icons.signalMedium}</span><span class="network-label">Bra</span>`;
      indicator.classList.add('quality-medium');
      break;
    case 'poor':
      indicator.innerHTML = `<span class="icon">${icons.signalLow}</span><span class="network-label">Svag</span>`;
      indicator.classList.add('quality-poor');
      break;
  }
}

function startNetworkMonitoring() {
  checkNetworkQuality();
  if (networkCheckInterval) clearInterval(networkCheckInterval);
  networkCheckInterval = setInterval(checkNetworkQuality, 5000);
}

function stopNetworkMonitoring() {
  if (networkCheckInterval) {
    clearInterval(networkCheckInterval);
    networkCheckInterval = null;
  }
}

function showCallUI() {
  const hasMultipleCameras = availableCameras.length > 1;
  
  render(`
    <div class="video-container">
      <video id="remoteVideo" class="remote-video" autoplay playsinline></video>
      <video id="localVideo" class="local-video ${isCameraOff ? 'camera-off' : ''}" autoplay playsinline muted></video>
      <div class="call-overlay-top">
        <div id="networkIndicator" class="network-indicator quality-good">
          <span class="icon">${icons.signalHigh}</span>
          <span class="network-label">Utmärkt</span>
        </div>
      </div>
      <div class="status-bar">
        <span id="callTimer" class="call-timer">00:00</span>
      </div>
      <div id="chatPanel" class="chat-panel ${isChatVisible ? 'visible' : ''}">
        <div class="chat-header">
          <span>Chatt / Chat</span>
          <button class="btn btn-icon btn-small" onclick="window.toggleChat()">
            <span class="icon">${icons.close}</span>
          </button>
        </div>
        <div id="chatMessages" class="chat-messages">
          ${renderChatMessages()}
        </div>
        <div class="chat-input-area">
          <input type="file" id="photoInput" accept="image/*" style="display:none" onchange="window.handlePhotoSelect(event)">
          <button class="btn btn-icon chat-photo-btn" onclick="document.getElementById('photoInput').click()" title="Skicka bild / Send photo">
            <span class="icon">${icons.image}</span>
          </button>
          <button id="voiceRecordBtn" class="btn btn-icon chat-voice-btn" onclick="window.toggleVoiceRecording()" title="Röstmeddelande / Voice message">
            <span class="icon">${icons.mic}</span>
          </button>
          <input type="text" id="chatInput" class="chat-input" placeholder="Skriv meddelande... / Type message..." onkeypress="if(event.key==='Enter') window.sendChatMessage()">
          <button class="btn btn-icon chat-send-btn" onclick="window.sendChatMessage()">
            <span class="icon">${icons.send}</span>
          </button>
        </div>
      </div>
      <div class="call-controls">
        <button id="muteBtn" class="btn btn-icon control-btn ${isMuted ? 'active' : ''}" onclick="window.toggleMute()" aria-label="Mikrofon / Microphone">
          <span class="icon">${isMuted ? icons.micOff : icons.mic}</span>
        </button>
        <button id="cameraBtn" class="btn btn-icon control-btn ${isCameraOff ? 'active' : ''}" onclick="window.toggleCamera()" aria-label="Kamera / Camera">
          <span class="icon">${isCameraOff ? icons.cameraOff : icons.camera}</span>
        </button>
        ${hasMultipleCameras ? `<button id="switchCameraBtn" class="btn btn-icon control-btn" onclick="window.switchCamera()" aria-label="Byt kamera / Switch camera">
          <span class="icon">${icons.cameraSwitch}</span>
        </button>` : ''}
        <button id="speakerBtn" class="btn btn-icon control-btn ${isSpeakerOn ? 'active' : ''}" onclick="window.toggleSpeaker()" aria-label="Högtalare / Speaker">
          <span class="icon">${isSpeakerOn ? icons.speaker : icons.speakerOff}</span>
        </button>
        <button id="chatBtn" class="btn btn-icon control-btn" onclick="window.toggleChat()" aria-label="Chatt / Chat">
          <span class="icon">${icons.chat}</span>
        </button>
        <button id="fullscreenBtn" class="btn btn-icon control-btn" onclick="window.toggleFullscreen()" aria-label="Fullskärm / Fullscreen">
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
  
  startCallTimer();
  startNetworkMonitoring();
}

function renderChatMessages() {
  if (chatMessages.length === 0) {
    return `<div class="chat-empty">Inga meddelanden än<br>No messages yet</div>`;
  }
  
  return chatMessages.map((msg, index) => `
    <div class="chat-message ${msg.isMine ? 'mine' : 'theirs'}" data-index="${index}">
      ${msg.photo ? `<img src="${msg.photo}" class="chat-photo" alt="Photo" data-photo="${escapeJs(msg.photo)}">` : ''}
      ${msg.audio ? `<audio controls class="chat-audio" src="${msg.audio}"></audio>` : ''}
      ${msg.text ? `<div class="chat-bubble">${escapeHtml(msg.text)}</div>` : ''}
      <div class="chat-time">${msg.time}</div>
    </div>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeJs(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/</g, '\\x3C')
    .replace(/>/g, '\\x3E')
    .replace(/`/g, '\\x60')
    .replace(/\r?\n/g, ' ')
    .replace(/\//g, '\\x2F');
}

function addChatMessage(text, isMine, photo = null, audio = null) {
  const now = new Date();
  const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  
  chatMessages.push({ text, isMine, time, photo, audio });
  
  const messagesContainer = document.getElementById('chatMessages');
  if (messagesContainer) {
    messagesContainer.innerHTML = renderChatMessages();
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

window.toggleChat = function() {
  isChatVisible = !isChatVisible;
  const panel = document.getElementById('chatPanel');
  if (panel) {
    panel.classList.toggle('visible', isChatVisible);
    if (isChatVisible) {
      document.getElementById('chatInput')?.focus();
    }
  }
};

window.sendChatMessage = function() {
  const input = document.getElementById('chatInput');
  if (!input) return;
  
  const text = input.value.trim();
  if (!text) return;
  
  addChatMessage(text, true);
  socket.emit('chat-message', { roomId: currentRoomId, text });
  
  input.value = '';
};

function handleIncomingChat(text, photo = null, audio = null) {
  addChatMessage(text, false, photo, audio);
}

window.handlePhotoSelect = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    alert('Välj en bildfil / Please select an image file');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    alert('Bilden är för stor (max 5MB) / Image too large (max 5MB)');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const photoData = e.target.result;
    addChatMessage('', true, photoData);
    socket.emit('chat-message', { roomId: currentRoomId, text: '', photo: photoData });
  };
  reader.readAsDataURL(file);
  
  event.target.value = '';
};

window.openPhoto = function(photoData) {
  const overlay = document.createElement('div');
  overlay.className = 'photo-overlay';
  overlay.innerHTML = `
    <img src="${photoData}" alt="Photo">
    <button class="btn btn-icon photo-close" onclick="this.parentElement.remove()">
      <span class="icon">${icons.close}</span>
    </button>
  `;
  overlay.onclick = function(e) {
    if (e.target === overlay) overlay.remove();
  };
  document.body.appendChild(overlay);
};

window.startVoiceRecording = async function() {
  if (isRecordingVoice) return;
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    voiceRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm; codecs=opus' });
    voiceChunks = [];
    
    voiceRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        voiceChunks.push(e.data);
      }
    };
    
    voiceRecorder.onstop = () => {
      const audioBlob = new Blob(voiceChunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onload = function(e) {
        const audioData = e.target.result;
        addChatMessage('', true, null, audioData);
        socket.emit('chat-message', { roomId: currentRoomId, text: '', photo: null, audio: audioData });
        stream.getTracks().forEach(track => track.stop());
      };
      reader.readAsDataURL(audioBlob);
    };
    
    isRecordingVoice = true;
    voiceRecordingStartTime = Date.now();
    voiceRecorder.start();
    
    const btn = document.getElementById('voiceRecordBtn');
    if (btn) {
      btn.classList.add('recording');
      btn.innerHTML = `<span class="icon">${icons.mic}</span><span class="recording-time" id="recordingTime">0:00</span>`;
    }
    
    window.voiceRecordingTimer = setInterval(() => {
      const timeEl = document.getElementById('recordingTime');
      if (timeEl && isRecordingVoice) {
        const elapsed = Math.floor((Date.now() - voiceRecordingStartTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        timeEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
      }
    }, 100);
    
    setTimeout(() => {
      window.stopVoiceRecording();
    }, 60000);
    
  } catch (err) {
    console.error('Error starting voice recording:', err);
    alert('Kunde inte starta inspelning / Could not start recording');
  }
};

window.stopVoiceRecording = function() {
  if (!isRecordingVoice) return;
  
  isRecordingVoice = false;
  
  if (voiceRecorder && voiceRecorder.state !== 'inactive') {
    voiceRecorder.stop();
  }
  voiceRecorder = null;
  voiceChunks = [];
  
  if (window.voiceRecordingTimer) {
    clearInterval(window.voiceRecordingTimer);
  }
  
  const btn = document.getElementById('voiceRecordBtn');
  if (btn) {
    btn.classList.remove('recording');
    btn.innerHTML = `<span class="icon">${icons.mic}</span>`;
  }
};

window.playVoiceMessage = function(audioData) {
  if (window.currentAudio) {
    window.currentAudio.pause();
  }
  
  const audio = new Audio(audioData);
  window.currentAudio = audio;
  audio.play();
};

window.toggleVoiceRecording = function() {
  if (isRecordingVoice) {
    window.stopVoiceRecording();
  } else {
    window.startVoiceRecording();
  }
};

const scheduledCalls = [];

function getScheduledCalls() {
  try {
    const data = localStorage.getItem('samtal_schedules');
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
}

function saveScheduledCall(schedule) {
  const schedules = getScheduledCalls();
  schedules.push(schedule);
  localStorage.setItem('samtal_schedules', JSON.stringify(schedules));
}

function deleteScheduledCall(index) {
  const schedules = getScheduledCalls();
  schedules.splice(index, 1);
  localStorage.setItem('samtal_schedules', JSON.stringify(schedules));
}

window.showScheduleScreen = function(contactCode = null) {
  const contacts = getSavedContacts();
  const schedules = getScheduledCalls();
  
  render(`
    <div class="container">
      <div class="card">
        ${renderInfoBar()}
        <div class="logo">
          <div class="logo-icon">
            ${icons.calendar}
          </div>
        </div>
        <h1 class="title">Schemalagda samtal</h1>
        <p class="subtitle">Scheduled calls</p>
        
        <div class="schedule-list" style="margin-top: 24px;">
          ${schedules.length === 0 ? `
            <p style="color: var(--text-muted); text-align: center; padding: 32px 0;">
              Inga schemalagda samtal än.<br>
              No scheduled calls yet.
            </p>
          ` : schedules.map((s, i) => `
            <div class="schedule-item" style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 16px;
              border: 2px solid #e8e8e8;
              border-radius: 12px;
              margin-bottom: 12px;
              background: var(--card-bg);
            ">
              <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--text-dark);">${s.contactName || 'Familj'}</div>
                <div style="font-size: 0.875rem; color: var(--sweden-blue); margin-top: 4px;">${formatScheduleDate(s.dateTime)}</div>
                ${s.note ? `<div style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">${escapeHtml(s.note)}</div>` : ''}
              </div>
              <button class="btn btn-icon btn-small btn-danger" onclick="window.confirmDeleteSchedule(${i})" title="Ta bort / Delete">
                <span class="icon" style="width: 20px; height: 20px;">${icons.hangup}</span>
              </button>
            </div>
          `).join('')}
        </div>
        
        ${contacts.length > 0 ? `
          <p class="schedule-label" style="margin-top: 24px; margin-bottom: 12px; font-weight: 600;">Nytt schemalagt samtal / New scheduled call</p>
          <select id="scheduleContact" class="device-select" style="margin-top: 0;">
            ${contacts.map(c => `<option value="${c.code}">${c.name || 'Familj'} (${c.code})</option>`).join('')}
          </select>
        ` : ''}
        
        <p class="schedule-label" style="margin-top: 16px;">Datum och tid / Date and time</p>
        <input type="datetime-local" id="scheduleDateTime" class="schedule-input">
        
        <p class="schedule-label" style="margin-top: 16px;">Anteckning / Note (valfritt)</p>
        <textarea id="scheduleNote" class="schedule-textarea" placeholder="T.ex. Vi pratar vid lunch / Let's have lunch"></textarea>
        
        <button class="btn btn-primary" onclick="window.saveNewSchedule()" style="margin-top: 24px;">
          <span class="icon">${icons.check}</span>
          <span>Spara / Save</span>
        </button>
        
        <button class="btn btn-secondary" onclick="window.showStartScreen()" style="margin-top: 16px;">
          <span>Tillbaka / Back</span>
        </button>
      </div>
    </div>
  `);
  
  startDateTimeUpdates();
};

function formatScheduleDate(dateTimeStr) {
  const date = new Date(dateTimeStr);
  const daysSv = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
  const monthsSv = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  
  const dayName = daysSv[date.getDay()];
  const day = date.getDate();
  const month = monthsSv[date.getMonth()];
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${dayName} ${day} ${month} kl ${hours}:${minutes}`;
}

window.saveNewSchedule = function() {
  const contactSelect = document.getElementById('scheduleContact');
  const dateTime = document.getElementById('scheduleDateTime').value;
  const note = document.getElementById('scheduleNote').value.trim();
  
  if (!contactSelect || !contactSelect.value) {
    alert('Välj en kontakt först / Select a contact first');
    return;
  }
  
  if (!dateTime) {
    alert('Välj datum och tid / Select date and time');
    return;
  }
  
  const contacts = getSavedContacts();
  const contact = contacts.find(c => c.code === contactSelect.value);
  
  saveScheduledCall({
    contactCode: contactSelect.value,
    contactName: contact ? contact.name : 'Familj',
    dateTime,
    note,
    createdAt: Date.now()
  });
  
  window.showScheduleScreen();
};

window.confirmDeleteSchedule = function(index) {
  if (confirm('Ta bort detta schemalagda samtal?\n\nDelete this scheduled call?')) {
    deleteScheduledCall(index);
    window.showScheduleScreen();
  }
};

function showCallEnded() {
  callEnded = true;
  stopCallTimer();
  stopNetworkMonitoring();
  
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  
  targetPeerId = null;
  
  if (dateTimeInterval) clearInterval(dateTimeInterval);
  
  render(`
    <div class="container">
      <div class="card">
        ${renderInfoBar()}
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
  
  startDateTimeUpdates();
}

window.showNewScheduleForm = function(contactCode) {
  const contacts = getSavedContacts();
  const contact = contacts.find(c => c.code === contactCode);
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content schedule-modal">
      <h2 style="font-size: 1.25rem; margin-bottom: 8px;">Schemalägg ett samtal</h2>
      <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 24px;">Schedule a call with ${contact ? contact.name || 'Familj' : 'Familj'}</p>
      
      <div class="schedule-form">
        <label class="schedule-label" for="date">
          <span class="schedule-label-icon">${icons.calendar}</span>
          Välj datum och tid
        </label>
        <input type="datetime-local" id="scheduleDateTime" class="schedule-input">
        
        <p class="schedule-hint">Välj datum och tid för samtalet</p>
        <p class="schedule-hint" style="margin-top: 8px;">Select date and time</p>
        
        <div class="schedule-actions">
          <button class="btn btn-primary" onclick="window.saveScheduleModal('${contactCode}')">
            <span class="icon">${icons.check}</span>
            <span>Spara / Save</span>
          </button>
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()" style="margin-top: 8px;">
            <span>Avbryt / Cancel</span>
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
};

window.saveScheduleModal = function(contactCode) {
  const dateTime = document.getElementById('scheduleDateTime').value;
  
  if (!dateTime) {
    alert('Välj datum och tid / Select date and time');
    return;
  }
  
  const contacts = getSavedContacts();
  const contact = contacts.find(c => c.code === contactCode);
  
  saveScheduledCall({
    contactCode,
    contactName: contact ? contact.name || 'Familj' : 'Familj',
    dateTime,
    note: '',
    createdAt: Date.now()
  });
  
  document.querySelector('.modal-overlay').remove();
  window.showScheduleScreen();
};

function updateScheduleList() {
  const container = document.getElementById('scheduleList');
  if (!container) return;
  
  const schedules = getScheduledCalls();
  container.innerHTML = '';
  
  schedules.forEach((schedule, index) => {
    const contact = getSavedContacts().find(c => c.code === schedule.contactCode);
    const row = document.createElement('div');
    row.className = 'schedule-list-item';
    row.innerHTML = `
      <div class="schedule-item-header">
        <span>${contact ? contact.name || 'Familj' : schedule.contactName || 'Familj'}</span>
        <span class="schedule-time">${formatScheduleDate(schedule.dateTime)}</span>
      </div>
      ${schedule.note ? `
        <p class="schedule-note">${escapeHtml(schedule.note)}</p>
      ` : ''}
      <button class="btn btn-small btn-danger" onclick="window.deleteScheduleByIndex(${index})">
        <span class="icon">${icons.hangup}</span>
      </button>
    `;
    container.appendChild(row);
  });
}

window.deleteScheduleByIndex = function(index) {
  if (confirm('Ta bort detta schemalagda samtal?\n\nDelete this scheduled call?')) {
    deleteScheduledCall(index);
    updateScheduleList();
  }
};

window.deleteSchedule = function(contactCode, scheduleIndex) {
  deleteScheduledCall(scheduleIndex);
  updateScheduleList();
};

window.confirmDeleteSchedule = function(index) {
  if (confirm('Ta bort detta schemalagda samtal?\n\nDelete this scheduled call?')) {
    deleteScheduledCall(index);
    window.showScheduleScreen();
  }
};

function showWaitingUI(roomId, link, qrCode) {
  render(`
    <div class="container">
      <div class="card">
        ${renderInfoBar()}
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
          <p class="link-text">${escapeHtml(link)}</p>
        </div>
        
        <div class="share-buttons" style="margin-top: 16px;">
          ${isMobile() ? `
          <button class="btn btn-primary" onclick="window.shareViaWebShare('${escapeJs(currentRoomId)}', '${escapeJs(currentContactName || 'Familj')}')" title="Dela / Share">
            <span class="icon">${icons.share}</span>
          </button>
          <button class="btn btn-secondary" onclick="window.sendSMS('${escapeJs(currentContactName || 'Familj')}', '${escapeJs(link)}')" title="SMS">
            <span class="icon">${icons.sms}</span>
          </button>
          ` : ''}
          <button class="btn btn-primary" onclick="window.copyLinkToClipboard('${escapeJs(link)}')" title="Kopiera länk / Copy link">
            <span class="icon">${icons.copy}</span>
          </button>
        </div>
        
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
  startDateTimeUpdates();
}

function showJoiningUI() {
  render(`
    <div class="container">
      <div class="card">
        ${renderInfoBar()}
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
  
  startDateTimeUpdates();
}

function _renderStartScreen() {
  const savedContacts = getSavedContacts();
  const hasContacts = savedContacts.length > 0;
  
  render(`
    <div class="container">
      <div class="card">
        ${renderInfoBar()}
        <div class="logo">
          <img src="/logo.png" alt="Samtalsvän" class="logo-image">
        </div>
        <h1 class="title">Samtalsvän</h1>
        <p class="subtitle">Videosamtal för alla</p>
        <p class="subtitle" style="margin-top: 0;">Video calls for everyone</p>
        
        <button id="startCallBtn" class="btn btn-primary" onclick="window.startCall()" style="margin-top: 32px;">
          <span class="icon">${icons.video}</span>
          <span>Starta videosamtal</span>
        </button>
        <p style="color: #8a8a9e; margin-top: 8px; font-size: 0.95rem;">Start video call</p>
        
        <div class="divider-section">
          <div class="divider"></div>
          <span>eller / or</span>
          <div class="divider"></div>
        </div>
        
        <button id="createContactBtn" class="btn btn-secondary" onclick="window.showCreateContact()" style="margin-top: 16px;">
          <span class="icon">${icons.contact}</span>
          <span>Skapa kontaktkort / Create contact card</span>
        </button>
        <p style="color: #8a8a9e; margin-top: 8px; font-size: 0.95rem;">For elderly to call you</p>
        
        ${hasContacts ? `
          <button id="manageContactsBtn" class="btn btn-secondary" onclick="window.showManageContacts()" style="margin-top: 16px;">
            <span class="icon">${icons.contact}</span>
            <span>Mina kontakter / My contacts (${savedContacts.length})</span>
          </button>
        ` : ''}
        
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
  
  startDateTimeUpdates();
}

function _renderCreateContactScreen() {
  render(`
    <div class="container">
      <div class="card">
        ${renderInfoBar()}
        <div class="logo">
          <div class="logo-icon">
            ${icons.contact}
          </div>
        </div>
        <h1 class="title">Kontaktkort</h1>
        <p class="subtitle">Contact Card</p>
        
        <p style="color: var(--text-muted); margin: 24px 0 16px; text-align: left;">
          Skapa ett kontaktkort för din anhöriga. De kan skanna QR-koden for att ringa dig direkt.<br><br>
          Create a contact card for your elderly relative. They can scan the QR code to call you directly.
        </p>
        
        <label class="label-block" style="text-align: left;">
          Namn / Name (valfritt / optional)
          <input type="text" id="contactName" class="device-select" placeholder="t.ex. Farmor Anna" style="margin-top: 8px;">
        </label>
        
        <button id="createContactBtn" class="btn btn-primary" onclick="window.createContact()" style="margin-top: 24px;">
          <span class="icon">${icons.contact}</span>
          <span>Skapa kontaktkort / Create card</span>
        </button>
        
        <button class="btn btn-secondary" onclick="window.showStartScreen()" style="margin-top: 16px;">
          <span>Tillbaka / Back</span>
        </button>
      </div>
    </div>
  `);
  
  startDateTimeUpdates();
}

function _renderContactCreatedScreen(data) {
  render(`
    <div class="container">
      <div class="card">
        ${renderInfoBar()}
        <div class="logo">
          <div class="logo-icon">
            ${icons.check}
          </div>
        </div>
        <h1 class="title">Kontaktkort skapat!</h1>
        <p class="subtitle">Contact card created!</p>
        
        <div class="contact-code-display">
          <div class="contact-label">Din kod / Your code:</div>
          <div class="contact-code">${data.code}</div>
        </div>
        
        <div class="qr-section">
          <p class="qr-title">Skanna för att ringa / Scan to call</p>
          <img src="${data.qrCode}" alt="QR Code" class="qr-code" />
        </div>
        
        <button class="btn btn-primary" onclick="window.printContactCard('${escapeJs(data.code)}', '${escapeJs(data.name)}', '${escapeJs(data.qrCode)}', '${escapeJs(data.qrPrint)}')">
          <span class="icon">${icons.print}</span>
          <span>Skriv ut kort / Print card</span>
        </button>
        
        <button class="btn btn-secondary" onclick="window.startListeningForCalls('${escapeJs(data.code)}')" style="margin-top: 16px;">
          <span class="icon">${icons.phone}</span>
          <span>Vänta på samtal / Wait for calls</span>
        </button>
        
        <button class="btn btn-secondary" onclick="window.showManageContacts()" style="margin-top: 8px;">
          <span class="icon">${icons.contact}</span>
          <span>Mina kontakter / My contacts</span>
        </button>
        
        <button class="btn btn-secondary" onclick="window.showStartScreen()" style="margin-top: 8px;">
          <span>Tillbaka / Back</span>
        </button>
      </div>
    </div>
  `);
  
  startDateTimeUpdates();
}

function _renderListeningScreen(code, name) {
  render(`
    <div class="container">
      <div class="card">
        ${renderInfoBar()}
        <div class="logo">
          <div class="logo-icon">
            ${icons.phone}
          </div>
        </div>
        <h1 class="title">Väntar på samtal</h1>
        <p class="subtitle">Waiting for calls</p>
        <p style="color: var(--text-muted); margin-top: 16px;">${name}</p>
        <p style="color: var(--text-muted);">Kod: ${code}</p>
        
        <div class="waiting-dots" style="margin-top: 32px;"><span></span><span></span><span></span></div>
        
        <p style="color: var(--text-muted); margin-top: 24px;">
          Lämna denna sida öppen. Din anhöriga kan ringa dig när som helst genom att skanna sitt kontaktkort.<br><br>
          Keep this page open. Your relative can call you anytime by scanning their contact card.
        </p>
        
        <button class="btn btn-secondary" onclick="window.showStartScreen()" style="margin-top: 32px;">
          <span>Avbryt / Cancel</span>
        </button>
      </div>
    </div>
  `);
  
  startDateTimeUpdates();
}

function _renderIncomingCallScreen(data) {
  render(`
    <div class="container incoming-call">
      <div class="card incoming-call-card">
        <div class="incoming-call-icon">
          ${icons.phone}
        </div>
        <h1 class="title">Inkommande samtal!</h1>
        <p class="subtitle">Incoming call!</p>
        <p style="color: var(--text-muted); margin-top: 16px; font-size: 1.25rem;">${escapeHtml(data.callerName || 'Anhörig')}</p>
        
        <div class="waiting-dots" style="margin-top: 24px;"><span></span><span></span><span></span></div>
        
        <button id="acceptCallBtn" class="btn btn-primary" onclick="window.acceptIncomingCall('${escapeJs(data.roomId)}')" style="margin-top: 32px;">
          <span class="icon">${icons.phone}</span>
          <span>Svara / Answer</span>
        </button>
        
        <button class="btn btn-danger" onclick="window.declineIncomingCall()" style="margin-top: 16px;">
          <span class="icon">${icons.hangup}</span>
          <span>Avvisa / Decline</span>
        </button>
      </div>
    </div>
  `);
  
  playRingtone();
}

function _renderDialingScreen(code) {
  render(`
    <div class="container">
      <div class="card">
        ${renderInfoBar()}
        <div class="logo">
          <div class="logo-icon">
            ${icons.phone}
          </div>
        </div>
        <h1 class="title">Ringer...</h1>
        <p class="subtitle">Calling...</p>
        <p style="color: var(--text-muted); margin-top: 16px;">Kod: ${code}</p>
        
        <div class="waiting-dots" style="margin-top: 32px;"><span></span><span></span><span></span></div>
        
        <button class="btn btn-danger" onclick="window.endCall()" style="margin-top: 32px;">
          <span class="icon">${icons.hangup}</span>
          <span>Avbryt / Cancel</span>
        </button>
      </div>
    </div>
  `);
  
  startDateTimeUpdates();
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

function playRingtone() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const playTone = (freq, start, duration) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + start);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + start + duration);
      oscillator.start(audioContext.currentTime + start);
      oscillator.stop(audioContext.currentTime + start + duration);
    };
    
    playTone(800, 0, 0.3);
    playTone(600, 0.35, 0.3);
    playTone(800, 1, 0.3);
    playTone(600, 1.35, 0.3);
  } catch (e) {
    console.warn('Could not play ringtone:', e);
  }
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

window.showStartScreen = function() {
  _renderStartScreen();
};

window.showManageContacts = function() {
  _renderManageContactsScreen();
};

window.showCreateContact = function() {
  _renderCreateContactScreen();
};

window.createContact = async function() {
  const btn = document.getElementById('createContactBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>Skapar... / Creating...</span>';
  }
  
  try {
    const name = document.getElementById('contactName')?.value || 'Familj / Family';
    
    const response = await fetch('/create-contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    
    const data = await response.json();
    currentContactCode = data.code;
    
    saveContactToLocal(data.code, data.name, data.qrCode, data.qrPrint);
    
    _renderContactCreatedScreen(data);
  } catch (err) {
    console.error('Error creating contact:', err);
    showError('Kunde inte skapa kontaktkort.<br><br>Could not create contact card.');
  }
};

function getSavedContacts() {
  try {
    const contacts = localStorage.getItem('samtal_contacts');
    return contacts ? JSON.parse(contacts) : [];
  } catch (err) {
    console.error('Error loading contacts:', err);
    return [];
  }
}

function saveContactToLocal(code, name, qrCode, qrPrint) {
  try {
    const contacts = getSavedContacts();
    const existingIndex = contacts.findIndex(c => c.code === code);
    
    if (existingIndex >= 0) {
      contacts[existingIndex] = { code, name, qrCode, qrPrint, createdAt: Date.now() };
    } else {
      contacts.push({ code, name, qrCode, qrPrint, createdAt: Date.now() });
    }
    
    localStorage.setItem('samtal_contacts', JSON.stringify(contacts));
  } catch (err) {
    console.error('Error saving contact:', err);
  }
}

function deleteContactFromLocal(code) {
  try {
    const contacts = getSavedContacts();
    const filtered = contacts.filter(c => c.code !== code);
    localStorage.setItem('samtal_contacts', JSON.stringify(filtered));
  } catch (err) {
    console.error('Error deleting contact:', err);
  }
}

function _renderManageContactsScreen() {
  const contacts = getSavedContacts();
  
  render(`
    <div class="container">
      <div class="card">
        ${renderInfoBar()}
        <div class="logo">
          <div class="logo-icon">
            ${icons.contact}
          </div>
        </div>
        <h1 class="title">Mina kontakter</h1>
        <p class="subtitle">My Contacts</p>
        
        <div class="contacts-list" style="margin-top: 24px;">
          ${contacts.length === 0 ? `
            <p style="color: var(--text-muted); text-align: center; padding: 32px 0;">
              Du har inga sparade kontaktkort än.<br>
              You haven't created any contact cards yet.
            </p>
          ` : contacts.map(contact => `
            <div class="contact-item" style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 16px;
              border: 2px solid #e8e8e8;
              border-radius: 12px;
              margin-bottom: 12px;
              background: var(--card-bg);
            ">
              <div style="flex: 1; text-align: left;">
                <div style="font-weight: 600; font-size: 1.125rem; color: var(--text-dark);">${escapeHtml(contact.name || 'Familj / Family')}</div>
                <div style="font-size: 0.875rem; color: var(--text-muted); margin-top: 4px;">Kod: ${escapeHtml(contact.code)}</div>
              </div>
              <div style="display: flex; gap: 8px;">
                ${isMobile() ? `
                <button class="btn btn-icon btn-small" onclick="window.shareContactLink('${escapeJs(contact.code)}', '${escapeJs(contact.name || 'Familj')}')" title="Dela / Share">
                  <span class="icon" style="width: 20px; height: 20px;">${icons.share}</span>
                </button>
                <button class="btn btn-icon btn-small" onclick="window.sendContactSMS('${escapeJs(contact.code)}', '${escapeJs(contact.name || 'Familj')}')" title="SMS">
                  <span class="icon" style="width: 20px; height: 20px;">${icons.sms}</span>
                </button>
                ` : ''}
                <button class="btn btn-icon btn-small" onclick="window.copyContactLink('${escapeJs(contact.code)}')" title="Kopiera länk / Copy link">
                  <span class="icon" style="width: 20px; height: 20px;">${icons.copy}</span>
                </button>
                <button class="btn btn-icon btn-small" onclick="window.printContactCard('${escapeJs(contact.code)}', '${escapeJs(contact.name)}', '${escapeJs(contact.qrCode)}', '${escapeJs(contact.qrPrint)}')" title="Skriv ut / Print">
                  <span class="icon" style="width: 20px; height: 20px;">${icons.print}</span>
                </button>
                <button class="btn btn-icon btn-small btn-danger" onclick="window.deleteContact('${escapeJs(contact.code)}')" title="Ta bort / Delete">
                  <span class="icon" style="width: 20px; height: 20px;">${icons.trash}</span>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
        
        <button class="btn btn-primary" onclick="window.showCreateContact()" style="margin-top: 24px;">
          <span class="icon">${icons.contact}</span>
          <span>Nytt kontaktkort / New contact</span>
        </button>
        
        <button class="btn btn-secondary" onclick="window.showStartScreen()" style="margin-top: 16px;">
          <span>Tillbaka / Back</span>
        </button>
      </div>
    </div>
  `);
  
  startDateTimeUpdates();
}

window.deleteContact = async function(code) {
  if (confirm('Är du säker att att vill ta bort kontaktkortet med koden "' + code + '"?\n\nTabort permanent / Delete permanently?')) {
    try {
      const response = await fetch('/contact/' + code, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        deleteContactFromLocal(code);
        _renderManageContactsScreen();
      } else {
        deleteContactFromLocal(code);
        _renderManageContactsScreen();
      }
    } catch (err) {
      console.error('Error deleting contact:', err);
      deleteContactFromLocal(code);
      _renderManageContactsScreen();
    }
  }
};

window.printContactCard = function(code, name, qrCode, qrPrint) {
  const qrImage = qrPrint || qrCode;
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Kontaktkort - ${code}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          background: #ffffff;
          padding: 20px;
        }
        .card {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border: 8px solid #005293;
          border-radius: 20px;
          padding: 40px;
          text-align: center;
        }
        .header {
          border-bottom: 4px solid #fecb00;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .title {
          font-size: 48px;
          font-weight: bold;
          color: #005293;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 24px;
          color: #333333;
        }
        .qr-section {
          margin: 30px 0;
        }
        .qr-section img {
          width: 200px;
          height: 200px;
          border: 4px solid #005293;
          border-radius: 10px;
        }
        .qr-hint {
          font-size: 18px;
          color: #333333;
          margin-top: 15px;
        }
        .code-section {
          background: #fecb00;
          border: 4px solid #005293;
          border-radius: 15px;
          padding: 25px;
          margin: 30px 0;
        }
        .code-label {
          font-size: 20px;
          color: #333333;
          margin-bottom: 15px;
        }
        .code {
          font-size: 56px;
          font-weight: bold;
          letter-spacing: 8px;
          color: #1a1a2e;
        }
        .instructions {
          margin-top: 30px;
          padding: 20px;
          background: #f0f0f0;
          border-radius: 10px;
          text-align: left;
        }
        .instructions h3 {
          font-size: 20px;
          color: #005293;
          margin-bottom: 15px;
        }
        .instructions p {
          font-size: 16px;
          color: #333333;
          line-height: 1.6;
          margin-bottom: 10px;
        }
        .instructions-number {
          font-weight: bold;
          color: #005293;
        }
        @media print {
          body {
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .card {
            border: 8px solid #005293;
            page-break-inside: avoid;
          }
          .code-section {
            background: #fecb00 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .instructions {
            background: #f0f0f0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="title">SAMTALSVÄN</div>
          <div class="subtitle">${name}</div>
        </div>
        
        <div class="qr-section">
          <img src="${qrImage}" alt="QR Code">
          <div class="qr-hint">
            Skanna QR-koden med kameran<br>
            Scan QR code with camera
          </div>
        </div>
        
        <div class="code-section">
          <div class="code-label">DIN KOD / YOUR CODE:</div>
          <div class="code">${code}</div>
        </div>
        
        <div class="instructions">
          <h3>Så här ringer du / How to call:</h3>
          <p><span class="instructions-number">1.</span> Öppna kameran på din telefon / Open camera on phone</p>
          <p><span class="instructions-number">2.</span> Rikta kameran mot QR-koden / Point camera at QR code</p>
          <p><span class="instructions-number">3.</span> Tryck på länken som visas / Tap the link shown</p>
          <p><span class="instructions-number">4.</span> Vänta på svar / Wait for answer</p>
        </div>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 250);
};

window.startListeningForCalls = function(code) {
  currentContactCode = code;
  socket.emit('register-contact', code);
};

window.acceptIncomingCall = async function(roomId) {
  try {
    const cameraId = document.getElementById('cameraSelect')?.value || null;
    const micId = document.getElementById('micSelect')?.value || null;
    
    if (!localStream) {
      localStream = await getLocalStream(cameraId, micId);
    }
    
    socket.emit('accept-call', roomId);
  } catch (err) {
    console.error('Error accepting call:', err);
    showError('Kunde inte svara på samtalet.<br><br>Could not answer the call.');
  }
};

window.declineIncomingCall = function() {
  window.location.reload();
};

window.endCall = endCall;
window.toggleFullscreen = toggleFullscreen;
window.toggleMute = toggleMute;
window.toggleCamera = toggleCamera;
window.switchCamera = switchCamera;
window.toggleSpeaker = toggleSpeaker;

async function joinRoom(roomId) {
  currentRoomId = roomId;
  isInitiator = false;
  
  showJoiningUI();
  
  try {
    const cameraId = document.getElementById('cameraSelect')?.value || null;
    const micId = document.getElementById('micSelect')?.value || null;
    
    localStream = await getLocalStream(cameraId, micId);
    socket.emit('join', roomId);
  } catch (err) {
    console.error('Error joining room:', err);
    showError('Kunde inte komma åt kamera/mikrofon.<br>Kontrollera behörigheter i webbläsaren.<br><br>Could not access camera/microphone.<br>Check browser permissions.');
  }
}

async function dialContact(code) {
  _renderDialingScreen(code);
  
  try {
    const cameraId = document.getElementById('cameraSelect')?.value || null;
    const micId = document.getElementById('micSelect')?.value || null;
    
    localStream = await getLocalStream(cameraId, micId);
    socket.emit('call-contact', code);
  } catch (err) {
    console.error('Error dialing contact:', err);
    showError('Kunde inte ringa.<br>Kontrollera behörigheter i webbläsaren.<br><br>Could not call.<br>Check browser permissions.');
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

socket.on('contact-registered', (data) => {
  console.log('Contact registered:', data.code);
  _renderListeningScreen(data.code, data.name);
});

socket.on('contact-replaced', () => {
  showError('Du har loggats in från en annan enhet.<br><br>You have been logged in from another device.');
});

socket.on('incoming-call', (data) => {
  console.log('Incoming call from:', data.callerName);
  _renderIncomingCallScreen(data);
});

socket.on('calling', (data) => {
  console.log('Calling:', data.message);
});

socket.on('call-accepted', async (data) => {
  console.log('Call accepted by:', data.peerId);
  targetPeerId = data.peerId;
  
  if (!peerConnection) {
    peerConnection = createPeerConnection();
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });
  }
  
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  
  socket.emit('offer', {
    targetPeerId: data.peerId,
    offer
  });
});

socket.on('error', (data) => {
  showError(data.message);
});

socket.on('chat-message', (data) => {
  handleIncomingChat(data.text, data.photo, data.audio);
});

async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('room');
  const contactCode = urlParams.get('contact');
  const dialCode = urlParams.get('dial');
  
  if (roomId) {
    await joinRoom(roomId);
  } else if (dialCode) {
    await dialContact(dialCode);
  } else if (contactCode) {
    currentContactCode = contactCode;
    _renderStartScreen();
    setTimeout(() => {
      socket.emit('register-contact', contactCode);
    }, 500);
  } else {
    _renderStartScreen();
  }
}

document.addEventListener('DOMContentLoaded', init);
