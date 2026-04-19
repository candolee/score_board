const state = {
    serveTeam: null,
    score: { A: 0, B: 0 },
    matchHistory: []
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

// 점수 증감 함수
function changeScore(team, delta) {
    state.score[team] += delta;

    // 점수는 0 이하로 내려가지 않음
    if (state.score[team] < 0) {
        state.score[team] = 0;
    }

    // 득점 시 해당 팀으로 서브권 자동 변경
    if (delta > 0) {
        state.serveTeam = team;
    }

    updateDisplay();
}

// 서브권 토글 함수
function toggleServe() {
    if (state.serveTeam === 'A') {
        state.serveTeam = 'B';
    } else if (state.serveTeam === 'B') {
        state.serveTeam = 'A';
    } else {
        state.serveTeam = 'A'; // 최초 클릭 시 A팀 서브
    }
    updateDisplay();
}

// 화면 업데이트 (점수 및 서브권 표시)
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

// 게임 종료 및 기록 저장
function endGame() {
    if (state.score.A === 0 && state.score.B === 0) {
        alert('점수를 먼저 기록해주세요.');
        return;
    }

    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
    
    const playerA = [teamAPlayer1Input.value, teamAPlayer2Input.value].filter(v => v.trim()).join(', ');
    const playerB = [teamBPlayer1Input.value, teamBPlayer2Input.value].filter(v => v.trim()).join(', ');

    const record = {
        date: dateString,
        teamA: teamANameInput.value || 'TEAM A',
        teamB: teamBNameInput.value || 'TEAM B',
        playerA: playerA,
        playerB: playerB,
        scoreA: state.score.A,
        scoreB: state.score.B
    };

    state.matchHistory.unshift(record); // 최신 기록을 상단에 추가

    // 점수 및 서브권 초기화
    state.score.A = 0;
    state.score.B = 0;
    state.serveTeam = null;

    updateDisplay();
    renderMatchHistory();
}

// 새로운 게임 기록을 위한 초기화
function resetGame() {
    if (state.score.A > 0 || state.score.B > 0) {
        if (!confirm('현재 점수가 초기화됩니다. 새 게임을 시작하시겠습니까?')) {
            return;
        }
    }
    
    // 점수 및 서브권 초기화
    state.score.A = 0;
    state.score.B = 0;
    state.serveTeam = null;

    // 선수 이름 및 팀명 초기화
    teamANameInput.value = 'A팀';
    teamBNameInput.value = 'B팀';
    teamAPlayer1Input.value = '';
    teamAPlayer2Input.value = '';
    teamBPlayer1Input.value = '';
    teamBPlayer2Input.value = '';

    updateDisplay();
}

// 일자별 기록 화면 렌더링
function renderMatchHistory(query = '') {
    const searchInput = document.getElementById('search-player-input');
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

    if (historyToRender.length === 0) {
        if (state.matchHistory.length === 0) {
            matchHistoryContainer.innerHTML = '<div class="empty-history">아직 기록된 경기가 없습니다.</div>';
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
            colorA = '#4ade80'; // 녹색
            colorB = '#ef4444'; // 빨간색
        } else if (record.scoreA < record.scoreB) {
            resultA = '패';
            resultB = '승';
            colorA = '#ef4444';
            colorB = '#4ade80';
        } else {
            resultA = '무';
            resultB = '무';
        }

        const playerAStr = record.playerA ? `<span style="font-size:0.75rem; color:#a1a1aa; font-weight:normal;"> (${record.playerA})</span>` : '';
        const playerBStr = record.playerB ? `<span style="font-size:0.75rem; color:#a1a1aa; font-weight:normal;"> (${record.playerB})</span>` : '';

        html += `
            <div class="history-item" style="display: flex; align-items: center; justify-content: space-between; font-size: 0.9rem; margin-bottom: 8px; padding: 10px 15px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
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
            </div>
        `;
    });

    matchHistoryContainer.innerHTML = html;
}

// 경기기록 화면 토글 함수
function toggleHistory() {
    const historySection = document.getElementById('game-history-section');
    if (historySection.style.display === 'none') {
        historySection.style.display = 'block';
    } else {
        historySection.style.display = 'none';
    }
}

// 초기화
updateDisplay();
renderMatchHistory();
