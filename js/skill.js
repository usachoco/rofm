import { gridWidth, gridHeight, placedCharacters, mapData, CELL_STATUS, SKILL_RANGE_LIST, cellSkillEffects, placedSkills } from './data.js'; // cellSkillEffects をインポート
import { updateCellSkillOverlay, updateSkillTooltipsVisibility } from './grid.js'; // updateCellSkillOverlay をインポート
import { clearSelectedCharacter } from './character.js';
import { handleSkillSelectionModeChange } from './mode.js';

export let selectedSkill = null; // 選択されたスキルオブジェクト (id, value, color を含む)
let tempSkillAffectedCells = []; // 一時的なスキル影響範囲のセルを追跡


export const TEMP_SKILL_ID = 'TEMP_SKILL'; // 一時的なスキルID

/**
 * スキル選択ドロップダウンを動的に生成する
 * @param {*} resultText 
 * @param {*} formationGrid 
 */
export function createSkillDropdown(formationGrid, resultText) {
    const skillInput = document.getElementById('skill-select');
    const skillDatalist = document.getElementById('skill-list');
    skillDatalist.innerHTML = ''; // 既存のオプションをクリア

    SKILL_RANGE_LIST.forEach(skill => {
        const option = document.createElement('option');
        option.value = skill.name; // datalistのoptionのvalueは表示される値
        option.dataset.id = skill.id; // 実際のIDはdata属性に保存
        skillDatalist.appendChild(option);
    });

    skillInput.addEventListener('input', function() {
        const selectedOption = Array.from(skillDatalist.options).find(
            option => option.value === this.value
        );
        const selectedSkillId = selectedOption ? selectedOption.dataset.id : null;

        if (selectedSkillId) {
            const skillData = SKILL_RANGE_LIST.find(s => s.id === selectedSkillId);
            selectedSkill = { id: skillData.id, size: skillData.size, color: skillData.color };

            clearSelectedCharacter();
            handleSkillSelectionModeChange();
            resultText.textContent = `${skillData.name} スキルが選択されました。グリッドにマウスオーバーして範囲を確認し、クリックして発動してください。`;
        } else {
            // スキルが選択されていない状態（クリアされた場合など）の処理
            clearSelectedSkill();
            resultText.textContent = 'スキル選択が解除されました。';
        }
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
            if (!cellSkillEffects.has(key)) {
                cellSkillEffects.set(key, new Map());
            }
            const skillCounts = cellSkillEffects.get(key);
            skillCounts.set(TEMP_SKILL_ID, (skillCounts.get(TEMP_SKILL_ID) || 0) + 1); // カウントをインクリメント

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
            if (cellSkillEffects.has(key)) {
                const skillCounts = cellSkillEffects.get(key);
                const currentCount = skillCounts.get(TEMP_SKILL_ID) || 0;
                if (currentCount > 1) {
                    skillCounts.set(TEMP_SKILL_ID, currentCount - 1); // カウントをデクリメント
                } else {
                    skillCounts.delete(TEMP_SKILL_ID); // カウントが0になったら削除
                }

                if (skillCounts.size === 0) {
                    cellSkillEffects.delete(key); // そのセルにスキル効果がなくなったらエントリを削除
                }

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
    for (const key in placedSkills) {
        // 発動点となるセルのツールチップをクリアするために updateCellSkillOverlay を呼び出す
        const coords = key.split('-').map(Number);
        const cellElement = formationGrid.querySelector(`[data-x="${coords[0]}"][data-y="${coords[1]}"]`);
        if (cellElement) {
            // placedSkills から削除する前に、updateCellSkillOverlay を呼び出すことで、
            // placedSkills[key] が undefined になり、ツールチップが非表示になる
            updateCellSkillOverlay(cellElement, coords[0], coords[1]);
        }
        delete placedSkills[key]; // マップからエントリを削除
    }
}

/**
 * 設置位置が確定したスキルの影響範囲を可視化する
 * @param {*} skill 設置するスキル
 * @param {*} x 設置先セルのx座標
 * @param {*} y 設置先セルのy座標
 * @param {*} formationGrid
 * @param {*} resultText 
 */
export function placeSkill(skill, x, y, formationGrid, resultText) {
    hideTemporarySkillEffectRange(formationGrid);
    // スキルの発動点を保存
    const cellKey = `${x}-${y}`;
    const targetCell = formationGrid.querySelector(`[data-x="${x}"][data-y="${y}"]`);
    placedSkills[cellKey] = { skillId: skill.id };
    updateSkillTooltipsVisibility(targetCell, cellKey);
    // スキルの効果範囲を描画
    const affectedCells = getSkillAffectedCells(x, y, skill.size);
    let affectedCharacters = [];
    affectedCells.forEach(coord => {
        const key = `${coord.x}-${coord.y}`;
        if (!cellSkillEffects.has(key)) {
            cellSkillEffects.set(key, new Map());
        }
        const skillCounts = cellSkillEffects.get(key);
        skillCounts.set(skill.id, (skillCounts.get(skill.id) || 0) + 1); // カウントをインクリメント

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
        resultText.textContent = `(${x},${y})に${skill.size}x${skill.size}スキルを発動！\n影響を受けるキャラクター: ${charNames}`;
    } else {
        resultText.textContent = `(${x},${y})に${skill.size}x${skill.size}スキルを発動しましたが、影響を受けるキャラクターはいません。`;
    }
    clearSelectedSkill();
}

/**
 * 下記の「スキル設置セルを検討している状態」を解除する
 * - マウスホバーに仮のスキル影響範囲が追随する
 * - クリックした位置にスキル影響範囲が描画される
 */
export function clearSelectedSkill() {
    const skillInput = document.getElementById('skill-select');
    skillInput.value = ''; // 選択を解除
    selectedSkill = null; // selectedSkill を null にリセット
}

/**
 * 指定された座標のスキルを削除する
 * @param {number} x - スキルのX座標
 * @param {number} y - スキルのY座標
 * @param {HTMLElement} formationGrid - グリッド要素
 * @param {HTMLElement} resultText - 結果表示要素
 */
export function deleteSkill(x, y, formationGrid, resultText) {
    const cellKey = `${x}-${y}`;
    const skillToDelete = placedSkills[cellKey];

    if (skillToDelete) {
        // スキルの影響範囲をクリア
        const affectedCells = getSkillAffectedCells(x, y, SKILL_RANGE_LIST.find(s => s.id === skillToDelete.skillId).size);
        affectedCells.forEach(coord => {
            const key = `${coord.x}-${coord.y}`;
            if (cellSkillEffects.has(key)) {
                const skillCounts = cellSkillEffects.get(key);
                const currentCount = skillCounts.get(skillToDelete.skillId) || 0;
                if (currentCount > 1) {
                    skillCounts.set(skillToDelete.skillId, currentCount - 1); // カウントをデクリメント
                } else {
                    skillCounts.delete(skillToDelete.skillId); // カウントが0になったら削除
                }

                if (skillCounts.size === 0) {
                    cellSkillEffects.delete(key); // そのセルにスキル効果がなくなったらエントリを削除
                }

                const targetCell = formationGrid.querySelector(`[data-x="${coord.x}"][data-y="${coord.y}"]`);
                if (targetCell) {
                    updateCellSkillOverlay(targetCell, coord.x, coord.y);
                }
            }
        });

        // placedSkills からスキルを削除
        delete placedSkills[cellKey];

        // 発動点セルのハイライトとツールチップを更新
        const originCellElement = formationGrid.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (originCellElement) {
            updateSkillTooltipsVisibility(originCellElement, cellKey);
            updateCellSkillOverlay(originCellElement, x, y);
        }

        resultText.textContent = `(${x},${y})のスキルを削除しました。`;
    } else {
        resultText.textContent = `(${x},${y})にスキルは存在しません。`;
    }
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
            let distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            distance = Math.floor(distance * 10) / 10;
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
 * 障害物で遮られずに線分が成立するか調べる
 * @param {*} start 
 * @param {*} end 
 * @returns {boolean}
 */
function assertLineOfSight(start, end) {
    const cells = getLineOfSightCells(start, end);
    return (cells.length > 0);
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
        if (assertLineOfSight(start, end)) {
            cells.push(end);
        }
    });
    return cells;
    /*
    // 重複しているセルを排除する
    const uniqueActiveCellsMap = new Map();
    cells.forEach((cell) => {
        const key = `${cell.x}_${cell.y}`;
        uniqueActiveCellsMap.set(key, cell);
    });
    const uniqueActiveCells = Array.from(uniqueActiveCellsMap.values());
    return uniqueActiveCells;
    */
}
