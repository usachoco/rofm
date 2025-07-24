import { showContextMenu } from './ui.js';
import { mapData, CELL_STATUS, placedCharacters, cellSkillEffects, SKILL_RANGE_LIST } from './data.js'; // cellSkillEffects, SKILL_RANGE_LIST をインポート
import { selectedCharacter, selectedCharacterType, placeCharacter } from './character.js';
import { selectedSkill, showTemporarySkillEffectRange, hideTemporarySkillEffectRange, activateSkill } from './skill.js';
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
            // セルが生成されたときにスキルオーバーレイを初期化
            updateCellSkillOverlay(cell, j, i);
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
            } else if (selectedSkill) { // selectedSkillSize の代わりに selectedSkill を使用
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

        // 右クリックイベントリスナーを追加
        cell.addEventListener('contextmenu', (event) => {
            event.preventDefault(); // デフォルトのコンテキストメニューを抑制
            const x = parseInt(event.target.dataset.x);
            const y = parseInt(event.target.dataset.y);
            const cellKey = `${x}-${y}`;
            if (placedCharacters[cellKey]) {
                // キャラクターが存在する場合のみコンテキストメニューを表示
                showContextMenu(event.clientX, event.clientY, x, y);
            }
        });

        cell.addEventListener('mouseover', (event) => {
            if (getIsLineOfSightMode()) {
                if (selectedSkill) { // スキルが選択されている場合
                    clearLineOfSightHighlights();
                    showTemporarySkillEffectRange(event, formationGrid);
                } else if (!getFixedLineOfSightTarget()) { // 射線モードで固定ターゲットがない場合
                    handleLineOfSightMouseOver(event.target);
                }
            } else if (selectedSkill) { // 射線モードではないがスキルが選択されている場合
                showTemporarySkillEffectRange(event, formationGrid);
            }
        });
        cell.addEventListener('mouseout', () => {
            if (getIsLineOfSightMode()) {
                if (!getFixedLineOfSightTarget()) { // 射線モードで固定ターゲットがない場合
                    clearLineOfSightHighlights();
                }
            } else if (selectedSkill) { // 射線モードではないがスキルが選択されている場合
                hideTemporarySkillEffectRange(formationGrid);
            }
        });
    });

    // グリッド外をクリックしたらコンテキストメニューを非表示にする
    document.addEventListener('click', (event) => {
        const contextMenu = document.getElementById('context-menu');
        if (contextMenu && !contextMenu.contains(event.target)) {
            contextMenu.style.display = 'none';
        }
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

/**
 * セルに適用されているスキル効果に基づいて背景色を更新する
 * @param {HTMLElement} cellElement - 更新するセル要素
 * @param {number} x - セルのX座標
 * @param {number} y - セルのY座標
 */
export function updateCellSkillOverlay(cellElement, x, y) {
    const key = `${x}-${y}`;
    const activeSkillIds = cellSkillEffects[key];

    if (activeSkillIds && activeSkillIds.size > 0) {
        const gradients = [];
        activeSkillIds.forEach(skillId => {
            const skill = SKILL_RANGE_LIST.find(s => s.id === skillId);
            if (skill && skill.color) {
                // 半透明の色を生成 (例: 50% 透明度)
                const color = hexToRgba(skill.color, 0.25);
                gradients.push(`linear-gradient(${color}, ${color})`);
            }
        });
        // 複数のグラデーションを重ねて表示
        cellElement.style.backgroundImage = gradients.join(', ');
    } else {
        cellElement.style.backgroundImage = 'none'; // スキル効果がない場合は背景をクリア
    }
}

/**
 * 16進数カラーコードをRGBA形式に変換する
 * @param {string} hex - 16進数カラーコード (例: #RRGGBB)
 * @param {number} alpha - 透明度 (0.0 - 1.0)
 * @returns {string} RGBA形式の文字列 (例: rgba(255, 0, 0, 0.5))
 */
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
