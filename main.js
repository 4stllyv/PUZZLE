window.addEventListener("load", () => {

  // ✅ 最低表示時間
  const minTime = 1500;

  let loaded = false;

  // ✅ ランキング読み込み待ち
  db.ref("scores").once("value").then(() => {
    loaded = true;
  });

  // ✅ 一定時間後チェック
  setTimeout(() => {

    function tryHide() {
      if (loaded) {
        const splash = document.getElementById("splash");
        splash.style.opacity = "0";

        setTimeout(() => {
          splash.style.display = "none";
        }, 500);
      } else {
        // ✅ まだ読み込み中なら待つ
        setTimeout(tryHide, 200);
      }
    }

    tryHide();

  }, minTime);
});

const firebaseConfig = {
  apiKey: "AIzaSyCfDeRotfmLbzPxFOcb3pOIx41fUzofwR8",
  authDomain: "puzzle-game-af891.firebaseapp.com",
  databaseURL: "https://puzzle-game-af891-default-rtdb.firebaseio.com/",
  projectId: "puzzle-game-af891",
  storageBucket: "puzzle-game-af891.firebasestorage.app",
  messagingSenderId: "57733853912",
  appId: "1:57733853912:web:e42b7a96e50b9ca77d1dad",
  measurementId: "G-1SSQNNMKC8"
};


firebase.initializeApp(firebaseConfig);
const db = firebase.database();


document.body.addEventListener("touchmove", e => {
  e.preventDefault();
}, { passive: false });

const SEASON2_START = new Date("2026-06-26T14:00:00").getTime();


db.ref("scores").on("value", snapshot => {

  rankData = snapshot.val(); // ✅ 保存
  renderRanking(rankData);   // ✅ 表示

});



let started = false;

let playerName = "";

function startGame() {

  ending = false;
  showEnd = false;
  gameId++;
  setInputEnabled(true);
  swipeStart = null;
  isBusy = false;


  const name = document.getElementById("name").value.trim();

  if (!name) {
    alert("名前を入力してください！");
    return;
  }

  if (name.length > 8) {
    alert("名前は8文字以下で入力してください！");
    return;
  }

  playerName = name;

  localStorage.setItem("playerName", name);


  // ✅ 状態リセット
  score = 0;
  displayScore = 0;
  addScore = 0;
  moves = 30;
  combo = 0;
  isGameOver = false;
  // ✅ FEVERリセット（超重要🔥）
  feverTurns = 0;
  feverFlash = 0;
  feverHue = 0;
  feverStartedThisTurn = false;
  feverConsumedThisTurn = false;
  turnUsed = false;


  // ✅ UIリセット
  document.getElementById("scoreNum").innerText = "0";
  document.getElementById("movesNum").innerText = "30";

  // ✅ 盤面初期化
  init();
  update();

  // ✅ 画面切り替え
  show("gameScreen");


  if (!started) {
    loop();
    started = true;
  }
}


function retryGame() {

  ending = false;
  showEnd = false;
  setInputEnabled(true);
  swipeStart = null;
  isBusy = false;

  // ✅ 状態リセット
  score = 0;
  displayScore = 0;
  addScore = 0;
  moves = 30;
  combo = 0;
  isGameOver = false;
  // ✅ FEVERリセット（超重要🔥）
  feverTurns = 0;
  feverFlash = 0;
  feverHue = 0;
  feverStartedThisTurn = false;
  feverConsumedThisTurn = false;
  turnUsed = false;

  gameId++;


  // ✅ 盤面作り直し
  init();
  update();

  // ✅ UIリセット
  document.getElementById("scoreNum").innerText = "0";
  document.getElementById("movesNum").innerText = "30";

  // ✅ ゲーム画面に戻る
  show("gameScreen");

  // ✅ 安定化 (超重要)
  isBusy = false;
  idleTimer = 0;
  highlightTimer = 0;
  swipeStart = null;   // ✅ 追加
  ending = false;      // ✅ 念押し
}

function goTitle() {

  ending = false;
  showEnd = false;


  // ✅ 状態リセット
  score = 0;
  displayScore = 0;
  addScore = 0;
  moves = 30;
  combo = 0;
  isGameOver = false;

  // ✅ UIリセット
  document.getElementById("scoreNum").innerText = "0";
  document.getElementById("movesNum").innerText = "30";

  // ✅ タイトルへ
  show("title");
}

let tempAction = null;

// 歯車→メニュー
function openMenu() {
  show("menu");
}

// 「いいえ」
function backMenu() {
  show("menu");
}

// 「はい」
function doAction() {

  console.log("実行:", tempAction); // ✅ デバッグ

  if (tempAction === "retry") {
    retryGame();
    return;
  }

  if (tempAction === "title") {
    goTitle();
    return;
  }

  console.log("⚠ 未定義:", tempAction);
}

