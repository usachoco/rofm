import { updateGridLines, createGrid } from './grid.js'; // 仮のインポート、後で調整
import { clearAllCharacters } from './character.js'; // 仮のインポート、後で調整
import { clearSkillHighlights } from './skill.js'; // 仮のインポート、後で調整
import { exportData, importData, copyUrl } from './data.js'; // 仮のインポート、後で調整

export function setupUI(elements) {
    const {
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
    } = elements;

    // グリッド線表示チェックボックスのイベントリスナー
    showGridLinesCheckbox.addEventListener('change', () => updateGridLines(formationGrid, showGridLinesCheckbox));

    // 配置をリセットボタンのイベントリスナー
    resetFormationButton.addEventListener('click', () => {
        clearAllCharacters(formationGrid); // 全ての配置をクリア
        clearSkillHighlights(formationGrid); // リセット時にもスキルハイライトをクリア
        createGrid(formationGrid, showGridLinesCheckbox); // グリッドを再生成して初期状態に戻す
        resultText.textContent = '配置がリセットされました。';
    });

    // データのエクスポート
    exportDataButton.addEventListener('click', () => exportData(importDataInput, resultText));

    // データのインポート
    importDataButton.addEventListener('click', () => importData(importDataInput, formationGrid, resultText));

    // URLをコピー
    copyUrlButton.addEventListener('click', () => copyUrl(resultText));
}
