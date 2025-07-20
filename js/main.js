import { createGrid } from './grid.js';
import { setupCharacterButtons, selectedCharacter, selectedCharacterType, placeCharacter } from './character.js';
import { setupSkillButtons, selectedSkillSize, handleCellMouseOver, handleCellMouseOut, activateSkill } from './skill.js';
import { simulateFormation, importFromUrl } from './data.js';
import { setupUI } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const formationGrid = document.getElementById('formation-grid');
    const showGridLinesCheckbox = document.getElementById('show-grid-lines');
    const enableCollisionCheckbox = document.getElementById('enable-collision');
    const resetFormationButton = document.getElementById('reset-formation');
    const characterButtons = document.querySelectorAll('.char-btn');
    const resultText = document.getElementById('result-text');

    const exportDataButton = document.getElementById('export-data');
    const importDataInput = document.getElementById('import-data-input');
    const importDataButton = document.getElementById('import-data-button');
    const copyUrlButton = document.getElementById('copy-url-button');
    const skillButtons = document.querySelectorAll('.skill-btn');

    // UI要素をまとめて渡す
    setupUI({
        formationGrid,
        showGridLinesCheckbox,
        enableCollisionCheckbox,
        resetFormationButton,
        characterButtons,
        resultText,
        exportDataButton,
        importDataInput,
        importDataButton,
        copyUrlButton,
        skillButtons
    });

    // キャラクターボタンのセットアップ
    setupCharacterButtons(characterButtons, skillButtons, resultText, formationGrid);

    // スキルボタンのセットアップ
    setupSkillButtons(skillButtons, characterButtons, resultText, formationGrid);

    // グリッドの生成
    createGrid(formationGrid, showGridLinesCheckbox);

    // グリッドセルクリック時の処理
    formationGrid.querySelectorAll('.grid-cell').forEach(cell => {
        cell.addEventListener('click', (event) => {
            const x = parseInt(event.target.dataset.x);
            const y = parseInt(event.target.dataset.y);

            if (selectedCharacter && selectedCharacterType) {
                placeCharacter(event.target, x, y, enableCollisionCheckbox, formationGrid, resultText);
            } else if (selectedSkillSize) {
                activateSkill(event.target, x, y, formationGrid, resultText);
            } else {
                resultText.textContent = 'キャラクターまたはスキルを選択してください。';
            }
        });
        cell.addEventListener('mouseover', (event) => handleCellMouseOver(event, formationGrid));
        cell.addEventListener('mouseout', () => handleCellMouseOut(formationGrid));
    });

    // URLからのデータインポート（ページロード時）
    importFromUrl(formationGrid, resultText);

    // 初期状態のシミュレーション結果を表示
    simulateFormation(resultText);
});
