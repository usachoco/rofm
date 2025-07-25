import { gridWidth, gridHeight, placedCharacters, mapData, CELL_STATUS, SKILL_RANGE_LIST, cellSkillEffects } from './data.js'; // cellSkillEffects をインポート
import { updateCellSkillOverlay } from './grid.js'; // updateCellSkillOverlay をインポート
import { clearSelectedCharacter } from './character.js';
import { handleSkillSelectionModeChange } from './mode.js';

export let selectedSkill = null; // 選択されたスキルオブジェクト (id, value, color を含む)
let tempSkillAffectedCells = []; // 一時的なスキル影響範囲のセルを追跡

export const TEMP_SKILL_ID = 'TEMP_SKILL'; // 一時的なスキルID

/**
 * スキル選択ボタンを動的に生成する
 * @param {*} resultText 
 * @param {*} formationGrid 
 */
export function createSkillButtons(formationGrid, resultText) {
    // スキル選択ボタンを動的に生成
    const skillSelectionDiv = document.querySelector('.skill-selection');
    SKILL_RANGE_LIST.forEach(skill => {
        const button = document.createElement('button');
        button.classList.add('skill-btn');
        button.dataset.skillId = skill.id; // skillId をデータ属性に追加
        button.dataset.skillSize = skill.value;
        button.textContent = skill.name;
        skillSelectionDiv.appendChild(button);
        setupSkillButtons(button, resultText, formationGrid)
    });
}

/**
 * スキル選択ボタンにOnClickイベントハンドラを設定する
 * @param {*} skillButtons 
 * @param {*} resultText 
 * @param {*} formationGrid 
 */
function setupSkillButtons(button, resultText, formationGrid) {
    const skillButtons = document.querySelectorAll('.skill-btn');
    skillButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 選択状態の切り替え
            skillButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            
            const skillId = button.dataset.skillId;
            const skillSize = parseInt(button.dataset.skillSize);
            const skillColor = SKILL_RANGE_LIST.find(s => s.id === skillId).color; // 色を取得
            selectedSkill = { id: skillId, size: skillSize, color: skillColor }; // selectedSkill を設定

            // キャラクター選択を解除
            clearSelectedCharacter();
            handleSkillSelectionModeChange(); // モード切り替えロジックを呼び出す
            resultText.textContent = `${button.textContent} スキルが選択されました。グリッドにマウスオーバーして範囲を確認し、クリックして発動してください。`;
        });
    });
}

/**
 * 移動中のスキル設置セルを描写する
 *   - 設置済みのスキル影響範囲を削除する
 *   - 現在のセルを中心とした仮のスキル影響範囲を描画する
 * @param {*} event 
 * @param {*} formationGrid 
 */
export function showTemporarySkillEffectRange(event, formationGrid) {
    hideTemporarySkillEffectRange(formationGrid);
    if (selectedSkill) {
        const cell = event.target;
        const centerX = parseInt(cell.dataset.x);
        const centerY = parseInt(cell.dataset.y);
        const affectedCells = getSkillAffectedCells(centerX, centerY, selectedSkill.size);
        affectedCells.forEach(coord => {
            const key = `${coord.x}-${coord.y}`;
            if (!cellSkillEffects[key]) {
                cellSkillEffects[key] = new Set();
            }
            cellSkillEffects[key].add(TEMP_SKILL_ID);
            const targetCell = formationGrid.querySelector(`[data-x="${coord.x}"][data-y="${coord.y}"]`);
            if (targetCell) {
                updateCellSkillOverlay(targetCell, coord.x, coord.y);
            }
            tempSkillAffectedCells.push(coord); // 一時的なセルを追跡
        });
    }
}

/**
 * 移動中のスキル設置セルを非表示にする
 * - 仮のスキル影響範囲を削除する. これがないとマップ端に描画が残ってしまう.
 * @param {*} formationGrid 
 */
