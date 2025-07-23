import { createGrid } from './grid.js';
import { clearAllCharacters, deleteCharacter } from './character.js'; // deleteCharacter をインポート
import { clearSkillHighlights } from './skill.js';

let contextMenu = null; // コンテキストメニュー要素を保持する変数

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

    // コンテキストメニューの初期化
    createContextMenu(formationGrid, resultText);
}

/**
 * コンテキストメニューを生成し、DOMに追加する
 * @param {*} formationGrid 
 * @param {*} resultText 
 */
function createContextMenu(formationGrid, resultText) {
    contextMenu = document.createElement('div');
    contextMenu.id = 'context-menu';
    contextMenu.classList.add('context-menu');
    contextMenu.style.display = 'none'; // 初期状態では非表示

    const deleteOption = document.createElement('div');
    deleteOption.classList.add('context-menu-item');
    deleteOption.textContent = '削除';
    deleteOption.addEventListener('click', () => {
        const x = parseInt(contextMenu.dataset.x);
        const y = parseInt(contextMenu.dataset.y);
        deleteCharacter(x, y, formationGrid, resultText);
        contextMenu.style.display = 'none'; // メニューを非表示にする
    });
    contextMenu.appendChild(deleteOption);

    document.body.appendChild(contextMenu);
}

/**
 * コンテキストメニューを表示する
 * @param {*} xPos 
 * @param {*} yPos 
 * @param {*} charX 
 * @param {*} charY 
 */
export function showContextMenu(xPos, yPos, charX, charY) {
    if (!contextMenu) return;

    contextMenu.style.left = `${xPos}px`;
    contextMenu.style.top = `${yPos}px`;
    contextMenu.style.display = 'block';
    contextMenu.dataset.x = charX; // 削除対象のキャラクターの座標を保存
    contextMenu.dataset.y = charY;
}
