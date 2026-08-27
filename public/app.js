import { DiscordSDK } from 'https://esm.sh/@discord/embedded-app-sdk';

const DISCORD_CLIENT_ID = '1542386414463877231';
let discordSdk = null;

const btnCompartilhar = document.getElementById('btnCompartilhar');
const videoGrid = document.getElementById('videoGrid');
const emptyState = document.getElementById('emptyState');
const statusText = document.getElementById('statusText');
const statusDot = document.getElementById('statusDot');
const liveBadge = document.getElementById('liveBadge');
const qualitySelect = document.getElementById('qualitySelect');
const fpsSelect = document.getElementById('fpsSelect');

const socket = io('/'); 
const peer = new Peer({ host: 'peerjs.com', port: 443, secure: true }); 

let streamLocal = null;
let meuPeerId = null;
let roomId = "g4-lives-room";
let activeStreamsCount = 0;

// Elemento da transmissão local
const meuVideoCard = document.createElement('div');
meuVideoCard.className = 'video-card';
const meuVideo = document.createElement('video');
meuVideo.muted = true;
meuVideo.playsInline = true;
const meuTag = document.createElement('div');
meuTag.className = 'video-tag';
meuTag.innerText = 'Sua Transmissão';
meuVideoCard.appendChild(meuVideo);
meuVideoCard.appendChild(meuTag);

function atualizarEstadoVisual() {
    if (activeStreamsCount > 0) {
        emptyState.style.display = 'none';
        videoGrid.style.display = 'grid';
        liveBadge.style.display = 'inline-block';
    } else {
        emptyState.style.display = 'flex';
        videoGrid.style.display = 'none';
        liveBadge.style.display = 'none';
    }
}

async function setupDiscord() {
    try {
        discordSdk = new DiscordSDK(DISCORD_CLIENT_ID);
        await discordSdk.ready();
        
        if (discordSdk.channelId) {
            roomId = discordSdk.channelId;
        }

        statusText.innerText = "Conectado ao Discord";
    } catch (error) {
        console.warn("Rodando fora do Discord SDK:", error);
        statusText.innerText = "Pronto para transmitir";
    }
}

peer.on('open', id => {
    meuPeerId = id;
    socket.emit('join-room', roomId, meuPeerId);
});

socket.on('user-connected', userId => {
    if (streamLocal) {
        conectarParaNovoUsuario(userId, streamLocal);
    }
});

peer.on('call', call => {
    call.answer(streamLocal); 
    
    const cardRemoto = document.createElement('div');
    cardRemoto.className = 'video-card';
    const videoRemoto = document.createElement('video');
    videoRemoto.playsInline = true;
    const tagRemoto = document.createElement('div');
    tagRemoto.className = 'video-tag';
    tagRemoto.innerText = 'Amigo ao Vivo';
    
    cardRemoto.appendChild(videoRemoto);
    cardRemoto.appendChild(tagRemoto);
    
    call.on('stream', streamAmigo => {
        adicionarVideoCard(cardRemoto, videoRemoto, streamAmigo);
    });

    call.on('close', () => {
        cardRemoto.remove();
        activeStreamsCount--;
        atualizarEstadoVisual();
    });
});

btnCompartilhar.addEventListener('click', async () => {
    if (streamLocal) {
        stopStream();
        return;
    }

    try {
        const quality = parseInt(qualitySelect.value);
        const fps = parseInt(fpsSelect.value);

        let idealWidth = 1920;
        if (quality === 1440) idealWidth = 2560;
        else if (quality === 1080) idealWidth = 1920;
        else if (quality === 720) idealWidth = 1280;
        else if (quality === 480) idealWidth = 854;

        streamLocal = await navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: "always",
                frameRate: { ideal: fps, max: fps },
                width: { ideal: idealWidth },
                height: { ideal: quality }
            },
            audio: true
        });

        adicionarVideoCard(meuVideoCard, meuVideo, streamLocal);
        
        btnCompartilhar.querySelector('span').innerText = "Parar Transmissão";
        btnCompartilhar.classList.add('streaming');

        streamLocal.getVideoTracks()[0].onended = () => {
            stopStream();
        };

    } catch (erro) {
        console.error("Erro ao capturar tela:", erro);
    }
});

function stopStream() {
    if (streamLocal) {
        streamLocal.getTracks().forEach(t => t.stop());
        streamLocal = null;
    }
    meuVideoCard.remove();
    btnCompartilhar.querySelector('span').innerText = "Começar a Transmitir";
    btnCompartilhar.classList.remove('streaming');
    activeStreamsCount--;
    atualizarEstadoVisual();
}

function conectarParaNovoUsuario(userId, stream) {
    const call = peer.call(userId, stream);
    const cardRemoto = document.createElement('div');
    cardRemoto.className = 'video-card';
    const videoRemoto = document.createElement('video');
    videoRemoto.playsInline = true;
    const tagRemoto = document.createElement('div');
    tagRemoto.className = 'video-tag';
    tagRemoto.innerText = 'Amigo ao Vivo';
    
    cardRemoto.appendChild(videoRemoto);
    cardRemoto.appendChild(tagRemoto);
    
    call.on('stream', streamAmigo => {
        adicionarVideoCard(cardRemoto, videoRemoto, streamAmigo);
    });

    call.on('close', () => {
        cardRemoto.remove();
        activeStreamsCount--;
        atualizarEstadoVisual();
    });
}

function adicionarVideoCard(card, elementoVideo, stream) {
    elementoVideo.srcObject = stream;
    elementoVideo.addEventListener('loadedmetadata', () => {
        elementoVideo.play();
    });
    videoGrid.appendChild(card);
    activeStreamsCount++;
    atualizarEstadoVisual();
}

atualizarEstadoVisual();
setupDiscord();
