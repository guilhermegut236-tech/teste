import { DiscordSDK } from 'https://esm.sh/@discord/embedded-app-sdk';

const DISCORD_CLIENT_ID = "1542386414463877231"; 
let discordSdk = null;

const startBtn = document.getElementById('start-btn');
const localVideo = document.getElementById('local-video');
const noPreviewText = document.getElementById('no-preview-text');
const statusText = document.getElementById('status');
const fpsSelect = document.getElementById('fps-select');

async function initDiscord() {
    try {
        // Inicializa o SDK usando o link direto para a internet (CDN)
        discordSdk = new DiscordSDK(DISCORD_CLIENT_ID);
        await discordSdk.ready();
        statusText.innerText = "Conectado ao SDK do Discord!";
    } catch (e) {
        console.warn("Rodando fora do Discord. Modo Navegador ativado.");
        statusText.innerText = "Modo Navegador (Pronto para teste local)";
    }
}

initDiscord();

// Lógica de Compartilhamento de Tela
startBtn.addEventListener('click', async () => {
    try {
        const fps = parseInt(fpsSelect.value);
        
        // Solicita ao usuário qual tela/guia compartilhar
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                frameRate: { ideal: fps, max: fps }
            },
            audio: true 
        });

        // Coloca o stream no elemento de vídeo para o criador ver o preview
        localVideo.srcObject = stream;
        localVideo.style.display = "block";
        noPreviewText.style.display = "none";
        
        startBtn.innerText = "Transmitindo...";
        startBtn.style.backgroundColor = "#DA373C"; // Cor vermelha do Discord
        statusText.innerText = "Sua tela está sendo capturada!";

        // Listener para caso o usuário pare de compartilhar
        stream.getVideoTracks()[0].onended = () => {
            stopShare();
        };

    } catch (err) {
        console.error("Erro ao capturar tela:", err);
        statusText.innerText = "Permissão negada.";
    }
});

function stopShare() {
    const stream = localVideo.srcObject;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    localVideo.srcObject = null;
    localVideo.style.display = "none";
    noPreviewText.style.display = "block";
    
    startBtn.innerText = "Começar Atividade";
    startBtn.style.backgroundColor = "var(--brand-color)";
    statusText.innerText = "Transmissão encerrada.";
}
