import { placedCharacters, simulateFormation } from './data.js';
import { clearSkillHighlights, clearSelectedSkill } from './skill.js'; // clearSelectedSkillをインポート

export let selectedCharacter = null;
export let selectedCharacterType = null; // 'ally' or 'enemy'

export function setupCharacterButtons(characterButtons, skillButtons, resultText, formationGrid) {
    characterButtons.forEach(button => {
        button.addEventListener('click', () => {
            clearSkillHighlights(formationGrid); // 新しい操作開始時にハイライトをクリア
            // 選択状態の切り替え
            characterButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            selectedCharacter = button.dataset.char;
            selectedCharacterType = button.classList.contains('enemy-btn') ? 'enemy' : 'ally';

            // スキル選択を解除
            clearSelectedSkill(); // clearSelectedSkill関数を呼び出す
            
            resultText.textContent = `${selectedCharacter} (${selectedCharacterType === 'ally' ? '味方' : '敵'}) が選択されました。グリッドをクリックして配置してください。`;
        });
    });
}

export function placeCharacter(cell, x, y, enableCollisionCheckbox, formationGrid, resultText) {
    const cellKey = `${x}-${y}`;

    if (placedCharacters[cellKey] && enableCollisionCheckbox.checked) {
        resultText.textContent = `(${x},${y})には既に${placedCharacters[cellKey].name}が配置されています。衝突判定が有効です。`;
        return;
    }

    if (cell.classList.contains('has-character')) {
        const existingChar = cell.querySelector('.character-icon');
        if (existingChar) {
            cell.removeChild(existingChar);
        }
        cell.classList.remove('has-character');
        if (placedCharacters[cellKey]) {
            cell.classList.remove(`${placedCharacters[cellKey].type}-${placedCharacters[cellKey].name}`);
        }
        delete placedCharacters[cellKey];
    }

    const charIcon = document.createElement('span');
    charIcon.classList.add('character-icon');
    charIcon.textContent = selectedCharacter.substring(0, 2).toUpperCase();
    cell.appendChild(charIcon);
    cell.classList.add('has-character');
    cell.classList.add(`${selectedCharacterType}-${selectedCharacter}`);
    placedCharacters[cellKey] = { name: selectedCharacter, type: selectedCharacterType };
    resultText.textContent = `${selectedCharacter} (${selectedCharacterType === 'ally' ? '味方' : '敵'}) を (${x},${y}) に配置しました。`;
    simulateFormation(resultText);
}

export function clearAllCharacters(formationGrid) {
    formationGrid.querySelectorAll('.grid-cell').forEach(cell => {
        cell.classList.remove('has-character');
        const charIcon = cell.querySelector('.character-icon');
        if (charIcon) {
            cell.removeChild(charIcon);
        }
        // 以前のキャラクタータイプクラスを削除
        for (const key in placedCharacters) {
            const charType = placedCharacters[key].type;
            const charName = placedCharacters[key].name;
            cell.classList.remove(`${charType}-${charName}`);
        }
    });
    for (const key in placedCharacters) {
        delete placedCharacters[key];
    }
    selectedCharacter = null;
    selectedCharacterType = null;
    document.querySelectorAll('.char-btn').forEach(btn => btn.classList.remove('selected'));
}

export function clearSelectedCharacter() {
    document.querySelectorAll('.char-btn').forEach(btn => btn.classList.remove('selected'));
    selectedCharacter = null;
    selectedCharacterType = null;
}

export function clearAndPlaceCharacters(charactersToPlace, formationGrid, resultText) {
    clearAllCharacters(formationGrid); // 現在の配置を全てクリア

    // 新しいキャラクターを配置
    for (const key in charactersToPlace) {
        const char = charactersToPlace[key];
        const [x, y] = key.split('-');
        const cell = formationGrid.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (cell) {
            const charIcon = document.createElement('span');
            charIcon.classList.add('character-icon');
            charIcon.textContent = char.name.substring(0, 2).toUpperCase();
            cell.appendChild(charIcon);
            cell.classList.add('has-character');
            cell.classList.add(`${char.type}-${char.name}`);
            placedCharacters[key] = { name: char.name, type: char.type };
        }
    }
    simulateFormation(resultText);
}
