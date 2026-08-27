const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room') || 'g4-lives-room';
const userId = urlParams.get('uid');

const btnStartScreen = document.getElementById('btnStartScreen');
const btnStartCam = document.getElementById('btnStartCam');
const previewScreen = document.getElementById('previewScreen');
const previewScreenText = document.getElementById('previewScreenText');
const previewCam = document.getElementById('previewCam');
const previewCamText = document.getElementById('previewCamText');
const qualitySelect = document.getElementById('qualitySelect');
const fpsSelect = document.getElementById('fpsSelect');

const socket = io('/');
const peer = new Peer({ host: 'peerjs.com', port: 443, secure: true });

let streamLocal = null;
let meuPeerId = null;

peer.on('open', id => {
    meuPeerId = id;
    socket.emit('join-room', roomId, meuPeerId);
});

// Quando outros amigos (ou a própria tela do Discord) entram na sala
socket.on('user-connected', targetUserId => {
    if (streamLocal) {
        peer.call(targetUserId, streamLocal);
    }
});

btnStartScreen.addEventListener('click', async () => {
    if (streamLocal) {
        pararTransmissao();
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

        previewScreen.srcObject = streamLocal;
        previewScreen.style.display = 'block';
        previewScreenText.style.display = 'none';

        btnStartScreen.querySelector('span').innerText = "Parar Transmissão";
        btnStartScreen.classList.add('streaming');

        // Notifica a sala e liga para quem já estiver no canal do Discord
        socket.emit('join-room', roomId, meuPeerId);

        streamLocal.getVideoTracks()[0].onended = () => {
            pararTransmissao();
        };

    } catch (err) {
        console.error("Erro ao capturar tela:", err);
    }
});

btnStartCam.addEventListener('click', async () => {
    if (streamLocal) {
        pararTransmissao();
        return;
    }

    try {
        streamLocal = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        previewCam.srcObject = streamLocal;
        previewCam.style.display = 'block';
        previewCamText.style.display = 'none';

        btnStartCam.querySelector('span').innerText = "Parar Câmera";
        btnStartCam.classList.add('streaming');

        socket.emit('join-room', roomId, meuPeerId);

        streamLocal.getVideoTracks()[0].onended = () => {
            pararTransmissao();
        };
    } catch (err) {
        console.error("Erro na câmera:", err);
    }
});

function pararTransmissao() {
    if (streamLocal) {
        streamLocal.getTracks().forEach(t => t.stop());
        streamLocal = null;
    }

    previewScreen.style.display = 'none';
    previewScreenText.style.display = 'block';
    previewCam.style.display = 'none';
    previewCamText.style.display = 'block';

    btnStartScreen.querySelector('span').innerText = "Escolher tela e transmitir";
    btnStartScreen.classList.remove('streaming');
    btnStartCam.querySelector('span').innerText = "Ligar a câmera";
    btnStartCam.classList.remove('streaming');
}