export function hideTemporarySkillEffectRange(formationGrid) {
    // スキル設置セルを検討している状態のとき
    if (selectedSkill) {
        tempSkillAffectedCells.forEach(coord => {
            const key = `${coord.x}-${coord.y}`;
            if (cellSkillEffects[key]) {
                cellSkillEffects[key].delete(TEMP_SKILL_ID);
                const targetCell = formationGrid.querySelector(`[data-x="${coord.x}"][data-y="${coord.y}"]`);
                if (targetCell) {
                    updateCellSkillOverlay(targetCell, coord.x, coord.y);
                }
            }
        });
        tempSkillAffectedCells = []; // リセット
    }
}

/**
 * 設置済みのスキル関連エフェクトを削除する
 * @param {*} formationGrid 
 */
export function clearAllSkillEffects(formationGrid) { // 関数名を変更
    for (const key in cellSkillEffects) {
        const coords = key.split('-').map(Number);
        const cellElement = formationGrid.querySelector(`[data-x="${coords[0]}"][data-y="${coords[1]}"]`);
        if (cellElement) {
            cellSkillEffects[key].clear(); // Setをクリア
            updateCellSkillOverlay(cellElement, coords[0], coords[1]); // 背景色を更新
        }
        delete cellSkillEffects[key]; // マップからエントリを削除
    }
}

/**
 * 設置位置が確定したスキルの影響範囲を可視化する
 * @param {*} cell 設置先セル
 * @param {*} x 設置先セルのx座標
 * @param {*} y 設置先セルのy座標
 * @param {*} formationGrid
 * @param {*} resultText 
 */
export function activateSkill(cell, x, y, formationGrid, resultText) {
    hideTemporarySkillEffectRange(formationGrid);
    const affectedCells = getSkillAffectedCells(x, y, selectedSkill.size);
    let affectedCharacters = [];
    affectedCells.forEach(coord => {
        const key = `${coord.x}-${coord.y}`;
        if (!cellSkillEffects[key]) {
            cellSkillEffects[key] = new Set();
        }
        cellSkillEffects[key].add(selectedSkill.id); // 確定したスキルIDを追加
        const affectedCellElement = formationGrid.querySelector(`[data-x="${coord.x}"][data-y="${coord.y}"]`);
        if (affectedCellElement) {
            updateCellSkillOverlay(affectedCellElement, coord.x, coord.y); // 背景色を更新
        }
        if (placedCharacters[key]) {
            affectedCharacters.push(placedCharacters[key]); // 影響を受けるキャラクターをピックアップ
        }
    });
    if (affectedCharacters.length > 0) {
        const charNames = affectedCharacters.map(char => `${char.name}(${char.type === 'ally' ? '味方' : '敵'})`).join(', ');
        resultText.textContent = `(${x},${y})に${selectedSkill.size}x${selectedSkill.size}スキルを発動！\n影響を受けるキャラクター: ${charNames}`;
    } else {
        resultText.textContent = `(${x},${y})に${selectedSkill.size}x${selectedSkill.size}スキルを発動しましたが、影響を受けるキャラクターはいません。`;
    }
    clearSelectedSkill();
}

/**
 * 下記の「スキル設置セルを検討している状態」を解除する
 * - マウスホバーに仮のスキル影響範囲が追随する
 * - クリックした位置にスキル影響範囲が描画される
 */
export function clearSelectedSkill() {
    document.querySelectorAll('.skill-btn').forEach(btn => btn.classList.remove('selected'));
    selectedSkill = null; // selectedSkill を null にリセット
}

/**
 * 指定されたセルを中心とした四角形の効果範囲セル座標の配列を返す.
 * この関数では障害物の存在が考慮されない.
 * @param {*} centerX 
 * @param {*} centerY 
 * @param {*} skillSize 
 * @returns {Array} セル座標 {x: x0, y: y0} の配列
 */
