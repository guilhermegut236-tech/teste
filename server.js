const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://discord.com");
    res.removeHeader('X-Frame-Options');
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Lógica de "Salas" do Socket.io
io.on('connection', (socket) => {
    console.log('Novo usuário conectado ao Socket:', socket.id);

    // Quando um usuário entra na atividade do Discord
    socket.on('join-room', (roomId, peerId) => {
        socket.join(roomId);
        console.log(`Usuário ${peerId} entrou na sala ${roomId}`);
        
        // Avisa os outros na sala que alguém novo chegou
        socket.to(roomId).emit('user-connected', peerId);

        socket.on('disconnect', () => {
            console.log(`Usuário ${peerId} saiu`);
            socket.to(roomId).emit('user-disconnected', peerId);
        });
    });
});

server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
