import { mapData, CELL_STATUS, placedCharacters } from './data.js'; // placedCharacters をインポート
import { selectedCharacter, selectedCharacterType, placeCharacter } from './character.js';
import { selectedSkillSize, showTemporarySkillEffectRange, hideTemporarySkillEffectRange, activateSkill } from './skill.js';
import { getIsLineOfSightMode, getFixedLineOfSightTarget, setFixedLineOfSightTarget, applyLineOfSightHighlight, handleLineOfSightMouseOver, clearLineOfSightHighlights } from './mode.js';

let draggedCharacterElement = null; // ドラッグ中のキャラクター要素
let originalCell = null; // ドラッグ開始時のセル
let draggedCharacterData = null; // ドラッグ中のキャラクターデータ

/** マップの幅 */
export const gridWidth = 50; // 48
/** マップの高さ */
export const gridHeight = 37; // 27

const enableCollisionCheckbox = document.getElementById('enable-collision');
const resultText = document.getElementById('result-text');

/**
 * マップデータに基づいてグリッド領域を生成する
 * @param {*} formationGrid 
 * @param {*} showGridLinesCheckbox 
 * @param {*} width 
 * @param {*} height 
 */
export function createGrid(formationGrid, width = gridWidth, height = gridHeight) {
    formationGrid.innerHTML = '';
    // グリッドのCSS変数を設定
    formationGrid.style.setProperty('--grid-width', width);
    formationGrid.style.setProperty('--grid-height', height);
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.dataset.x = j;
            cell.dataset.y = i;
            // マップデータに基づいてセルのステータスを設定
            const cellStatus = mapData[i][j];
            if (cellStatus === (CELL_STATUS.UNWALKABLE | CELL_STATUS.OBSTACLE)) {
                cell.classList.add('hardwall');
            }
            if (cellStatus === CELL_STATUS.UNWALKABLE) {
                cell.classList.add('softwall');
            }
            formationGrid.appendChild(cell);
        }
    }
    updateGridLines(formationGrid);
    setupGridEventListeners(formationGrid);
}

/**
 * グリッド領域にイベントリスナーを設定する
 * @param {*} formationGrid 
 */
