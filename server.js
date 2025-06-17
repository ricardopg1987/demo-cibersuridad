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

// Página para detener efectos
app.get('/stop', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'stop.html'));
});

// Página de prueba rápida
app.get('/test', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prueba Rápida</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f0f0f0; }
        button { padding: 20px; margin: 10px; font-size: 18px; border: none; border-radius: 8px; cursor: pointer; color: white; width: 80%; max-width: 300px; }
        .vibrate { background: #ff6b6b; }
        .sound { background: #4ecdc4; }
        .both { background: #45b7d1; }
        .status { margin: 20px 0; padding: 15px; background: white; border-radius: 8px; }
    </style>
</head>
<body>
    <h1>🔧 Prueba Rápida de Vibración y Sonido</h1>
    
    <div class="status" id="status">
        Toca los botones para probar cada función
    </div>
    
    <button class="vibrate" onclick="testVibrate()">📳 Probar Vibración Constante</button>
    <button class="sound" onclick="testSound()">🔊 Probar Sonido</button>
    <button class="both" onclick="testBoth()">🎯 Probar Ambos</button>
    <button onclick="stopAll()" style="background: #dc3545;">⏹️ Detener Todo</button>
    
    <div class="status">
        <h3>📋 Para que funcione:</h3>
        <p>✅ Usar HTTPS o localhost</p>
        <p>✅ Tocar la pantalla primero</p>
        <p>✅ Activar sonido en el dispositivo</p>
        <p>✅ No estar en modo silencioso</p>
    </div>
    
    <script>
        const status = document.getElementById('status');
        let vibrateInterval = null;
        let audioContext = null;
        let beepInterval = null;
        
        function updateStatus(message, color = '#333') {
            status.innerHTML = message;
            status.style.color = color;
        }
        
        function testVibrate() {
            if ('vibrate' in navigator) {
                stopAll();
                
                function vibratePattern() {
                    navigator.vibrate([400, 100, 400, 100, 200, 50, 300]);
                }
                
                vibratePattern();
                vibrateInterval = setInterval(vibratePattern, 1200);
                
                updateStatus('📳 Vibración constante activada (durará 30 segundos)', 'green');
                setTimeout(stopAll, 30000);
            } else {
                updateStatus('❌ Tu dispositivo no soporta vibración', 'red');
            }
        }
        
        function testSound() {
            stopAll();
            createBeepLoop();
            updateStatus('🔊 Sonido de alarma activado', 'green');
            setTimeout(stopAll, 10000);
        }
        
        function createBeepLoop() {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                function createBeep() {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
                    oscillator.type = 'square';
                    
                    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.3);
                }
                
                createBeep();
                beepInterval = setInterval(createBeep, 600);
            } catch (e) {
                updateStatus('❌ Error creando sonido: ' + e.message, 'red');
            }
        }
        
        function testBoth() {
            testVibrate();
            setTimeout(testSound, 200);
            updateStatus('🎯 Vibración + Sonido activados', 'blue');
        }
        
        function stopAll() {
            if (vibrateInterval) {
                clearInterval(vibrateInterval);
                vibrateInterval = null;
                navigator.vibrate && navigator.vibrate(0);
            }
            
            if (beepInterval) {
                clearInterval(beepInterval);
                beepInterval = null;
            }
            
            if (audioContext) {
                audioContext.close();
                audioContext = null;
            }
            
            updateStatus('⏹️ Todos los efectos detenidos', 'gray');
        }
        
        // Información del dispositivo
        window.addEventListener('load', () => {
            let info = '📱 Información:<br>';
            info += 'Vibración: ' + (navigator.vibrate ? '✅ Soportada' : '❌ No soportada') + '<br>';
            info += 'Audio Context: ' + (window.AudioContext || window.webkitAudioContext ? '✅ Soportado' : '❌ No soportado') + '<br>';
            info += 'Dispositivo: ' + (navigator.userAgent.includes('Mobile') ? '📱 Móvil' : '🖥️ Escritorio');
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'status';
            infoDiv.innerHTML = info;
            document.body.appendChild(infoDiv);
        });
    </script>
</body>
</html>
    `);
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
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🎮 Panel de control: http://localhost:${PORT}/`);
    console.log(`📱 Código QR: http://localhost:${PORT}/qr`);
    console.log(`💻 Demo hackeo: http://localhost:${PORT}/hack`);
    console.log(`🔧 Prueba rápida: http://localhost:${PORT}/test`);
});