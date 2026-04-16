

// 1. GLOBAL STATE
let gameState = {
    players: [],
    numPlayers: 0,
    maxCards: 7,
    currentRound: 0,
    roundCards: 1,
    direction: 1,
    dealerIndex: -1,
    history: [], // Array of round point arrays
    bids: [],
    results: [],
    bidsLocked: false,
    lastSaved: null,
    isFinished: false,
    id: null // Unique identifier for this game instance
};

const SUITS = ["♠ Kali", "♦ Charkat", "♣ Fuli", "♥ Lali"];
const SUIT_COLORS = { "♠": "#1e293b", "♦": "#ef4444", "♣": "#1e293b", "♥": "#ef4444" };

// 2. INITIALIZATION & STORAGE
document.addEventListener('DOMContentLoaded', () => {
    renderNameInputs();
    checkExistingGame();
    setupEventListeners();
    animateHomePage();
    createFloatingSuits();
});

function saveToLocalStorage() {
    // 1. Ensure the game has a unique ID before saving anything
    if (!gameState.id) {
        gameState.id = Date.now(); 
    }

    gameState.lastSaved = new Date().toLocaleString();
    
    // 2. Load the full history
    let allGames = JSON.parse(localStorage.getItem('kachuful_history_list')) || [];

    // 3. Find if this game exists. If yes, update it. If no, add it.
    const existingIndex = allGames.findIndex(g => g.id === gameState.id);

    if (existingIndex > -1) {
        allGames[existingIndex] = JSON.parse(JSON.stringify(gameState)); // Deep copy
    } else {
        allGames.push(JSON.parse(JSON.stringify(gameState)));
    }
    // 4. Save back to Storage
    localStorage.setItem('kachuful_history_list', JSON.stringify(allGames));
    localStorage.setItem('kachuful_v2_save', JSON.stringify(gameState));
    
    console.log(`Game ${gameState.id} saved. Status: ${gameState.isFinished ? 'Finished' : 'Active'}`);
}