function setupGridEventListeners(formationGrid) {
    formationGrid.querySelectorAll('.grid-cell').forEach(cell => {
        // 各セルをドラッグ可能にする
        cell.setAttribute('draggable', 'true');

        // ドラッグ開始イベント
        cell.addEventListener('dragstart', (event) => {
            // セルにキャラクター要素がある場合のみドラッグを許可
            const characterElement = event.target.querySelector('.character-icon'); // .character-icon に修正
            if (characterElement) {
                draggedCharacterElement = characterElement;
                originalCell = event.target;
                const originalX = parseInt(originalCell.dataset.x);
                const originalY = parseInt(originalCell.dataset.y);
                const cellKey = `${originalX}-${originalY}`;
                draggedCharacterData = placedCharacters[cellKey]; // placedCharactersからキャラクターデータを取得

                if (draggedCharacterData) {
                    // ドラッグ中のキャラクターの情報をDataTransferオブジェクトに設定
                    event.dataTransfer.setData('text/plain', JSON.stringify(draggedCharacterData));
                    event.dataTransfer.effectAllowed = 'move';
                    // ドラッグ中の要素にスタイルを適用（オプション）
                    event.target.classList.add('dragging');
                } else {
                    // データが見つからない場合はドラッグを無効にする
                    event.preventDefault();
                }
            } else {
                // キャラクターがいない場合はドラッグを無効にする
                event.preventDefault();
            }
        });

        // ドラッグオーバーイベント
        cell.addEventListener('dragover', (event) => {
            event.preventDefault(); // ドロップを許可するために必要
            event.dataTransfer.dropEffect = 'move';
            // ドロップ可能なセルにハイライト表示など（オプション）
        });

        // ドロップイベント
        cell.addEventListener('drop', (event) => {
            event.preventDefault();
            if (draggedCharacterElement && originalCell && draggedCharacterData) {
                const targetCell = event.target.closest('.grid-cell'); // ドロップ先のセルを取得
                if (targetCell && targetCell !== originalCell) {
                    const targetX = parseInt(targetCell.dataset.x);
                    const targetY = parseInt(targetCell.dataset.y);
                    const targetCellKey = `${targetX}-${targetY}`;

                    // 侵入不可セルへの配置を禁止
                    if (mapData[targetY][targetX] & CELL_STATUS.UNWALKABLE) {
                        resultText.textContent = `(${targetX},${targetY})は侵入不可セルです。キャラクターを配置できません。`;
                        return;
                    }

                    // ドロップ先のセルに既にキャラクターがいないか確認
                    if (!placedCharacters[targetCellKey]) { // placedCharacters を参照
                        // 元のセルからキャラクターを削除
                        originalCell.removeChild(draggedCharacterElement);
                        originalCell.classList.remove('has-character');
                        originalCell.classList.remove(`${draggedCharacterData.type}-${draggedCharacterData.name}`);
                        const originalX = parseInt(originalCell.dataset.x);
                        const originalY = parseInt(originalCell.dataset.y);
                        delete placedCharacters[`${originalX}-${originalY}`]; // placedCharacters から元のデータを削除

                        // 新しいセルにキャラクターを移動
                        targetCell.appendChild(draggedCharacterElement);
                        targetCell.classList.add('has-character');
                        targetCell.classList.add(`${draggedCharacterData.type}-${draggedCharacterData.name}`);
                        placedCharacters[targetCellKey] = draggedCharacterData; // placedCharacters に新しいデータを追加

                        resultText.textContent = `キャラクターを(${originalX},${originalY})から(${targetX},${targetY})へ移動しました。`;
                    } else {
                        resultText.textContent = 'このセルには既にキャラクターがいます。';
                    }
                }
            }
        });

        // ドラッグ終了イベント
        cell.addEventListener('dragend', (event) => {
            // ドラッグ中のスタイルを削除
            if (originalCell) {
                originalCell.classList.remove('dragging');
            }
            // 変数をリセット
            draggedCharacterElement = null;
            originalCell = null;
            draggedCharacterData = null; // ドラッグ中のキャラクターデータもリセット
        });

        cell.addEventListener('click', (event) => {
            const x = parseInt(event.target.dataset.x);
            const y = parseInt(event.target.dataset.y);
            if (selectedCharacter && selectedCharacterType) {
                // キャラクター設置モード
                placeCharacter(event.target, x, y, enableCollisionCheckbox, resultText);
            } else if (selectedSkillSize) {
                // スキル設置モード
                activateSkill(event.target, x, y, formationGrid, resultText);
                clearLineOfSightHighlights(); // スキル発動後に射線ハイライトをクリア
            } else if (getIsLineOfSightMode()) {
                // 射程設置モード
                const fixedTarget = getFixedLineOfSightTarget();
                if (fixedTarget && fixedTarget.x === x && fixedTarget.y === y) {
                    setFixedLineOfSightTarget(null);
                    clearLineOfSightHighlights();
                    resultText.textContent = `(${x},${y})の固定表示を解除しました。`;
                } else {
                    setFixedLineOfSightTarget({ x, y });
                    applyLineOfSightHighlight(x, y);
                    resultText.textContent = `(${x},${y})を中心とした射線と射程範囲が固定表示されました。`;
                }
            } else {
                resultText.textContent = 'キャラクターまたはスキルを選択してください。';
            }
        });
        cell.addEventListener('mouseover', (event) => {
            if (getIsLineOfSightMode() && selectedSkillSize) {
                clearLineOfSightHighlights();
                showTemporarySkillEffectRange(event, formationGrid);
            } else if (getIsLineOfSightMode() && !getFixedLineOfSightTarget()) {
                handleLineOfSightMouseOver(event.target);
            } else if (!getIsLineOfSightMode()) {
                showTemporarySkillEffectRange(event, formationGrid);
            }
        });
        cell.addEventListener('mouseout', () => {
            if (getIsLineOfSightMode() && !getFixedLineOfSightTarget()) {
                clearLineOfSightHighlights();
            } else if (!getIsLineOfSightMode()) {
                hideTemporarySkillEffectRange(formationGrid);
            }
        });
    });
}

/**
 * グリッドラインの表示・非表示チェックボックスにイベントリスナーを設定する
 * @param {*} formationGrid 
 */
export function setupGridLinesCheckbox(formationGrid) {
    // グリッド線表示チェックボックスのイベントリスナー
    const showGridLinesCheckbox = document.getElementById('show-grid-lines');
    showGridLinesCheckbox.addEventListener('change', () => 
        updateGridLines(formationGrid)
    );
}

/**
 * グリッド領域のライン表示・非表示を切り替える
 * @param {*} formationGrid 
 */
function updateGridLines(formationGrid) {
    const showGridLinesCheckbox = document.getElementById('show-grid-lines');
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
