import { showContextMenu } from './ui.js';
import { mapData, CELL_STATUS, placedCharacters, placedSkills, cellSkillEffects, SKILL_RANGE_LIST, gridWidth, gridHeight } from './data.js'; // cellSkillEffects, SKILL_RANGE_LIST をインポート
import { selectedCharacter, selectedCharacterType, placeCharacter } from './character.js';
import { selectedSkill, showTemporarySkillEffectRange, hideTemporarySkillEffectRange, placeSkill, TEMP_SKILL_ID } from './skill.js';
import { getIsLineOfSightMode, getFixedLineOfSightTarget, setFixedLineOfSightTarget, applyLineOfSightHighlight, handleLineOfSightMouseOver, clearLineOfSightHighlights } from './mode.js';

let draggedCharacterElement = null; // ドラッグ中のキャラクター要素
let originalCell = null; // ドラッグ開始時のセル
let draggedCharacterData = null; // ドラッグ中のキャラクターデータ

let isDraggingMap = false; // マップドラッグ中かどうか
let startDragX = 0; // マップドラッグ開始時のX座標
let startDragY = 0; // マップドラッグ開始時のY座標
let mapOffsetX = 0; // マップの現在のXオフセット
let mapOffsetY = 0; // マップの現在のYオフセット
let animationFrameId = null; // requestAnimationFrame のID

const enableCollisionCheckbox = document.getElementById('enable-collision');
const resultText = document.getElementById('result-text');

/**
 * マップデータに基づいてグリッド領域を生成する
 * @param {*} formationGrid 
 * @param {*} showGridLinesCheckbox 
 * @param {*} width 
 * @param {*} height 
 */