function checkExistingGame() {
    const history = JSON.parse(localStorage.getItem('kachuful_history_list')) || [];
    const container = document.getElementById('gameListContainer');
    const section = document.getElementById('historySection');
    const clearBtn = document.getElementById('btnClearHistory');

    if (history.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    container.innerHTML = "";

    // Clear History Logic
    clearBtn.onclick = () => {
        if (confirm("Delete all saved matches?")) {
            localStorage.removeItem('kachuful_history_list');
            localStorage.removeItem('kachuful_v2_save');
            checkExistingGame();
        }
    };

    // Render Items
    history.slice().reverse().forEach((game, i) => {
        const div = document.createElement('div');
        div.className = 'history-item player-line'; // "history-item" is for GSAP target
        div.style.cssText = "cursor:pointer; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;";
        
        const isWin = game.isFinished;
        const winnerName = isWin ? [...game.players].sort((a,b)=>b.total-a.total)[0].name : "";

        div.innerHTML = `
            <div style="flex:1">
                <div class="small" style="color:var(--accent)">${game.lastSaved}</div>
                <strong>${game.players.length} Players</strong> ${isWin ? ` | <span style="color:#22c55e">Winner: ${winnerName}</span>` : ' | ⏳ Active'}
            </div>
            <button class="btn ghost small">View</button>
        `;

        div.onclick = () => {
            gameState = game;
            if (game.isFinished) {
                document.getElementById('homeScreen').style.display = 'none';
                endGame(true); // "true" means viewing from history, don't re-save
            } else {
                resumeGame();
            }
        };
        container.appendChild(div);
    });

    // GSAP Slide-in
    gsap.to(".history-item", {
        opacity: 1,
        x: 0,
        start: "left",
        stagger: 0.1,
        duration: 0.4,
        ease: "power2.out"
    });
   
}

function clearStorage() {
    localStorage.removeItem('kachuful_v2_save');
}

// 3. UI EVENT LISTENERS
function setupEventListeners() {
    document.getElementById('numPlayers').addEventListener('input', renderNameInputs);
    document.getElementById('btnStart').addEventListener('click', startNewGame);
   
    const btnResume = document.getElementById('btnResume');
    if (btnResume) btnResume.addEventListener('click', resumeGame);

    document.getElementById('btnConfirmBids').addEventListener('click', confirmBids);
    document.getElementById('btnClearBids').addEventListener('click', clearBids);
    document.getElementById('btnSaveResults').addEventListener('click', saveRoundResults);
    document.getElementById('btnEndGame').addEventListener('click', endGame);
    
    document.getElementById('menuBtn').addEventListener('click', () => {
        if (confirm("Exit to main menu? Your progress is saved.")) location.reload();
    });
}

function renderNameInputs() {
    const container = document.getElementById("nameInputs");
    if (!container) return;
    container.innerHTML = "";
    const n = parseInt(document.getElementById("numPlayers").value) || 4;
    for (let i = 0; i < n; i++) {
        const inp = document.createElement("input");
        inp.type = "text";
        inp.placeholder = `Player ${i + 1}`;
        inp.className = "player-name-input";
        // Preserve names if already typing
        container.appendChild(inp);
    }
}

// 4. SCREEN NAVIGATION
function showGameScreen() {
    document.getElementById('homeScreen').style.display = 'none';
    const screen = document.getElementById('gameScreen');
    screen.style.display = 'grid'; // Crucial for your CSS desktop layout
}

function startNewGame() {
    const n = parseInt(document.getElementById("numPlayers").value);
    const startVal = parseInt(document.getElementById("startCards").value);
    const maxVal = parseInt(document.getElementById("maxCards").value);
    if (n < 3 || n > 10) { alert("Please choose 3-10 players."); return; }

    const nameInputs = document.querySelectorAll('.player-name-input');
    gameState.players = Array.from(nameInputs).map((input, i) => ({
        name: input.value.trim() || `P${i + 1}`,
        total: 0
    }));

    gameState.numPlayers = n;
    gameState.startCards = startVal;
    gameState.maxCards = maxVal;
    gameState.currentRound = 0;
    gameState.direction = (startVal >= maxVal) ? -1 : 1;
    gameState.roundCards = startVal;
    gameState.history = [];
    
    showGameScreen();
    nextRound(true); // "true" means it's the first round, so it won't auto-advance again
}

function resumeGame() {
    if (!gameState) return;

    // If the game is already finished, don't show the play screen
    if (gameState.isFinished) {
        document.getElementById('homeScreen').style.display = 'none';
        endGame(true); // Open the results celebration directly
        return;
    }

    // Otherwise, continue to the live game screen
    document.getElementById('homeScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'grid';
    refreshUI();
}

// 5. CORE GAMEPLAY LOGIC
function nextRound(isFirstRound = false) {
    gameState.currentRound++;

    if (!isFirstRound) {
        // 1. Move the card count based on direction
        gameState.roundCards += gameState.direction;

        // 2. Check if we hit the boundaries to flip direction
        if (gameState.direction === 1 && gameState.roundCards >= gameState.maxCards) {
            // We reached the top, now prepare to go down
            gameState.direction = -1;
        } 
        else if (gameState.direction === -1 && gameState.roundCards <= 1) {
            // We reached the bottom (1 card), now prepare to go up
            gameState.direction = 1;
        }
        else if (gameState.direction === -1 && gameState.roundCards <= gameState.startCards && gameState.startCards === gameState.maxCards) {
             // Special case: if we started at max, went down to 1, and now back at max
             // You can choose to end the game here or let it loop.
        }
    }

    // Dealer rotates
    if (gameState.currentRound === 1) {
        gameState.dealerIndex = gameState.numPlayers - 1;
    } else {
        gameState.dealerIndex = (gameState.dealerIndex + 1) % gameState.numPlayers;
    }

    gameState.bids = Array(gameState.numPlayers).fill(null);
    gameState.results = Array(gameState.numPlayers).fill(null);
    gameState.bidsLocked = false;

    saveToLocalStorage();
    refreshUI();
}

function refreshUI() {
    // 1. Header Info (Keep your existing code here)
    const joker = SUITS[(gameState.currentRound - 1) % SUITS.length];
    document.getElementById("roundBadge").innerText = `Round ${gameState.currentRound}`;
    document.getElementById("cardsInfo").innerText = `Cards: ${gameState.roundCards}`;
    
    const suitEl = document.getElementById("jokerSuit");
    suitEl.innerText = joker;
    suitEl.style.color = SUIT_COLORS[joker[0]];
    document.getElementById("dealerName").innerText = gameState.players[gameState.dealerIndex].name;

    // --- NEW LOCK LOGIC START ---
    if (gameState.isFinished) {
        // Hide all input panels
        document.getElementById('bidsPanel').style.display = 'none';
        document.getElementById('resultsPanel').style.display = 'none';
        document.getElementById('btnEndGame').style.display = 'none'; 
        
        // Update status text
        const statusEl = document.querySelector('.status');
        if (statusEl) statusEl.innerHTML = "<strong style='color:var(--good)'>🏆 Match Finished</strong>";
        
        updateScoreTable();
        return; // STOP execution here so panels don't get turned back on below
    }
    // --- NEW LOCK LOGIC END ---

    // 2. Existing Visibility Logic (for active games)
    document.getElementById('bidsPanel').style.display = 'block';
    document.getElementById('resultsPanel').style.display = gameState.bidsLocked ? 'block' : 'none';
    document.getElementById('btnConfirmBids').disabled = !gameState.bids.every(b => b !== null);
    document.getElementById('btnEndGame').style.display = 'block';

    renderBiddingList();
    renderResultsList();
    updateScoreTable();
}

// 6. BIDDING SYSTEM
function renderBiddingList() {
    const container = document.getElementById("orderList");
    container.innerHTML = "";
    
    // Determine bidding order (starts after dealer)
    const order = [];
    for (let i = 1; i <= gameState.numPlayers; i++) {
        order.push((gameState.dealerIndex + i) % gameState.numPlayers);
    }

    order.forEach((pIdx, pos) => {
        const isLast = (pos === order.length - 1);
        const div = document.createElement("div");
        // Highlight active player (the first one who hasn't bid yet)
        const isActive = gameState.bids[pIdx] === null && !gameState.bidsLocked;
        
        div.className = `player-line ${isActive ? 'active' : ''}`;

        div.innerHTML = `
            <span class="player-name">${pos + 1}. ${gameState.players[pIdx].name}</span>
            <input type="number" id="bid_input_${pIdx}" 
                value="${gameState.bids[pIdx] ?? ''}" 
                ${gameState.bidsLocked ? 'disabled' : ''} 
                min="0">
            <span id="restrict_msg_${pIdx}" class="player-meta small" style="color:var(--bad)"></span>
        `;

        const input = div.querySelector('input');
        // We no longer pass sumBids here; the function will calculate it fresh
        input.addEventListener('input', (e) => handleBidInput(pIdx, e.target.value, isLast));
        container.appendChild(div);
    });

    // Run a quick check to show the restriction message for the last player immediately
    updateRestrictionDisplay();
}

function handleBidInput(pIdx, val, isLast) {
    let n = parseInt(val);
    
    if (isNaN(n)) {
        gameState.bids[pIdx] = null;
    } else {
        // 1. Calculate the sum of EVERYONE ELSE'S bids
        let sumOthers = 0;
        gameState.bids.forEach((bid, index) => {
            if (index !== pIdx && bid !== null) {
                sumOthers += bid;
            }
        });

        const forbiddenNumber = gameState.roundCards - sumOthers;

        // 2. Check the restriction for the last bidder
        if (isLast && n === forbiddenNumber ) {
            alert(`Forbidden Bid! As the last player, you cannot bid ${n} because the total would equal ${gameState.roundCards}.`);
            document.getElementById(`bid_input_${pIdx}`).value = "";
            gameState.bids[pIdx] = null;
        }else if (n < 0 || n > gameState.roundCards) {
            alert(`Invalid Bid! Please enter a number between 0 and ${gameState.roundCards}.`);
            document.getElementById(`bid_input_${pIdx}`).value = "";
            gameState.bids[pIdx] = null;
         } 
        else {
            gameState.bids[pIdx] = n;
        }
    }

    // 3. Update the restriction text visually for the last player
    updateRestrictionDisplay();

    // 4. Enable/Disable the confirm button
    const allFilled = gameState.bids.every(b => b !== null);
    document.getElementById('btnConfirmBids').disabled = !allFilled;
}

// Helper to show the "Cannot bid X" message dynamically
function updateRestrictionDisplay() {
    const order = [];
    for (let i = 1; i <= gameState.numPlayers; i++) {
        order.push((gameState.dealerIndex + i) % gameState.numPlayers);
    }

    const lastPlayerIdx = order[order.length - 1];
    let sumOthers = 0;
    
    // Sum everyone except the last player
    order.forEach((pIdx, pos) => {
        if (pos < order.length - 1 && gameState.bids[pIdx] !== null) {
            sumOthers += gameState.bids[pIdx];
        }
    });

    const forbidden = gameState.roundCards - sumOthers;
    const msgEl = document.getElementById(`restrict_msg_${lastPlayerIdx}`);
    
    if (msgEl && !gameState.bidsLocked) {
        msgEl.innerText = forbidden >= 0 ? `Restriction: != ${forbidden}` : "";
    }
}

function confirmBids() {
    gameState.bidsLocked = true;
    // Pre-fill results with bids as a shortcut
    gameState.results = [...gameState.bids];
    saveToLocalStorage();
    refreshUI();
}

function clearBids() {
    gameState.bids = Array(gameState.numPlayers).fill(null);
    gameState.bidsLocked = false;
    refreshUI();
}

// 7. RESULTS & SCORING
function renderResultsList() {
    const container = document.getElementById("resultsList");
    container.innerHTML = "";
    if (!gameState.bidsLocked) return;

    gameState.players.forEach((player, i) => {
        const div = document.createElement("div");
        div.className = "player-line";
        div.innerHTML = `
            <span class="player-name">${player.name} (Bid: ${gameState.bids[i]})</span>
            <div class="row">
                <button class="btn ghost" onclick="adjustResult(${i}, -1)">-</button>
                <input type="number" id="res_input_${i}" value="${gameState.results[i]}" readonly style="width:50px; text-align:center">
                <button class="btn ghost" onclick="adjustResult(${i}, 1)">+</button>
            </div>
        `;
        container.appendChild(div);
    });
    validateResultsSum();
}

window.adjustResult = function(idx, delta) {
    let newVal = (gameState.results[idx] || 0) + delta;
    if (newVal >= 0 && newVal <= gameState.roundCards) {
        gameState.results[idx] = newVal;
        document.getElementById(`res_input_${idx}`).value = newVal;
        validateResultsSum();
    }
};

function validateResultsSum() {
    const total = gameState.results.reduce((a, b) => a + (b || 0), 0);
    const btn = document.getElementById('btnSaveResults');
    const required = gameState.roundCards;
    
    // Always keep it enabled so the click event can trigger the alert
    btn.disabled = false; 

    if (total === required) {
        btn.style.background = "var(--good)"; // Green/Success color
        btn.style.opacity = "1";
        btn.innerText = "Save & Next Round";
    } else {
        btn.style.background = "var(--bad)"; // Red/Warning color
        btn.style.opacity = "0.7";
        btn.innerText = `Need ${required} tricks (Current: ${total})`;
    }
}

function saveRoundResults() {
    const totalWon = gameState.results.reduce((a, b) => a + (Number(b) || 0), 0);
    const required = gameState.roundCards;

    // 1. Trigger the popup ONLY when they try to save
    if (totalWon !== required) {
        alert(`🚨 Total tricks must be exactly ${required}.\nYou currently have ${totalWon}.\n\nPlease adjust the tricks before saving.`);
        return; // Stop the save process
    }
   
    const roundPoints = gameState.players.map((_, i) => {
        const bid = gameState.bids[i];
        const won = gameState.results[i];
        return (bid === won) ? (bid + 10) : (bid === 0 ? -won : -bid);
    });

    roundPoints.forEach((pts, i) => { gameState.players[i].total += pts; });
    gameState.history.push(roundPoints);
    saveToLocalStorage();

    const isAuto = document.getElementById('autoNext').checked;
    
    if (isAuto) {
        nextRound();
    } else {
        if (confirm("Round Saved! Proceed to next?")) {
            nextRound();
        } else {
            refreshUI();
        }
    }
}
// 8. SCOREBOARD TABLE
function updateScoreTable() {
    const table = document.getElementById("scoreTable");
    const roundCount = document.getElementById("roundCount");
    roundCount.innerText =  gameState.currentRound - 1; // Show completed rounds
    if (!table) return;

    let html = `<thead><tr><th>Round</th>`;
    gameState.players.forEach(p => html += `<th>${p.name}</th>`);
    html += `</tr></thead><tbody>`;

    gameState.history.forEach((round, rIdx) => {
        html += `<tr><td>R${rIdx + 1}</td>`;
        round.forEach(pts => {
            const cls = pts >= 0 ? 'positive' : 'negative';
            html += `<td class="${cls}">${pts > 0 ? '+'+pts : pts}</td>`;
        });
        html += `</tr></tbody>`;
    });

    // // Total Row
    // html += `<tr class="total-row"><td><strong>Total</strong></td>`;
    // gameState.players.forEach(p => {
    //     html += `<td><strong>${p.total}</strong></td>`;
    // });
    // html += `</tr></tbody>`;
    
    table.innerHTML = html;
}

// 9. END GAME
function endGame(isReview = false) {
    if (!isReview && !confirm("Finish this match and crown the winner?")) return;

    if (isReview) {
        gameState.isFinished = true;
        saveToLocalStorage();
    }

    const standings = [...gameState.players].sort((a, b) => b.total - a.total);
    const winner = standings[0];

    const screen = document.getElementById('celebrationScreen');
    const standingsBox = document.getElementById('finalStandings');
    const winnerNameLabel = document.getElementById('winnerName');
    
    standingsBox.innerHTML = "";
    winnerNameLabel.innerText = winner.name;
    screen.style.display = 'flex';

    standings.forEach((p, i) => {
        const row = document.createElement('div');
        row.className = 'final-row';
        row.style.cssText = "display:flex; justify-content:space-between; padding:12px; background:rgba(255,255,255,0.05); margin-bottom:8px; border-radius:8px; opacity:0;";
        row.innerHTML = `<span>${i + 1}. ${p.name}</span> <strong>${p.total} pts</strong>`;
        standingsBox.appendChild(row);
    });

    // GSAP Timeline
    const tl = gsap.timeline();
    tl.fromTo("#winnerContent", { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5 });
    tl.fromTo(".trophy", { rotation: -45, scale: 0 }, { rotation: 0, scale: 1, duration: 0.8, ease: "back.out(2)" });
    tl.to(".final-row", { opacity: 1, x: 0, stagger: 0.1, duration: 0.4 });

    // Confetti Blast!
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#3b82f6', '#22c55e']
    });
}
function animateHomePage() {
    // 1. Prepare elements (Hide them instantly before animation starts)
    gsap.set("#homeScreen", { opacity: 1 }); // Container visible
    gsap.set(".home-anim", { opacity: 0, y: -20 }); // Panels hidden and up
    gsap.set(".history-item", { opacity: 0, x: -30 }); // Items hidden and left

    const tl = gsap.timeline();

    // 2. Animate the main panels (Header & Setup)
    tl.to(".home-anim", {
        opacity: 1,
        y: 0,
        stagger: 0.15,
        duration: 0.6,
        ease: "power2.out"
    });

    // 3. ONLY THEN animate the history items
    // This 'stagger' starts after the panels are in place
    tl.to(".history-item", {
        opacity: 1,
        x: 0,
        stagger: 0.08,
        duration: 0.4,
        ease: "power1.out"
    }, "-=0.2"); // Start slightly before the panel finishes for smoothness

    // 4. Logo Pulse
    tl.to(".logo-circle", {
        scale: 1.05,
        duration: 0.8,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut"
    }, "<"); // Run at the same time as history animation
}
// function createFloatingSuits() {
//     const container = document.getElementById('bg-elements');
//     if (!container) return;
    
