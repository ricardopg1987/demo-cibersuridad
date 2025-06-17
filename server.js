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

// Página de prueba en "/test"
app.get('/test', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prueba Rápida</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
        button { padding: 20px; margin: 10px; font-size: 18px; border: none; border-radius: 8px; cursor: pointer; color: white; }
        .vibrate { background: #ff6b6b; }
        .sound { background: #4ecdc4; }
        .both { background: #45b7d1; }
    </style>
</head>
<body>
    <h1>🔧 Prueba Rápida</h1>
    <button class="vibrate" onclick="testVibrate()">📳 Vibrar</button>
    <button class="sound" onclick="testSound()">🔊 Sonar</button>
    <button class="both" onclick="testBoth()">🎯 Ambos</button>
    
    <audio id="audio" src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcfBTCQ1/LNeSoFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcfBTCQ1/LNeSoFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcfBTCQ1/LNeSoFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcfBTCQ1/LNeSoFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcfBT" preload="auto"></audio>
    
    <script>
        function testVibrate() {
            if (navigator.vibrate) {
                navigator.vibrate([400, 200, 400]);
                alert('Vibración activada');
            } else {
                alert('Vibración no soportada');
            }
        }
        
        function testSound() {
            const audio = document.getElementById('audio');
            audio.volume = 0.8;
            audio.play().then(() => {
                alert('Sonido reproducido');
            }).catch(e => {
                alert('Error: ' + e.message);
            });
        }
        
        function testBoth() {
            testVibrate();
            testSound();
        }
    </script>
</body>
</html>
    `);
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