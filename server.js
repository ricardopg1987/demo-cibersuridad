const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Sirve archivos estáticos de /public
app.use(express.static(path.join(__dirname, 'public')));

// Panel de control SOLO en "/"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'control.html'));
});

// QR en "/qr"
app.get('/qr', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'qr.html'));
});

// Página de hackeo en "/hack"
app.get('/hack', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Nuevas rutas de control
app.get('/stop', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'stop.html'));
});

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    // Evento principal de hackeo
    socket.on('hack', () => {
        console.log('Hack iniciado por:', socket.id);
        io.emit('startHack');
    });
    
    // Evento para detener el hackeo
    socket.on('stopHack', () => {
        console.log('Hack detenido por:', socket.id);
        io.emit('stopHack');
    });
    
    // Efectos individuales
    socket.on('flashColors', () => {
        io.emit('flashColors');
    });
    
    socket.on('vibrate', () => {
        io.emit('vibrate');
    });
    
    socket.on('playSound', () => {
        io.emit('playSound');
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Panel de control: http://localhost:${PORT}/`);
    console.log(`Código QR: http://localhost:${PORT}/qr`);
    console.log(`Demo hackeo: http://localhost:${PORT}/hack`);
});