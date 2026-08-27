// Inicialização Socket e PeerJS
const socket = io();
const peer = new Peer({ host: 'peerjs.com', port: 443, secure: true });

const viewMain = document.getElementById('viewMain');
const viewStreamActive = document.getElementById('viewStreamActive');
const videoGrid = document.getElementById('videoGrid');
const inputShareLink = document.getElementById('inputShareLink');
const btnCopyLink = document.getElementById('btnCopyLink');
const btnLaunchBrowser = document.getElementById('btnLaunchBrowser');

const roomId = "g4-lives-room";
let meuPeerId = null;

function atualizarLink() {
    const origin = window.location.origin;
    const url = `${origin}/share.html?room=${roomId}&uid=${meuPeerId || ''}`;
    inputShareLink.value = url;
    btnLaunchBrowser.href = url;
}

btnCopyLink.addEventListener('click', () => {
    navigator.clipboard.writeText(inputShareLink.value).then(() => {
        btnCopyLink.innerText = "Copiado!";
        setTimeout(() => { btnCopyLink.innerText = "Copiar"; }, 2000);
    });
});

peer.on('open', id => {
    meuPeerId = id;
    atualizarLink();
    socket.emit('join-room', roomId, meuPeerId);
});

// RECEPTOR DO DISCORD: Quando o share.html começa a transmitir no navegador
peer.on('call', call => {
    call.answer(); // Recebe o vídeo
    
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
        
        viewMain.style.display = 'none';
        viewStreamActive.style.display = 'flex';
    });

    call.on('close', () => {
        card.remove();
        viewStreamActive.style.display = 'none';
        viewMain.style.display = 'flex';
    });
});

atualizarLink();