export function getSkillAffectedCells(centerX, centerY, skillSize) {
    const cells = [];
    const offset = Math.floor(skillSize / 2);
    for (let i = -offset; i <= offset; i++) {
        for (let j = -offset; j <= offset; j++) {
            const targetX = centerX + j;
            const targetY = centerY + i;
            // グリッド範囲内にあるかチェック
            if (targetX >= 0 && targetX < gridWidth && targetY >= 0 && targetY < gridHeight) {
                cells.push({ x: targetX, y: targetY });
            }
        }
    }
    return cells;
}

/**
 * 2次元配列をピクセルグリッドと見なし、円の範囲内のセル座標を返す.
 *
 * @param {number} centerX - 円の中心のX座標
 * @param {number} centerY - 円の中心のY座標
 * @param {number} radius - 円の半径
 * @returns {Array<Array<number,number>>} セルの座標の配列. 例: [{x: 0, y: 0}, {x: 1, y: 1}]
 */
function getCircleRangeCells(centerX, centerY, radius) {
    const affectedCells = [];
    // 円の境界ボックスを計算
    const minX = Math.max(0, Math.floor(centerX - radius));
    const maxX = Math.min(gridWidth - 1, Math.ceil(centerX + radius));
    const minY = Math.max(0, Math.floor(centerY - radius));
    const maxY = Math.min(gridHeight - 1, Math.ceil(centerY + radius));
    // 境界ボックス内のすべてのセルを反復処理
    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            // 各セルが円の内側にあるかどうかをチェック（中心からの距離が半径以下か）
            const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            if (distance <= radius) {
                affectedCells.push({x: x, y: y});
            }
        }
    }
    return affectedCells;
}

/**
 * 2次元配列をピクセルグリッドと見なし、線分に含まれるセルの座標を返す.
 * ただし、障害物で遮られる場合、その線分は成立しないものとして無視する.
 *
 * @param {object} start 開始点 {x: number, y: number}
 * @param {object} end 終了点 {x: number, y: number}
 * @returns {Array<object>} 線分上のセルの座標の配列。例: [{x: 0, y: 0}, {x: 1, y: 1}]
 */
function getLineOfSightCells(start, end) {
    // 基本はブレゼンハムの線分アルゴリズムを採用
    const cells = [];
    let x0 = start.x;
    let y0 = start.y;
    const x1 = end.x;
    const y1 = end.y;
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;
    while (true) {
        // 障害物判定は独自処理
        const cellStatus = mapData[y0][x0];
        if ((cellStatus & CELL_STATUS.OBSTACLE) === CELL_STATUS.OBSTACLE) {
            return [];
        }
        cells.push({ x:x0, y:y0 });
        if (x0 === x1 && y0 === y1) {
          break;
        }
        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x0 += sx;
        }
        if (e2 < dx) {
          err += dx;
          y0 += sy;
        }
    }
    return cells;
}

/**
 * 射程範囲内かつ障害物に遮られないセルの座標を返す.
 * @param {number} centerX 円の中心のX座標
 * @param {number} centerY 円の中心のY座標
 * @param {number} radius 円の半径
 * @returns {Array<Array<number, number>>} セルの座標の配列. 例: [{x: 0, y: 0}, {x: 1, y: 1}]
 */
export function getRangeAffectedCells(centerX, centerY, radius) {
    let cells = [];
    // 射程範囲円を取得する
    const circleRange = getCircleRangeCells(centerX, centerY, radius);
    // 射程範囲内で射線が通るセルを取得する
    circleRange.forEach(end => {
        const start = {x:centerX, y:centerY};
        const activeCells = getLineOfSightCells(start, end);
        if (activeCells.length > 0) {
            cells = cells.concat(activeCells);
        }
    });
    // 重複しているセルを排除する
    const uniqueActiveCellsMap = new Map();
    cells.forEach((cell) => {
        const key = `${cell.x}_${cell.y}`;
        uniqueActiveCellsMap.set(key, cell);
    });
    const uniqueActiveCells = Array.from(uniqueActiveCellsMap.values());
    return uniqueActiveCells;
}
