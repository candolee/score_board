import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, query, orderBy, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
    projectId: "scordboard",
    appId: "1:30546922123:web:375c502f5213ca9de8228e",
    storageBucket: "scordboard.firebasestorage.app",
    apiKey: "AIzaSyA7Ks3Iftl0OQfYEM-fMdqbPvk7Os5kbmA",
    authDomain: "scordboard.firebaseapp.com",
    messagingSenderId: "30546922123"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const state = {
    serveTeam: null,
    score: { A: 0, B: 0 },
    matchHistory: [],
    currentUser: null,
    unsubscribeSnapshot: null
};

// DOM 요소를 가져옵니다.
const scoreAEl = document.getElementById('score-A');
const scoreBEl = document.getElementById('score-B');
const serveAEl = document.getElementById('serve-indicator-A');
const serveBEl = document.getElementById('serve-indicator-B');
const teamANameInput = document.getElementById('teamA-name');
const teamBNameInput = document.getElementById('teamB-name');
const teamAPlayer1Input = document.getElementById('teamA-player1');
const teamAPlayer2Input = document.getElementById('teamA-player2');
const teamBPlayer1Input = document.getElementById('teamB-player1');
const teamBPlayer2Input = document.getElementById('teamB-player2');
const matchHistoryContainer = document.getElementById('match-history-container');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const userEmail = document.getElementById('user-email');
const searchInput = document.getElementById('search-player-input');

// 검색 이벤트 리스너 추가
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        renderMatchHistory(e.target.value);
    });
}

// ------ 인증 관리 ------

const provider = new GoogleAuthProvider();

loginBtn.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Login failed", error);
        alert('로그인에 실패했습니다.');
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout failed", error);
    }
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        state.currentUser = user;
        loginBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        userEmail.textContent = user.email;
        loadUserMatches(user.uid);
    } else {
        state.currentUser = null;
        loginBtn.style.display = 'block';
        userInfo.style.display = 'none';
        state.matchHistory = [];
        if (state.unsubscribeSnapshot) {
            state.unsubscribeSnapshot();
            state.unsubscribeSnapshot = null;
        }
        renderMatchHistory();
    }
});

// ------ 데이터베이스 (Firestore) 관리 ------

function loadUserMatches(uid) {
    const matchesRef = collection(db, "users", uid, "matches");
    const q = query(matchesRef, orderBy("timestamp", "desc"));
    
    // 실시간 감지
    state.unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        state.matchHistory = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            state.matchHistory.push({
                id: doc.id,
                ...data
            });
        });
        renderMatchHistory(searchInput ? searchInput.value : '');
    }, (error) => {
        console.error("Error fetching matches", error);
        alert('데이터를 불러오는데 실패했습니다.');
    });
}

async function deleteMatch(matchId) {
    if (!state.currentUser) return;
    if (!confirm('이 기록을 삭제하시겠습니까?')) return;
    
    try {
        await deleteDoc(doc(db, "users", state.currentUser.uid, "matches", matchId));
    } catch (error) {
        console.error("Error deleting match", error);
        alert('기록 삭제에 실패했습니다.');
    }
}
window.deleteMatch = deleteMatch; // 전역 스코프에 노출

async function editMatch(matchId, currentScoreA, currentScoreB) {
    if (!state.currentUser) return;
    
    const newScoreA = prompt('A팀의 점수를 수정하세요:', currentScoreA);
    if (newScoreA === null) return;
    
    const newScoreB = prompt('B팀의 점수를 수정하세요:', currentScoreB);
    if (newScoreB === null) return;
    
    const parsedA = parseInt(newScoreA, 10);
    const parsedB = parseInt(newScoreB, 10);
    
    if (isNaN(parsedA) || isNaN(parsedB) || parsedA < 0 || parsedB < 0) {
        alert('올바른 숫자를 입력해주세요.');
        return;
    }
    
    try {
        await updateDoc(doc(db, "users", state.currentUser.uid, "matches", matchId), {
            scoreA: parsedA,
            scoreB: parsedB
        });
    } catch (error) {
        console.error("Error updating match", error);
        alert('기록 수정에 실패했습니다.');
    }
}
window.editMatch = editMatch;

// ------ 게임 로직 ------

// 점수 증감 함수
function changeScore(team, delta) {
    state.score[team] += delta;

    if (state.score[team] < 0) {
        state.score[team] = 0;
    }

    if (delta > 0) {
        state.serveTeam = team;
    }

    updateDisplay();
}

function toggleServe() {
    if (state.serveTeam === 'A') {
        state.serveTeam = 'B';
    } else if (state.serveTeam === 'B') {
        state.serveTeam = 'A';
    } else {
        state.serveTeam = 'A';
    }
    updateDisplay();
}

function updateDisplay() {
    scoreAEl.textContent = state.score.A;
    scoreBEl.textContent = state.score.B;

    if (state.serveTeam === 'A') {
        serveAEl.classList.add('active');
        serveBEl.classList.remove('active');
    } else if (state.serveTeam === 'B') {
        serveBEl.classList.add('active');
        serveAEl.classList.remove('active');
    } else {
        serveAEl.classList.remove('active');
        serveBEl.classList.remove('active');
    }
}

