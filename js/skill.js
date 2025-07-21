import { placedCharacters, mapData, CELL_STATUS } from './data.js';
import { gridWidth, gridHeight } from './grid.js';
import { clearSelectedCharacter } from './character.js'; // clearSelectedCharacterをインポート

export let selectedSkillSize = null; // 選択されたスキルの範囲 (3または5)

export function setupSkillButtons(skillButtons, characterButtons, resultText, formationGrid) {
    skillButtons.forEach(button => {
        button.addEventListener('click', () => {
            clearSkillHighlights(formationGrid); // 新しい操作開始時にハイライトをクリア
            // 選択状態の切り替え
            skillButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            selectedSkillSize = parseInt(button.dataset.skillSize);

            // キャラクター選択を解除
            clearSelectedCharacter(); // clearSelectedCharacter関数を呼び出す

            resultText.textContent = `${selectedSkillSize}x${selectedSkillSize}スキルが選択されました。グリッドにマウスオーバーして範囲を確認し、クリックして発動してください。`;
        });
    });
}

export function handleCellMouseOver(event, formationGrid) {
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

export function handleCellMouseOut(formationGrid) {
    // マウスアウト時は、スキルが選択されている場合のみハイライトをクリア
    // スキル発動後のハイライトは残すため、ここではクリアしない
    if (selectedSkillSize) {
        clearSkillHighlights(formationGrid);
    }
}

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
    document.querySelectorAll('.skill-btn').forEach(btn => btn.classList.remove('selected'));
    selectedSkillSize = null;
}

export function clearSelectedSkill() {
    document.querySelectorAll('.skill-btn').forEach(btn => btn.classList.remove('selected'));
    selectedSkillSize = null;
}

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

// プレゼンハムのアルゴリズムを実装
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

// 指定されたセルからの射程範囲内のセルを円形に取得
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
                        if (losCell.x === centerX && losCell.y === centerY) continue;
                        
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

                    if (!hasObstacle) {
                        cells.add(JSON.stringify({ x, y }));
                    }
                }
            }
        }
    }
    return Array.from(cells).map(s => JSON.parse(s));
}