function show(id){
  document.querySelectorAll(".screen").forEach(s=>{
    s.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");

  const note = document.querySelector(".note");

  if(note){
    if(id === "title"){
      note.style.display = "block";
    }else{
      note.style.display = "none";
    }
  }
}

let showEnd = false;

function gameOver() {

  if (isGameOver) return;

  isGameOver = true;
  isBusy = false;
  setInputEnabled(true);
  swipeStart = null;

  showEnd = true;

  // ✅ 少し待ってから結果へ
  setTimeout(() => {

    let arr = Object.values(rankData || []);
    
    
    // ✅ シーズン2だけにする
    arr = arr.filter(v => v.time >= SEASON2_START);

    // スコア降順
    arr.sort((a, b) => b.score - a.score);

    // 自分より上の人数を数える
    let rank = 1;

    arr.forEach(v => {
      if (v.score > score) {
        rank++;
      }
    });

    let rankClass = "";

    if(rank === 1) rankClass = "gold";
    else if(rank === 2) rankClass = "silver";
    else if(rank === 3) rankClass = "bronze";
    else if(rank === 4) rankClass = "fourth";
    else if(rank === 5) rankClass = "fifth";

    document.getElementById("final").innerHTML =
      "Score: " + Math.floor(displayScore) +
      "<br><span class='" + rankClass + "'>総合ランキング " + rank + " 位！</span>";

    db.ref("scores").push({
      name: playerName,
      score: score,
      time: Date.now(),
      season: Date.now() < SEASON2_START ? "s1" : "s2"
    });


    show("result");
    showEnd = false;

  }, 1500); // ←ここ調整🔥
}

// ===== 素材 =====
const imgs = {
  red: new Image(), blue: new Image(),
  green: new Image(), yellow: new Image(),
  purple: new Image(), bomb: new Image()
};

imgs.red.src = "assets/red.png";
imgs.blue.src = "assets/blue.png";
imgs.green.src = "assets/green.png";
imgs.yellow.src = "assets/yellow.png";
imgs.purple.src = "assets/purple.png";
imgs.bomb.src = "assets/bomb.png";

// ===== 状態 =====
const size = 8
let cell = 50;
const colors = ["red", "blue", "green", "yellow", "purple"];

let comboTimer = 0;

let board = [], score = 0, moves = 30, combo = 0;
let swapAnim = null, fallAnim = [];
let flash = 0, shake = 0;
let rankMode = "all";
let rankData = null;
let gameId = 0;

function setRankMode(mode){

  rankMode = mode;

  document.getElementById("allBtn").classList.remove("active-btn");
  document.getElementById("weekBtn").classList.remove("active-btn");
  document.getElementById("seasonBtn").classList.remove("active-btn");

  if(mode === "all"){
    document.getElementById("allBtn").classList.add("active-btn");
  }
  else if(mode === "week"){
    document.getElementById("weekBtn").classList.add("active-btn");
  }
  else if(mode === "season"){
    document.getElementById("seasonBtn").classList.add("active-btn");
  }

  renderRanking(rankData);
}

const SEASON1_END = new Date("2026-07-01").getTime();

function renderRanking(data){

  const box = document.getElementById("globalRank");
  box.innerHTML = "";

  if (!data) {
    box.innerHTML = "まだスコアなし";
    return;
  }

  let arr = Object.values(data);

  // ✅ モードごとにフィルター
  if(rankMode === "week"){
    let now = Date.now();
    let week = 7 * 24 * 60 * 60 * 1000;

    arr = arr.filter(v => now - v.time <= week);
  }

  
  // ✅ 総合（シーズン2だけ）
  if(rankMode === "all"){
    arr = arr.filter(v => v.time >= SEASON2_START);
  }


  if(rankMode === "season"){
    arr = arr.filter(v => v.time < SEASON2_START);
  }

  // ✅ ソート
  arr.sort((a, b) => b.score - a.score);

  // ✅ ★ シーズンだけ特別表示
  if(rankMode === "season"){

    if(arr.length === 0){
      box.innerHTML = "まだスコアなし";
      return;
    }

    // 🥇 1位
    let top = arr[0];

    let topDiv = document.createElement("div");
    topDiv.className = "rank-top";

    topDiv.innerHTML = `
      <div class="top-left">
        <img src="${top.icon || 'assets/crown.png'}">
      </div>
      <div class="top-right">
        <div class="top-name">🥇 ${top.name}</div>
        <div class="top-score">${top.score}</div>
      </div>
    `;

    box.appendChild(topDiv);

    // ⭐ 2〜5位
    // ✅ 上段（2位・3位）
    let row1 = document.createElement("div");
    row1.className = "season-row";

    // ✅ 下段（4位・5位）
    let row2 = document.createElement("div");
    row2.className = "season-row";

    arr.slice(1,5).forEach((v,i)=>{

      let div = document.createElement("div");

      // ✅ 順位でクラス変える
      if(i === 0){
        div.className = "season-mini silver";
      }
      else if(i === 1){
        div.className = "season-mini bronze";
      }
      else{
        div.className = "season-mini";
      }

      div.innerHTML = `
        <span>${i+2}位</span> ${v.name}<br>
        <small>${v.score}</small>
      `;


      if(i < 2){
        row1.appendChild(div); // 2位・3位
      }else{
        row2.appendChild(div); // 4位・5位
      }
    });

    box.appendChild(row1);
    box.appendChild(row2);

    return;
  }

  arr.slice(0,5).forEach((v,i)=>{

    let div = document.createElement("div");

    if(i === 0) div.className = "rank-item gold";
    else if(i === 1) div.className = "rank-item silver";
    else if(i === 2) div.className = "rank-item bronze";
    else if(i === 3) div.className = "rank-item fourth";
    else if(i === 4) div.className = "rank-item fifth";
    else div.className = "rank-item";

    let icon = ["🥇","🥈","🥉"][i] || (i+1);

    div.innerHTML = `
      <div class="rank-name">${icon} ${v.name}　${v.score}</div>
    `;

    box.appendChild(div);
  });
}

// ===== 初期化 =====
function rand() {
  return colors[Math.floor(Math.random() * colors.length)];
}

function hasMove() {

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {

      // 右と入れ替え
      if (x < size - 1) {
        swap(x, y, x + 1, y);
        if (find().matches.length) {
          swap(x, y, x + 1, y);
          return true;
        }
        swap(x, y, x + 1, y);
      }

      // 下と入れ替え
      if (y < size - 1) {
        swap(x, y, x, y + 1);
        if (find().matches.length) {
          swap(x, y, x, y + 1);
          return true;
        }
        swap(x, y, x, y + 1);
      }

    }
  }

  return false;
}

function init() {

  do {

    board = [];

    for (let y = 0; y < size; y++) {
      board[y] = [];

      for (let x = 0; x < size; x++) {

        let c;

        do {
          c = rand();

        } while (
          x >= 2 &&
          board[y][x - 1] === c &&
          board[y][x - 2] === c ||

          y >= 2 &&
          board[y - 1][x] === c &&
          board[y - 2][x] === c
        );

        board[y][x] = c;
      }
    }
  } while (!hasMove()); // ✅ ここが神ポイント
}


// ===== 描画 =====
const c = document.getElementById("game");
const ctx = c.getContext("2d");


const topUI = 180; // ✅ 上のUI高さ（調整OK）

const maxSize = Math.min(
  500,
  window.innerWidth * 0.9,
  window.innerHeight - topUI
);

const dpr = window.devicePixelRatio || 1;

c.width = maxSize * dpr;
c.height = maxSize * dpr;

c.style.width = maxSize + "px";
c.style.height = maxSize + "px";

ctx.scale(dpr, dpr);

// ✅ 重要：cellをletにしておく！
cell = Math.floor(maxSize / size);
let zoom = 1;

function draw() {
  ctx.clearRect(0, 0, maxSize, maxSize);
  // ===== 🔥 FEVER背景グロー =====
  if(feverTurns > 0){

    let grad = ctx.createLinearGradient(0,0,maxSize,maxSize);

    grad.addColorStop(0, `hsla(${feverHue},100%,60%,0.25)`);
    grad.addColorStop(1, `hsla(${feverHue+60},100%,60%,0.25)`);

    ctx.fillStyle = grad;
    ctx.fillRect(0,0,maxSize,maxSize);

  }

  // フラッシュ（FEVER対応）
  if (flash > 0 || feverFlash > 0) {

    let f = Math.max(flash, feverFlash);

    ctx.fillStyle = "rgba(255,255,255," + f + ")";
    ctx.fillRect(0, 0, maxSize, maxSize);

    flash -= 0.08;
  }

  ctx.save();

  ctx.scale(zoom, zoom);
        ctx.translate(
        maxSize * (1 - zoom) / 2,
        maxSize * (1 - zoom) / 2

      );

  // シェイク
  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    shake--;
  }

  // ===== 落下描画 =====
  fallAnim.forEach(f => {
    let yPos = f.from + (f.to - f.from) * f.progress;

    let offset = 0;

    let px = f.x * cell + offset;
    let py = yPos * cell + offset;

    let b = f.type;

    ctx.drawImage(imgs[b], px, py, cell - 4, cell - 4);
  });

  // ===== 通常描画 =====
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {

      if (fallAnim.some(f => f.x === x && f.to === y)) continue;

      let b = board[y][x];
      if (!b) continue;

      let baseSize = cell - 4;
      let size2 = baseSize;

      let offset = 0;

      let px = x * cell + offset;
      let py = y * cell + offset;

      // ハイライト
      if (highlightTimer > 0 && highlight.some(p => p.x === x && p.y === y)) {
        size2 = baseSize * 1.2;
        px -= (size2 - baseSize) / 2;
        py -= (size2 - baseSize) / 2;
        ctx.globalAlpha = 0.7;
      }

      if (b === "bomb") {
        ctx.drawImage(imgs[b], px, py, size2, size2);

        let cx = px + size2 / 2;
        let cy = py + size2 / 2;

        let t = Date.now() / 300;
        let pulse = (Math.sin(t) + 1) / 2;
        pulse = Math.pow(pulse, 2.5);

        let glowSize = size2 + pulse * 4;

        ctx.save();
        ctx.globalCompositeOperation = "lighter";

        let glow = ctx.createRadialGradient(
          cx, cy, size2 * 0.2,
          cx, cy, glowSize
        );

        glow.addColorStop(0, `rgba(255,255,220,${0.15 + pulse * 0.35})`);
        glow.addColorStop(0.5, `rgba(255,220,120,${0.08 + pulse * 0.25})`);
        glow.addColorStop(1, "rgba(255,200,0,0)");

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, glowSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

      } else {
        ctx.drawImage(imgs[b], px, py, size2, size2);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

    }
  }

    if(feverTurns > 0){
    ctx.globalCompositeOperation = "lighter";
  }

  // ===== ✅ ★ここが超重要（爆発エフェクト） =====
  boomAnim.forEach(b => {

    let offset = 0;

    let cx = b.x * cell + offset + cell / 2;
    let cy = b.y * cell + offset + cell / 2;

    let grad = ctx.createRadialGradient(
      cx, cy, 0,
      cx, cy, b.radius
    );

    grad.addColorStop(0, `rgba(255,255,200,${b.alpha})`);
    grad.addColorStop(1, "rgba(255,120,0,0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, b.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  // ✅ 破片描画
  particles.forEach(p => {

    let offset = 0;

    let px = p.x * cell + offset + cell/2;
    let py = p.y * cell + offset + cell/2;

    ctx.fillStyle = `rgba(255,200,100,${p.life})`;

    ctx.fillRect(px, py, 4, 4);
  });

  // 終了表示
  if (showEnd) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, maxSize, maxSize);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 40px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText("終了！", maxSize / 2, maxSize / 2);
  }

  ctx.restore();
}


function drawBomb(x, y, size) {

  // 本体
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.fill();

  // ✅ 光エフェクト
  let glow = ctx.createRadialGradient(x, y, 5, x, y, size);
  glow.addColorStop(0, "rgba(255,255,200,0.9)");
  glow.addColorStop(1, "rgba(255,200,0,0)");

  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
}

// ===== スワップ =====
function animateSwap(x1, y1, x2, y2, valid) {
  swapAnim = { x1, y1, x2, y2, progress: 0, valid };
}

// ===== アニメ更新 =====
function updateAnim() {
  if (swapAnim) {
    swapAnim.progress += 0.15;

    if (swapAnim.progress >= 1) {
      let a = swapAnim;

      let t = board[a.y1][a.x1];
      board[a.y1][a.x1] = board[a.y2][a.x2];
      board[a.y2][a.x2] = t;

      swapAnim = null;

      if (find().matches.length) {
        moves--;
        document.getElementById("movesNum").innerText = moves;
        update();
      } else if (a.valid) {
        animateSwap(a.x2, a.y2, a.x1, a.y1, false);
      }
    }
  }

  fallAnim.forEach(f => f.progress += 0.065);
  fallAnim = fallAnim.filter(f => f.progress < 1);
}

// ===== マッチ =====
function find(){

  let map = {};
  let bombPos = [];
  let extra = [];
  let didLine = false;


  // =========================
  // ✅ 横チェック
  // =========================
  for(let y=0;y<size;y++){

    let count = 1;

    for(let x=1;x<=size;x++){

      if(x<size && board[y][x] === board[y][x-1]){
        count++;
      } else {

        if(count >= 3){

          let group = [];

          for(let k=0;k<count;k++){
            let px = x-1-k;
            let py = y;

            map[px+"_"+py] = {x:px,y:py};
            group.push({x:px,y:py});
          }

          // ✅ 4個 → 横一列
          if(count === 4 && fever === 0){
            didLine = true; 
            for(let i=0;i<size;i++){
              extra.push({x:i,y:y});
            }
          }


          // ✅ 5以上 → 爆弾
          // FEVER中
          if(feverTurns > 0 && count >= 4 && !bombTriggered && !isBombChain){
            let center = group[Math.floor(group.length/2)];
            bombPos.push(center);
          }

          // 通常
          else if(count >= 5 && !bombTriggered && !didLine && !isBombChain){
            let center = group[Math.floor(group.length/2)];
            bombPos.push(center);
          }


        }

        count = 1;
      }
    }
  }

  // =========================
  // ✅ 縦チェック
  // =========================
  for(let x=0;x<size;x++){

    let count = 1;

    for(let y=1;y<=size;y++){

      if(y<size && board[y][x] === board[y-1][x]){
        count++;
      } else {

        if(count >= 3){

          let group = [];

          for(let k=0;k<count;k++){
            let px = x;
            let py = y-1-k;

            map[px+"_"+py] = {x:px,y:py};
            group.push({x:px,y:py});
          }

          // ✅ 4個 → 縦一列  
          if(count === 4 && fever === 0){
            didLine = true; 
            for(let i=0;i<size;i++){
              extra.push({x:x,y:i});
            }
          }


          // ✅ 5以上 → 爆弾
          // ✅ FEVER中
          if(feverTurns > 0 && count >= 4 && !bombTriggered && !isBombChain){
            let center = group[Math.floor(group.length/2)];
            bombPos.push(center);
          }

          // ✅ 通常
          else if(count >= 5 && !bombTriggered && !didLine && !isBombChain){
            let center = group[Math.floor(group.length/2)];
            bombPos.push(center);
          }


        }

        count = 1;
      }
    }
  }

  // =========================
  // ✅ L字・T字（爆弾だけ）
  // =========================
  let groups = getGroups();
  groups.forEach(g => {

  if(g.some(p => board[p.y][p.x] === "bomb")) return;
  if(bombTriggered) return;
  // ✅ 実際に消えるマスだけ抽出
  let hit = g.filter(p => map[p.x + "_" + p.y]);

  if(g.length >= 5){

  if(g.some(p => board[p.y][p.x] === "bomb")) return;
  if(bombTriggered) return;

  // ✅ 実際に消えるマスだけ
  let hit = g.filter(p => map[p.x + "_" + p.y]);

  // ✅ ★ここが重要！！
  if(hit.length >= 5){

    let center = hit[Math.floor(hit.length/2)];
    bombPos.push(center);
  }

}

});


  // =========================
  // ✅ まとめ
  // =========================
  let base = Object.values(map);
  let all = base.concat(extra);

  // 重複削除
  let used={};
  all = all.filter(p=>{
    let key=p.x+"_"+p.y;
    if(used[key]) return false;
    used[key]=true;
    return true;
  });

  // 爆弾重複削除
  let usedB={};
  bombPos = bombPos.filter(p=>{
    let key=p.x+"_"+p.y;
    if(usedB[key]) return false;
    usedB[key]=true;
    return true;
  });

  return {
    matches: all,
    bombPos
  };
}





// ===== 消し =====
let comboX = 0;
let comboY = 0;
let comboTimeout = null;
let displayCombo = 0;
let displayScore = 0;
let addScore = 0;
let fever = 0;
let feverFlash = 0;
let feverHue = 0;
let feverUsed = false;
let feverTurns = 0;
let feverConsumed = false;
let turnUsed = false;
let feverConsumedThisTurn = false;
let feverStartedThisTurn = false;

function remove(m, bombPos){

  combo++;

  if(combo >= 5 && feverTurns === 0){
    feverTurns = 2;
    feverStartedThisTurn = true;
  }

  displayCombo = combo;
  comboTimer = 60;

  
  
  comboX = m[0].x;
  comboY = m[0].y;

  let el = document.getElementById("comboText");

if(combo > 1){

  // ✅ フィーバー表示
  if(feverTurns > 0){
    let el = document.getElementById("comboText");

    el.innerText = "🔥 FEVER x1.5";
    el.style.color = "orange";
    el.style.opacity = 1;

    setTimeout(()=>{
      el.style.opacity = 0;
    }, 600);
  }

  // ✅ ★前のタイマー消す
  if(comboTimeout){
    clearTimeout(comboTimeout);
  }

  el.innerText = displayCombo + " COMBO!";
  // ✅ 強さで色変える
  if(combo >= 8){
    el.style.color = "red";
  }else if(combo >= 5){
    el.style.color = "yellow";
  }else{
    el.style.color = "white";
  }

  el.style.opacity = 1;
  el.style.transform = "translate(-50%, -60%) scale(1.2)";

  setTimeout(() => {
    el.style.transform = "translate(-50%, -50%) scale(1)";
  }, 50);

  // ✅ ★これを変数に入れる
  comboTimeout = setTimeout(() => {
    el.style.opacity = 0;
  }, 800);
}



  // ✅ 実際に消えた数で計算
  let count = m.length;

  let gain = count * 15 + combo * 20;

  if(feverTurns > 0){
    gain *= 1.3;
  }


  if (count === 4) gain += 40;
  else if (count === 5) gain += 80;
  else if (count === 6) gain += 150;
  else if (count === 7) gain += 250;
  else if (count >= 8)gain += 300;
  


  score += gain;       // 最終スコア
  addScore += gain;    // 表示用に積む


  flash = 0.8;
  shake = 10;

m.forEach(p=>{

  // ✅ 爆弾なら爆発させる！
  if(board[p.y][p.x] === "bomb"){
  let bombCells = explode(p.x, p.y);

  bombCells.forEach(b => {
    board[b.y][b.x] = null;
  });
  }

  board[p.y][p.x] = null;
});

  if(bombPos && bombPos.length){
    bombPos.forEach(p=>{
      board[p.y][p.x] = "bomb";
    });
  }
  bombTriggered = false;

}





// ===== 落下 =====
function drop(){

  fallAnim = []; // ←毎回リセット

  for(let x = 0; x < size; x++){

    let writeY = size - 1;

    for(let y = size - 1; y >= 0; y--){

      if(board[y][x] !== null){

        // 落ちる必要あるときだけ
        if(writeY !== y){

          fallAnim.push({
            x: x,
            from: y,
            to: writeY,
            type: board[y][x],
            progress: 0
          });
        }

        board[writeY][x] = board[y][x];

        if(writeY !== y){
          board[y][x] = null;
        }

        writeY--;
      }
    }

    for(let y = writeY; y >= 0; y--){
      board[y][x] = null;
    }
  }
}



// ===== 補充 =====
function fill(){
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      if(board[y][x] === null){
        board[y][x] = rand();
      }
    }
  }
}

