import { clearAndPlaceCharacters } from './character.js';
import { MAP_N1_ER, MAP_V3_ER } from './mapdata/map01.js';

/** セルのステータス定義  */
export const CELL_STATUS = {
    NONE: 0, // 制限なしセル
    UNWALKABLE: 1, // 侵入不可セル
    OBSTACLE: 2 // 射線を遮るセル
};

/** キャラクターの定義 */
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

/** 敵キャラクターの定義 */ 
export const ENEMY_CHARACTERS = [
    { id: 'player', name: '対戦相手' },
];

/** マップデータを保持する変数  */
export let mapData = [];

/** キャラクターシンボルの配置情報が格納される配列 */
export const placedCharacters = {}; // { "x-y": { name: "characterName", type: "ally/enemy" } }

/**
 * マップデータを初期化する
 */
export function initializeMapData() {
    mapData = MAP_N1_ER; // グローバルなmapDataを更新
}

/**
 * マップ上に配置されているシンボルの情報を画面表示するための文字列を生成する
 * @param {*} resultText 
 */
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

export async function setupCopyURLButton(resultText) {
    // URLコピーボタンのイベントリスナー
    const copyUrlButton = document.getElementById('copy-url-button');
    copyUrlButton.addEventListener('click', () => 
        copyUrl(resultText)
    );
}

/**
 * マップ上に配置されているシンボルの情報をURL文字列に書き出してクリップボードにコピーする
 * @param {*} resultText 
 */
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

/**
 * 与えられたURL文字列からデータを読み取ってマップ上にシンボルを配置する
 * @param {*} formationGrid 
 * @param {*} resultText 
 */
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

/**
 * 与えられたデータをdeflate圧縮してUint8配列にして返す
 * @param {Object} data 
 * @returns {Uint8Array}
 */
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

/**
 * 与えられたデータをinflate展開してObjectにして返す
 * @param {Uint8Array} compressedData 
 * @returns {Object}
 */
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

/**
 * Uint8ArrayをエンコードしたBase64文字列を返す
 * @param {Uint8Array} uint8Array 
 * @returns {string}
 */
function uint8ToBase64(uint8Array) {
  return btoa(String.fromCharCode.apply(null, uint8Array));
}

/**
 * Base64文字列をデコードしたUint8Arrayを返す
 * @param {string} base64String 
 * @returns {Uint8Array}
 */
function base64ToUint8(base64String) {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
