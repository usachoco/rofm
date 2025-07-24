import { clearAndPlaceCharacters, clearAllCharacters } from './character.js';
import { MAP_LIST } from './mapdata/map01.js';
import { createGrid } from './grid.js';


/** マップの幅 */
export let gridWidth = 0;
/** マップの高さ */
export let gridHeight = 0;

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

/** 設置スキルの定義 */
export const SKILL_RANGE_LIST = [
    { id: 'BD_ROKISWEIL', name: 'ロキの叫び', value: 23, color: '#ff0000'},
    { id: 'DC_UGLYDANCE', name: '自分勝手なダンス', value: 23, color: '#00ff00'},
    { id: 'WM_SATURDAY_NIGHT_FEVER', name: 'フライデーナイトフィーバー', value: 23, color: '#0000ff'},
    { id: 'WM_MELODYOFSINK', name: 'メロディーオブシンク', value: 23, color: '#ff00ff'},
    { id: 'EM_LIGHTNING_LAND', name: 'ライトニングランド', value: 9, color: '#ff0000'},
    { id: 'SA_LANDPROTECTOR', name: 'ランドプロテクター', value: 11, color: '#00ff00'},
]

/** マップデータを保持する変数  */
export let mapData = [];
export let mapID = '';

/** キャラクターシンボルの配置情報が格納される配列 */
export const placedCharacters = {}; // { "x-y": { name: "characterName", type: "ally/enemy" } }

/** 設置スキルシンボルの配置情報が格納される配列 */
export const placedSkills = {};

/** 各セルに影響を与えているスキルIDのリストが格納されるマップ */
export const cellSkillEffects = {}; // { "x-y": Set<string> }

/**
 * マップ選択ボタンを動的に生成する
 * @param {*} resultText 
 * @param {*} formationGrid 
 */
export function createMapButtons(formationGrid, resultText) {
    // マップ選択ボタンを動的に生成
    const mapSelectionDiv = document.querySelector('.map-selection');
    MAP_LIST.forEach(map => {
        const button = document.createElement('button');
        button.classList.add('map-btn');
        button.dataset.map = map.id;
        button.textContent = map.name;
        mapSelectionDiv.appendChild(button);
        setupMapButton(button, resultText, formationGrid)
    });
}

/**
 * マップ設定ボタンにイベントリスナーを設定する
 * @param {*} button
 * @param {*} skillButtons 
 * @param {*} resultText 
 * @param {*} formationGrid 
 */
function setupMapButton(button, resultText, formationGrid) {
    button.addEventListener('click', () => {
        const mapButtons = document.querySelectorAll('.map-btn');
        // キャラクタ配置初期化
        clearAllCharacters(formationGrid);
        // マップ読み込み
        initializeMapData(button.dataset.map);
        createGrid(formationGrid);
        resultText.textContent = `${button.textContent} が選択されました。`;
        mapButtons.forEach(btn => btn.classList.remove('selected'));  // 一旦すべてのボタンを非選択にしてから
        button.classList.add('selected');   // このボタンだけ選択する
    });
}

/**
 * マップボタンの選択状態を解除する
 */
export function clearSelectedMap() {
    document.querySelectorAll('.map-btn').forEach(btn => btn.classList.remove('selected'));
}

/**
 * マップデータを初期化する
 */
export function initializeMapData(id) {
    mapID = id; // グローバルなmapNameを更新
    mapData = MAP_LIST.find(map => map.id === id).data; // グローバルなmapDataを更新
    gridWidth = mapData[0].length; // グローバルなgridWidthを更新
    gridHeight = mapData.length;
    initializeCellSkillEffects(); // スキル効果マップも初期化
}

/**
 * セルスキル効果マップを初期化またはリセットする
 */
export function initializeCellSkillEffects() {
    for (const key in cellSkillEffects) {
        delete cellSkillEffects[key];
    }
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
    const allData = [
        mapID,
        placedCharacters,
        placedSkills,
    ];
    const data = await compressData(allData);
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
            const allData = await decompressData(decodedData);
            const importedMapID = allData[0];
            const importedCharacters = allData[1];
            initializeMapData(importedMapID);
            createGrid(formationGrid);
            clearAndPlaceCharacters(importedCharacters, formationGrid, resultText);
            // TODO: スキルデータのインポート処理を書く
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