async function endGame() {
    if (state.score.A === 0 && state.score.B === 0) {
        alert('점수를 먼저 기록해주세요.');
        return;
    }

    if (!state.currentUser) {
        alert('기록을 저장하려면 로그인이 필요합니다.');
        return;
    }

    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
    
    const playerA = [teamAPlayer1Input.value, teamAPlayer2Input.value].filter(v => v.trim()).join(', ');
    const playerB = [teamBPlayer1Input.value, teamBPlayer2Input.value].filter(v => v.trim()).join(', ');

    const record = {
        date: dateString,
        timestamp: today.getTime(), // 정렬용
        teamA: teamANameInput.value || 'TEAM A',
        teamB: teamBNameInput.value || 'TEAM B',
        playerA: playerA,
        playerB: playerB,
        scoreA: state.score.A,
        scoreB: state.score.B
    };

    // Firebase에 저장
    try {
        const matchesRef = collection(db, "users", state.currentUser.uid, "matches");
        await addDoc(matchesRef, record);
    } catch (error) {
        console.error("Error saving match", error);
        alert("기록 저장 중 오류가 발생했습니다.");
        return;
    }

    // 화면 초기화
    state.score.A = 0;
    state.score.B = 0;
    state.serveTeam = null;
    updateDisplay();
}

function resetGame() {
    if (state.score.A > 0 || state.score.B > 0) {
        if (!confirm('현재 점수가 초기화됩니다. 새 게임을 시작하시겠습니까?')) {
            return;
        }
    }
    
    state.score.A = 0;
    state.score.B = 0;
    state.serveTeam = null;

    teamANameInput.value = 'A팀';
    teamBNameInput.value = 'B팀';
    teamAPlayer1Input.value = '';
    teamAPlayer2Input.value = '';
    teamBPlayer1Input.value = '';
    teamBPlayer2Input.value = '';

    updateDisplay();
}

function renderMatchHistory(query = '') {
    const searchTerm = query || (searchInput ? searchInput.value : '');
    
    let historyToRender = state.matchHistory;
    
    if (searchTerm.trim() !== '') {
        const lowerTerm = searchTerm.trim().toLowerCase();
        historyToRender = state.matchHistory.filter(record => 
            (record.playerA && record.playerA.toLowerCase().includes(lowerTerm)) || 
            (record.playerB && record.playerB.toLowerCase().includes(lowerTerm)) ||
            (record.teamA && record.teamA.toLowerCase().includes(lowerTerm)) ||
            (record.teamB && record.teamB.toLowerCase().includes(lowerTerm))
        );
    }

    if (!state.currentUser) {
        matchHistoryContainer.innerHTML = '<div class="empty-history">아직 기록된 경기가 없습니다. (로그인 후 이용 가능)</div>';
        return;
    }

    if (historyToRender.length === 0) {
        if (state.matchHistory.length === 0) {
            matchHistoryContainer.innerHTML = '<div class="empty-history">기록된 경기가 없습니다. 첫 번째 게임을 기록해보세요!</div>';
        } else {
            matchHistoryContainer.innerHTML = '<div class="empty-history">검색 조건과 일치하는 기록이 없습니다.</div>';
        }
        return;
    }

    let html = '';
    historyToRender.forEach(record => {
        let resultA = '-';
        let resultB = '-';
        let colorA = '#fff';
        let colorB = '#fff';

        if (record.scoreA > record.scoreB) {
            resultA = '승';
            resultB = '패';
            colorA = '#4ade80';
            colorB = '#ef4444';
        } else if (record.scoreA < record.scoreB) {
            resultA = '패';
            resultB = '승';
            colorA = '#ef4444';
            colorB = '#4ade80';
        }

        const playerAStr = record.playerA ? `<span style="font-size:0.75rem; color:#a1a1aa; font-weight:normal;"> (${record.playerA})</span>` : '';
        const playerBStr = record.playerB ? `<span style="font-size:0.75rem; color:#a1a1aa; font-weight:normal;"> (${record.playerB})</span>` : '';

        html += `
            <div class="history-item" style="display: flex; align-items: center; justify-content: space-between; font-size: 0.9rem; margin-bottom: 8px; padding: 10px 15px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; position: relative;">
                <div style="color: #a1a1aa; margin-right: 15px; white-space: nowrap; font-size: 0.75rem;">
                    ${record.date}
                </div>
                <div style="display: flex; flex: 1; align-items: center; justify-content: center; gap: 10px;">
                    <div style="text-align: right; flex: 1; color: ${colorA}; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${record.teamA}${playerAStr}
                    </div>
                    <div style="font-weight: 800; font-size: 1.1rem; white-space: nowrap; width: 65px; text-align: center; letter-spacing: 1px;">
                        ${record.scoreA} : ${record.scoreB}
                    </div>
                    <div style="text-align: left; flex: 1; color: ${colorB}; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${record.teamB}${playerBStr}
                    </div>
                </div>
                <div style="display: flex; gap: 5px; margin-left: 10px;">
                    <!-- 수정 버튼 -->
                    <button onclick="editMatch('${record.id}', ${record.scoreA}, ${record.scoreB})" title="점수 수정" style="background: none; border: none; color: #38bdf8; font-size: 0.9rem; cursor: pointer; padding: 5px;">
                        ✏️
                    </button>
                    <!-- 삭제 버튼 -->
                    <button onclick="deleteMatch('${record.id}')" title="기록 삭제" style="background: none; border: none; color: #ef4444; font-size: 1rem; cursor: pointer; padding: 5px;">
                        &times;
                    </button>
                </div>
            </div>
        `;
    });

    matchHistoryContainer.innerHTML = html;
}

function toggleHistory() {
    const historySection = document.getElementById('game-history-section');
    if (historySection.style.display === 'none') {
        historySection.style.display = 'block';
    } else {
        historySection.style.display = 'none';
    }
}

// window에 게임 컨트롤 함수들 노출시켜서 HTML의 inline 이벤트에서 사용할 수 있게 함
window.gameControls = {
    changeScore,
    toggleServe,
    endGame,
    resetGame,
    toggleHistory
};

updateDisplay();
renderMatchHistory();