// ===== スワップ =====
function swap(x1, y1, x2, y2) {
  let t = board[y1][x1];
  board[y1][x1] = board[y2][x2];
  board[y2][x2] = t;
}

// ===== 爆弾 =====

let bombTriggered = false; // 爆弾で消えたか
let boomAnim = [];
let isBombChain = false;
let particles = [];


function explode(x, y) {

  let list = [{x, y}];
  let visited = {};
  let removed = {};
  let bombCount = 1;

  zoom = 1.2;
  while(list.length){

    let p = list.pop();
    let key = p.x + "_" + p.y;

    if(visited[key]) continue;
    visited[key] = true;

    let range = 1;

    for(let dy = -range; dy <= range; dy++){
      for(let dx = -range; dx <= range; dx++){

        let nx = p.x + dx;
        let ny = p.y + dy;

        if(nx < 0 || ny < 0 || nx >= size || ny >= size) continue;

        let k = nx + "_" + ny;

        if(board[ny][nx] === "bomb"){
          let key2 = nx + "_" + ny;

          if(!visited[key2]){
            list.push({x:nx, y:ny});
            bombCount++; // ✅ ここが正しくカウント
          }
        }

        removed[k] = {x: nx, y: ny};
        // ✅ 爆発エフェクト追加（各マス）
        boomAnim.push({
          x: nx,
          y: ny,
          radius: 0,
          max: cell * 3,
          alpha: 0.8
        });
        flash = 1.5;   // ✅ 強く光る
        shake = 25;    // ✅ 強く揺れる
        // ✅ 破片追加
        for(let i=0;i<6;i++){
          particles.push({
            x: nx,
            y: ny,
            vx: (Math.random()-0.5)*4,
            vy: (Math.random()-0.5)*4,
            life: 1
          });
        }
      }
    }

  }
  if(bombCount >= 2){

  // 💡 一瞬止まる感じ
  shake = 80;
  flash = 4;
  zoom = 1.8;

  // ✅ ① 時間差で連続爆発させる（これが神）
  for(let i=0;i<60;i++){

    setTimeout(() => {

      let rx = Math.random() * size;
      let ry = Math.random() * size;

      boomAnim.push({
        x: rx,
        y: ry,
        radius: 0,
        max: cell * 6,
        alpha: 1
      });

    }, i * 20); // ←時間差ポイント🔥
  }

  // ✅ ② パーティクル嵐
  for(let i=0;i<200;i++){
    particles.push({
      x: Math.random()*size,
      y: Math.random()*size,
      vx: (Math.random()-0.5)*8,
      vy: (Math.random()-0.5)*8,
      life: 0.3
    });
  }

  // ✅ ③ 画面フラッシュ2段階
  setTimeout(() => { flash = 2; }, 100);
  setTimeout(() => { flash = 1; }, 200);

  // ✅ ④ 連続サウンド（やってたら）
  try{
    sound.currentTime = 0;
    sound.play();
    setTimeout(()=>sound.play(), 120);
    setTimeout(()=>sound.play(), 240);
  }catch(e){}

  // ✅ ⑤ 実際の全消し
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      removed[x+"_"+y] = {x,y};
    }
  }
  
  let total = size * size;

  let gain = total * 20; // ← 数値調整OK🔥

  score += gain;
  addScore += gain;

}

  return Object.values(removed);
}


