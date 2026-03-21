const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const QRCode = require('qrcode');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const rooms = new Map();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post('/create-call', async (req, res) => {
  const roomId = crypto.randomUUID();
  const link = `${BASE_URL}?room=${roomId}`;
  
  try {
    const qrDataUrl = await QRCode.toDataURL(link, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff'
      }
    });
    
    rooms.set(roomId, {
      peers: [],
      createdAt: Date.now()
    });
    
    res.json({
      roomId,
      link,
      qrCode: qrDataUrl
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    res.status(500).json({ error: 'Failed to create call' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join', (roomId) => {
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'Rummet finns inte / Room does not exist' });
      return;
    }
    
    if (room.peers.length >= 2) {
      socket.emit('error', { message: 'Rummet är fullt / Room is full' });
      return;
    }
    
    socket.join(roomId);
    room.peers.push(socket.id);
    socket.roomId = roomId;
    
    console.log(`User ${socket.id} joined room ${roomId}. Peers: ${room.peers.length}`);
    
    if (room.peers.length === 1) {
      socket.emit('waiting', { message: 'Väntar på deltagare... / Waiting for participant...' });
    } else if (room.peers.length === 2) {
      const [initiator] = room.peers;
      io.to(initiator).emit('peer-joined', { peerId: socket.id });
      socket.emit('peer-joined', { peerId: initiator, isInitiator: true });
    }
  });
  
  socket.on('offer', (data) => {
    const { targetPeerId, offer } = data;
    socket.to(targetPeerId).emit('offer', {
      offer,
      fromPeerId: socket.id
    });
  });
  
  socket.on('answer', (data) => {
    const { targetPeerId, answer } = data;
    socket.to(targetPeerId).emit('answer', {
      answer,
      fromPeerId: socket.id
    });
  });
  
  socket.on('ice-candidate', (data) => {
    const { targetPeerId, candidate } = data;
    socket.to(targetPeerId).emit('ice-candidate', {
      candidate,
      fromPeerId: socket.id
    });
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        room.peers = room.peers.filter(id => id !== socket.id);
        
        room.peers.forEach(peerId => {
          io.to(peerId).emit('peer-left', { peerId: socket.id });
        });
        
        if (room.peers.length === 0) {
          rooms.delete(socket.roomId);
          console.log(`Room ${socket.roomId} deleted (empty)`);
        }
      }
    }
  });
});

setInterval(() => {
  const now = Date.now();
  const maxAge = 2 * 60 * 60 * 1000;
  
  for (const [roomId, room] of rooms.entries()) {
    if (now - room.createdAt > maxAge && room.peers.length === 0) {
      rooms.delete(roomId);
      console.log(`Room ${roomId} deleted (expired)`);
    }
  }
}, 10 * 60 * 1000);

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   Samtalsvän server running on ${BASE_URL}              ║
║                                                           ║
║   Ready for video calls!                                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
