import { getRangeAffectedCells, clearAllSkillEffects, getLineOfSightCells } from './skill.js';
import { clearSelectedCharacter } from './character.js';

let isLineOfSightMode = false;
let currentRange = 9;
let fixedLineOfSightTarget = null;
let formationGrid = null; // DOM要素を保持するための変数
let resultText = null; // 結果表示用のDOM要素
const toggleLineOfSightModeButton = document.getElementById('toggle-line-of-sight-mode');

export function initializeMode(gridElement, resultTextElement) {
    formationGrid = gridElement;
    resultText = resultTextElement;

    // 射程距離入力のイベントリスナー
    const rangeInput = document.getElementById('range-input');
    if (rangeInput) {
        rangeInput.addEventListener('change', (event) => {
            currentRange = parseInt(event.target.value);
            if (isLineOfSightMode && fixedLineOfSightTarget) {
                applyLineOfSightHighlight(fixedLineOfSightTarget.x, fixedLineOfSightTarget.y);
            } else if (isLineOfSightMode) {
                const activeCell = formationGrid.querySelector('.grid-cell:hover');
                if (activeCell) {
                    handleLineOfSightMouseOver(activeCell);
                }
            }
        });
    }

    // 射線可視化モード切り替えボタンのイベントリスナー
    if (toggleLineOfSightModeButton) {
        toggleLineOfSightModeButton.addEventListener('click', () => {
            isLineOfSightMode = !isLineOfSightMode;
            toggleLineOfSightModeButton.classList.toggle('selected', isLineOfSightMode);
            toggleLineOfSightModeButton.textContent = isLineOfSightMode ? '射程可視化モード: ON' : '射程可視化モード: OFF';
            
            clearSelectedCharacter();
            clearLineOfSightHighlights();
            fixedLineOfSightTarget = null;

            if (isLineOfSightMode) {
                resultText.textContent = `射程可視化モードが有効になりました。グリッドにマウスオーバーして射程範囲を確認してください。`;
            } else {
                resultText.textContent = '射程可視化モードが無効になりました。';
            }
        });
    }
}

// 全ての選択状態とモードをクリアする関数
export function resetSelectionAndMode() {
    clearSelectedCharacter();
    clearAllSkillEffects(formationGrid); // スキルハイライトもクリア
    clearLineOfSightHighlights(); // 射線ハイライトもクリア
    isLineOfSightMode = false;
    fixedLineOfSightTarget = null;
    if (toggleLineOfSightModeButton) {
        toggleLineOfSightModeButton.classList.remove('selected');
        toggleLineOfSightModeButton.textContent = '射程可視化モード: OFF';
    }
}

// 射線可視化モードのハイライトをクリアする関数
export function clearLineOfSightHighlights() {
    if (!formationGrid) return;
    formationGrid.querySelectorAll('.grid-cell.line-of-sight-highlight').forEach(cell => {
        cell.classList.remove('line-of-sight-highlight');
    });
    formationGrid.querySelectorAll('.grid-cell.range-highlight').forEach(cell => {
        cell.classList.remove('range-highlight');
    });
}

// 射線可視化モード用のマウスオーバーハンドラ
export function handleLineOfSightMouseOver(cell) {
    if (!formationGrid) return;
    clearLineOfSightHighlights();
    const targetX = parseInt(cell.dataset.x);
    const targetY = parseInt(cell.dataset.y);
    applyLineOfSightHighlight(targetX, targetY);
}

// 射線と射程範囲のハイライトを適用する共通関数
export function applyLineOfSightHighlight(targetX, targetY) {
    if (!formationGrid) return;
    clearLineOfSightHighlights();

    const rangeCells = getRangeAffectedCells(targetX, targetY, currentRange);
    rangeCells.forEach(coord => {
        const targetCell = formationGrid.querySelector(`[data-x="${coord.x}"][data-y="${coord.y}"]`);
        if (targetCell) {
            targetCell.classList.add('range-highlight');
        }
    });
}

/**
 * 始点から終点までの線分にハイライトを適用するデバッグ関数
 * @param {*} startCell 
 * @param {*} endCell 
 */
export function applyDebugLineOfSightHightlight(startCell, endCell) {
    // 初期化
    clearLineOfSightHighlights();
    // 描画
    getLineOfSightCells(startCell, endCell).forEach(coord => {
        const targetCell = formationGrid.querySelector(`[data-x="${coord.x}"][data-y="${coord.y}"]`);
        if (targetCell) {
            targetCell.classList.add('range-highlight');
        }
    });
}

// 射線可視化モードの状態を取得
export function getIsLineOfSightMode() {
    return isLineOfSightMode;
}

// 固定された射線可視化ターゲットの状態を取得
export function getFixedLineOfSightTarget() {
    return fixedLineOfSightTarget;
}

// 固定された射線可視化ターゲットを設定
export function setFixedLineOfSightTarget(target) {
    fixedLineOfSightTarget = target;
}

// 射程距離を取得
export function getCurrentRange() {
    return currentRange;
}

// 射程距離を設定
export function setCurrentRange(range) {
    currentRange = range;
}

// キャラクター選択時のモード解除
export function handleCharacterSelectionModeChange() {
    isLineOfSightMode = false;
    if (toggleLineOfSightModeButton) {
        // 射程範囲設置モードを解除する. ただし描画済みの射程範囲は削除しない
        toggleLineOfSightModeButton.classList.remove('selected');
        toggleLineOfSightModeButton.textContent = '射程可視化モード: OFF';
    }
    fixedLineOfSightTarget = null;
}

// スキル選択時のモード解除
export function handleSkillSelectionModeChange() {
    isLineOfSightMode = false;
    if (toggleLineOfSightModeButton) {
        toggleLineOfSightModeButton.classList.remove('selected');
        toggleLineOfSightModeButton.textContent = '射程可視化モード: OFF';
    }
    fixedLineOfSightTarget = null;
}