function getGroups() {

  let visited = Array.from({ length: size }, () => Array(size).fill(false));
  let groups = [];

  function dfs(x, y, type, group) {

    if (type === "bomb") return;
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    if (visited[y][x]) return;
    if (board[y][x] !== type) return;

    visited[y][x] = true;
    group.push({ x, y });

    dfs(x + 1, y, type, group);
    dfs(x - 1, y, type, group);
    dfs(x, y + 1, type, group);
    dfs(x, y - 1, type, group);
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {

      if (visited[y][x]) continue;

      let group = [];
      dfs(x, y, board[y][x], group);

      if (group.length >= 3) { // ✅ 最低3で消す
        groups.push(group);
      }
    }
  }

  return groups;
}

// ===== 更新 =====
let isGameOver = false;

let highlight = [];
let highlightTimer = 0;
let ending = false; // ✅ 終了待ち状態
let isBusy = false;

function update() {

  let data = find();
  let m = data.matches;

  if (moves <= 0) {
    ending = true;
  }

  // ✅ ハイライト中は処理止める（演出用）
  if (highlightTimer > 0) {
    return;
  }

  // ✅ ハイライト終了処理
  if (highlightTimer <= 0) {
    highlight = [];
  }

  // =========================
  // ✅ マッチがある場合
  // =========================
  if (m.length) {

  isBusy = true;
  setInputEnabled(false);

  highlight = m;
  highlightTimer = 18;
  let id = gameId;

  setTimeout(() => {

    if(id !== gameId) return;

    remove(m, data.bombPos);

    // ✅ まず落とす
    drop();

    // ✅ ★ここが追加（アニメ終わるの待つ）
    let wait = setInterval(() => {

      if(fallAnim.length === 0){

        clearInterval(wait);

        fill();
        drop();

        setTimeout(() => {
          
        if(id === gameId){
            update();
          }

        }, 200);
      }

    }, 16);

  }, 250);

  return;
}

  // =========================
  // ✅ マッチない（完全停止候補）
  // =========================
  if(m.length === 0){
  combo = 0;
  displayCombo = 0;

  if(turnUsed && !feverConsumedThisTurn && feverTurns > 0 && !feverStartedThisTurn){
    feverTurns--;
    feverConsumedThisTurn = true;
  }

  
  if(!isBusy && fallAnim.length === 0){
    turnUsed = false;
  }

  }

  // ✅ そのあとシャッフル
  if (!hasMove()) {
    do { shuffle(); } while (!hasMove());
    return;
  }


  // ✅ UI更新
  document.getElementById("movesNum").innerText = moves;
}


