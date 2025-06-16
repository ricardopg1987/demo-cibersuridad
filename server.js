// server.js - Backend completo con Node.js y Socket.IO
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Variables para controlar la demo
let connectedDevices = 0;
let demoActive = false;

// Middleware
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.static('public'));
app.use(express.json());

// Headers para CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Rutas principales
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/control', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'control.html'));
});

app.get('/qr', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'qr.html'));
});

// API para obtener estadísticas
app.get('/api/stats', (req, res) => {
  res.json({
    connectedDevices,
    demoActive,
    timestamp: new Date().toISOString()
  });
});

// Health check para Render
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    connectedDevices,
    demoActive,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Manejo de conexiones WebSocket
io.on('connection', (socket) => {
  console.log('Nuevo dispositivo conectado:', socket.id);
  connectedDevices++;
  
  // Notificar a todos sobre el recuento de dispositivos
  io.emit('deviceCount', connectedDevices);
  
  // Identificar tipo de cliente
  socket.on('identify', (data) => {
    console.log('Cliente identificado:', data);
    if (data.type === 'controller') {
      socket.join('controllers');
      socket.emit('deviceCount', connectedDevices);
      socket.emit('demoStatus', { active: demoActive });
    } else if (data.type === 'display') {
      socket.join('displays');
      socket.emit('deviceCount', connectedDevices);
    } else {
      socket.join('clients');
    }
  });
  
  // Comandos del controlador
  socket.on('changeColor', (data) => {
    console.log('Cambiando color:', data);
    io.to('clients').emit('changeColor', data);
  });
  
  socket.on('vibrate', (data) => {
    console.log('Activando vibración:', data);
    io.to('clients').emit('vibrate', data);
  });
  
  socket.on('startDemo', () => {
    console.log('Iniciando demo');
    demoActive = true;
    io.to('clients').emit('startDemo');
    io.to('controllers').emit('demoStatus', { active: true });
    io.to('displays').emit('demoStatus', { active: true });
  });
  
  socket.on('stopDemo', () => {
    console.log('Deteniendo demo');
    demoActive = false;
    io.to('clients').emit('stopDemo');
    io.to('controllers').emit('demoStatus', { active: false });
    io.to('displays').emit('demoStatus', { active: false });
  });
  
  socket.on('hackEffect', (data) => {
    console.log('Ejecutando efecto hack:', data);
    io.to('clients').emit('hackEffect', data);
  });
  
  socket.on('requestStats', () => {
    socket.emit('deviceCount', connectedDevices);
    socket.emit('demoStatus', { active: demoActive });
  });
  
  // Manejo de desconexión
  socket.on('disconnect', (reason) => {
    console.log('Dispositivo desconectado:', socket.id, 'Razón:', reason);
    connectedDevices = Math.max(0, connectedDevices - 1);
    io.emit('deviceCount', connectedDevices);
  });
});

// Puerto para Render o local
const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📱 Página cliente: http://localhost:${PORT}`);
  console.log(`🎮 Panel de control: http://localhost:${PORT}/control`);
  console.log(`📋 Display QR: http://localhost:${PORT}/qr`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});