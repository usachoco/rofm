import { createGrid, gridWidth, gridHeight } from './grid.js';
import { setupCharacterButtons, selectedCharacter, selectedCharacterType, placeCharacter, clearSelectedCharacter } from './character.js'; // clearSelectedCharacterをインポート
import { setupSkillButtons, selectedSkillSize, handleCellMouseOver, handleCellMouseOut, activateSkill, getLineOfSightCells, getRangeAffectedCells, clearSkillHighlights, clearSelectedSkill } from './skill.js'; // clearSelectedSkillをインポート
import { simulateFormation, importFromUrl, ALLY_CHARACTERS, ENEMY_CHARACTERS, initializeMapData, placedCharacters } from './data.js';
import { setupUI } from './ui.js';

let isLineOfSightMode = false; // 射線可視化モードの状態
let currentRange = 9; // デフォルトの射程距離
let fixedLineOfSightTarget = null; // クリックで固定された射線可視化のターゲットセル

document.addEventListener('DOMContentLoaded', () => {
    const formationGrid = document.getElementById('formation-grid');

    // マップデータを初期化
    initializeMapData(gridWidth, gridHeight);
    const showGridLinesCheckbox = document.getElementById('show-grid-lines');
    const enableCollisionCheckbox = document.getElementById('enable-collision');
    const resetFormationButton = document.getElementById('reset-formation');
    const resultText = document.getElementById('result-text');
    const copyUrlButton = document.getElementById('copy-url-button');
    const skillButtons = document.querySelectorAll('.skill-btn');
    const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
    const rangeInput = document.getElementById('range-input');
    const toggleLineOfSightModeButton = document.getElementById('toggle-line-of-sight-mode');

    // 全ての選択状態とモードをクリアする関数
    function resetSelectionAndMode() {
        clearSelectedCharacter();
        clearSelectedSkill();
        isLineOfSightMode = false;
        fixedLineOfSightTarget = null;
        toggleLineOfSightModeButton.classList.remove('selected'); // ボタンの選択状態も解除
        clearLineOfSightHighlights(formationGrid); // 射線ハイライトもクリア
        setupGridEventListeners(); // グリッドを再生成した後にイベントリスナーを再設定
    }

    // キャラクター選択ボタンを動的に生成
    const characterSelectionDiv = document.querySelector('.character-selection');
    ALLY_CHARACTERS.forEach(char => {
        const button = document.createElement('button');
        button.classList.add('char-btn');
        button.dataset.char = char.id;
        button.textContent = char.name;
        characterSelectionDiv.appendChild(button);
    });

    const enemySelectionDiv = document.querySelector('.enemy-selection');
    ENEMY_CHARACTERS.forEach(char => {
        const button = document.createElement('button');
        button.classList.add('char-btn', 'enemy-btn');
        button.dataset.char = char.id;
        button.textContent = char.name;
        enemySelectionDiv.appendChild(button);
    });

    // 動的に生成されたボタンを含むNodeListを再取得
    const characterButtons = document.querySelectorAll('.char-btn');

    // UI要素をまとめて渡す
        setupUI({
        formationGrid,
        showGridLinesCheckbox,
        enableCollisionCheckbox,
        resetFormationButton,
        characterButtons, // 更新されたcharacterButtonsを渡す
        resultText,
        copyUrlButton,
        skillButtons,
        collapsibleHeaders,
        rangeInput, // 新しいUI要素を追加
        toggleLineOfSightModeButton, // 新しいUI要素を追加
        resetSelectionAndMode // 新しい関数を追加
    });

    // キャラクターボタンのセットアップ
    setupCharacterButtons(characterButtons, skillButtons, resultText, formationGrid);

    // スキルボタンのセットアップ
    setupSkillButtons(skillButtons, characterButtons, resultText, formationGrid);

    // グリッドの生成
    createGrid(formationGrid, showGridLinesCheckbox, gridWidth, gridHeight);

    // グリッドセルにイベントリスナーを設定する関数
    function setupGridEventListeners() {
        formationGrid.querySelectorAll('.grid-cell').forEach(cell => {
            cell.addEventListener('click', (event) => {
                const x = parseInt(event.target.dataset.x);
                const y = parseInt(event.target.dataset.y);

                if (selectedCharacter && selectedCharacterType) {
                    placeCharacter(event.target, x, y, enableCollisionCheckbox, formationGrid, resultText);
                } else if (selectedSkillSize) {
                    activateSkill(event.target, x, y, formationGrid, resultText);
                    clearLineOfSightHighlights(formationGrid); // スキル発動後に射線ハイライトをクリア
                } else if (isLineOfSightMode) {
                    // 射線可視化モードでクリックされた場合
                    if (fixedLineOfSightTarget && fixedLineOfSightTarget.x === x && fixedLineOfSightTarget.y === y) {
                        // 同じセルを再度クリックした場合、固定を解除
                        fixedLineOfSightTarget = null;
                        clearLineOfSightHighlights(formationGrid);
                        resultText.textContent = `(${x},${y})の固定表示を解除しました。`;
                    } else {
                        // 別のセルをクリックした場合、そのセルを固定ターゲットにする
                        fixedLineOfSightTarget = { x, y };
                        applyLineOfSightHighlight(x, y, formationGrid);
                        resultText.textContent = `(${x},${y})を中心とした射線と射程範囲が固定表示されました。`;
                    }
                } else {
                    resultText.textContent = 'キャラクターまたはスキルを選択してください。';
                }
            });
            cell.addEventListener('mouseover', (event) => {
                if (isLineOfSightMode && selectedSkillSize) {
                    // 射線モードが有効で、かつスキルが選択されている場合、射線ハイライトをクリアしスキルハイライトを優先
                    clearLineOfSightHighlights(formationGrid);
                    handleCellMouseOver(event, formationGrid);
                } else if (isLineOfSightMode && !fixedLineOfSightTarget) {
                    // 射線モードが有効で、かつ固定ターゲットがない場合のみマウスオーバーハイライト
                    handleLineOfSightMouseOver(event.target, formationGrid);
                } else if (!isLineOfSightMode) {
                    // 通常のスキルモードの場合
                    handleCellMouseOver(event, formationGrid);
                }
            });
            cell.addEventListener('mouseout', () => {
                if (isLineOfSightMode && !fixedLineOfSightTarget) {
                    // 射線モードが有効で、かつ固定ターゲットがない場合のみマウスアウト時にハイライトをクリア
                    clearLineOfSightHighlights(formationGrid);
                } else if (!isLineOfSightMode) {
                    // 通常のスキルモードの場合
                    handleCellMouseOut(formationGrid);
                }
            });
        });
    }

    // 射程距離入力のイベントリスナー
    rangeInput.addEventListener('change', (event) => {
        currentRange = parseInt(event.target.value);
        if (isLineOfSightMode && fixedLineOfSightTarget) {
            // 射線モードが有効で、かつ固定ターゲットがある場合、固定ターゲットのハイライトを更新
            applyLineOfSightHighlight(fixedLineOfSightTarget.x, fixedLineOfSightTarget.y, formationGrid);
        } else if (isLineOfSightMode) {
            // 射線モードが有効で、固定ターゲットがない場合、現在のマウス位置のハイライトを更新
            const activeCell = formationGrid.querySelector('.grid-cell:hover');
            if (activeCell) {
                handleLineOfSightMouseOver(activeCell, formationGrid);
            }
        }
    });

    // 射線可視化モード切り替えボタンのイベントリスナー
    toggleLineOfSightModeButton.addEventListener('click', () => {
        isLineOfSightMode = !isLineOfSightMode;
        toggleLineOfSightModeButton.classList.toggle('selected', isLineOfSightMode);
        
        // 他のモードを解除
        clearSelectedCharacter();
        clearSelectedSkill();

        clearSkillHighlights(formationGrid); // スキル関連のハイライトをクリア
        clearLineOfSightHighlights(formationGrid); // 射線関連のハイライトをクリア
        fixedLineOfSightTarget = null; // 固定ターゲットを解除

        if (isLineOfSightMode) {
            resultText.textContent = `射線可視化モードが有効になりました。グリッドにマウスオーバーして射線と射程範囲を確認してください。`;
        } else {
            resultText.textContent = '射線可視化モードが無効になりました。';
        }
    });

    // キャラクターボタンのセットアップを修正 (モード切り替えロジックを追加)
    characterButtons.forEach(button => {
        button.addEventListener('click', () => {
            isLineOfSightMode = false; // 射線モードを解除
            toggleLineOfSightModeButton.classList.remove('selected');
            fixedLineOfSightTarget = null; // 固定ターゲットを解除
            clearSkillHighlights(formationGrid); // スキル関連のハイライトをクリア
            // clearLineOfSightHighlights(formationGrid); // キャラクター選択時は射線ハイライトをクリアしない
        });
    });

    // スキルボタンのセットアップを修正 (モード切り替えロジックを追加)
    skillButtons.forEach(button => {
        button.addEventListener('click', () => {
            isLineOfSightMode = false; // 射線モードを解除
            toggleLineOfSightModeButton.classList.remove('selected');
            fixedLineOfSightTarget = null; // 固定ターゲットを解除
            clearSkillHighlights(formationGrid); // スキル関連のハイライトをクリア
            // clearLineOfSightHighlights(formationGrid); // スキル選択時は射線ハイライトをクリアしない
        });
    });

    // 射線可視化モード用のマウスオーバーハンドラ
    // 射線可視化モードのハイライトをクリアする関数
    function clearLineOfSightHighlights(formationGrid) {
        formationGrid.querySelectorAll('.grid-cell.line-of-sight-highlight').forEach(cell => {
            cell.classList.remove('line-of-sight-highlight');
        });
        formationGrid.querySelectorAll('.grid-cell.range-highlight').forEach(cell => {
            cell.classList.remove('range-highlight');
        });
    }

    // 射線可視化モード用のマウスオーバーハンドラ
    function handleLineOfSightMouseOver(cell, formationGrid) {
        clearLineOfSightHighlights(formationGrid); // 既存のハイライトをクリア
        const targetX = parseInt(cell.dataset.x);
        const targetY = parseInt(cell.dataset.y);
        applyLineOfSightHighlight(targetX, targetY, formationGrid);
    }

    // 射線と射程範囲のハイライトを適用する共通関数
    function applyLineOfSightHighlight(targetX, targetY, formationGrid) {
        clearLineOfSightHighlights(formationGrid); // 既存のハイライトをクリア

        // 射程範囲内のセルをハイライト
        const rangeCells = getRangeAffectedCells(targetX, targetY, currentRange);
        rangeCells.forEach(coord => {
            const targetCell = formationGrid.querySelector(`[data-x="${coord.x}"][data-y="${coord.y}"]`);
            if (targetCell) {
                targetCell.classList.add('range-highlight');
            }
        });

        // 配置されているキャラクターからターゲットセルへの射線をハイライト
        Object.values(placedCharacters).forEach(char => {
            const charX = char.x;
            const charY = char.y;
            const distance = Math.sqrt(Math.pow(targetX - charX, 2) + Math.pow(targetY - charY, 2));

            if (distance <= currentRange) {
                const lineCells = getLineOfSightCells(charX, charY, targetX, targetY);
                lineCells.forEach(coord => {
                    const lineCellElement = formationGrid.querySelector(`[data-x="${coord.x}"][data-y="${coord.y}"]`);
                    if (lineCellElement) {
                        lineCellElement.classList.add('line-of-sight-highlight');
                    }
                });
            }
        });
    }

    // URLからのデータインポート（ページロード時）
    importFromUrl(formationGrid, resultText);

    // 初期状態のシミュレーション結果を表示
    simulateFormation(resultText);

    // 初期ロード時にイベントリスナーを設定
    setupGridEventListeners();
});
