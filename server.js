// server.js - Backend con Node.js y Socket.IO
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
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Variables para controlar la demo
let connectedDevices = 0;
let demoActive = false;

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para la página de control del presentador
app.get('/control', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'control.html'));
});

// API para obtener estadísticas
app.get('/api/stats', (req, res) => {
  res.json({
    connectedDevices,
    demoActive
  });
});

// Manejo de conexiones WebSocket
io.on('connection', (socket) => {
  console.log('Nuevo dispositivo conectado:', socket.id);
  connectedDevices++;
  
  // Notificar a todos los controladores sobre el nuevo dispositivo
  io.emit('deviceCount', connectedDevices);
  
  // Identificar si es un dispositivo de control o cliente
  socket.on('identify', (data) => {
    if (data.type === 'controller') {
      socket.join('controllers');
      socket.emit('deviceCount', connectedDevices);
    } else {
      socket.join('clients');
    }
  });
  
  // Manejar comandos del controlador
  socket.on('changeColor', (data) => {
    io.to('clients').emit('changeColor', data);
  });
  
  socket.on('vibrate', (data) => {
    io.to('clients').emit('vibrate', data);
  });
  
  socket.on('startDemo', () => {
    demoActive = true;
    io.to('clients').emit('startDemo');
    io.to('controllers').emit('demoStatus', { active: true });
  });
  
  socket.on('stopDemo', () => {
    demoActive = false;
    io.to('clients').emit('stopDemo');
    io.to('controllers').emit('demoStatus', { active: false });
  });
  
  socket.on('hackEffect', (data) => {
    io.to('clients').emit('hackEffect', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Dispositivo desconectado:', socket.id);
    connectedDevices--;
    io.emit('deviceCount', connectedDevices);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
  console.log(`Página cliente: http://localhost:${PORT}`);
  console.log(`Panel de control: http://localhost:${PORT}/control`);
});