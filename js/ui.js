import { createGrid } from './grid.js';
import { clearAllCharacters, deleteCharacter } from './character.js';
import { clearAllSkillEffects, deleteSkill } from './skill.js'; // deleteSkill をインポート

let contextMenu = null; // コンテキストメニュー要素を保持する変数

/**
 * その他HTMLエレメントにイベントリスナーをセットする
 */
export function setupUI(formationGrid, resultText) {
    // 配置リセットボタンのイベントリスナー
    const resetFormationButton = document.getElementById('reset-formation');
    resetFormationButton.addEventListener('click', () => {
        clearAllCharacters(formationGrid); // 全ての配置をクリア
        clearAllSkillEffects(formationGrid); // リセット時にもスキルハイライトをクリア
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

    document.body.appendChild(contextMenu);
}

/**
 * コンテキストメニューを表示する
 * @param {number} xPos - メニューのX座標
 * @param {number} yPos - メニューのY座標
 * @param {number} targetX - ターゲットセルのX座標
 * @param {number} targetY - ターゲットセルのY座標
 * @param {string} type - 'character' または 'skill'
 * @param {HTMLElement} formationGrid - グリッド要素
 * @param {HTMLElement} resultText - 結果表示要素
 */
export function showContextMenu(xPos, yPos, targetX, targetY, type, formationGrid, resultText) {
    if (!contextMenu) return;

    // 既存のメニュー項目をクリア
    contextMenu.innerHTML = '';

    const deleteOption = document.createElement('div');
    deleteOption.classList.add('context-menu-item');
    deleteOption.textContent = '削除';
    deleteOption.addEventListener('click', () => {
        if (type === 'character') {
            deleteCharacter(targetX, targetY, formationGrid, resultText);
        } else if (type === 'skill') {
            deleteSkill(targetX, targetY, formationGrid, resultText);
        }
        contextMenu.style.display = 'none'; // メニューを非表示にする
    });
    contextMenu.appendChild(deleteOption);

    contextMenu.style.left = `${xPos}px`;
    contextMenu.style.top = `${yPos}px`;
    contextMenu.style.display = 'block';
    contextMenu.dataset.x = targetX; // 削除対象の座標を保存
    contextMenu.dataset.y = targetY;
}
