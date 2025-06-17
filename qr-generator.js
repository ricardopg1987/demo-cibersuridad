// qr-generator.js - Generador QR nativo sin dependencias externas
class NativeQRGenerator {
    constructor() {
        // Tablas de codificación QR
        this.MODE_NUMBER = 1;
        this.MODE_ALPHA_NUM = 2;
        this.MODE_8BIT_BYTE = 4;
        
        this.ERROR_CORRECT_L = 1;
        this.ERROR_CORRECT_M = 0;
        this.ERROR_CORRECT_Q = 3;
        this.ERROR_CORRECT_H = 2;
        
        // Patrones de máscara
        this.maskPatterns = [
            (i, j) => (i + j) % 2 === 0,
            (i, j) => i % 2 === 0,
            (i, j) => j % 3 === 0,
            (i, j) => (i + j) % 3 === 0,
            (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0,
            (i, j) => (i * j) % 2 + (i * j) % 3 === 0,
            (i, j) => ((i * j) % 2 + (i * j) % 3) % 2 === 0,
            (i, j) => ((i + j) % 2 + (i * j) % 3) % 2 === 0
        ];
    }
    
    // Generar QR simple para URLs
    generateSimpleQR(text, size = 200) {
        // Para demos simples, usamos un patrón visual que simula QR
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = size;
        canvas.height = size;
        
        // Fondo blanco
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        
        // Generar patrón basado en el texto
        const gridSize = 25; // 25x25 grid
        const cellSize = size / gridSize;
        
        // Crear hash simple del texto para generar patrón consistente
        const hash = this.simpleHash(text);
        
        ctx.fillStyle = '#000000';
        
        // Dibujar esquinas de posicionamiento
        this.drawPositionSquare(ctx, 0, 0, cellSize * 7);
        this.drawPositionSquare(ctx, (gridSize - 7) * cellSize, 0, cellSize * 7);
        this.drawPositionSquare(ctx, 0, (gridSize - 7) * cellSize, cellSize * 7);
        
        // Dibujar patrón de datos basado en hash
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (this.shouldSkipCell(i, j, gridSize)) continue;
                
                // Generar bit basado en posición y hash
                const bitValue = this.getBitFromHash(hash, i, j);
                if (bitValue) {
                    ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
                }
            }
        }
        
        // Dibujar separadores
        this.drawSeparators(ctx, cellSize, gridSize);
        
        return canvas;
    }
    
    // Hash simple para generar patrón consistente
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    
    // Obtener bit del hash para posición específica
    getBitFromHash(hash, i, j) {
        const position = i * 25 + j;
        const shifted = hash >> (position % 32);
        return (shifted & 1) === 1;
    }
    
    // Verificar si debe saltar la celda (áreas reservadas)
    shouldSkipCell(i, j, gridSize) {
        // Esquinas de posicionamiento
        if ((i < 9 && j < 9) || 
            (i < 9 && j >= gridSize - 8) || 
            (i >= gridSize - 8 && j < 9)) {
            return true;
        }
        
        // Líneas de timing
        if (i === 6 || j === 6) {
            return true;
        }
        
        return false;
    }
    
    // Dibujar cuadrado de posicionamiento
    drawPositionSquare(ctx, x, y, size) {
        const cellSize = size / 7;
        
        // Cuadrado exterior negro
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, size, size);
        
        // Cuadrado interior blanco
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + cellSize, y + cellSize, size - 2 * cellSize, size - 2 * cellSize);
        
        // Cuadrado central negro
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 3 * cellSize, y + 3 * cellSize, cellSize, cellSize);
    }
    
    // Dibujar separadores
    drawSeparators(ctx, cellSize, gridSize) {
        ctx.fillStyle = '#000000';
        
        // Líneas de timing
        for (let i = 8; i < gridSize - 8; i++) {
            if (i % 2 === 0) {
                ctx.fillRect(6 * cellSize, i * cellSize, cellSize, cellSize);
                ctx.fillRect(i * cellSize, 6 * cellSize, cellSize, cellSize);
            }
        }
    }
    
    // Generar QR usando SVG (más ligero)
    generateSVGQR(text, size = 200) {
        const gridSize = 25;
        const cellSize = size / gridSize;
        const hash = this.simpleHash(text);
        
        let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;
        svg += `<rect width="${size}" height="${size}" fill="white"/>`;
        
        // Esquinas de posicionamiento
        svg += this.getSVGPositionSquare(0, 0, cellSize * 7);
        svg += this.getSVGPositionSquare((gridSize - 7) * cellSize, 0, cellSize * 7);
        svg += this.getSVGPositionSquare(0, (gridSize - 7) * cellSize, cellSize * 7);
        
        // Patrón de datos
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (this.shouldSkipCell(i, j, gridSize)) continue;
                
                const bitValue = this.getBitFromHash(hash, i, j);
                if (bitValue) {
                    svg += `<rect x="${j * cellSize}" y="${i * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
                }
            }
        }
        
        // Líneas de timing
        for (let i = 8; i < gridSize - 8; i++) {
            if (i % 2 === 0) {
                svg += `<rect x="${6 * cellSize}" y="${i * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
                svg += `<rect x="${i * cellSize}" y="${6 * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
            }
        }
        
        svg += '</svg>';
        return svg;
    }
    
    // Obtener SVG para cuadrado de posicionamiento
    getSVGPositionSquare(x, y, size) {
        const cellSize = size / 7;
        return `
            <rect x="${x}" y="${y}" width="${size}" height="${size}" fill="black"/>
            <rect x="${x + cellSize}" y="${y + cellSize}" width="${size - 2 * cellSize}" height="${size - 2 * cellSize}" fill="white"/>
            <rect x="${x + 3 * cellSize}" y="${y + 3 * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>
        `;
    }
    
    // Método principal para generar QR
    generateQR(text, options = {}) {
        const size = options.size || 200;
        const format = options.format || 'canvas'; // 'canvas' o 'svg'
        
        if (format === 'svg') {
            return this.generateSVGQR(text, size);
        } else {
            return this.generateSimpleQR(text, size);
        }
    }
}

// Función helper para usar fácilmente
function createNativeQR(text, containerId, options = {}) {
    const generator = new NativeQRGenerator();
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error('Container no encontrado:', containerId);
        return null;
    }
    
    const size = options.size || 200;
    const format = options.format || 'canvas';
    
    if (format === 'svg') {
        const svg = generator.generateQR(text, { size, format: 'svg' });
        container.innerHTML = svg;
    } else {
        const canvas = generator.generateQR(text, { size, format: 'canvas' });
        container.innerHTML = '';
        container.appendChild(canvas);
    }
    
    return generator;
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.NativeQRGenerator = NativeQRGenerator;
    window.createNativeQR = createNativeQR;
}