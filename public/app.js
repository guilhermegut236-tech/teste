import { DiscordSDK } from 'https://esm.sh/@discord/embedded-app-sdk';

const DISCORD_CLIENT_ID = '1542386414463877231';
let discordSdk = null;

const viewConnecting = document.getElementById('viewConnecting');
const viewStreamActive = document.getElementById('viewStreamActive');
const videoGrid = document.getElementById('videoGrid');
const statusLabel = document.getElementById('statusLabel');

const linkShareScreen = document.getElementById('linkShareScreen');
const linkShareCam = document.getElementById('linkShareCam');

const socket = io();
const peer = new Peer({ host: 'peerjs.com', port: 443, secure: true });

let meuPeerId = null;
let roomId = "g4-lives-room";

function atualizarLinks() {
    const baseUrl = `${window.location.origin}/share.html?room=${roomId}&uid=${meuPeerId || ''}`;
    linkShareScreen.href = `${baseUrl}&fonte=tela`;
    linkShareCam.href = `${baseUrl}&fonte=camera`;
}

// Fallback de clique caso o target _blank seja barrado dentro de iframes
function tratarAbertura(e) {
    if (discordSdk) {
        e.preventDefault();
        discordSdk.commands.openExternalLink({ url: this.href }).catch(() => {
            window.open(this.href, '_blank');
        });
    }
}

linkShareScreen.addEventListener('click', tratarAbertura);
linkShareCam.addEventListener('click', tratarAbertura);

async function setupDiscord() {
    try {
        discordSdk = new DiscordSDK(DISCORD_CLIENT_ID);
        await discordSdk.ready();

        if (discordSdk.channelId) {
            roomId = discordSdk.channelId;
            atualizarLinks();
        }

        statusLabel.innerText = "Conectado ao Discord. Clique abaixo para transmitir!";
    } catch (e) {
        console.warn("Fora do Discord:", e);
        statusLabel.innerText = "Clique abaixo para abrir a tela de transmissão";
    }
}

peer.on('open', id => {
    meuPeerId = id;
    atualizarLinks();
    socket.emit('join-room', roomId, meuPeerId);
});

// Quando o navegador externo (ou outro amigo) transmite
peer.on('call', call => {
    call.answer(); // Atende apenas como espectador (recebendo o vídeo)
    
    const card = document.createElement('div');
    card.className = 'video-card';
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    
    card.appendChild(video);
    
    call.on('stream', streamTransmissao => {
        video.srcObject = streamTransmissao;
        videoGrid.innerHTML = '';
        videoGrid.appendChild(card);
        
        viewConnecting.style.display = 'none';
        viewStreamActive.style.display = 'flex';
    });

    call.on('close', () => {
        card.remove();
        viewStreamActive.style.display = 'none';
        viewConnecting.style.display = 'flex';
    });
});

setupDiscord();
atualizarLinks();
