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

    updateDisplay();
}

// 서브권 설정 함수
function setServe(team) {
    state.serveTeam = team;
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

// 일자별 기록 화면 렌더링
function renderMatchHistory() {
    if (state.matchHistory.length === 0) {
        matchHistoryContainer.innerHTML = '<div class="empty-history">아직 기록된 경기가 없습니다.</div>';
        return;
    }

    let html = '';
    state.matchHistory.forEach(record => {
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

        const playerADisplay = record.playerA ? `<br><span style="font-size: 0.75rem; color: #a1a1aa; font-weight: normal;">${record.playerA}</span>` : '';
        const playerBDisplay = record.playerB ? `<br><span style="font-size: 0.75rem; color: #a1a1aa; font-weight: normal;">${record.playerB}</span>` : '';

        html += `
            <div class="history-item" style="flex-direction: column; align-items: stretch; margin-bottom: 12px; padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 12px;">
                <div style="font-size: 0.8rem; color: #a1a1aa; margin-bottom: 8px; text-align: center;">${record.date}</div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="history-team left" style="flex: 1; text-align: right; color: ${colorA}; font-weight: bold;">${record.teamA} <span style="font-size:0.8em">(${resultA})</span>${playerADisplay}</div>
                    <div class="history-score" style="margin: 0 20px; font-size: 1.4rem; letter-spacing: 2px;">${record.scoreA} : ${record.scoreB}</div>
                    <div class="history-team right" style="flex: 1; text-align: left; color: ${colorB}; font-weight: bold;"><span style="font-size:0.8em">(${resultB})</span> ${record.teamB}${playerBDisplay}</div>
                </div>
            </div>
        `;
    });

    matchHistoryContainer.innerHTML = html;
}

// 초기화
updateDisplay();
renderMatchHistory();
