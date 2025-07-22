import { placedCharacters, mapData, CELL_STATUS } from './data.js';
import { gridWidth, gridHeight } from './grid.js';
import { clearSelectedCharacter } from './character.js';
import { handleSkillSelectionModeChange } from './mode.js';

export let selectedSkillSize = null; // 選択されたスキルの範囲 (3または5)

/**
 * スキル選択ボタンにOnClickイベントハンドラを設定する
 * @param {*} skillButtons 
 * @param {*} resultText 
 * @param {*} formationGrid 
 */
export function setupSkillButtons(resultText, formationGrid) {
    const skillButtons = document.querySelectorAll('.skill-btn');
    skillButtons.forEach(button => {
        button.addEventListener('click', () => {
            clearSkillHighlights(formationGrid); // 新しい操作開始時にハイライトをクリア
            // 選択状態の切り替え
            skillButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            selectedSkillSize = parseInt(button.dataset.skillSize);
            // キャラクター選択を解除
            clearSelectedCharacter();
            handleSkillSelectionModeChange(); // モード切り替えロジックを呼び出す
            resultText.textContent = `${selectedSkillSize}x${selectedSkillSize}スキルが選択されました。グリッドにマウスオーバーして範囲を確認し、クリックして発動してください。`;
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
    if (selectedSkillSize) {
        clearSkillHighlights(formationGrid); // 既存のハイライトをクリア
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

/**
 * 移動中のスキル設置セルを非表示にする
 * - 仮のスキル影響範囲を削除する. これがないとマップ端に描画が残ってしまう.
 * @param {*} formationGrid 
 */
export function hideTemporarySkillEffectRange(formationGrid) {
    // スキル設置セルを検討している状態のとき
    if (selectedSkillSize) {
        clearSkillHighlights(formationGrid);    // 仮のスキル影響範囲を消去する
    }
}

/**
 * マップ上のスキル関連エフェクト（ハイライト）を削除する
 * - スキル設置セル
 * - スキル効果範囲セル
 * - スキルの影響を受けているキャラクターセル
 * @param {*} formationGrid 
 */
export function clearSkillHighlights(formationGrid) {
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

/**
 * 設置位置が確定したスキルの影響範囲を可視化する
 * @param {*} cell 設置先セル
 * @param {*} x 設置先セルのx座標 // TODO いらないのでは
 * @param {*} y 設置先セルのy座標 // TODO いらないのでは
 * @param {*} formationGrid
 * @param {*} resultText 
 */
export function activateSkill(cell, x, y, formationGrid, resultText) {
    clearSkillHighlights(formationGrid); // スキル発動前に既存のハイライトをクリア
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
            affectedCharacters.push(placedCharacters[key]); // 影響を受けるキャラクターをピックアップ
        }
    });
    if (affectedCharacters.length > 0) {
        const charNames = affectedCharacters.map(char => `${char.name}(${char.type === 'ally' ? '味方' : '敵'})`).join(', ');
        resultText.textContent = `(${x},${y})に${selectedSkillSize}x${selectedSkillSize}スキルを発動！\n影響を受けるキャラクター: ${charNames}`;
    } else {
        resultText.textContent = `(${x},${y})に${selectedSkillSize}x${selectedSkillSize}スキルを発動しましたが、影響を受けるキャラクターはいません。`;
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
    selectedSkillSize = null;
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
 * 起点と終点を結ぶセル座標の配列を返す.
 * この関数では障害物の存在が考慮される.
 * @param {*} x0 起点
 * @param {*} y0 起点
 * @param {*} x1 終点
 * @param {*} y1 終点
 * @returns {Array} セル座標 {x: x0, y: y0} の配列
 */
export function getLineOfSightCells(x0, y0, x1, y1) {
    const cells = [];
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;
    while (true) {
        // 現在のセルがグリッド範囲内にあるかチェック
        if (x0 < 0 || x0 >= gridWidth || y0 < 0 || y0 >= gridHeight) {
            break; // 範囲外に出たら終了
        }
        // 射線を遮るセル（OBSTACLE）があるかチェック
        // ただし、始点セル自体はチェックしない（始点に障害物があっても射線はそこから始まるため）
        if (!((x0 === x1 && y0 === y1) || (x0 === x0 && y0 === y0))) { // 終点または始点でない場合
            const cellStatus = mapData[y0][x0];
            if ((cellStatus & CELL_STATUS.OBSTACLE) === CELL_STATUS.OBSTACLE) {
                // 射線を遮るセルが見つかった場合、そのセルまでを射線として返し、終了
                cells.push({ x: x0, y: y0 }); // 障害物セル自体も射線に含まれる
                break;
            }
        }
        cells.push({ x: x0, y: y0 });
        // プレゼンハムのアルゴリズム
        if (x0 === x1 && y0 === y1) break;
        let e2 = 2 * err;
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
 * 指定されたセルを中心とした円形の射程範囲セル座標の配列を返す.
 * この関数では障害物の存在が考慮される.
 * @param {*} centerX 中心
 * @param {*} centerY 中心
 * @param {*} range 射程距離
 * @returns {Array} セル座標 {x: x0, y: y0} の配列
 */
export function getRangeAffectedCells(centerX, centerY, range) {
    const cells = new Set(); // 重複を避けるためにSetを使用
    for (let y = centerY - range; y <= centerY + range; y++) {
        for (let x = centerX - range; x <= centerX + range; x++) {
            // グリッド範囲内にあるかチェック
            if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
                // 中心からの距離を計算し、円形に含めるか判断
                const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                if (distance <= range) {
                    // 射線上に障害物がないかチェック
                    const lineOfSight = getLineOfSightCells(centerX, centerY, x, y);
                    let hasObstacle = false;
                    // 始点と終点を除く射線上のセルをチェック
                    for (let i = 0; i < lineOfSight.length - 1; i++) {
                        const losCell = lineOfSight[i];
                        // 始点セルはチェックしない
                        if (losCell.x === centerX && losCell.y === centerY) {
                            continue;
                        }
                        const cellStatus = mapData[losCell.y][losCell.x];
                        if ((cellStatus & CELL_STATUS.OBSTACLE) === CELL_STATUS.OBSTACLE) {
                            hasObstacle = true;
                            break;
                        }
                    }
                    // 終点セルが障害物の場合も射線は通らないと判断
                    if (lineOfSight.length > 0) {
                        const lastCell = lineOfSight[lineOfSight.length - 1];
                        if (lastCell.x === x && lastCell.y === y) {
                            const cellStatus = mapData[lastCell.y][lastCell.x];
                            if ((cellStatus & CELL_STATUS.OBSTACLE) === CELL_STATUS.OBSTACLE) {
                                hasObstacle = true;
                            }
                        }
                    }
                    // 経路上に障害物がないセルは有効射程範囲として追加する
                    if (!hasObstacle) {
                        cells.add(JSON.stringify({ x, y }));
                    }
                }
            }
        }
    }
    return Array.from(cells).map(s => JSON.parse(s));
}
