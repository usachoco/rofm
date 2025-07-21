import { mapData, CELL_STATUS } from './data.js';

/** マップの幅 */
export const gridWidth = 40; // 48
/** マップの高さ */
export const gridHeight = 40; // 27

/**
 * マップデータに基づいてマップ画面を初期描画する
 * @param {*} formationGrid 
 * @param {*} showGridLinesCheckbox 
 * @param {*} width 
 * @param {*} height 
 */
export function createGrid(formationGrid, showGridLinesCheckbox, width = gridWidth, height = gridHeight) {
    formationGrid.innerHTML = '';
    // グリッドのCSS変数を設定
    formationGrid.style.setProperty('--grid-width', width);
    formationGrid.style.setProperty('--grid-height', height);

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.dataset.x = j;
            cell.dataset.y = i;
            // マップデータに基づいてセルのステータスを設定
            const cellStatus = mapData[i][j];
            if (cellStatus === (CELL_STATUS.UNWALKABLE | CELL_STATUS.OBSTACLE)) {
                cell.classList.add('hardwall');
            }
            if (cellStatus === CELL_STATUS.UNWALKABLE) {
                cell.classList.add('softwall');
            }
            // イベントリスナーはmain.jsで設定するため、ここでは追加しない
            formationGrid.appendChild(cell);
        }
    }
    updateGridLines(formationGrid, showGridLinesCheckbox);
}

/**
 * マップ画面のグリッドライン表示・非表示を切り替える
 * @param {*} formationGrid 
 * @param {*} showGridLinesCheckbox 
 */
export function updateGridLines(formationGrid, showGridLinesCheckbox) {
    if (showGridLinesCheckbox.checked) {
        formationGrid.querySelectorAll('.grid-cell').forEach(cell => {
            cell.style.border = '1px solid #ddd';
        });
    } else {
        formationGrid.querySelectorAll('.grid-cell').forEach(cell => {
            cell.style.border = 'none';
        });
    }
}
