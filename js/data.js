import { clearAndPlaceCharacters } from './character.js';
// gridWidth, gridHeight は main.js で渡されるか、createMapData内で取得する

// セルのステータス定義
export const CELL_STATUS = {
    NONE: 0, // 制限なしセル
    UNWALKABLE: 1, // 侵入不可セル
    OBSTACLE: 2 // 射線を遮るセル
};

// マップデータを保持する変数 (初期化は後で行う)
export let mapData = [];

// マップデータを初期化する関数
export function initializeMapData(width, height) {
    const map = [];
    for (let i = 0; i < height; i++) {
        map.push(new Array(width).fill(CELL_STATUS.NONE));
    }
    // 例: 特定のセルを侵入不可に設定 (テスト用)
    map[5][5] = CELL_STATUS.UNWALKABLE;
    map[5][6] = CELL_STATUS.UNWALKABLE | CELL_STATUS.OBSTACLE; // 侵入不可かつ射線を遮るセル
    mapData = map; // グローバルなmapDataを更新
}

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
    { id: 'TT-M', name: 'トルバドゥール' },
    { id: 'TT-F', name: 'トルヴェール' },
    { id: 'WH', name: 'ウィンドホーク' },
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

export async function copyUrl(resultText) {
    const data = await compressData(placedCharacters);
    const encodedData = uint8ToBase64(data); // Base64エンコード
    const url = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;
    navigator.clipboard.writeText(url).then(() => {
        resultText.textContent = '現在の配置を含むURLをクリップボードにコピーしました。';
    }).catch(err => {
        resultText.textContent = 'URLのコピーに失敗しました。';
        console.error('Copy URL error:', err);
    });
}

export async function importFromUrl(formationGrid, resultText) {
    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get('data');
    if (encodedData) {
        try {
            const decodedData = base64ToUint8(encodedData); // Base64デコード
            const importedCharacters = await decompressData(decodedData);
            clearAndPlaceCharacters(importedCharacters, formationGrid, resultText);
            resultText.textContent = 'URLから配置データをインポートしました。';
        } catch (e) {
            resultText.textContent = 'URLからのデータインポートに失敗しました。データが破損している可能性があります。';
            console.error('URL import error:', e);
        }
    }
}

// 圧縮関数
async function compressData(data) {
  const jsonString = JSON.stringify(data);
  const textEncoder = new TextEncoder();
  const encoded = textEncoder.encode(jsonString);

  const cs = new CompressionStream('deflate'); // 'gzip' も選択可
  const writer = cs.writable.getWriter();
  writer.write(encoded);
  writer.close();

  const compressedBuffer = await new Response(cs.readable).arrayBuffer();
  // ArrayBuffer を Uint8Array に変換して返す
  return new Uint8Array(compressedBuffer);
}

// 展開関数
async function decompressData(compressedData) {
  const ds = new DecompressionStream('deflate'); // 'gzip' も選択可
  const writer = ds.writable.getWriter();
  writer.write(compressedData);
  writer.close();

  const decompressedBuffer = await new Response(ds.readable).arrayBuffer();
  const textDecoder = new TextDecoder();
  const jsonString = textDecoder.decode(decompressedBuffer);

  return JSON.parse(jsonString);
}

// Base64エンコードヘルパー
function uint8ToBase64(uint8Array) {
  return btoa(String.fromCharCode.apply(null, uint8Array));
}

// Base64デコードヘルパー
function base64ToUint8(base64String) {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
