const state = {
    currentSet: 1,
    serveTeam: null,
    scores: {
        1: { A: 0, B: 0 },
        2: { A: 0, B: 0 },
        3: { A: 0, B: 0 }
    },
    activeTab: 1
};

// DOM 요소를 가져옵니다.
const selectSet = document.getElementById('current-set-selector');
const scoreAEl = document.getElementById('score-A');
const scoreBEl = document.getElementById('score-B');
const serveAEl = document.getElementById('serve-indicator-A');
const serveBEl = document.getElementById('serve-indicator-B');
const teamANameInput = document.getElementById('teamA-name');
const teamBNameInput = document.getElementById('teamB-name');
const tabContainer = document.getElementById('tab-content-container');
const tabButtons = document.querySelectorAll('.tab-btn');

// 이벤트 리스너: 세트 변경
selectSet.addEventListener('change', (e) => {
    state.currentSet = parseInt(e.target.value);
    // 세트가 바뀌면 서브 표시 초기화 (선택적)
    // state.serveTeam = null; 
    updateDisplay();
    switchTab(state.currentSet); // 세트 변경 시 탭도 같이 변경
});

// 이벤트 리스너: 팀명 변경 시 기록 즉시 업데이트
[teamANameInput, teamBNameInput].forEach(input => {
    input.addEventListener('input', renderHistory);
});

// 점수 증감 함수
function changeScore(team, delta) {
    const setScore = state.scores[state.currentSet];
    setScore[team] += delta;
    
    // 점수는 0 이하로 내려가지 않음
    if (setScore[team] < 0) {
        setScore[team] = 0;
    }
    
    // 득점 시 서브권을 자동으로 가져올 수도 있지만, 수동 조작을 위해 주석 처리
    // if (delta > 0) { setServe(team); }

    updateDisplay();
    renderHistory();
}

// 서브권 설정 함수
function setServe(team) {
    state.serveTeam = team;
    updateDisplay();
}

// 탭 전환 함수
function switchTab(setNumber) {
    state.activeTab = setNumber;
    
    // 활성화된 탭 스타일 업데이트
    tabButtons.forEach((btn, index) => {
        if (index + 1 === setNumber) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    renderHistory();
}

// 화면 업데이트 (점수 및 서브권 표시)
function updateDisplay() {
    scoreAEl.textContent = state.scores[state.currentSet].A;
    scoreBEl.textContent = state.scores[state.currentSet].B;

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

// 기록 화면 렌더링
function renderHistory() {
    const aScore = state.scores[state.activeTab].A;
    const bScore = state.scores[state.activeTab].B;
    const aName = teamANameInput.value || 'TEAM A';
    const bName = teamBNameInput.value || 'TEAM B';

    if (aScore === 0 && bScore === 0) {
        tabContainer.innerHTML = '<div class="empty-history">해당 세트에는 아직 기록된 점수가 없습니다.</div>';
    } else {
        tabContainer.innerHTML = `
            <div class="history-list">
                <div class="history-item">
                    <div class="history-team left">${aName}</div>
                    <div class="history-score">${aScore} - ${bScore}</div>
                    <div class="history-team right">${bName}</div>
                </div>
            </div>
        `;
    }
}

// 초기화
updateDisplay();
renderHistory();