// ---- PC ----
let swipeStart = null;

// --- PC ---
c.addEventListener("mousedown", e => {
  if (isGameOver || isBusy || moves <= 0) {
    swipeStart = null;
    return;
  }
  let offset = 0;

  let rect = c.getBoundingClientRect();

  let x = Math.floor((e.clientX - rect.left) / cell);
  let y = Math.floor((e.clientY - rect.top) / cell);

  // 範囲外防止（おすすめ）
  if (x < 0 || y < 0 || x >= size || y >= size) return;

  swipeStart = { x, y };
});

c.addEventListener("mouseup", e => {
  if (isBusy || !swipeStart || moves <= 0) return;

  let rect = c.getBoundingClientRect();

  let x = Math.floor((e.clientX - rect.left) / cell);
  let y = Math.floor((e.clientY - rect.top) / cell);

  let dx = x - swipeStart.x;
  let dy = y - swipeStart.y;

  // ✅ 範囲外防止
  if (x < 0 || y < 0 || x >= size || y >= size) {
    swipeStart = null;
    return;
  }

  // =======================
  // ✅ ① スワップ（最優先）
  // =======================
  if (Math.abs(dx) + Math.abs(dy) === 1) {

    let x1 = swipeStart.x;
    let y1 = swipeStart.y;

    swap(x1, y1, x, y);

    let result = find();

    if (result.matches.length > 0 && moves > 0) {

    turnUsed = true; // ✅ 「この手を使った」フラグ
    feverConsumedThisTurn = false;
    feverStartedThisTurn = false;

    moves--;
    document.getElementById("movesNum").innerText = moves;
    update();
    } else {
      swap(x1, y1, x, y);
    }

    swipeStart = null;
    return;
  }

  // =======================
  // ✅ ② タップ（完全一致のみ）
  // =======================
  if (x === swipeStart.x && y === swipeStart.y) {

    if (board[y][x] === "bomb") {

      isBombChain = true;

      let cells = explode(x, y);

      cells.forEach(b => {
        board[b.y][b.x] = null;
      });

      let gain = cells.length * 10 * (1 + combo);

      score += gain;
      addScore += gain;

      let id = gameId;

      setTimeout(() => {

        if(id !== gameId) return;

        drop();

        let wait = setInterval(() => {

          if(fallAnim.length === 0){

            clearInterval(wait);

            fill();
            drop();

            isBombChain = false;

            setTimeout(() => {
              if(id === gameId){
                update();
              }
            }, 200);
          }

        }, 16);

      }, 120);

      highlightTimer = 0;
      swipeStart = null;
      return;
    }
  }

  // ✅ 何もなかったら終了
  swipeStart = null;
});

