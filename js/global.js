/**
 * 広範囲から参照される変数・関数群
 */

import { updateAllTooltipsVisibility } from './grid.js';

const showTooltipsCheckbox = document.getElementById('show-tooltips');

/**
 * ツールチップの可視状態を取得する
 * @returns 
 */
export function getStatusTooltip() {
    return showTooltipsCheckbox.checked;
}

/**
 * ツールチップ表示チェックボックスにイベントリスナーを設定する
 */
export function setupTooltipsCheckbox() {
    showTooltipsCheckbox.addEventListener('change', () => {
        updateAllTooltipsVisibility();
    });
}
