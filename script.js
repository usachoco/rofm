document.addEventListener('DOMContentLoaded', () => {
    const formationGrid = document.getElementById('formation-grid');
    const showGridLinesCheckbox = document.getElementById('show-grid-lines');
    const enableCollisionCheckbox = document.getElementById('enable-collision');
    const resetFormationButton = document.getElementById('reset-formation');
    const characterButtons = document.querySelectorAll('.char-btn');
    const resultText = document.getElementById('result-text');

    const exportDataButton = document.getElementById('export-data');
    const importDataInput = document.getElementById('import-data-input');
    const importDataButton = document.getElementById('import-data-button');
    const copyUrlButton = document.getElementById('copy-url-button');

    const gridSize = 10; // 10x10グリッド
    let selectedCharacter = null;
    let selectedCharacterType = null; // 'ally' or 'enemy'
    const placedCharacters = {}; // { "x-y": { name: "characterName", type: "ally/enemy" } }

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

    // グリッドをクリアしてキャラクターを配置するヘルパー関数
    function clearAndPlaceCharacters(charactersToPlace) {
        // 現在の配置を全てクリア
        formationGrid.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('has-character');
            const charIcon = cell.querySelector('.character-icon');
            if (charIcon) {
                cell.removeChild(charIcon);
            }
            // 以前のキャラクタータイプクラスを削除
            for (const key in placedCharacters) {
                const charType = placedCharacters[key].type;
                const charName = placedCharacters[key].name;
                cell.classList.remove(`${charType}-${charName}`);
            }
        });
        for (const key in placedCharacters) {
            delete placedCharacters[key];
        }

        // 新しいキャラクターを配置
        for (const key in charactersToPlace) {
            const char = charactersToPlace[key];
            const [x, y] = key.split('-');
            const cell = formationGrid.querySelector(`[data-x="${x}"][data-y="${y}"]`);
            if (cell) {
                const charIcon = document.createElement('span');
                charIcon.classList.add('character-icon');
                charIcon.textContent = char.name.substring(0, 2).toUpperCase();
                cell.appendChild(charIcon);
                cell.classList.add('has-character');
                cell.classList.add(`${char.type}-${char.name}`);
                placedCharacters[key] = { name: char.name, type: char.type };
            }
        }
        simulateFormation();
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

    // キャラクター選択ボタンと敵キャラクター選択ボタンのイベントリスナー
    document.querySelectorAll('.char-btn').forEach(button => {
        button.addEventListener('click', () => {
            // 選択状態の切り替え
            document.querySelectorAll('.char-btn').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            selectedCharacter = button.dataset.char;
            selectedCharacterType = button.classList.contains('enemy-btn') ? 'enemy' : 'ally';
            resultText.textContent = `${selectedCharacter} (${selectedCharacterType === 'ally' ? '味方' : '敵'}) が選択されました。グリッドをクリックして配置してください。`;
        });
    });

    // グリッドセルクリック時の処理
    function handleCellClick(event) {
        const cell = event.target;
        const x = cell.dataset.x;
        const y = cell.dataset.y;
        const cellKey = `${x}-${y}`;

        if (selectedCharacter && selectedCharacterType) {
            if (placedCharacters[cellKey] && enableCollisionCheckbox.checked) {
                resultText.textContent = `(${x},${y})には既に${placedCharacters[cellKey].name}が配置されています。衝突判定が有効です。`;
                return;
            }

            // 既にキャラクターが配置されているセルからキャラクターを削除
            if (cell.classList.contains('has-character')) {
                const existingChar = cell.querySelector('.character-icon');
                if (existingChar) {
                    cell.removeChild(existingChar);
                }
                cell.classList.remove('has-character');
                // 以前のキャラクタータイプクラスを削除
                if (placedCharacters[cellKey]) {
                    cell.classList.remove(`${placedCharacters[cellKey].type}-${placedCharacters[cellKey].name}`);
                }
                delete placedCharacters[cellKey];
            }

            // 新しいキャラクターを配置
            const charIcon = document.createElement('span');
            charIcon.classList.add('character-icon');
            charIcon.textContent = selectedCharacter.substring(0, 2).toUpperCase(); // キャラクター名の頭2文字を表示
            cell.appendChild(charIcon);
            cell.classList.add('has-character');
            cell.classList.add(`${selectedCharacterType}-${selectedCharacter}`); // タイプとキャラクター名に応じたクラスを追加
            placedCharacters[cellKey] = { name: selectedCharacter, type: selectedCharacterType };
            resultText.textContent = `${selectedCharacter} (${selectedCharacterType === 'ally' ? '味方' : '敵'}) を (${x},${y}) に配置しました。`;
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
        selectedCharacterType = null;
        for (const key in placedCharacters) {
            const charType = placedCharacters[key].type;
            const charName = placedCharacters[key].name;
            const cell = formationGrid.querySelector(`[data-x="${key.split('-')[0]}"][data-y="${key.split('-')[1]}"]`);
            if (cell) {
                cell.classList.remove(`${charType}-${charName}`);
            }
            delete placedCharacters[key];
        }
        document.querySelectorAll('.char-btn').forEach(btn => btn.classList.remove('selected'));
        resultText.textContent = '配置がリセットされました。';
        clearAndPlaceCharacters({}); // 全ての配置をクリア
    });

    // グリッド線表示チェックボックスのイベントリスナー
    showGridLinesCheckbox.addEventListener('change', updateGridLines);

    // シミュレーションロジック（仮）
    function simulateFormation() {
        let allyCount = 0;
        let enemyCount = 0;
        let simulationOutput = '現在の配置: ';

        if (Object.keys(placedCharacters).length === 0) {
            simulationOutput += 'キャラクターは配置されていません。';
        } else {
            for (const key in placedCharacters) {
                const char = placedCharacters[key];
                simulationOutput += `${char.name}(${char.type === 'ally' ? '味方' : '敵'})@${key} `;
                if (char.type === 'ally') {
                    allyCount++;
                } else {
                    enemyCount++;
                }
            }
        }
        resultText.textContent = `${simulationOutput} (味方: ${allyCount}, 敵: ${enemyCount})`;
    }

    // データのエクスポート
    exportDataButton.addEventListener('click', () => {
        const data = JSON.stringify(placedCharacters);
        importDataInput.value = data;
        resultText.textContent = '配置データをテキストエリアにエクスポートしました。';
    });

    // データのインポート
    importDataButton.addEventListener('click', () => {
        try {
            const dataString = importDataInput.value;
            const importedCharacters = JSON.parse(dataString);
            clearAndPlaceCharacters(importedCharacters);
            resultText.textContent = '配置データをインポートしました。';
        } catch (e) {
            resultText.textContent = 'インポートデータが無効です。JSON形式を確認してください。';
            console.error('Import error:', e);
        }
    });

    // URLをコピー
    copyUrlButton.addEventListener('click', () => {
        const data = JSON.stringify(placedCharacters);
        const encodedData = btoa(encodeURIComponent(data)); // Base64エンコード
        const url = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;
        navigator.clipboard.writeText(url).then(() => {
            resultText.textContent = '現在の配置を含むURLをクリップボードにコピーしました。';
        }).catch(err => {
            resultText.textContent = 'URLのコピーに失敗しました。';
            console.error('Copy URL error:', err);
        });
    });

    // URLからのデータインポート（ページロード時）
    function importFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const encodedData = params.get('data');
        if (encodedData) {
            try {
                const decodedData = decodeURIComponent(atob(encodedData)); // Base64デコード
                const importedCharacters = JSON.parse(decodedData);
                clearAndPlaceCharacters(importedCharacters);
                resultText.textContent = 'URLから配置データをインポートしました。';
            } catch (e) {
                resultText.textContent = 'URLからのデータインポートに失敗しました。データが破損している可能性があります。';
                console.error('URL import error:', e);
            }
        }
    }

    // 初期化
    createGrid();
    importFromUrl(); // URLからのインポートを試みる
    simulateFormation(); // 初期状態のシミュレーション結果を表示
});