// --- スマホ ---
c.addEventListener("touchstart", e => {
  e.preventDefault();
  if (isGameOver || isBusy) {
    swipeStart = null;
    return;
  }

  let rect = c.getBoundingClientRect();
  let t = e.touches[0];

  let offset = 0;

    
  let x = Math.floor((t.clientX - rect.left) / cell);
  let y = Math.floor((t.clientY - rect.top) / cell);


  if (x < 0 || y < 0 || x >= size || y >= size) return;

  swipeStart = { x, y };
});

c.addEventListener("touchend", e => {
  e.preventDefault();
  if (!swipeStart || isBusy || moves <= 0) return;

  let r = c.getBoundingClientRect();
  let t = e.changedTouches[0];

  let x = Math.floor((t.clientX - r.left) / cell);
  let y = Math.floor((t.clientY - r.top) / cell);

  let dx = x - swipeStart.x;
  let dy = y - swipeStart.y;

  // ✅ 範囲外防止
  if (x < 0 || y < 0 || x >= size || y >= size) {
    swipeStart = null;
    return;
  }

  // =======================
  // ✅ ① スワップ（最優先）
  // =======================
  if (Math.abs(dx) + Math.abs(dy) === 1) {

    let x1 = swipeStart.x;
    let y1 = swipeStart.y;

    swap(x1, y1, x, y);

    let result = find();

    if (result.matches.length > 0 && moves > 0) {

    turnUsed = true; // ✅ 「この手を使った」フラグ
    feverConsumedThisTurn = false;
    feverStartedThisTurn = false;

    moves--;
    document.getElementById("movesNum").innerText = moves;
    update();
    } else {
      swap(x1, y1, x, y);
    }

    swipeStart = null;
    return;
  }

  // =======================
  // ✅ ② タップ（完全に同じマスだけ）
  // =======================
  if (x === swipeStart.x && y === swipeStart.y) {

    if (board[y][x] === "bomb") {

      isBombChain = true;

      let cells = explode(x, y);

      cells.forEach(b => {
        board[b.y][b.x] = null;
      });

      let gain = cells.length * 10 * (1 + combo);
      score += gain;
      addScore += gain;

      let id = gameId;

      setTimeout(() => {

        if(id !== gameId) return;

        drop();

        let wait = setInterval(() => {

          if(fallAnim.length === 0){

            clearInterval(wait);

            fill();
            drop();

            isBombChain = false;

            setTimeout(() => {
              if(id === gameId){
                update();
              }
            }, 200);
          }

        }, 16);

      }, 120);

      highlightTimer = 0;
      swipeStart = null;
      return;
    }
  }

  swipeStart = null;
});



