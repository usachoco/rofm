import { updateGridLines, createGrid } from './grid.js';
import { clearAllCharacters } from './character.js';
import { clearSkillHighlights } from './skill.js';
import { copyUrl } from './data.js';

/**
 * 分割代入されたHTMLエレメントにイベントリスナーをセットする
 * @param {Object} elements { }でまとめられたHTMLエレメント
 */
export function setupUI(elements) {
    const {
        formationGrid,
        showGridLinesCheckbox,
        enableCollisionCheckbox,
        resetFormationButton,
        characterButtons,
        resultText,
        copyUrlButton,
        skillButtons,
        collapsibleHeaders,
        resetSelectionAndMode,
    } = elements;

    // グリッド線表示チェックボックスのイベントリスナー
    showGridLinesCheckbox.addEventListener('change', () => 
        updateGridLines(formationGrid, showGridLinesCheckbox)
    );

    // 配置リセットボタンのイベントリスナー
    resetFormationButton.addEventListener('click', () => {
        clearAllCharacters(formationGrid); // 全ての配置をクリア
        clearSkillHighlights(formationGrid); // リセット時にもスキルハイライトをクリア
        createGrid(formationGrid, showGridLinesCheckbox); // グリッドを再生成して初期状態に戻す
        resetSelectionAndMode(); // 選択状態とモードをリセット
        resultText.textContent = '配置がリセットされました。';
    });

    // URLコピーボタンのイベントリスナー
    copyUrlButton.addEventListener('click', () => 
        copyUrl(resultText)
    );

    // サイドメニューの開閉イベントリスナー
    if (collapsibleHeaders && collapsibleHeaders.length > 0) {
        collapsibleHeaders.forEach(header => {
            header.addEventListener('click', function() {
                this.classList.toggle('expanded');
                const content = this.nextElementSibling;
            });
        });
    }
}
