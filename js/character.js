import { placedCharacters, simulateFormation, mapData, CELL_STATUS, ALLY_CHARACTERS, ENEMY_CHARACTERS } from './data.js';
import { clearSkillHighlights, clearSelectedSkill } from './skill.js';
import { handleCharacterSelectionModeChange } from './mode.js';

export let selectedCharacter = null;
export let selectedCharacterType = null; // 'ally' or 'enemy'

/**
 * 指定された座標のキャラクターを削除する
 * @param {*} x 
 * @param {*} y 
 * @param {*} formationGrid 
 * @param {*} resultText 
 */
export function deleteCharacter(x, y, formationGrid, resultText) {
    const cellKey = `${x}-${y}`;
    const characterData = placedCharacters[cellKey];

    if (characterData) {
        const cell = formationGrid.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (cell) {
            const charIcon = cell.querySelector('.character-icon');
            if (charIcon) {
                cell.removeChild(charIcon);
            }
            cell.classList.remove('has-character');
            cell.classList.remove(`${characterData.type}-${characterData.name}`);
            delete placedCharacters[cellKey];
            resultText.textContent = `(${x},${y}) の ${characterData.name} を削除しました。`;
            simulateFormation(resultText); // シミュレーションを再実行
        }
    } else {
        resultText.textContent = `(${x},${y}) にはキャラクターがいません。`;
    }
}

/**
 * キャラクター選択ボタンを動的に生成する
 * @param {*} resultText 
 * @param {*} formationGrid 
 */
export function createCharacterButtons(formationGrid, resultText) {
    // キャラクター選択ボタンを動的に生成
    const characterSelectionDiv = document.querySelector('.character-selection');
    ALLY_CHARACTERS.forEach(char => {
        const button = document.createElement('button');
        button.classList.add('char-btn');
        button.dataset.char = char.id;
        button.textContent = char.name;
        characterSelectionDiv.appendChild(button);
        setupCharacterButton(button, resultText, formationGrid)
    });
}

/**
 * エネミー選択ボタンを動的に生成する
 * @param {*} resultText 
 * @param {*} formationGrid 
 */
export function createEnemyButtons(formationGrid, resultText) {
    // エネミー選択ボタンを動的に生成
    const enemySelectionDiv = document.querySelector('.enemy-selection');
    ENEMY_CHARACTERS.forEach(char => {
        const button = document.createElement('button');
        button.classList.add('char-btn', 'enemy-btn');
        button.dataset.char = char.id;
        button.textContent = char.name;
        enemySelectionDiv.appendChild(button);
        setupCharacterButton(button, resultText, formationGrid)
    });
}

/**
 * キャラクター/エネミー設定ボタンにイベントリスナーを設定する
 * @param {*} button
 * @param {*} skillButtons 
 * @param {*} resultText 
 * @param {*} formationGrid 
 */
function setupCharacterButton(button, resultText, formationGrid) {
    const characterButtons = document.querySelectorAll('.char-btn');
    button.addEventListener('click', () => {
        clearSkillHighlights(formationGrid); // 新しい操作開始時にハイライトをクリア
        characterButtons.forEach(btn => btn.classList.remove('selected'));  // 一旦すべてのボタンを非選択にしてから
        button.classList.add('selected');   // このボタンだけ選択する
        selectedCharacter = button.dataset.char;
        selectedCharacterType = button.classList.contains('enemy-btn') ? 'enemy' : 'ally';
        // スキル選択を解除
        clearSelectedSkill();
        handleCharacterSelectionModeChange(); // モード切り替えロジックを呼び出す
        resultText.textContent = `${selectedCharacter} (${selectedCharacterType === 'ally' ? '味方' : '敵'}) が選択されました。グリッドをクリックして配置してください。`;
    });
}

/**
 * 現在選択中のキャラクター/エネミーを指定されたセルに設置する
 * @param {*} cell 
 * @param {*} x 
 * @param {*} y 
 * @param {*} enableCollisionCheckbox 
 * @param {*} resultText 
 * @returns 
 */
export function placeCharacter(cell, x, y, enableCollisionCheckbox, resultText) {
    const cellKey = `${x}-${y}`;
    // 侵入不可セルへの配置を禁止
    if (mapData[y][x] & CELL_STATUS.UNWALKABLE) {
        resultText.textContent = `(${x},${y})は侵入不可セルです。キャラクターを配置できません。`;
        return;
    }
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

/**
 * マップ上に配置されている全てのキャラクター情報を削除する
 * @param {*} formationGrid 
 */
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

/**
 * キャラクターボタンの選択状態を解除する
 */
export function clearSelectedCharacter() {
    document.querySelectorAll('.char-btn').forEach(btn => btn.classList.remove('selected'));
    selectedCharacter = null;
    selectedCharacterType = null;
}

/**
 * 渡されたキャラクタ配置座標に基づいてマップ上にキャラクタシンボルを描画する.
 * @param {*} charactersToPlace 
 * @param {*} formationGrid
 * @param {*} resultText 
 */
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
