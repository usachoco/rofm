import * as gridModule from '../grid.js';

describe('grid.js', () => {
  let formationGrid;
  let showGridLinesCheckbox;

  beforeEach(() => {
    // 各テストの前にDOM要素を生成する
    document.body.innerHTML = `
      <div id="formation-grid"></div>
      <input type="checkbox" id="show-grid-lines">
    `;
    formationGrid = document.getElementById('formation-grid');
    showGridLinesCheckbox = document.getElementById('show-grid-lines');
  });

  afterEach(() => {
    // 各テストの後にDOMをクリーンアップする
    document.body.innerHTML = '';
  });

  // gridSize 定数のテストを追加
  describe('gridSize', () => {
    test('gridSizeが期待される値（10）であること', () => {
      expect(gridModule.gridSize).toBe(10);
    });
  });

  describe('createGrid', () => {
    test('グリッドが指定されたサイズで作成されること', () => {
      gridModule.createGrid(formationGrid, showGridLinesCheckbox);
      expect(formationGrid.children.length).toBe(gridModule.gridSize * gridModule.gridSize);
      expect(formationGrid.children[0].classList.contains('grid-cell')).toBe(true);
      expect(formationGrid.children[0].dataset.x).toBe('0');
      expect(formationGrid.children[0].dataset.y).toBe('0');
      expect(formationGrid.children[0].style.border).toBe('');  // デフォルトは border = 'none' ではなく空白
    });

    // グリッド作成前に既存のコンテンツがクリアされることのテストを追加
    test('グリッド作成前に既存のコンテンツがクリアされること', () => {
      formationGrid.innerHTML = '<div class="existing-content"></div>';
      gridModule.createGrid(formationGrid, showGridLinesCheckbox);
      expect(formationGrid.querySelector('.existing-content')).toBeNull();
      expect(formationGrid.children.length).toBe(gridModule.gridSize * gridModule.gridSize);
    });

    // 各セルのテキストコンテンツが正しいことのテストを追加
    test('各グリッドセルのテキストコンテンツが正しい座標文字列であること', () => {
      gridModule.createGrid(formationGrid, showGridLinesCheckbox);
      for (let i = 0; i < gridModule.gridSize; i++) {
        for (let j = 0; j < gridModule.gridSize; j++) {
          const cell = formationGrid.querySelector(`[data-x="${j}"][data-y="${i}"]`);
          expect(cell.textContent).toBe(`${j},${i}`);
        }
      }
    });

    test('updateGridLinesが適切に呼び出され、グリッドのボーダーが設定されること（チェックボックスがチェックされている場合）', () => {
        showGridLinesCheckbox.checked = true;
        gridModule.createGrid(formationGrid, showGridLinesCheckbox); // createGrid が内部で updateGridLines を呼び出す
        formationGrid.querySelectorAll('.grid-cell').forEach(cell => {
            expect(['1px solid #ddd', '1px solid rgb(221, 221, 221)']).toContain(cell.style.border)
        });
    });
    test('updateGridLinesが適切に呼び出され、グリッドのボーダーが設定されないこと（チェックボックスがチェックされていない場合）', () => {
        showGridLinesCheckbox.checked = false; // デフォルトだが明示的に
        gridModule.createGrid(formationGrid, showGridLinesCheckbox);
        formationGrid.querySelectorAll('.grid-cell').forEach(cell => {
            expect(['none', '']).toContain(cell.style.border);
        });
    });

  });

  describe('updateGridLines', () => {
    // updateGridLines 単体のテストのために、事前にグリッドを作成しておく
    beforeEach(() => {
        gridModule.createGrid(formationGrid, showGridLinesCheckbox);
    });
    test('チェックボックスがチェックされている場合、グリッドセルにボーダーが追加されること', () => {
      showGridLinesCheckbox.checked = true;
      gridModule.updateGridLines(formationGrid, showGridLinesCheckbox);
      formationGrid.querySelectorAll('.grid-cell').forEach(cell => {
        expect(['1px solid #ddd', '1px solid rgb(221, 221, 221)']).toContain(cell.style.border)
      });
    });
    test('チェックボックスがチェックされていない場合、グリッドセルからボーダーが削除されること', () => {
      // createGridで一度ボーダーなしに設定されるため、このテストケースだと不要かもしれないが、念のため
      formationGrid.querySelectorAll('.grid-cell').forEach(cell => {
          cell.style.border = '1px solid #ddd'; // 明示的にボーダーを付けてから消えるか確認
      });
      showGridLinesCheckbox.checked = false;
      gridModule.updateGridLines(formationGrid, showGridLinesCheckbox);
      formationGrid.querySelectorAll('.grid-cell').forEach(cell => {
        expect(['none', '']).toContain(cell.style.border);
      });
    });
  });

});
