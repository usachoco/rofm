import { placedCharacters } from './data.js';
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
