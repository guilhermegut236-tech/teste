import { DiscordSDK } from 'https://esm.sh/@discord/embedded-app-sdk';

const DISCORD_CLIENT_ID = '1542386414463877231';
let discordSdk = null;

const viewConnecting = document.getElementById('viewConnecting');
const viewRoomIdle = document.getElementById('viewRoomIdle');
const viewStreamActive = document.getElementById('viewStreamActive');
const videoGrid = document.getElementById('videoGrid');
const userNameBadge = document.getElementById('userNameBadge');

const socket = io('/');
const peer = new Peer({ host: 'peerjs.com', port: 443, secure: true });

let meuPeerId = null;
let roomId = "g4-lives-room";
let currentUserName = "G4";

function mostrarTela(tela) {
    viewConnecting.style.display = 'none';
    viewRoomIdle.style.display = 'none';
    viewStreamActive.style.display = 'none';

    if (tela === 'connecting') viewConnecting.style.display = 'flex';
    if (tela === 'idle') viewRoomIdle.style.display = 'flex';
    if (tela === 'stream') viewStreamActive.style.display = 'flex';
}

// Abrir a página de transmissão no navegador externo
function abrirPaginaDeCapturaNoNavegador() {
    const shareUrl = `${window.location.origin}/share.html?room=${roomId}&uid=${meuPeerId}&name=${encodeURIComponent(currentUserName)}`;
    
    // Se estiver no Discord, tenta abrir via SDK ou popup
    if (discordSdk) {
        discordSdk.commands.openExternalLink({ url: shareUrl }).catch(() => {
            window.open(shareUrl, '_blank');
        });
    } else {
        window.open(shareUrl, '_blank');
    }
}

// Configura os botões da pílula
document.getElementById('btnOpenSharePage1').onclick = abrirPaginaDeCapturaNoNavegador;
document.getElementById('btnOpenSharePageCam1').onclick = abrirPaginaDeCapturaNoNavegador;
document.getElementById('btnOpenSharePage2').onclick = abrirPaginaDeCapturaNoNavegador;
document.getElementById('btnOpenSharePageCam2').onclick = abrirPaginaDeCapturaNoNavegador;

async function setupDiscord() {
    try {
        discordSdk = new DiscordSDK(DISCORD_CLIENT_ID);
        await discordSdk.ready();

        if (discordSdk.channelId) {
            roomId = discordSdk.channelId;
        }

        const auth = await discordSdk.commands.authorize({
            client_id: DISCORD_CLIENT_ID,
            response_type: "code",
            state: "",
            prompt: "none",
            scope: ["identify", "guilds"]
        });

        if (auth && auth.user) {
            currentUserName = auth.user.username;
            userNameBadge.innerText = currentUserName;
        }
    } catch (e) {
        console.warn("Fora do Discord:", e);
    } finally {
        setTimeout(() => {
            mostrarTela('idle');
        }, 1000);
    }
}

peer.on('open', id => {
    meuPeerId = id;
    socket.emit('join-room', roomId, meuPeerId);
});

// Quando o navegador externo (ou outro amigo) transmite e liga para a sala
peer.on('call', call => {
    call.answer(); // Apenas assiste (recebe o vídeo)
    
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
        mostrarTela('stream');
    });

    call.on('close', () => {
        card.remove();
        mostrarTela('idle');
    });
});

setupDiscord();