// ===== ループ =====
let idleTimer = 0;
let endWait = 0;

function loop(){

  zoom = 1;

  if(addScore > 0){
    let step = Math.ceil(addScore * 0.2);

    displayScore += step;
    addScore -= step;
  }

  document.getElementById("scoreNum").innerText = Math.floor(displayScore);
  const feverInfo = document.getElementById("feverInfo");
  const feverTurnsInfo = document.getElementById("feverTurnsInfo");

  if(feverTurns > 0){
    feverInfo.innerText = "🔥 FEVER ×1.5";
    feverTurnsInfo.innerText = "FEVER残り " + feverTurns;
  }else{
    feverInfo.innerText = "";
    feverTurnsInfo.innerText = "";
  }

  draw();
  updateAnim();

  // ===== 🔥 FEVER演出 =====
  if(feverTurns > 0){

    feverHue += 3;
    if(feverHue > 360) feverHue = 0;

    feverFlash = 0.4;

    for(let i=0;i<5;i++){
      particles.push({
        x: Math.random()*size,
        y: Math.random()*size,
        vx: (Math.random()-0.5)*3,
        vy: (Math.random()-0.5)*3,
        life: 1
      });
    }

  }else{
    feverFlash *= 0.9;
  }


  // ✅ 爆発アニメ更新
  boomAnim.forEach(b => {
    b.radius += 20;
    b.alpha -= 0.05;
  });
  // ✅ 破片更新
  particles.forEach(p => {
    p.x += p.vx * 0.1;
    p.y += p.vy * 0.1;
    p.life -= 0.03;
  });

particles = particles.filter(p => p.life > 0);

  boomAnim = boomAnim.filter(b => b.alpha > 0);


  // ✅ マッチあるかチェック
  let hasMatch = find().matches.length > 0;

  if(hasMatch || fallAnim.length > 0 || swapAnim){
    idleTimer = 0; // 動いてる
  }else{
    idleTimer++;   // 止まってる
  }

  // ✅ 完全停止したら解放
  if(idleTimer > 10){ // 約0.16秒（60fps基準）
    isBusy = false;
    setInputEnabled(true);
  }

  
  if (
    moves <= 0 &&
    !isGameOver &&
    addScore <= 0 &&
    highlightTimer <= 0 &&
    fallAnim.length === 0 &&
    find().matches.length === 0 &&
    !isBombChain
  ) {

    endWait++;

    // ✅ 約0.5秒待つ（60fps想定）
    if (endWait > 30) {
      gameOver();
    }

  } else {
    endWait = 0; // 条件崩れたらリセット
  }


  if(highlightTimer > 0){
    highlightTimer--;
  }else{
    highlight = [];
  }

    
  if (!isBusy) {
    setInputEnabled(true);
  }


  if(comboTimer > 0){
  comboTimer--;
  }

  requestAnimationFrame(loop);
}

function confirmAction(type) {
  console.log("押された:", type); // ✅ デバッグ

  tempAction = type;

  let text = "";

  if (type === "retry") {
    text = "現在のゲームをやり直します。\nよろしいですか？";
  }

  if (type === "title") {
    text = "タイトルに戻ります。\n進行中のゲームは失われます。";
  }

  document.getElementById("confirmText").innerText = text;

  show("confirm");
}

function shuffle() {

  let arr = [];

  // ✅ 全部1次元に集める
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      arr.push(board[y][x]);
    }
  }

  // ✅ シャッフル
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  // ✅ 盤面に戻す
  let i = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      board[y][x] = arr[i++];
    }
  }
}

function setInputEnabled(flag){

  const canvas = document.getElementById("game");

  if(flag){
    canvas.style.pointerEvents = "auto";
  }else{
    canvas.style.pointerEvents = "none";
    swipeStart = null;
  }

}

document.querySelectorAll("button").forEach(btn => {
  btn.addEventListener("click", () => {
    btn.style.transform = "scale(0.9)";
    setTimeout(() => {
      btn.style.transform = "";
    }, 100);
  });
});
