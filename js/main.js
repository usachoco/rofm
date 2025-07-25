import { createGrid, setupGridLinesCheckbox } from './grid.js';
import { createCharacterButtons, createEnemyButtons } from './character.js';
import { createSkillDropdown } from './skill.js'; // createSkillButtons を createSkillDropdown に変更
import { simulateFormation, importFromUrl, createMapDropdown, setupCopyURLButton } from './data.js'; // createMapButtons を createMapDropdown に変更
import { setupUI } from './ui.js';
import { initializeMode } from './mode.js';

/**
 * モジュールの呼び出し起点となるファイルなので、ここには具体的なロジックを書かないこと
 */
document.addEventListener('DOMContentLoaded', () => {
    const resultText = document.getElementById('result-text');
    const formationGrid = document.getElementById('formation-grid');

    initializeMode(formationGrid, resultText);
    setupUI(formationGrid, resultText);
    createMapDropdown(formationGrid, resultText); // createMapButtons を createMapDropdown に変更
    createCharacterButtons(formationGrid, resultText);
    createEnemyButtons(formationGrid, resultText);
    createSkillDropdown(formationGrid, resultText); // createSkillButtons を createSkillDropdown に変更
    setupGridLinesCheckbox(formationGrid);
    setupCopyURLButton(resultText);
    importFromUrl(formationGrid, resultText);
    createGrid(formationGrid);
    simulateFormation(resultText);
});
