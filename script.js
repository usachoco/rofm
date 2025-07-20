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
    const skillButtons = document.querySelectorAll('.skill-btn'); // スキルボタンのDOM要素

    const gridSize = 10; // 10x10グリッド
    let selectedCharacter = null;
    let selectedCharacterType = null; // 'ally' or 'enemy'
    let selectedSkillSize = null; // 選択されたスキルの範囲 (3または5)
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
                cell.addEventListener('mouseover', handleCellMouseOver); // マウスオーバーイベントを追加
                cell.addEventListener('mouseout', handleCellMouseOut);   // マウスアウトイベントを追加
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
            clearSkillHighlights(); // 新しい操作開始時にハイライトをクリア
            // 選択状態の切り替え
            document.querySelectorAll('.char-btn').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            selectedCharacter = button.dataset.char;
            selectedCharacterType = button.classList.contains('enemy-btn') ? 'enemy' : 'ally';

            // スキル選択を解除
            skillButtons.forEach(btn => btn.classList.remove('selected'));
            selectedSkillSize = null;

            resultText.textContent = `${selectedCharacter} (${selectedCharacterType === 'ally' ? '味方' : '敵'}) が選択されました。グリッドをクリックして配置してください。`;
        });
    });

    // スキル選択ボタンのイベントリスナー
    skillButtons.forEach(button => {
        button.addEventListener('click', () => {
            clearSkillHighlights(); // 新しい操作開始時にハイライトをクリア
            // 選択状態の切り替え
            skillButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            selectedSkillSize = parseInt(button.dataset.skillSize);

            // キャラクター選択を解除
            document.querySelectorAll('.char-btn').forEach(btn => btn.classList.remove('selected'));
            selectedCharacter = null;
            selectedCharacterType = null;

            resultText.textContent = `${selectedSkillSize}x${selectedSkillSize}スキルが選択されました。グリッドにマウスオーバーして範囲を確認し、クリックして発動してください。`;
        });
    });

    // スキル範囲のハイライト表示
    function handleCellMouseOver(event) {
        if (selectedSkillSize) {
            clearSkillHighlights(); // 既存のハイライトをクリア
            const cell = event.target;
            const centerX = parseInt(cell.dataset.x);
            const centerY = parseInt(cell.dataset.y);

            const affectedCells = getSkillAffectedCells(centerX, centerY, selectedSkillSize);
            affectedCells.forEach(coord => {
                const targetCell = formationGrid.querySelector(`[data-x="${coord.x}"][data-y="${coord.y}"]`);
                if (targetCell) {
                    targetCell.classList.add('skill-highlight');
                }
            });
        }
    }

    // スキル範囲のハイライト解除
    function handleCellMouseOut() {
        // マウスアウト時は、スキルが選択されている場合のみハイライトをクリア
        // スキル発動後のハイライトは残すため、ここではクリアしない
        if (selectedSkillSize) {
            clearSkillHighlights();
        }
    }

    // スキルハイライトをクリアするヘルパー関数
    function clearSkillHighlights() {
        formationGrid.querySelectorAll('.grid-cell.skill-highlight').forEach(cell => {
            cell.classList.remove('skill-highlight');
        });
        formationGrid.querySelectorAll('.grid-cell.skill-target').forEach(cell => {
            cell.classList.remove('skill-target');
        });
        formationGrid.querySelectorAll('.grid-cell.skill-affected').forEach(cell => {
            cell.classList.remove('skill-affected');
        });
    }

    // グリッドセルクリック時の処理
    function handleCellClick(event) {
        const cell = event.target;
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);
        const cellKey = `${x}-${y}`;

        // clearSkillHighlights(); // クリック時にハイライトをクリア (ここから移動)

        if (selectedCharacter && selectedCharacterType) {
            // キャラクター配置ロジック（既存）
            if (placedCharacters[cellKey] && enableCollisionCheckbox.checked) {
                resultText.textContent = `(${x},${y})には既に${placedCharacters[cellKey].name}が配置されています。衝突判定が有効です。`;
                return;
            }

            if (cell.classList.contains('has-character')) {
                const existingChar = cell.querySelector('.character-icon');
                if (existingChar) {
                    cell.removeChild(existingChar);
                }
                cell.classList.remove('has-character');
                if (placedCharacters[cellKey]) {
                    cell.classList.remove(`${placedCharacters[cellKey].type}-${placedCharacters[cellKey].name}`);
                }
                delete placedCharacters[cellKey];
            }

            const charIcon = document.createElement('span');
            charIcon.classList.add('character-icon');
            charIcon.textContent = selectedCharacter.substring(0, 2).toUpperCase();
            cell.appendChild(charIcon);
            cell.classList.add('has-character');
            cell.classList.add(`${selectedCharacterType}-${selectedCharacter}`);
            placedCharacters[cellKey] = { name: selectedCharacter, type: selectedCharacterType };
            resultText.textContent = `${selectedCharacter} (${selectedCharacterType === 'ally' ? '味方' : '敵'}) を (${x},${y}) に配置しました。`;
            simulateFormation();

        } else if (selectedSkillSize) {
            // スキル発動ロジック
            clearSkillHighlights(); // スキル発動前に既存のハイライトをクリア
            cell.classList.add('skill-target'); // ターゲットセルをハイライト

            const affectedCells = getSkillAffectedCells(x, y, selectedSkillSize);
            let affectedCharacters = [];

            affectedCells.forEach(coord => {
                const key = `${coord.x}-${coord.y}`;
                const affectedCellElement = formationGrid.querySelector(`[data-x="${coord.x}"][data-y="${coord.y}"]`);
                if (affectedCellElement) {
                    affectedCellElement.classList.add('skill-affected'); // スキル影響範囲内のすべてのセルをハイライト
                }
                if (placedCharacters[key]) {
                    affectedCharacters.push(placedCharacters[key]);
                }
            });

            if (affectedCharacters.length > 0) {
                const charNames = affectedCharacters.map(char => `${char.name}(${char.type === 'ally' ? '味方' : '敵'})`).join(', ');
                resultText.textContent = `(${x},${y})に${selectedSkillSize}x${selectedSkillSize}スキルを発動！\n影響を受けるキャラクター: ${charNames}`;
            } else {
                resultText.textContent = `(${x},${y})に${selectedSkillSize}x${selectedSkillSize}スキルを発動しましたが、影響を受けるキャラクターはいません。`;
            }

            // スキル発動後、選択状態を解除
            skillButtons.forEach(btn => btn.classList.remove('selected'));
            selectedSkillSize = null;

        } else {
            resultText.textContent = 'キャラクターまたはスキルを選択してください。';
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
        clearSkillHighlights(); // リセット時にもスキルハイライトをクリア
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

    // スキル影響範囲のセル座標を計算するヘルパー関数
    function getSkillAffectedCells(centerX, centerY, skillSize) {
        const cells = [];
        const offset = Math.floor(skillSize / 2);

        for (let i = -offset; i <= offset; i++) {
            for (let j = -offset; j <= offset; j++) {
                const targetX = centerX + j;
                const targetY = centerY + i;

                // グリッド範囲内にあるかチェック
                if (targetX >= 0 && targetX < gridSize && targetY >= 0 && targetY < gridSize) {
                    cells.push({ x: targetX, y: targetY });
                }
            }
        }
        return cells;
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
