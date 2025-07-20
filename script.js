document.addEventListener('DOMContentLoaded', () => {
    const formationGrid = document.getElementById('formation-grid');
    const showGridLinesCheckbox = document.getElementById('show-grid-lines');
    const enableCollisionCheckbox = document.getElementById('enable-collision');
    const resetFormationButton = document.getElementById('reset-formation');
    const characterButtons = document.querySelectorAll('.char-btn');
    const resultText = document.getElementById('result-text');

    const gridSize = 10; // 10x10グリッド
    let selectedCharacter = null;
    const placedCharacters = {}; // { "x-y": "characterName" }

    // グリッドの生成
    function createGrid() {
        formationGrid.innerHTML = '';
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const cell = document.createElement('div');
                cell.classList.add('grid-cell');
                cell.dataset.x = j;
                cell.dataset.y = i;
                cell.textContent = `${j},${i}`; // デバッグ用に座標を表示
                cell.addEventListener('click', handleCellClick);
                formationGrid.appendChild(cell);
            }
        }
        updateGridLines();
    }

    // グリッド線の表示/非表示を切り替える
    function updateGridLines() {
        if (showGridLinesCheckbox.checked) {
            formationGrid.querySelectorAll('.grid-cell').forEach(cell => {
                cell.style.border = '1px solid #ddd';
            });
        } else {
            formationGrid.querySelectorAll('.grid-cell').forEach(cell => {
                cell.style.border = 'none';
            });
        }
    }

    // キャラクター選択ボタンのイベントリスナー
    characterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 選択状態の切り替え
            characterButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            selectedCharacter = button.dataset.char;
            resultText.textContent = `${selectedCharacter} が選択されました。グリッドをクリックして配置してください。`;
        });
    });

    // グリッドセルクリック時の処理
    function handleCellClick(event) {
        const cell = event.target;
        const x = cell.dataset.x;
        const y = cell.dataset.y;
        const cellKey = `${x}-${y}`;

        if (selectedCharacter) {
            if (placedCharacters[cellKey] && enableCollisionCheckbox.checked) {
                resultText.textContent = `(${x},${y})には既に${placedCharacters[cellKey]}が配置されています。衝突判定が有効です。`;
                return;
            }

            // 既にキャラクターが配置されているセルからキャラクターを削除
            if (cell.classList.contains('has-character')) {
                const existingChar = cell.querySelector('.character-icon');
                if (existingChar) {
                    cell.removeChild(existingChar);
                }
                cell.classList.remove('has-character');
                delete placedCharacters[cellKey];
            }

            // 新しいキャラクターを配置
            const charIcon = document.createElement('span');
            charIcon.classList.add('character-icon');
            charIcon.textContent = selectedCharacter.substring(0, 2).toUpperCase(); // キャラクター名の頭2文字を表示
            cell.appendChild(charIcon);
            cell.classList.add('has-character');
            placedCharacters[cellKey] = selectedCharacter;
            resultText.textContent = `${selectedCharacter} を (${x},${y}) に配置しました。`;
            simulateFormation();
        } else {
            resultText.textContent = 'キャラクターを選択してください。';
        }
    }

    // 配置をリセットボタンのイベントリスナー
    resetFormationButton.addEventListener('click', () => {
        formationGrid.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('has-character');
            const charIcon = cell.querySelector('.character-icon');
            if (charIcon) {
                cell.removeChild(charIcon);
            }
        });
        selectedCharacter = null;
        for (const key in placedCharacters) {
            delete placedCharacters[key];
        }
        characterButtons.forEach(btn => btn.classList.remove('selected'));
        resultText.textContent = '配置がリセットされました。';
    });

    // グリッド線表示チェックボックスのイベントリスナー
    showGridLinesCheckbox.addEventListener('change', updateGridLines);

    // シミュレーションロジック（仮）
    function simulateFormation() {
        let simulationOutput = '現在の配置: ';
        if (Object.keys(placedCharacters).length === 0) {
            simulationOutput += 'キャラクターは配置されていません。';
        } else {
            for (const key in placedCharacters) {
                simulationOutput += `${placedCharacters[key]}@${key} `;
            }
        }
        resultText.textContent = simulationOutput;
    }

    // 初期化
    createGrid();
    simulateFormation(); // 初期状態のシミュレーション結果を表示
});
