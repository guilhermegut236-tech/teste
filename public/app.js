import { DiscordSDK } from 'https://esm.sh/@discord/embedded-app-sdk';

const DISCORD_CLIENT_ID = '1542386414463877231';
let discordSdk = null;

const viewMain = document.getElementById('viewMain');
const viewStreamActive = document.getElementById('viewStreamActive');
const videoGrid = document.getElementById('videoGrid');
const statusLabel = document.getElementById('statusLabel');
const inputShareLink = document.getElementById('inputShareLink');
const btnCopyLink = document.getElementById('btnCopyLink');
const btnLaunchBrowser = document.getElementById('btnLaunchBrowser');

const socket = io();
const peer = new Peer({ host: 'peerjs.com', port: 443, secure: true });

let meuPeerId = null;
let roomId = "g4-lives-room";

function gerarUrlCaptura() {
    const origin = window.location.origin;
    return `${origin}/share.html?room=${roomId}&uid=${meuPeerId || ''}`;
}

function atualizarInterfaceLink() {
    const url = gerarUrlCaptura();
    inputShareLink.value = url;
}

// 1. ABRIR NO NAVEGADOR VIA BOTÃO
btnLaunchBrowser.addEventListener('click', () => {
    const url = gerarUrlCaptura();
    
    // Tenta abrir pelo comando oficial do Discord SDK
    if (discordSdk) {
        discordSdk.commands.openExternalLink({ url: url }).catch(() => {
            window.open(url, '_blank');
        });
    } else {
        window.open(url, '_blank');
    }
});

// 2. COPIAR LINK CASO DESEJE
btnCopyLink.addEventListener('click', () => {
    navigator.clipboard.writeText(inputShareLink.value).then(() => {
        btnCopyLink.innerText = "Copiado!";
        setTimeout(() => { btnCopyLink.innerText = "Copiar"; }, 2000);
    });
});

async function setupDiscord() {
    try {
        discordSdk = new DiscordSDK(DISCORD_CLIENT_ID);
        await discordSdk.ready();

        if (discordSdk.channelId) {
            roomId = discordSdk.channelId;
            atualizarInterfaceLink();
        }

        statusLabel.innerText = "Conectado ao canal. Aguardando transmissão...";
    } catch (e) {
        console.warn("Fora do Discord:", e);
        statusLabel.innerText = "Modo de Teste. Aguardando transmissão...";
    }
}

peer.on('open', id => {
    meuPeerId = id;
    atualizarInterfaceLink();
    socket.emit('join-room', roomId, meuPeerId);
});

// 3. RECEPTOR DE VÍDEO NO DISCORD: Quando o navegador externo (share.html) transmite a tela
peer.on('call', call => {
    call.answer(); // Recebe o vídeo como espectador
    
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
        
        // Esconde o painel e mostra o vídeo recebido em tela cheia no Discord
        viewMain.style.display = 'none';
        viewStreamActive.style.display = 'flex';
    });

    call.on('close', () => {
        card.remove();
        viewStreamActive.style.display = 'none';
        viewMain.style.display = 'flex';
    });
});

setupDiscord();
