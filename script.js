const players = [
    { id: 1, name: "", msLeft: 0, totalMs: 0, isEliminated: false },
    { id: 2, name: "", msLeft: 0, totalMs: 0, isEliminated: false },
    { id: 3, name: "", msLeft: 0, totalMs: 0, isEliminated: false },
    { id: 4, name: "", msLeft: 0, totalMs: 0, isEliminated: false }
];

let activePlayerIndex = null;
let lastTime = 0;
let animationFrameId = null;
let isGameRunning = false;
let eliminationOrder = []; // Elenenleri sırayla kaydedeceğimiz dizi

function startApp() {
    const dk = parseFloat(document.getElementById('duration').value);
    if(isNaN(dk) || dk <= 0) return alert("Lütfen geçerli bir süre girin!");

    const totalMs = dk * 60 * 1000;
    eliminationOrder = []; // Sıralamayı sıfırla

    for(let i = 0; i < 4; i++) {
        const nameInput = document.getElementById(`name${i+1}`).value || `Oyuncu ${i+1}`;
        players[i].name = nameInput;
        players[i].msLeft = totalMs;
        players[i].totalMs = totalMs;
        players[i].isEliminated = false;
        
        document.getElementById(`label${i+1}`).innerText = nameInput;
        document.getElementById(`status${i+1}`).innerText = "";
        document.getElementById(`p${i+1}`).classList.remove('eliminated', 'active', 'warning');
        updateDisplay(i);
    }

    document.getElementById('setup').style.display = 'none';
    document.getElementById('game-board').style.display = 'grid';

    activePlayerIndex = 0; 
    document.getElementById('p1').classList.add('active');
    isGameRunning = true;
    lastTime = Date.now();
    
    animationFrameId = requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (!isGameRunning) return;

    const now = Date.now();
    const deltaTime = now - lastTime;
    lastTime = now;

    if (activePlayerIndex !== null) {
        let p = players[activePlayerIndex];
        p.msLeft -= deltaTime;

        // Zamanı dolan oyuncunun elenme anı
        if (p.msLeft <= 0) {
            p.msLeft = 0;
            p.isEliminated = true;
            updateDisplay(activePlayerIndex);
            
            // Oyuncuyu elenme sırasına ekle
            eliminationOrder.push(p);
            
            const currentBox = document.getElementById(`p${activePlayerIndex+1}`);
            currentBox.classList.remove('active', 'warning');
            currentBox.classList.add('eliminated');
            document.getElementById(`status${activePlayerIndex+1}`).innerText = "ELENDİ";

            // Hayatta kalanları kontrol et
            const survivors = players.filter(pl => !pl.isEliminated);
            
            if (survivors.length === 1) {
                // Sadece 1 kişi kaldı! O kazandı.
                eliminationOrder.push(survivors[0]); // Kazananı sıralamanın en tepesine eklemek için sona atıyoruz
                isGameRunning = false;
                showLeaderboard(survivors[0]);
                return;
            } else {
                // Hala hayatta olanlar var, sıradaki canlı oyuncuya geç
                switchToNextAlivePlayer();
                return;
            }
        }

        updateDisplay(activePlayerIndex);
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

function updateDisplay(index) {
    const p = players[index];
    const timeElement = document.getElementById(`time${index+1}`);
    const boxElement = document.getElementById(`p${index+1}`);
    const fillElement = document.getElementById(`fill${index+1}`);

    const totalSeconds = Math.ceil(p.msLeft / 1000);
    let m = Math.floor(totalSeconds / 60);
    let s = totalSeconds % 60;
    
    m = m < 10 ? "0" + m : m;
    s = s < 10 ? "0" + s : s;
    
    timeElement.innerText = `${m}:${s}`;

    const percent = (p.msLeft / p.totalMs) * 100;
    fillElement.style.height = `${percent}%`;

    // Son 10 saniye uyarısı (Sadece elenmediyse)
    if (totalSeconds <= 10 && totalSeconds > 0 && !p.isEliminated) {
        boxElement.classList.add('warning');
    } else {
        boxElement.classList.remove('warning');
    }
}

function nextTurn(clickedPlayerId) {
    if (!isGameRunning) return;

    const clickedIndex = clickedPlayerId - 1;

    // Sadece sırası gelen canlı oyuncu dokunursa sıra geçer
    if (clickedIndex === activePlayerIndex && !players[clickedIndex].isEliminated) {
        document.getElementById(`p${activePlayerIndex+1}`).classList.remove('active');
        switchToNextAlivePlayer();
    }
}

function switchToNextAlivePlayer() {
    let attempts = 0;
    // Sıradaki elenmemiş oyuncuyu bulana kadar dön (Maksimum 4 deneme)
    do {
        activePlayerIndex = (activePlayerIndex + 1) % 4;
        attempts++;
    } while (players[activePlayerIndex].isEliminated && attempts < 4);

    if (!players[activePlayerIndex].isEliminated) {
        document.getElementById(`p${activePlayerIndex+1}`).classList.add('active');
        lastTime = Date.now();
    }
}

function showLeaderboard(winner) {
    cancelAnimationFrame(animationFrameId);
    document.getElementById('game-board').style.display = 'none';
    
    const resultsDiv = document.getElementById('results');
    const listDiv = document.getElementById('leaderboard-list');
    
    document.getElementById('winner-title').innerText = `🏆 KAZANAN: ${winner.name}`;
    listDiv.innerHTML = ""; // Listeyi temizle

    // eliminationOrder dizisi [İlk Elenen, İkinci Elenen, Üçüncü Elenen, Kazanan] şeklinde sıralıdır.
    // Sıralamayı 1.den 4.ye göstermek için diziyi ters çeviriyoruz (Reverse).
    const finalRankings = [...eliminationOrder].reverse();

    finalRankings.forEach((player, index) => {
        const rank = index + 1;
        const item = document.createElement('div');
        item.className = `leaderboard-item rank-${rank}`;
        
        let timeInfo = "SÜRE BİTTİ";
        if (rank === 1) {
            const totalSeconds = Math.ceil(player.msLeft / 1000);
            let m = Math.floor(totalSeconds / 60);
            let s = totalSeconds % 60;
            timeInfo = `KALAN SÜRE: ${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
        }

        item.innerHTML = `<span>#${rank} ${player.name}</span> <span>${timeInfo}</span>`;
        listDiv.appendChild(item);
    });

    resultsDiv.style.display = 'block';
}