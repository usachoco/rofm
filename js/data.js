import { clearAndPlaceCharacters } from './character.js'; // 仮のインポート、後で調整

export const placedCharacters = {}; // { "x-y": { name: "characterName", type: "ally/enemy" } }

export const ALLY_CHARACTERS = [
    { id: 'DK', name: 'ドラゴンナイト' },
    { id: 'IG', name: 'インペリアルガード' },
    { id: 'AG', name: 'アークメイジ' },
    { id: 'EM', name: 'エレメンタルマスター' },
    { id: 'MT', name: 'マイスター' },
    { id: 'BO', name: 'バイオロ' },
    { id: 'SH', name: 'シャドウクロス' },
    { id: 'AY', name: 'アビスチェイサー' },
    { id: 'CD', name: 'カーディナル' },
    { id: 'IQ', name: 'インクイジター' },
    { id: 'SY', name: '天帝' },
    { id: 'ST', name: 'ソウルアセティック' },
    { id: 'SS-M', name: '蜃気楼' },
    { id: 'SS-F', name: '不知火' },
    { id: 'WH', name: 'ウィンドホーク' },
    { id: 'TT-M', name: 'トルバドゥール' },
    { id: 'TT-F', name: 'トルヴェール' },
    { id: 'NW', name: 'ナイトウォッチ' },
    { id: 'HN', name: 'ハイパーノービス' },
    { id: 'SD', name: 'スピリットハンドラー' }
];

export const ENEMY_CHARACTERS = [
    { id: 'player', name: '対戦相手' },
];

export function simulateFormation(resultText) {
    let allyCount = 0;
    let enemyCount = 0;
    let simulationOutput = '現在の配置: ';

    if (Object.keys(placedCharacters).length === 0) {
        simulationOutput += 'キャラクターは配置されていません。';
    } else {
        for (const key in placedCharacters) {
            const char = placedCharacters[key];
            simulationOutput += `${char.name}(${char.type === 'ally' ? '味方' : '敵'})@${key} `;
            if (char.type === 'ally') {
                allyCount++;
            } else {
                enemyCount++;
            }
        }
    }
    resultText.textContent = `${simulationOutput} (味方: ${allyCount}, 敵: ${enemyCount})`;
}

export function exportData(importDataInput, resultText) {
    const data = JSON.stringify(placedCharacters);
    importDataInput.value = data;
    resultText.textContent = '配置データをテキストエリアにエクスポートしました。';
}

export function importData(importDataInput, formationGrid, resultText) {
    try {
        const dataString = importDataInput.value;
        const importedCharacters = JSON.parse(dataString);
        clearAndPlaceCharacters(importedCharacters, formationGrid, resultText);
        resultText.textContent = '配置データをインポートしました。';
    } catch (e) {
        resultText.textContent = 'インポートデータが無効です。JSON形式を確認してください。';
        console.error('Import error:', e);
    }
}

export function copyUrl(resultText) {
    const data = JSON.stringify(placedCharacters);
    const encodedData = btoa(encodeURIComponent(data)); // Base64エンコード
    const url = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;
    navigator.clipboard.writeText(url).then(() => {
        resultText.textContent = '現在の配置を含むURLをクリップボードにコピーしました。';
    }).catch(err => {
        resultText.textContent = 'URLのコピーに失敗しました。';
        console.error('Copy URL error:', err);
    });
}

export function importFromUrl(formationGrid, resultText) {
    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get('data');
    if (encodedData) {
        try {
            const decodedData = decodeURIComponent(atob(encodedData)); // Base64デコード
            const importedCharacters = JSON.parse(decodedData);
            clearAndPlaceCharacters(importedCharacters, formationGrid, resultText);
            resultText.textContent = 'URLから配置データをインポートしました。';
        } catch (e) {
            resultText.textContent = 'URLからのデータインポートに失敗しました。データが破損している可能性があります。';
            console.error('URL import error:', e);
        }
    }
}
