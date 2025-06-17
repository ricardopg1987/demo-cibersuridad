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

io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('hack', () => {
        io.emit('startHack');
    });
});

server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
