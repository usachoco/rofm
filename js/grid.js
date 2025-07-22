import { mapData, CELL_STATUS } from './data.js';
import { getIsLineOfSightMode, getFixedLineOfSightTarget, setFixedLineOfSightTarget, applyLineOfSightHighlight, handleLineOfSightMouseOver, clearLineOfSightHighlights } from './mode.js';
import { selectedCharacter, selectedCharacterType, placeCharacter } from './character.js';
import { selectedSkillSize, showTemporarySkillEffectRange, hideTemporarySkillEffectRange, activateSkill } from './skill.js';

/** マップの幅 */
export const gridWidth = 62; // 48
/** マップの高さ */
export const gridHeight = 44; // 27

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