//     container.innerHTML = ""; // Clear any old ones
//     const suits = ['♠', '♥', '♣', '♦'];
    
//     // Create 20 suits for a fuller look
//     for (let i = 0; i < 20; i++) {
//         const div = document.createElement('div');
//         div.className = 'floating-suit';
//         div.innerText = suits[Math.floor(Math.random() * suits.length)];
        
//         // Random styles
//         const size = Math.random() * 30 + 20;
//         div.style.cssText = `
//             position: absolute;
//             font-size: ${size}px;
//             color: rgba(255, 255, 255, 0.07);
//             left: ${Math.random() * 100}%;
//             top: ${Math.random() * 100}%;
//             z-index: -1;
//         `;
        
//         container.appendChild(div);

//         // Continuous floating animation
//         gsap.to(div, {
//             x: "random(-150, 150)",
//             y: "random(-150, 150)",
//             rotation: "random(-360, 360)",
//             duration: "random(15, 25)",
//             repeat: -1,
//             yoyo: true,
//             ease: "sine.inOut"
//         });
        
//         // Extra: Subtle fade in/out pulse
//         gsap.to(div, {
//             opacity: 0.3,
//             duration: "random(2, 5)",
//             repeat: -1,
//             yoyo: true,
//             ease: "power1.inOut"
//         });
//     }
// }