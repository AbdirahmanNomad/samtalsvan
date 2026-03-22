require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const QRCode = require('qrcode');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');

const { config, getIceServers, validateEnv } = require('./config');

validateEnv();

const app = express();
const server = http.createServer(app);

const corsOrigin = process.env.CORS_ORIGIN || '*';
const io = new Server(server, {
  cors: {
    origin: corsOrigin === '*' ? true : corsOrigin.split(','),
    methods: ["GET", "POST"]
  }
});

const PORT = config.port;
const BASE_URL = config.baseUrl;

const rooms = new Map();
const contacts = new Map();

const contactNameSchema = Joi.string().trim().max(100).pattern(/^[a-zA-ZåäöÅÄÖ0-9\s\-\/]+$/).default('Familj / Family');
const contactCodeSchema = Joi.string().length(8).pattern(/^[A-Z0-9]+$/).uppercase().required();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-hashes'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "wss:", "https:"],
      mediaSrc: ["'self'", "blob:"],
      fontSrc: ["'self'", "data:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const createCallLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.createCallMax,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const contactLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.contactMax,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const gdprLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.gdprMax,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/create-call', createCallLimiter, async (req, res) => {
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

app.post('/create-contact', contactLimiter, async (req, res) => {
  const { error, value: name } = contactNameSchema.validate(req.body.name);
  
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  
  const code = crypto.randomBytes(4).toString('hex').toUpperCase();
  const ownerToken = crypto.randomBytes(16).toString('hex');
  const link = `${BASE_URL}?contact=${code}`;
  
  contacts.set(code, {
    name: name || 'Familj / Family',
    ownerToken,
    createdAt: Date.now()
  });
  
  try {
    const qrCode = await QRCode.toDataURL(link, {
      width: 300,
      margin: 2,
      color: {
        dark: '#005293',
        light: '#ffffff'
      }
    });
    
    const qrPrint = await QRCode.toDataURL(link, {
      width: 400,
      margin: 4,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    res.json({
      code,
      name: name || 'Familj / Family',
      link,
      qrCode,
      qrPrint,
      ownerToken
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    res.status(500).json({ error: 'Failed to create contact card' });
  }
});

app.get('/contact/:code', contactLimiter, (req, res) => {
  const { error, value: code } = contactCodeSchema.validate(req.params.code.toUpperCase());
  
  if (error) {
    return res.status(400).json({ error: 'Invalid contact code' });
  }
  
  const contact = contacts.get(code);
  
  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  
  res.json({
    code,
    name: contact.name
  });
});

app.delete('/contact/:code', contactLimiter, (req, res) => {
  const { error, value: code } = contactCodeSchema.validate(req.params.code.toUpperCase());
  
  if (error) {
    return res.status(400).json({ error: 'Invalid contact code' });
  }
  
  const ownerToken = req.headers['x-owner-token'];
  const contact = contacts.get(code);
  
  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  
  if (!ownerToken || ownerToken !== contact.ownerToken) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  contacts.delete(code);
  res.json({ success: true, message: 'Contact deleted' });
});

app.get('/contacts', contactLimiter, (req, res) => {
  const codes = (req.query.codes || '').split(',').filter(Boolean);
  
  if (codes.length === 0) {
    return res.json({ contacts: [] });
  }
  
  if (codes.length > 50) {
    return res.status(400).json({ error: 'Too many codes requested' });
  }
  
  const result = codes.map(code => {
    const upperCode = code.toUpperCase().trim();
    const contact = contacts.get(upperCode);
    if (contact) {
      return { code: upperCode, name: contact.name };
    }
    return null;
  }).filter(Boolean);
  
  res.json({ contacts: result });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size, contacts: contacts.size });
});

app.get('/health/ready', (req, res) => {
  res.json({ ready: true });
});

app.get('/health/live', (req, res) => {
  res.json({ alive: true });
});

app.get('/ice-servers', (req, res) => {
  res.json({ iceServers: getIceServers() });
});

app.get('/api/user/data', gdprLimiter, (req, res) => {
  const ownerToken = req.headers['x-owner-token'];
  
  if (!ownerToken) {
    return res.status(401).json({ error: 'X-Owner-Token header required' });
  }
  
  const userContacts = [];
  for (const [code, contact] of contacts.entries()) {
    if (contact.ownerToken === ownerToken) {
      userContacts.push({
        code,
        name: contact.name,
        createdAt: contact.createdAt
      });
    }
  }
  
  res.json({ contacts: userContacts });
});

app.delete('/api/user/data', gdprLimiter, (req, res) => {
  const ownerToken = req.headers['x-owner-token'];
  
  if (!ownerToken) {
    return res.status(401).json({ error: 'X-Owner-Token header required' });
  }
  
  let deletedCount = 0;
  for (const [code, contact] of contacts.entries()) {
    if (contact.ownerToken === ownerToken) {
      contacts.delete(code);
      deletedCount++;
    }
  }
  
  res.json({ success: true, deletedContacts: deletedCount });
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id.substring(0, 8));
  
  socket.on('join', (roomId) => {
    if (typeof roomId !== 'string' || roomId.length > 100) {
      socket.emit('error', { message: 'Invalid room ID' });
      return;
    }
    
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
    
    console.log(`User joined room. Peers: ${room.peers.length}`);
    
    if (room.peers.length === 1) {
      socket.emit('waiting', { message: 'Väntar på deltagare... / Waiting for participant...' });
    } else if (room.peers.length === 2) {
      const [initiator] = room.peers;
      io.to(initiator).emit('peer-joined', { peerId: socket.id });
      socket.emit('peer-joined', { peerId: initiator, isInitiator: true });
    }
  });
  
  socket.on('offer', (data) => {
    if (!data || !data.targetPeerId || !data.offer) {
      return;
    }
    socket.to(data.targetPeerId).emit('offer', {
      offer: data.offer,
      fromPeerId: socket.id
    });
  });
  
  socket.on('answer', (data) => {
    if (!data || !data.targetPeerId || !data.answer) {
      return;
    }
    socket.to(data.targetPeerId).emit('answer', {
      answer: data.answer,
      fromPeerId: socket.id
    });
  });
  
  socket.on('ice-candidate', (data) => {
    if (!data || !data.targetPeerId || !data.candidate) {
      return;
    }
    socket.to(data.targetPeerId).emit('ice-candidate', {
      candidate: data.candidate,
      fromPeerId: socket.id
    });
  });
  
  socket.on('leave-room', (roomId) => {
    if (!roomId || !socket.roomId || socket.roomId !== roomId) {
      return;
    }
    
    const room = rooms.get(roomId);
    if (room) {
      room.peers = room.peers.filter(id => id !== socket.id);
      
      room.peers.forEach(peerId => {
        io.to(peerId).emit('peer-left', { peerId: socket.id });
      });
      
      socket.leave(roomId);
      socket.roomId = null;
      
      if (room.peers.length === 0) {
        rooms.delete(roomId);
      }
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id.substring(0, 8));
    
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        room.peers = room.peers.filter(id => id !== socket.id);
        
        room.peers.forEach(peerId => {
          io.to(peerId).emit('peer-left', { peerId: socket.id });
        });
        
        if (room.peers.length === 0) {
          room.emptySince = room.emptySince || Date.now();
        }
      }
    }
  });
});

setInterval(() => {
  const now = Date.now();
  const maxAge = 2 * 60 * 60 * 1000;
  const contactMaxAge = 30 * 24 * 60 * 60 * 1000;
  
  for (const [roomId, room] of rooms.entries()) {
    if (now - room.createdAt > maxAge && room.peers.length === 0) {
      rooms.delete(roomId);
    }
  }
  
  for (const [code, contact] of contacts.entries()) {
    if (now - contact.createdAt > contactMaxAge) {
      contacts.delete(code);
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
