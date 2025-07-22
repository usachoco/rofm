import { createGrid } from './grid.js';
import { clearAllCharacters } from './character.js';
import { clearSkillHighlights } from './skill.js';

/**
 * その他HTMLエレメントにイベントリスナーをセットする
 */
export function setupUI(formationGrid, resultText) {
    // 配置リセットボタンのイベントリスナー
    const resetFormationButton = document.getElementById('reset-formation');
    resetFormationButton.addEventListener('click', () => {
        clearAllCharacters(formationGrid); // 全ての配置をクリア
        clearSkillHighlights(formationGrid); // リセット時にもスキルハイライトをクリア
        createGrid(formationGrid); // グリッドを再生成して初期状態に戻す
        resultText.textContent = '配置がリセットされました。';
    });
    // サイドメニューの開閉イベントリスナー
    const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
    if (collapsibleHeaders && collapsibleHeaders.length > 0) {
        collapsibleHeaders.forEach(header => {
            header.addEventListener('click', function() {
                this.classList.toggle('expanded');
                const content = this.nextElementSibling;
            });
        });
    }
}
