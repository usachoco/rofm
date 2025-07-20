export const gridSize = 40; // 40x40グリッド

export function createGrid(formationGrid, showGridLinesCheckbox) {
    formationGrid.innerHTML = '';
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.dataset.x = j;
            cell.dataset.y = i;
            // イベントリスナーはmain.jsで設定するため、ここでは追加しない
            formationGrid.appendChild(cell);
        }
    }
    updateGridLines(formationGrid, showGridLinesCheckbox);
}

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