export function createGrid(formationGrid) {

    formationGrid.innerHTML = '';
    // グリッドのCSS変数を設定
    formationGrid.style.setProperty('--grid-width', gridWidth);
    formationGrid.style.setProperty('--grid-height', gridHeight);
    for (let i = 0; i < gridHeight; i++) {
        for (let j = 0; j < gridWidth; j++) {
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
            // ツールチップ要素を追加
            const tooltip = document.createElement('div');
            tooltip.classList.add('skill-tooltip');
            cell.appendChild(tooltip);

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
    // グリッド全体のマウスイベントリスナーを設定
    formationGrid.addEventListener('mousedown', (event) => {
        // 左クリックのみでドラッグを許可
        if (event.button !== 0) return;

        // クリックされた要素がキャラクターアイコンでない場合のみマップドラッグを開始
        const clickedElement = event.target.closest('.grid-cell');
        const characterElement = clickedElement ? clickedElement.querySelector('.character-icon') : null;

        if (!characterElement) {
            isDraggingMap = true;
            startDragX = event.clientX - mapOffsetX;
            startDragY = event.clientY - mapOffsetY;
            formationGrid.style.cursor = 'grabbing'; // カーソルを変更
            event.preventDefault(); // テキスト選択などを防ぐ
        }
    });

    formationGrid.addEventListener('mousemove', (event) => {
        if (isDraggingMap) {
            // 新しいオフセットを計算
            const newOffsetX = event.clientX - startDragX;
            const newOffsetY = event.clientY - startDragY;

            // オフセットが変更された場合のみ更新
            if (newOffsetX !== mapOffsetX || newOffsetY !== mapOffsetY) {
                mapOffsetX = newOffsetX;
                mapOffsetY = newOffsetY;

                // 既存のアニメーションフレームがあればキャンセル
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }

                // 次のアニメーションフレームでDOMを更新
                animationFrameId = requestAnimationFrame(() => {
                    formationGrid.style.transform = `translate(${mapOffsetX}px, ${mapOffsetY}px)`;
                });
            }
            event.preventDefault();
        }
    });

    formationGrid.addEventListener('mouseup', () => {
        if (isDraggingMap) {
            isDraggingMap = false;
            formationGrid.style.cursor = 'grab'; // カーソルを元に戻す
            // ドラッグ終了時にアニメーションフレームをキャンセル
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }
    });

    // 各グリッドセルにイベントリスナーを設定
    formationGrid.querySelectorAll('.grid-cell').forEach(cell => {
        cell.setAttribute('draggable', 'true');

        cell.addEventListener('dragstart', (event) => {
            const characterElement = event.target.querySelector('.character-icon');
            if (characterElement) {
                draggedCharacterElement = characterElement;
                originalCell = event.target;
                const originalX = parseInt(originalCell.dataset.x);
                const originalY = parseInt(originalCell.dataset.y);
                const cellKey = `${originalX}-${originalY}`;
                draggedCharacterData = placedCharacters[cellKey];

                if (draggedCharacterData) {
                    event.dataTransfer.setData('text/plain', JSON.stringify(draggedCharacterData));
                    event.dataTransfer.effectAllowed = 'move';
                    event.target.classList.add('dragging');
                } else {
                    event.preventDefault();
                }
            } else {
                // キャラクターアイコン以外がドラッグされた場合はドラッグを無効にする
                event.preventDefault();
            }
        });

        // ドラッグオーバーイベント (キャラクタードラッグ用)
        cell.addEventListener('dragover', (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
        });

        // ドロップイベント (キャラクタードラッグ用)
        cell.addEventListener('drop', (event) => {
            event.preventDefault();
            if (draggedCharacterElement && originalCell && draggedCharacterData) {
                const targetCell = event.target.closest('.grid-cell');
                if (targetCell && targetCell !== originalCell) {
                    const targetX = parseInt(targetCell.dataset.x);
                    const targetY = parseInt(targetCell.dataset.y);
                    const targetCellKey = `${targetX}-${targetY}`;

                    if (mapData[targetY][targetX] & CELL_STATUS.UNWALKABLE) {
                        resultText.textContent = `(${targetX},${targetY})は侵入不可セルです。キャラクターを配置できません。`;
                        return;
                    }

                    if (!placedCharacters[targetCellKey]) {
                        originalCell.removeChild(draggedCharacterElement);
                        originalCell.classList.remove('has-character');
                        originalCell.classList.remove(`${draggedCharacterData.type}-${draggedCharacterData.name}`);
                        const originalX = parseInt(originalCell.dataset.x);
                        const originalY = parseInt(originalCell.dataset.y);
                        delete placedCharacters[`${originalX}-${originalY}`];

                        targetCell.appendChild(draggedCharacterElement);
                        targetCell.classList.add('has-character');
                        targetCell.classList.add(`${draggedCharacterData.type}-${draggedCharacterData.name}`);
                        placedCharacters[targetCellKey] = draggedCharacterData;

                        resultText.textContent = `キャラクターを(${originalX},${originalY})から(${targetX},${targetY})へ移動しました。`;
                    } else {
                        resultText.textContent = 'このセルには既にキャラクターがいます。';
                    }
                }
            }
        });

        // ドラッグ終了イベント (キャラクタードラッグ用)
        cell.addEventListener('dragend', (event) => {
            if (originalCell) {
                originalCell.classList.remove('dragging');
            }
            draggedCharacterElement = null;
            originalCell = null;
            draggedCharacterData = null;
        });

        cell.addEventListener('click', (event) => {
            const x = parseInt(event.target.dataset.x);
            const y = parseInt(event.target.dataset.y);
            if (selectedCharacter && selectedCharacterType) {
                // キャラクター設置モード
                placeCharacter(event.target, x, y, enableCollisionCheckbox, resultText);
            } else if (selectedSkill) { // selectedSkillSize の代わりに selectedSkill を使用
                // スキル設置モード
                placeSkill(selectedSkill, x, y, formationGrid, resultText);
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
            const x = parseInt(event.target.dataset.x);
            const y = parseInt(event.target.dataset.y);
            const cellKey = `${x}-${y}`;
            const tooltipElement = event.target.querySelector('.skill-tooltip');

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

            // スキルの発動点にマウスオーバーした場合のみツールチップを表示
            if (placedSkills[cellKey] && tooltipElement) {
                tooltipElement.style.opacity = '1';
                tooltipElement.style.visibility = 'visible';
            }
        });
        cell.addEventListener('mouseout', (event) => {
            const x = parseInt(event.target.dataset.x);
            const y = parseInt(event.target.dataset.y);
            const cellKey = `${x}-${y}`;
            const tooltipElement = event.target.querySelector('.skill-tooltip');

            if (getIsLineOfSightMode()) {
                if (!getFixedLineOfSightTarget()) { // 射線モードで固定ターゲットがない場合
                    clearLineOfSightHighlights();
                }
            } else if (selectedSkill) { // 射線モードではないがスキルが選択されている場合
                hideTemporarySkillEffectRange(formationGrid);
            }

            // スキルの発動点からマウスが外れた場合のみツールチップを非表示
            if (placedSkills[cellKey] && tooltipElement) {
                tooltipElement.style.opacity = '0';
                tooltipElement.style.visibility = 'hidden';
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
    const tooltipElement = cellElement.querySelector('.skill-tooltip');

    // 背景色の更新
    if (activeSkillIds && activeSkillIds.size > 0) {
        const gradients = [];
        activeSkillIds.forEach(skillId => {
            const skill = SKILL_RANGE_LIST.find(s => s.id === skillId);
            if (skill && skill.color) {
                const color = hexToRgba(skill.color, 0.25);
                gradients.push(`linear-gradient(${color}, ${color})`);
            } else if (skillId === TEMP_SKILL_ID) {
                const color = hexToRgba('#ffff00', 0.25);
                gradients.push(`linear-gradient(${color}, ${color})`);
            }
        });
        cellElement.style.backgroundImage = gradients.join(', ');
    } else {
        cellElement.style.backgroundImage = 'none';
    }

    // ツールチップのテキスト内容の更新 (表示/非表示はイベントリスナーで制御)
    if (tooltipElement) {
        if (placedSkills[key]) { // このセルがスキルの発動点である場合
            const skillId = placedSkills[key].skillId;
            const skill = SKILL_RANGE_LIST.find(s => s.id === skillId);
            if (skill) {
                tooltipElement.textContent = skill.name;
                cellElement.classList.add('skill-origin-highlight'); // 発動点にハイライトを追加
            } else {
                tooltipElement.textContent = '';
                cellElement.classList.remove('skill-origin-highlight'); // スキルがない場合はハイライトを削除
            }
        } else { // スキルの発動点ではない場合
            tooltipElement.textContent = '';
            cellElement.classList.remove('skill-origin-highlight'); // 発動点ではない場合はハイライトを削除
        }
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
