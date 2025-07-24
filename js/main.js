import { createGrid, setupGridLinesCheckbox } from './grid.js';
import { createCharacterButtons, createEnemyButtons } from './character.js';
import { createSkillButtons } from './skill.js';
import { simulateFormation, importFromUrl, createMapButtons, setupCopyURLButton } from './data.js';
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
    createMapButtons(formationGrid, resultText);
    createCharacterButtons(formationGrid, resultText);
    createEnemyButtons(formationGrid, resultText);
    createSkillButtons(formationGrid, resultText);
    setupGridLinesCheckbox(formationGrid);
    setupCopyURLButton(resultText);
    importFromUrl(formationGrid, resultText);
    createGrid(formationGrid);
    simulateFormation(resultText);
});
