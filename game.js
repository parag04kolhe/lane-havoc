/* ══════════════════════════════════════════════
   game.js — Road Rash Runner
   Canvas/DPR setup · gradient cache · PERF
   Constants · perspective helpers · object pools
   Environment/weather data · shop catalogues
   Persistence · state globals · game variables
   Utility helpers · main loop · event listeners
══════════════════════════════════════════════ */

/* ══════════════════════════════════════════════
   HIДPI / DPR SETUP
══════════════════════════════════════════════ */
const canvas  = document.getElementById('game');
const ctx     = canvas.getContext('2d', {willReadFrequently: false, alpha: false});
const svalEl  = document.getElementById('sval');
const bvalEl  = document.getElementById('bval');
const bdvalEl = document.getElementById('bdval');
const lboxEl  = document.getElementById('lbox');
const jfillEl = document.getElementById('jfill');
const cvalEl  = document.getElementById('cval');
const dvalEl  = document.getElementById('dval');

const W = 400;

// ── Mobile vs Desktop ─────────────────────────────────────────────────────
// Mobile: canvas fills the full screen via CSS (100vw × 100dvh). H is calculated
// from the physical screen ratio so the game buffer matches the screen with no distortion.
// Desktop: classic 400×620 card view, centred in the browser window.
const _isMobile = window.innerWidth <= 768;

let H;
if(_isMobile){
  // Use physical screen dimensions (not viewport) — accounts for browser chrome
  const _pw = Math.min(screen.width, screen.height); // portrait width
  const _ph = Math.max(screen.width, screen.height); // portrait height
  H = Math.max(620, Math.round(W * _ph / _pw));
} else {
  H = 620;
}

const DPR = Math.min(window.devicePixelRatio||1, 2);

canvas.width  = Math.round(W * DPR);
canvas.height = Math.round(H * DPR);
// Mobile: canvas CSS size is controlled by CSS (width:100% height:100% of container)
// Desktop: canvas CSS size is set by resizeGame() below
ctx.scale(DPR, DPR);
ctx.imageSmoothingEnabled = true;
if('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'medium';

/* ══════════════════════════════════════════════
   GRADIENT & DOM CACHE
   Pre-build every gradient that never changes so
   we never call createLinearGradient / createRadialGradient
   inside the draw loop for static visuals.
══════════════════════════════════════════════ */
const GC = {}; // gradient cache — populated after canvas is sized

function _buildStaticGradients(){
  // Vignette — full-screen radial, never changes
  const vg = ctx.createRadialGradient(W/2,H/2,H*0.30,W/2,H/2,H*0.82);
  vg.addColorStop(0,'transparent');
  vg.addColorStop(1,'rgba(0,0,3,0.55)');
  GC.vignette = vg;

  // Road body — horizontal linear, never changes
  const rg = ctx.createLinearGradient(ROAD_L,0,ROAD_R,0);
  rg.addColorStop(0,'#1c2030');rg.addColorStop(0.15,'#222736');
  rg.addColorStop(0.5,'#252b3a');rg.addColorStop(0.85,'#222736');
  rg.addColorStop(1,'#1c2030');
  GC.road = rg;

  // Road sheen — horizontal linear, never changes
  const sh = ctx.createLinearGradient(ROAD_L,0,ROAD_R,0);
  sh.addColorStop(0,'transparent');sh.addColorStop(0.35,'rgba(255,255,255,0.015)');
  sh.addColorStop(0.5,'rgba(255,255,255,0.03)');sh.addColorStop(0.65,'rgba(255,255,255,0.015)');
  sh.addColorStop(1,'transparent');
  GC.roadSheen = sh;

  // Nitro vignette
  const nv = ctx.createRadialGradient(W/2,H/2,80,W/2,H/2,W*0.75);
  nv.addColorStop(0,'transparent');nv.addColorStop(1,'rgba(245,158,11,0.8)');
  GC.nitroVig = nv;

  // Oil slick overlay gradient
  const og = ctx.createLinearGradient(0,0,W,H);
  og.addColorStop(0,'rgba(180,0,255,0.3)');og.addColorStop(0.5,'rgba(0,200,200,0.3)');
  og.addColorStop(1,'rgba(0,255,100,0.25)');
  GC.oilOverlay = og;

  // Enemy headlight cone gradient — shared for all enemies (just repositioned via fillStyle)
  // We cache per-lane versions since lane X positions are fixed
  GC.enemyHL = {};
  LANE_XS.forEach(lx=>{
    const eg = ctx.createRadialGradient(lx,0,2,lx,60,80);
    eg.addColorStop(0,'#e8f0ff');eg.addColorStop(1,'transparent');
    GC.enemyHL[lx] = eg;
  });

  // Tyre gradient — same for all tyres, position doesn't matter for linear gradient appearance
  const tg = ctx.createLinearGradient(0,0,8,12);
  tg.addColorStop(0,'#2d2d2d');tg.addColorStop(1,'#111');
  GC.tyre = tg;

  // Jump shadow gradient — recreated per-frame (position changes), so skip caching
}
// Called after ROAD_L / LANE_XS constants are defined (see below)

// Cache DOM refs used every frame in draw()
const _hudEl  = document.getElementById('hud');
const _jbarEl = document.getElementById('jbar');
const _scBtn  = document.getElementById('soundCtrlBtn');
const _pauseBtn = document.getElementById('pauseBtn');
const _exitBtn  = document.getElementById('exitBtn');
const _fireBtn  = document.getElementById('tbtn-fire');
const _nitroBtn = document.getElementById('tbtn-nitro');
const _copyrightEl = document.getElementById('copyright-notice');
let _lastGstForCopyright = -1; // tracks last state to avoid DOM write every frame

/* ══════════════════════════════════════════════
   STATE — declared early so PERF.tick() can reference ST
══════════════════════════════════════════════ */
const ST={ENGINE:10,SPLASH:7,INTRO:0,PLAYING:1,CRASHING:2,RESPAWNING:3,GAMEOVER:4,SHOP:5,REVIVE:6,HOWTO:8,STATS:9,LEADERBOARD:11};
let gst=ST.INTRO;

/* ══════════════════════════════════════════════
   ADAPTIVE PERFORMANCE SYSTEM
   Measures real frame times during the first 60 gameplay frames,
   then silently drops to 'mid' or 'low' quality if needed.
   Three levers: DPR, shadowBlur (biggest GPU cost), particle caps.
══════════════════════════════════════════════ */
const PERF = {
  tier: 'high',   // 'high' | 'mid' | 'low'
  shadows: true,
  maxExhaust: 40,
  maxBlood:   74,   // 60 burst + 14 drip
  maxRain:   65,
  maxDust:    90,
  maxCrash:   28,
  _samples: [],
  _lastTS:    0,
  _badgeTimer: 0,   // frames to show the quality-change badge
  _currentDPR: DPR,

  _rescaleDPR(newDPR) {
    if(Math.abs(newDPR - this._currentDPR) < 0.01) return;
    this._currentDPR = newDPR;
    canvas.width  = Math.round(W * newDPR);
    canvas.height = Math.round(H * newDPR);
    ctx.setTransform(newDPR, 0, 0, newDPR, 0, 0);
    ctx.imageSmoothingEnabled = true;
    if('imageSmoothingQuality' in ctx)
      ctx.imageSmoothingQuality = newDPR >= 1.5 ? 'high' : 'medium';
  },

  _applyTier(tier) {
    if(this.tier === tier) return;
    this.tier = tier;
    this._badgeTimer = 300; // display badge for 5 s
    if(tier === 'low') {
      this.shadows    = false;
      this.maxExhaust = 12;
      this.maxBlood   = 20;
      this.maxRain    = 30;
      this.maxDust    = 30;
      this.maxCrash   = 10;
      this._rescaleDPR(Math.min(window.devicePixelRatio||1, 1));
      if('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'low';
      document.documentElement.classList.add('perf-no-blur');
    } else if(tier === 'mid') {
      this.shadows    = false;
      this.maxExhaust = 22;
      this.maxBlood   = 40;
      this.maxRain    = 45;
      this.maxDust    = 55;
      this.maxCrash   = 18;
      this._rescaleDPR(Math.min(window.devicePixelRatio||1, 1.5));
      if('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'medium';
      document.documentElement.classList.add('perf-no-blur');
    } else { // 'high'
      this.shadows    = true;
      this.maxExhaust = 40;
      this.maxBlood   = 74;
      this.maxRain    = 65;
      this.maxDust    = 90;
      this.maxCrash   = 28;
      this._rescaleDPR(Math.min(window.devicePixelRatio||1, 2));
      if('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
      document.documentElement.classList.remove('perf-no-blur');
    }
  },

  // Call once per animation frame with the rAF timestamp
  tick(ts) {
    if(this._lastTS === 0) { this._lastTS = ts; return; }
    const dt = ts - this._lastTS;
    this._lastTS = ts;
    // Only profile during active gameplay, not menus / pauses
    if(gst !== ST.PLAYING && gst !== ST.RESPAWNING) return;
    if(dt > 200) return;  // skip stalls (tab switch, etc.)
    this._samples.push(dt);
    // Re-evaluate every 60 samples (≈1s) so thermal throttling is caught mid-game
    if(this._samples.length >= 60) {
      const avg = this._samples.reduce((a,b) => a+b, 0) / this._samples.length;
      this._samples = []; // reset window for next evaluation
      // avg > 22 ms  →  < 45 fps  →  low quality
      // avg > 17 ms  →  < 59 fps  →  mid quality
      if(avg > 22)       this._applyTier('low');
      else if(avg > 17)  this._applyTier('mid');
      // Don't auto-upgrade — only degrade silently
    }
  }
};

// ── Shadow gate ──────────────────────────────────────────────────────────────
// Device hint: pre-set tier for obvious mid/low-end devices so we don't burn
// the first second at full quality while profiling.
(function(){
  const mem   = navigator.deviceMemory      || 4; // GB, Chrome/Android only
  const cores = navigator.hardwareConcurrency || 4;
  // ≤2 GB RAM or ≤4 logical cores → start at mid, will drop to low if needed
  if(mem <= 2 || cores <= 4){
    PERF.tier = 'high'; // trick _applyTier into running
    PERF._applyTier('mid');
  }
})();
// On low/mid tier PERF.shadows is false → all shadows become 0, no code changes needed elsewhere.
(function(){
  const proto = CanvasRenderingContext2D.prototype;
  const desc  = Object.getOwnPropertyDescriptor(proto, 'shadowBlur');
  if(!desc || !desc.set) return; // browser doesn't expose the descriptor — skip
  Object.defineProperty(proto, 'shadowBlur', {
    set(v) { desc.set.call(this, PERF.shadows ? v : 0); },
    get()  { return desc.get.call(this); },
    configurable: true
  });
})();

// ── Canvas sizing ─────────────────────────────────────────────────────────
// Mobile: game-container is position:fixed 100vw×100dvh, canvas is 100%×100%
//         of that — CSS handles it, no JS sizing needed. Returns early.
// Desktop: fit the canvas within the browser window maintaining W:H ratio.
function resizeGame(){
  if(_isMobile) return;
  const avW = window.innerWidth;
  const avH = window.innerHeight;
  const aspect = W / H;
  let dW = avW, dH = dW / aspect;
  if(dH > avH){ dH = avH; dW = dH * aspect; }
  dW = Math.floor(dW); dH = Math.floor(dH);
  canvas.style.width  = dW + 'px';
  canvas.style.height = dH + 'px';
  const wrap = document.getElementById('wrap');
  if(wrap){ wrap.style.width = dW + 'px'; wrap.style.height = dH + 'px'; }
  const gc = document.getElementById('game-container');
  if(gc){ gc.style.width = dW + 'px'; gc.style.height = dH + 'px'; }
}
resizeGame();
window.addEventListener('resize', resizeGame);

/* ══════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════ */
const LANE_XS = [80,160,240,320];
const ROAD_L  = 40, ROAD_R = 360, ROAD_W = 320, ROAD_CX = 200;
const JUMP_DUR = 52, JUMP_CD = 0, JUMP_H = 72;
_buildStaticGradients(); // safe to call now — ROAD_L and LANE_XS are defined


/* ══════════════════════════════════════════════
   OBJECT POOL SYSTEM
   Eliminates per-frame heap allocation and GC pauses.
   Every object that gets created/destroyed during gameplay
   is pre-allocated here and reused in place.
══════════════════════════════════════════════ */

// Generic pool: pre-allocate N objects, reuse by resetting properties.
// _get() finds the first inactive slot. No push/splice ever happens.
function _makePool(n, factory){
  const arr = Array.from({length:n}, factory);
  arr._n = n;
  arr._next = 0; // free-list hint: start search from here
  arr._get = function(){
    for(let i=0;i<this._n;i++){
      const idx=(this._next+i)%this._n;
      if(!this[idx]._active){
        this._next=(idx+1)%this._n;
        this[idx]._active=true;
        return this[idx];
      }
    }
    // Pool full — reuse first slot (prevents hard crash, rare edge case)
    this[0]._active=true; return this[0];
  };
  arr._reset = function(){ for(let i=0;i<this._n;i++) this[i]._active=false; this._next=0; };
  arr._count = function(){ let n=0; for(let i=0;i<this._n;i++) if(this[i]._active) n++; return n; };
  return arr;
}

// Particle factory — all particle arrays share the same shape
function _pFactory(){ return {x:0,y:0,vx:0,vy:0,life:0,size:0,color:'#fff',gravity:0,_active:false}; }

// Pre-allocated particle pools (sized generously above PERF.max values)
const _EXHAUST_POOL    = _makePool(55,  _pFactory);
const _CRASH_POOL      = _makePool(32,  _pFactory);
const _BLOOD_POOL      = _makePool(82,  _pFactory);
const _SHIELD_POOL     = _makePool(44,  _pFactory); // shield burst + coin collect
const _SPEEDLINE_POOL  = _makePool(72,  _pFactory);
const _RAIN_POOL       = _makePool(70,  ()=>({x:0,y:0,spd:0,len:0,_active:false}));
const _DUST_POOL       = _makePool(95,  ()=>({x:0,y:0,vx:0,vy:0,r:0,life:0,g:0,_active:false}));
const _NMPOP_POOL      = _makePool(24,  ()=>({text:'',x:0,y:0,timer:0,col:'',big:false,_active:false}));
const _RING_POOL       = _makePool(8,   ()=>({x:0,y:0,r:0,life:0,maxR:0,_active:false}));

// Game object pools
const _ENEMY_POOL  = _makePool(8,  ()=>({lane:0,y:0,nmChecked:false,speedMult:1,_perfectDodge:false,_tutSmashed:false,_active:false}));
const _OBST_POOL   = _makePool(5,  ()=>({lane:0,y:0,type:'',nmChecked:false,_tutSmashed:false,_active:false}));
const _COIN_POOL   = _makePool(12, ()=>({lane:0,x:0,y:0,id:0,_active:false}));
const _PU_POOL     = _makePool(4,  ()=>({lane:0,x:0,y:0,type:'',_active:false}));
const _CATTLE_POOL = _makePool(4,  ()=>({x:0,y:0,dir:1,hSpeed:0,type:'',id:0,dead:false,mooed:false,nmChecked:false,_dodged:false,_active:false}));
const _BULLET_POOL = _makePool(8,  ()=>({x:0,y:0,vy:0,lane:0,_active:false})); // machine-gun bullets (max 8 = ammo limit)
const _TRUCK_POOL  = _makePool(6,  ()=>({lane:0,y:0,hits:0,nmChecked:false,_active:false})); // trucks — 2-hit obstacle, stage 3+

// Helper: assign properties from obj into a pool slot
function _poolSet(slot, obj){
  for(const k in obj) slot[k]=obj[k];
  slot._active=true;
  return slot;
}

// Replace old particle arrays with pool-backed proxies
// (these variables are referenced throughout — we keep the names)
let exhaustP    = _EXHAUST_POOL;
let crashP      = _CRASH_POOL;
let bloodP      = _BLOOD_POOL;
let shieldBurstP= _SHIELD_POOL;
let speedLineP  = _SPEEDLINE_POOL;
let rainDrops   = _RAIN_POOL;
let dustPtcls   = _DUST_POOL;
let nmPopups    = _NMPOP_POOL;
let landingRings= _RING_POOL;
let enemies     = _ENEMY_POOL;
let obstacles   = _OBST_POOL;
let coins       = _COIN_POOL;
let powerUps    = _PU_POOL;
let cattle      = _CATTLE_POOL;
let bullets     = _BULLET_POOL;
let trucks      = _TRUCK_POOL;
const PAL = {
  sky1:'#0a0c14', sky2:'#0f1322',
  roadEdge:'#131720',
  roadSurface1:'#1e222e', roadSurface2:'#252b38',
  roadLine:'rgba(255,255,255,0.55)',
  kerbA:'#c0392b', kerbB:'#e8e8e8',
  dashLine:'rgba(255,255,255,0.52)',
  enemyBody:'#e84118', enemyHL:'#e8f0ff',
};

/* ══════════════════════════════════════════════
   ENVIRONMENT & WEATHER CONSTANTS
══════════════════════════════════════════════ */
// Tile height — used for menu scroll tiling
const TILE_H=800;

// Weather
const WX_TYPES=['clear','rain','fog','dust','roadworks'];
const WX_WEIGHTS=[0.52,0.21,0.13,0.09,0.05];
const WX_DUR_MIN=350,WX_DUR_MAX=750;

// Returns the current environment theme based on stage number.
// Used by audio.js (music theme selection) — must stay in game.js.
function getEnvTheme(){
  return ['city','highway','desert','night'][Math.floor((stageNum-1)/3)%4];
}

/* ══════════════════════════════════════════════
   SHOP / CUSTOMISATION
══════════════════════════════════════════════ */
const SKINS=[
  {id:'green', name:'CIRCUIT',   price:0,   color:'#00e676',hl:'#ccfff0', rarity:'COMMON',    perk:null},
  {id:'red',   name:'BLAZE',     price:50,  color:'#ff3d3d',hl:'#ffd0d0', rarity:'COMMON',    perk:'Near-miss score +20%'},
  {id:'blue',  name:'TORPEDO',   price:50,  color:'#3b82f6',hl:'#bfdbfe', rarity:'COMMON',    perk:'Mini magnet always active'},
  {id:'cyan',  name:'ICE KING',  price:75,  color:'#06b6d4',hl:'#cffafe', rarity:'RARE',      perk:'Rain handling improved'},
  {id:'purple',name:'PHANTOM',   price:100, color:'#a855f7',hl:'#e9d5ff', rarity:'RARE',      perk:'Ghost lasts 1s longer'},
  {id:'gold',  name:'GOLD RUSH', price:200, color:'#f59e0b',hl:'#fef3c7', rarity:'LEGENDARY', perk:'Every coin scores +1', prestige:10},
];
const TRAILS=[
  {id:'default',name:'EXHAUST', price:0,   cols:null,                                                        rarity:'COMMON',    perk:null},
  {id:'fire',   name:'FIRE',    price:75,  cols:['#ff4400','#ff8800','#ffcc00','#ff2200'],                   rarity:'COMMON',    perk:'Nitro lasts 0.5s longer'},
  {id:'ice',    name:'ICE',     price:75,  cols:['#67e8f9','#3b82f6','#a5f3fc','#93c5fd'],                   rarity:'RARE',      perk:'Passive coin pull'},
  {id:'neon',   name:'NEON',    price:100, cols:['#4ade80','#22d3ee','#86efac','#6ee7b7'],                   rarity:'RARE',      perk:'Near-miss popups last longer'},
  {id:'rainbow',name:'RAINBOW', price:150, cols:['#f87171','#fb923c','#fbbf24','#4ade80','#60a5fa','#c084fc'],rarity:'LEGENDARY', perk:'Larger exhaust particles', prestige:10},
];
const BOOSTS=[
  {id:'none',        name:'NONE',         price:0,  desc:'No starting boost',          rarity:'COMMON'},
  {id:'shield_start',name:'SHIELD START', price:30, desc:'Begin each run with Shield', rarity:'COMMON'},
  {id:'nitro_start', name:'NITRO START',  price:40, desc:'Begin each run with Nitro',  rarity:'RARE'},
  {id:'extra_life',  name:'EXTRA LIFE',   price:50, desc:'Start every run with 2 lives',rarity:'RARE'},
];

/* ══════════════════════════════════════════════
   PERSISTENCE
══════════════════════════════════════════════ */
function loadLS(k,d){try{const v=localStorage.getItem(k);return v!==null?JSON.parse(v):d;}catch(e){return d;}}
function saveLS(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}

let coinBank      = loadLS('rr_coins2',0);
let bestScore     = loadLS('rr_best2',0);
let bestDistance  = loadLS('rr_best_dist_km',0); // best distance in km (distanceTravelled/15120)
let bestStageEver = loadLS('rr_best_stage',0);   // highest stage ever reached — prestige gate
let equippedSkin  = loadLS('rr_skin2','green');
let equippedTrail = loadLS('rr_trail2','default');
let equippedBoost = loadLS('rr_boost2','none');
let ownedItems    = loadLS('rr_owned2',['green','default','none']);
// ── Lifetime stats ──
let statTotalRuns   = loadLS('rr_stat_runs',0);
let statBestCombo   = loadLS('rr_stat_combo',0);
let statTotalMisses = loadLS('rr_stat_misses',0);
let statTotalCoins  = loadLS('rr_stat_coins',0);
function saveLifetimeStats(){
  statTotalRuns++;
  if(runMaxCombo>statBestCombo)statBestCombo=runMaxCombo;
  statTotalMisses+=runNearMisses;
  statTotalCoins+=sessionCoins;
  const runDist=parseFloat((distanceTravelled/15120).toFixed(2)); // km
  if(runDist>bestDistance){bestDistance=runDist;saveLS('rr_best_dist_km',bestDistance);}
  saveLS('rr_stat_runs',statTotalRuns);
  saveLS('rr_stat_combo',statBestCombo);
  saveLS('rr_stat_misses',statTotalMisses);
  saveLS('rr_stat_coins',statTotalCoins);
}
let showStats=false; // toggle stats overlay on intro screen
function getSkin() {return SKINS.find(s=>s.id===equippedSkin)||SKINS[0];}
function getTrail(){return TRAILS.find(t=>t.id===equippedTrail)||TRAILS[0];}

/* ══════════════════════════════════════════════
   SUPABASE — Global Leaderboard Integration
   Direct REST API — no proxy or serverless functions needed.
══════════════════════════════════════════════ */
const _SB_URL = 'https://zedrsbmkktyaecszlesk.supabase.co';
const _SB_KEY = 'sb_publishable_HBa4vm_39EvSqvmbeU7x7A_LIq_GpHB';
const _SB_HDR = {
  'Content-Type' : 'application/json',
  'apikey'       : _SB_KEY,
  'Authorization': 'Bearer ' + _SB_KEY
};

let playerName      = loadLS('rr_player_name',''); // saved display name
let _llPendingScore = 0;                           // score waiting for name entry

// Leaderboard screen state
let lbScores  = [];  // [{rank, score, name}]
let lbLoading = false;
let lbError   = '';
let lbMyRank  = 0;

// Fetch top 20 scores ordered by score descending
async function _llFetchScores(){
  try{
    const r=await fetch(
      _SB_URL+'/rest/v1/scores?select=name,score&order=score.desc&limit=20',
      {method:'GET', headers:_SB_HDR}
    );
    if(!r.ok){console.warn('[SB] fetch failed:',r.status);return[];}
    const rows=await r.json();
    return rows.map((row,i)=>({rank:i+1, score:row.score, name:row.name||'Anonymous'}));
  }catch(e){console.error('[SB] fetch error:',e);return[];}
}

// Insert a new score row
async function _llSubmit(name,score){
  try{
    const r=await fetch(_SB_URL+'/rest/v1/scores',{
      method :'POST',
      headers:{..._SB_HDR, 'Prefer':'return=minimal'},
      body   :JSON.stringify({name, score})
    });
    console.log('[SB] submit status:',r.status);
  }catch(e){console.error('[SB] submit error:',e);}
}

// Called automatically on every game over
async function _llHandleGameOver(finalScore){
  if(finalScore<=0)return;
  if(playerName){
    await _llSubmit(playerName, finalScore);
  }else{
    _llPendingScore=finalScore;
    const overlay=document.getElementById('nameOverlay');
    if(overlay)overlay.style.display='flex';
  }
}

// Called when player submits name via overlay
async function _llSubmitWithName(name,score){
  playerName=name;
  saveLS('rr_player_name',playerName);
  const overlay=document.getElementById('nameOverlay');
  if(overlay)overlay.style.display='none';
  await _llSubmit(name, score);
}

// Open the leaderboard screen and fetch scores
async function _llOpenLeaderboard(){
  gst=ST.LEADERBOARD;
  lbScores=[];lbLoading=true;lbError='';lbMyRank=0;
  try{
    lbScores=await _llFetchScores();
    if(playerName){
      const me=lbScores.find(s=>s.name===playerName);
      lbMyRank=me?me.rank:0;
    }
  }catch(e){
    lbError='Could not connect. Try again later.';
  }
  lbLoading=false;
}

// Name overlay button wiring (runs once DOM is ready)
(function(){
  const overlay=document.getElementById('nameOverlay');
  const input=document.getElementById('nameInput');
  const saveBtn=document.getElementById('nameSaveBtn');
  const skipBtn=document.getElementById('nameSkipBtn');
  if(!overlay||!input||!saveBtn||!skipBtn)return;
  saveBtn.addEventListener('click',()=>{
    const n=(input.value||'').trim().substring(0,16);
    if(!n)return;
    _llSubmitWithName(n,_llPendingScore);
  });
  saveBtn.addEventListener('touchstart',e=>{
    e.preventDefault();
    const n=(input.value||'').trim().substring(0,16);
    if(!n)return;
    _llSubmitWithName(n,_llPendingScore);
  },{passive:false});
  skipBtn.addEventListener('click',()=>{overlay.style.display='none';});
  skipBtn.addEventListener('touchstart',e=>{e.preventDefault();overlay.style.display='none';},{passive:false});
  input.addEventListener('touchstart',e=>e.stopPropagation(),{passive:true});
})();

/* ══════════════════════════════════════════════
   STATE — (ST and gst declared above, before PERF)
══════════════════════════════════════════════ */
let gamePaused=false;       // freeze update, show pause overlay
let exitConfirmActive=false; // show exit-confirm overlay


/* ══════════════════════════════════════════════
   GAME VARIABLES
══════════════════════════════════════════════ */
let score,frameCount,dashOff,baseSpd,spd;
let distanceTravelled=0;
let lastStages,stageNum,exhaustTimer,shakeAmt;
const DIST_PER_STAGE = 6000;
const MAX_SPEED_STAGE = 17;
let player,bloodPools;
let cattleCounter=0;
let stageFlash,lifeMsg;
let crashTimer,crashType,crashCattleIdx,crashX=0,crashY=0;
let cattlePending=false;
let trucksSpawnedThisStage=0,lastTruckStageNum=1; // per-stage truck spawn tracking
let sessionCoins;
let activeShield=false,magnetTimer=0,nitroTimer=0,ghostTimer=0,nitroMult=1;
// ── Nitro reserve system ──────────────────────────────────────────────
// nitroReserve: player has collected a nitro but not yet fired it
// nitroExpiryTimer: counts down 720→0 (12s); fires auto-expire at 0
// nitroTimerMax: duration nitroTimer was set to at activation (for bar drain display)
let nitroReserve=false,nitroExpiryTimer=0,nitroTimerMax=240;
// ── Machine Gun state ─────────────────────────────────────────────────
let gunActive=false,gunAmmo=0,gunRecoilTimer=0,bossShotWarningGiven=false;
let gunFireCooldown=0,gunSpawnCooldown=0,gunLastStageSpawned=-1,gunMuzzleFlash=0;
let gunPickupHintTimer=0; // frames to show the "TAP TO FIRE →" hint after picking up gun
let nearMissStreak=0,comboDecay=0,comboMult=1,comboFlashTimer=0;
let playerTilt=0;
let playerLaneVel=0;
let shopTab=0,shopIdx=0,preShop=ST.INTRO;
let bgScrollY=0;
// Weather
let weatherType='clear',weatherTimer=0,weatherTotalDur=0,weatherCooldown=600;
let weatherPreview=null;
let weatherMsg=null;
let roadworksWarnTimer=0; // counts down 180→0, shows lane-3 warning arrow before roadworks
// Power-up banner
let puBanner=null;
// Near-miss crash guard
let lastNearMissFrame=-999,lastNearMissScore=0;
// ── PERFECT NEAR-MISS STATE ──────────────────────────────
let perfectNmSlowMoTimer=0; // ms — drives 0.35× time scale on perfect dodge
let perfectNmFlash=0;       // ms — drives white screen flash
let _prevPlayerLane=1;      // lane from previous frame, used for perfect-dodge detection

// ── SPLASH + MENU STATE ───────────────────────────────────
let splashTimer=0;           // counts up; transition at 72 (1.2s @ 60fps)
let menuScrollY=0;           // slow parallax scroll on intro bg
let menuMusicNodes=[];       // ambient menu music nodes
let splashWhooshPending=false; // play whoosh on first AC unlock if splash still active
let splashLaunchPending=false; // play launch sound on first AC unlock if splash still active

// ── Extracted splash sound functions (called directly or deferred to first gesture) ──
function _playSplashWhoosh(){
  try{
    const t2=AC.currentTime;
    const sr=AC.sampleRate,dur=1.4,n=Math.ceil(sr*dur);
    const buf=AC.createBuffer(1,n,sr),d=buf.getChannelData(0);
    for(let i=0;i<n;i++)d[i]=(Math.random()*2-1);
    const src=AC.createBufferSource();src.buffer=buf;
    const flt=AC.createBiquadFilter();flt.type='lowpass';
    flt.frequency.setValueAtTime(3200,t2);
    flt.frequency.exponentialRampToValueAtTime(180,t2+dur*0.9);
    flt.Q.value=0.5;
    const g=AC.createGain();
    g.gain.setValueAtTime(0.001,t2);
    g.gain.linearRampToValueAtTime(1.2,t2+0.05);
    g.gain.exponentialRampToValueAtTime(0.001,t2+dur);
    src.connect(flt);flt.connect(g);g.connect(_dest());
    src.start(t2);src.stop(t2+dur+0.05);
    const o=AC.createOscillator(),og=AC.createGain();
    o.type='sawtooth';
    o.frequency.setValueAtTime(140,t2);
    o.frequency.exponentialRampToValueAtTime(55,t2+1.0);
    og.gain.setValueAtTime(0.001,t2);
    og.gain.linearRampToValueAtTime(0.28,t2+0.05);
    og.gain.exponentialRampToValueAtTime(0.001,t2+1.0);
    o.connect(og);og.connect(_dest());o.start(t2);o.stop(t2+1.05);
    splashWhooshPending=false;
  }catch(e){}
}
function _playSplashLaunch(){
  try{
    const t3=AC.currentTime;
    const sr2=AC.sampleRate,dur2=0.5,n2=Math.ceil(sr2*dur2);
    const buf2=AC.createBuffer(1,n2,sr2),d2=buf2.getChannelData(0);
    for(let i=0;i<n2;i++)d2[i]=(Math.random()*2-1);
    const src2=AC.createBufferSource();src2.buffer=buf2;
    const flt2=AC.createBiquadFilter();flt2.type='bandpass';flt2.frequency.value=1600;flt2.Q.value=1.2;
    const g2=AC.createGain();
    g2.gain.setValueAtTime(0.001,t3);
    g2.gain.linearRampToValueAtTime(1.8,t3+0.02);
    g2.gain.exponentialRampToValueAtTime(0.001,t3+dur2);
    src2.connect(flt2);flt2.connect(g2);g2.connect(_dest());
    src2.start(t3);src2.stop(t3+dur2+0.05);
    const oLaunch=AC.createOscillator(),gLaunch=AC.createGain();
    oLaunch.type='sawtooth';
    oLaunch.frequency.setValueAtTime(60,t3);
    oLaunch.frequency.exponentialRampToValueAtTime(200,t3+1.2);
    gLaunch.gain.setValueAtTime(0.001,t3);
    gLaunch.gain.linearRampToValueAtTime(0.45,t3+0.06);
    gLaunch.gain.exponentialRampToValueAtTime(0.001,t3+1.3);
    oLaunch.connect(gLaunch);gLaunch.connect(_dest());
    oLaunch.start(t3);oLaunch.stop(t3+1.35);
    const sr3=AC.sampleRate,dur3=1.5,n3=Math.ceil(sr3*dur3);
    const buf3=AC.createBuffer(1,n3,sr3),d3=buf3.getChannelData(0);
    for(let i=0;i<n3;i++)d3[i]=(Math.random()*2-1);
    const src3=AC.createBufferSource();src3.buffer=buf3;
    const flt3=AC.createBiquadFilter();flt3.type='lowpass';
    flt3.frequency.setValueAtTime(4000,t3+0.1);
    flt3.frequency.exponentialRampToValueAtTime(150,t3+dur3);
    flt3.Q.value=0.4;
    const g3=AC.createGain();
    g3.gain.setValueAtTime(0.001,t3+0.05);
    g3.gain.linearRampToValueAtTime(1.4,t3+0.15);
    g3.gain.exponentialRampToValueAtTime(0.001,t3+dur3);
    src3.connect(flt3);flt3.connect(g3);g3.connect(_dest());
    src3.start(t3+0.05);src3.stop(t3+dur3+0.1);
    splashLaunchPending=false;
  }catch(e){}
}
let menuMusicActive=false;
let _splashMenuBtns=null;    // button rects drawn by drawSplash overlay
let _engineBtnRect=null;     // circle for ENGINE START button hit-detection
let introScrollY=0;          // scroll offset for object guide page
let howtoPage=0;             // current page index 0-4 for How To Play slideshow

// ── NEW FEATURE VARS ──────────────────────────────────────
// Oil slick / speed bump timers
let oilSlickTimer=0; // disables lane switching
let slowBumpTimer=0; // brief slowdown
let clearStretchTimer=0; // stage 10+: intentional pause in spawning (breathing room)
let _shownMechanics={}; // tracks which mechanic intro banners have been shown this run
// Personal best tracking
let newRecordFlash=0; // frames to show NEW RECORD
let hasPassedBest=false;

/* ══════════════════════════════════════════════
   CONTEXTUAL TUTORIAL SYSTEM
   Watch-list pattern: objects are registered at
   spawn, hint fires when object crosses y=78px.
   3-phase speed easing: ramp-down 0.25s → hold
   40% for 1.25s → ramp-up 0.2s.
   Dismiss when object reaches 20px above player.
   One hint at a time, queued, never repeats.
══════════════════════════════════════════════ */

// Speed easing phases (in dt frames at 60fps)
const TUT_RAMP_DOWN = 15;  // 0.25s — ramp 100%→40%
const TUT_HOLD      = 75;  // 1.25s — hold at 40%
const TUT_RAMP_UP   = 12;  // 0.20s — ramp 40%→100%

// Spatial thresholds
const TUT_TRIGGER_Y = 78;  // show hint when object crosses this y
const TUT_DISMISS_ABOVE = 200; // start fade-out when object is this far above player
                               // tooltip sits 42px below ring, fade takes ~14 frames
                               // 200px gives clearance even at max game speed

// Per-type offset so the glow ring hits the visual centre of each sprite.
// obj.y is the leading (top) edge; these shift the ring to the true midpoint.
const TUT_RING_OFFSET = {
  enemy:0,       // drawCar centers on e.y already
  stone:0,       // arc centered on o.y
  manhole:0,     // ellipse centered on o.y
  speedbump:0,   // rect centered on o.y
  oil:0,         // ellipse centered on o.y
  brokencar:0,   // car body centered on o.y
  cattle:0,      // ellipse centered on c.y
  shield:0, nitro:0, ghost:0, gun:0, magnet:0, // all drawn centered on p.y
};

// Per-type ring radius — sized to snugly encircle each sprite with ~5px breathing room
const TUT_RING_RADIUS = {
  enemy:     36,  // 42×68px car body — ring clears the width comfortably
  stone:     22,  // radius-17 sphere + 5px gap
  manhole:   28,  // 23px outer rim + 5px gap
  speedbump: 22,  // 32×12px bump — ring wider than the bump
  oil:       34,  // 28px wide ellipse + 6px gap
  brokencar: 32,  // kept at default — broken car is handled separately
  cattle:    32,  // ~52px wide body — ring encircles the animal
  shield:    22,  // radius-14 icon + 8px gap
  nitro:     22,
  ghost:     22,
  gun:       22,
  magnet:    22,
};

// Hint messages — cleared: no contextual tooltips shown during gameplay
const TUTORIAL_MSGS = {};

// Persists across sessions — once seen, never shown again
let tutorialShown = (function(){
  try{ return JSON.parse(localStorage.getItem('rr_tut_shown')||'{}'); }catch(e){ return {}; }
})();

// Active hint  {key, objRef, msg, slamT, elapsed, dismissing, fadeOut}
let tut = null;
// Queued hints waiting their turn  [{key, objRef}]
let tutQueue = [];
// Objects registered at spawn, waiting to cross TUT_TRIGGER_Y  [{key, objRef}]
let tutWatchList = [];
// Frames elapsed into the 3-phase slow-mo (-1 = inactive)
let tutSlowElapsed = -1;

// ── Guided first-run tutorial (phase-based) ──────────────────────────
// -1 = off, 0 = setup, 1 = show move, 2 = dodge enemy, 3 = coin, 4 = jump
let tutPhase = -1;
let tutPhaseTimer = 0;
let tutEnemyRef = null;   // ref to spawned tutorial enemy
let tutCoinRef  = null;   // ref to spawned tutorial coin
let tutObstRef  = null;   // ref to spawned tutorial obstacle
let _tutPlayerLaneAtPhase2 = 1; // player's lane when phase 2 starts

// ── Phase 9: random enemy cars for player to dodge ─────────────────────
let tutPhase9Enemies = []; // refs to Phase 9 enemy cars

// ── Extended guided tutorial refs (phases 1-8) ────────────────────────
let tutPhase1EnemyRef2  = null; // 2nd enemy for Phase 1 (lane 0, move-right blockade)
let tutPhase2EnemyRef1  = null; // 1st enemy for Phase 2 (lane 2, move-left blockade)
let tutPhase2EnemyRef2  = null; // 2nd enemy for Phase 2 (lane 3, move-left blockade)
let tutJumpObstRef2     = null; // manhole (lane 1) for Phase 4 forced-jump blockade
let tutJumpEnemyRef1    = null; // car (lane 2) for Phase 4 forced-jump blockade
let tutJumpEnemyRef2    = null; // car (lane 3) for Phase 4 forced-jump blockade
let tutShieldRef        = null; // shield powerup spawned in Phase 5
let tutGunPickupRef     = null; // gun powerup spawned in Phase 6
let tutShootEnemyRef    = null; // enemy to shoot in Phase 7
let tutShieldLabelTimer = 0;    // frames to show "Shield — absorbs one crash" label
let tutHandoffTimer     = 0;    // frames for "You're ready!" handoff banner
let tutSpeedTarget      = 1.0;  // 0.0 = full stop, 1.0 = normal — set per-frame by phase logic
let tutSpeedCurrent     = 1.0;  // actual applied multiplier, interpolates toward tutSpeedTarget
let tutGunLane          = -1;   // which lane the tutorial gun spawned in
let tutPhase1StartLane  = 1;    // always 1 — player's locked lane at tutorial start
let tutShieldCollected  = false;// set true in powerup-collect loop when shield picked up
let tutGunCollected     = false;// set true in powerup-collect loop when gun picked up

// ── Nitro tutorial (Phase 2 tutorial, triggers at Stage 2 after first run) ──
let tutNitroPickupRef  = null;  // ref to spawned nitro powerup
let tutNitroObst1Ref   = null;  // ref to 1st smash obstacle
let tutNitroObst2Ref   = null;  // ref to 2nd smash obstacle
let tutNitroObst3Ref   = null;  // ref to 3rd smash obstacle
let tutNitroCollected  = false; // set true when nitro is picked up in phase 11
let tutNitroObstLane1  = -1;    // lane of 1st obstacle (and also nitro pickup)
let tutNitroObstLane2  = -1;    // lane of 2nd obstacle
let tutNitroObstLane3  = -1;    // lane of 3rd obstacle
// ── Phase 12: tap-to-continue + arrow overlay state ───────────────────
let _tutNitroTapReady    = false; // accepting a tap to proceed
let _tutNitroTapped      = false; // player has tapped
let tutNitroArrowActive  = false; // arrow + 'Watch fuel' text is showing
let tutNitroArrowTapped  = false; // after tap: draw arrow at 40% opacity
let tutNitroArrowFading  = false; // after first smash: fade arrow out
let tutNitroPostSmash1Timer = 0;  // coast timer after first smash (frames)

// ── Nitro tutorial done flag — own localStorage key to avoid conflicts with old data ──
// This is intentionally separate from tutorialShown so stale test data can't block it.
let _nitroTutDone = (function(){
  try{ return localStorage.getItem('rr_nitrotut')==='1'; }catch(e){ return false; }
})();
function _saveNitroTutDone(){
  try{ localStorage.setItem('rr_nitrotut','1'); }catch(e){}
}

// ══════════════════════════════════════════
//  NEW TUTORIAL STATE VARIABLES
// ══════════════════════════════════════════
// Phase 2: jump blockade spawned flag (prevents double-spawn after rewind)
let tutPhase2Spawned = false;

// Tutorial rewind system — when player crashes in phases 1-3, game reverses at 2x speed
let tutRewindActive  = false;  // true during the 1.5s rewind animation
let tutRewindTimer   = 0;      // counts down from 90 frames (1.5s at 60fps)
let tutCrashPopText  = '';     // message e.g. "Can't jump over cars!"
let tutCrashPopTimer = 0;      // frames to show the crash popup

// Phase 3: coins A + gun sub-state
let tutP3Spawned     = false;  // coins + gun have been spawned for phase 3
let tutP3GunUsed     = false;  // gun has been picked up in phase 3

// Phase 4: coins B + nitro sub-state
let tutP4Spawned         = false;  // coins + nitro spawned for phase 4
let tutNitroMoveLocked   = false;  // disables L/R input during tutorial nitro smash

// Gun fire-button arrow (phase 3 post-gun-pickup)
let tutGunArrowTimer = 0;  // frames to show the angled arrow toward fire button

// Certified Driver banner (phase 5)
let tutCertifiedSndDone = false;  // prevents sound playing more than once

// Tutorial crash-then-rewind: flag lets the real crash animation play, then rewinds
let tutCrashPending = false;  // when true, ST.CRASHING handler starts rewind instead of gameover

// Phase 3 — extra enemy car refs
let tutP3CarBRef  = null;  // Car B — lane 1, ~350px above car A
let tutP3CarCRef  = null;  // Car C — lane 2, ~350px above car B

// Phase 4 — nitro warmup before smash
let tutNitroWarmupActive = false;  // true during 1-sec warmup after nitro pickup
let tutNitroWarmupTimer  = 0;      // counts from 60 → 0 (1 sec at 60fps)

function _saveTutShown(){
  try{ localStorage.setItem('rr_tut_shown', JSON.stringify(tutorialShown)); }catch(e){}
}

// Tap-to-skip: instantly end the active hint
function _skipTutorial(){
  if(!tut) return;
  tut = null;
  tutSlowElapsed = -1;
  _dequeueNextTut();
}

// Promote next queued hint to active
function _dequeueNextTut(){
  if(tut) return;
  while(tutQueue.length > 0){
    const next = tutQueue.shift();
    if(tutorialShown[next.key]) continue; // already seen while waiting
    tutorialShown[next.key] = true;
    _saveTutShown();
    // Compute the flip decision once at creation — locked for the hint's lifetime.
    // At trigger time the object is near y=78+offset, so tooltip above would land
    // near y=-2 (above HUD). We evaluate now and store it so render never re-decides.
    const _obj = next.objRef;
    const _ry  = (_obj && _obj._active) ? (_obj.y + (TUT_RING_OFFSET[next.key]||0)) : TUT_TRIGGER_Y;
    const _tentativeTipY = _ry - 50 - 38; // TH=50, gap=38
    const _flippedBelow  = _tentativeTipY < 72; // 72 = HUD_TOP
    tut = { key:next.key, objRef:next.objRef||null, msg:TUTORIAL_MSGS[next.key],
            slamT:0, elapsed:0, dismissing:false, fadeOut:14,
            flippedBelow: _flippedBelow };
    tutSlowElapsed = 0; // kick off 3-phase slow-mo
    return;
  }
}

// Register an object at spawn — hint fires when it crosses TUT_TRIGGER_Y
function _watchTutorial(key, objRef){
  if(!TUTORIAL_MSGS[key]) return;
  if(tutorialShown[key])  return;
  for(let i=0;i<tutWatchList.length;i++) if(tutWatchList[i].key===key) return;
  tutWatchList.push({key, objRef: objRef||null});
}

// Called each update frame — promotes watched objects that have scrolled into view
function _checkWatchList(){
  for(let i=tutWatchList.length-1;i>=0;i--){
    const w = tutWatchList[i];
    const obj = w.objRef;
    // Drop if object left the screen or was destroyed
    if(!obj || !obj._active){ tutWatchList.splice(i,1); continue; }
    // Compute ring y the same way drawTutorial does
    const ry = obj.y + (TUT_RING_OFFSET[w.key]||0);
    if(ry >= TUT_TRIGGER_Y){
      tutWatchList.splice(i,1);
      if(tutorialShown[w.key]) continue;
      let inQueue=false;
      for(let j=0;j<tutQueue.length;j++) if(tutQueue[j].key===w.key){inQueue=true;break;}
      if(!inQueue && !(tut && tut.key===w.key)){
        tutQueue.push({key:w.key, objRef:w.objRef});
        _dequeueNextTut();
      }
    }
  }
}
// Run stats (for summary screen)
let runNearMisses=0,runCattleDodged=0,runMaxCombo=0,runStagesSurvived=0;
let runNitroInRain=false,runNitroRainDone=false;
// Revive system
let reviveTimer=0,reviveUsed=false;
let postShieldGrace=0; // brief invincibility frames after shield absorbs a hit
// Shield "SAVED!" moment
let savedFlash=0; // frames
// Boss (pursuit car) every 5 stages
let bossActive=false,bossCar=null,bossTimer=0,bossWarned=false;
// Danger vignette (last life)
let dangerPulse=0;
let almostDeadTimer=0;    // real-ms countdown — drives slow-mo
let almostDeadCooldown=0; // real-ms cooldown before next trigger


/* ══════════════════════════════════════════════
   HAPTICS  (vibrate API — Android Chrome + some iOS)
══════════════════════════════════════════════ */
function haptic(pat){try{if(navigator.vibrate)navigator.vibrate(pat);}catch(e){}}
/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
function rr(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}
function shade(hex,p){
  let r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return `rgb(${clamp(r+p,0,255)},${clamp(g+p,0,255)},${clamp(b+p,0,255)})`;
}
function hexToRgb(hex){
  return{r:parseInt(hex.slice(1,3),16),g:parseInt(hex.slice(3,5),16),b:parseInt(hex.slice(5,7),16)};
}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}
function lerp(a,b,t){return a+(b-a)*t;}

/* ══════════════════════════════════════════════
   SIN LOOKUP TABLE  — replaces per-frame Math.sin() calls for star twinkle
   256 entries; resolution is imperceptible for slow-oscillating effects.
══════════════════════════════════════════════ */
const SIN_LUT=(function(){
  const t=new Float32Array(256);
  for(let i=0;i<256;i++) t[i]=Math.sin(i/256*Math.PI*2);
  return t;
})();
// fastSin(x): x in radians, wraps correctly
function fastSin(x){return SIN_LUT[((x*(256/(Math.PI*2)))|0+512)&255];}

/* ══════════════════════════════════════════════
   BACKGROUND SCENERY HELPERS
══════════════════════════════════════════════ */
// Pre-generate building silhouettes once
const BLDG_L=[], BLDG_R=[];
(function genBuildings(){
  let x=0;
  while(x<50){const w=12+Math.random()*22,h=30+Math.random()*90;BLDG_L.push({x,w,h});x+=w+2;}
  x=370;
  while(x<W){const w=12+Math.random()*22,h=30+Math.random()*90;BLDG_R.push({x,w,h});x+=w+2;}
})();


let _lastLoopTS=0;
function loop(ts){
  PERF.tick(ts);
  const _rawDt=_lastLoopTS?(ts-_lastLoopTS):16.667;
  _lastLoopTS=ts;
  // Almost-dead timer runs in real ms — unaffected by slow-mo
  if(almostDeadTimer>0){
    const _prev=almostDeadTimer;
    almostDeadTimer=Math.max(0,almostDeadTimer-_rawDt);
    if(_prev>0&&almostDeadTimer===0) stopAlmostDead(); // restore audio when window ends
  }
  // Perfect near-miss timers run in real ms — unaffected by slow-mo
  if(perfectNmSlowMoTimer>0) perfectNmSlowMoTimer=Math.max(0,perfectNmSlowMoTimer-_rawDt);
  if(perfectNmFlash>0) perfectNmFlash=Math.max(0,perfectNmFlash-_rawDt);
  // Slow-mo: almostDead covers guaranteed crash; perfectNm covers last-moment same-lane dodge
  const _adSlowMo=almostDeadTimer>0&&(gst===ST.PLAYING||gst===ST.CRASHING||gst===ST.RESPAWNING);
  const _pnmSlowMo=perfectNmSlowMoTimer>0&&gst===ST.PLAYING;
  // dt normalised to 60 fps: 1.0 at 60fps, ~2.0 at 30fps. Cap at 3 to survive tab-switch stalls.
  const dt=Math.min(_rawDt/16.667,3)*(_adSlowMo?0.25:_pnmSlowMo?0.35:1.0);
  update(dt);draw();
  // ── Copyright notice: show on menu/splash screens, hide during gameplay ──
  if(_copyrightEl && gst !== _lastGstForCopyright){
    _lastGstForCopyright = gst;
    const _showCR = (gst===ST.ENGINE||gst===ST.SPLASH||gst===ST.INTRO||gst===ST.GAMEOVER||gst===ST.HOWTO||gst===ST.STATS||gst===ST.LEADERBOARD);
    _copyrightEl.style.display = _showCR ? 'block' : 'none';
  }
  requestAnimationFrame(loop);
}

document.addEventListener('keydown',e=>{
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();
  // ENGINE START screen — any key press fires the engine
  if(gst===ST.ENGINE){
    if(e.key===' '||e.key==='Enter'){
      initAC();gst=ST.SPLASH;splashTimer=0;
    }
    return;
  }
  // Exit confirm takes priority
  if(exitConfirmActive){
    if(e.key==='Escape'||e.key==='n'||e.key==='N'){exitConfirmActive=false;gamePaused=false;const pb=document.getElementById('pauseBtn');if(pb)pb.textContent='⏸';}
    if(e.key==='Enter'||e.key==='y'||e.key==='Y'){exitConfirmActive=false;gamePaused=false;stopEngine();stopBgMusic();stopWeatherSnd();gst=ST.SPLASH;showStats=false;initVars();const pb=document.getElementById('pauseBtn');if(pb)pb.textContent='⏸';startMenuMusic();}
    return;
  }
  if(gamePaused){
    if(e.key===' '||e.key==='p'||e.key==='P'){
      gamePaused=false;
      const pb=document.getElementById('pauseBtn');if(pb)pb.textContent='⏸';
      if(masterGain) masterGain.gain.setTargetAtTime(bgMuted?0:1, AC.currentTime, 0.08);
    }
    return;
  }
  if(e.key==='ArrowLeft')doLeft();if(e.key==='ArrowRight')doRight();
  if(e.key==='ArrowUp')doJump();if(e.key==='ArrowDown')doDown();
  if(e.key==='Enter')doGunFire();
  // Spacebar: fire nitro during gameplay, otherwise confirm/select in menus
  if(e.key===' '){if(gst===ST.PLAYING||gst===ST.RESPAWNING)doNitroFire();else doSelect();}
  if(e.key==='s'||e.key==='S')doShop();
  if((e.key==='p'||e.key==='P')&&(gst===ST.PLAYING||gst===ST.RESPAWNING)){gamePaused=true;const pb=document.getElementById('pauseBtn');if(pb)pb.textContent='▶';}
  if(e.key==='Escape'&&(gst===ST.SHOP||gst===ST.HOWTO||gst===ST.STATS)){gst===ST.SHOP?gst=preShop:gst=ST.SPLASH;}
  // How-to page navigation with arrow keys
  if(gst===ST.HOWTO){
    if(e.key==='ArrowRight'&&howtoPage<4){howtoPage++;snd('switch');}
    if(e.key==='ArrowLeft'&&howtoPage>0){howtoPage--;snd('switch');}
  }
});

// ── Touch handling ───────────────────────────────────────────────────────────
// preventDefault is scoped to the CANVAS element only.
// Document-level prevention has been intentionally removed — it was suppressing
// touch events on all HTML buttons (pause, mute, exit, arrows) on Android.

let tsx=0, tsy=0, tsTime=0, tMoved=false;

function getCanvasXY(touch){
  const rect=canvas.getBoundingClientRect();
  // Scale from display CSS pixels back to logical game coordinates
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;
  return {
    x:(touch.clientX - rect.left) * scaleX,
    y:(touch.clientY - rect.top)  * scaleY
  };
}

canvas.addEventListener('touchstart', e=>{
  initAC();
  // Request fullscreen on first touch — hides Chrome address bar
  if(!document.fullscreenElement){
    try{(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen||function(){}).call(document.documentElement);}catch(ex){}
  }
  const t=e.touches[0];
  tsx=t.clientX; tsy=t.clientY; tsTime=Date.now(); tMoved=false;
  e.preventDefault(); // scoped: only blocks scroll/bounce for canvas touches
  e.stopPropagation();
},{passive:false});

// ── Full desktop mouse click support (mirrors touchend logic) ──────────────
canvas.addEventListener('mousedown', e=>{
  if(e.button!==0) return; // left-click only
  initAC();
  const rect=canvas.getBoundingClientRect();
  const scaleX=W/rect.width, scaleY=H/rect.height;
  const relX=(e.clientX-rect.left)*scaleX;
  const relY=(e.clientY-rect.top)*scaleY;

  // ENGINE START
  if(gst===ST.ENGINE && _engineBtnRect){
    const b=_engineBtnRect;
    const dist=Math.sqrt((relX-b.cx)*(relX-b.cx)+(relY-b.cy)*(relY-b.cy));
    if(dist<=b.r){ initAC();gst=ST.SPLASH;splashTimer=0; }
    return;
  }

  // SHOP screen
  if(gst===ST.SHOP){
    const _PW=316,_PH=450,_PX=(W-_PW)/2,_PY=(H-_PH)/2-10;
    const _tabW=(_PW-32)/3;
    const _bbY=_PY+_PH-52,_bbH=28,_bbX=W/2-60;
    if(relY>=_bbY&&relY<=_bbY+_bbH&&relX>=_bbX&&relX<=_bbX+120){ doShop(); return; }
    const _tabY=_PY+68,_tabH=22;
    if(relY>=_tabY&&relY<=_tabY+_tabH){
      for(let ti=0;ti<3;ti++){
        const _tx=_PX+16+ti*(_tabW+4);
        if(relX>=_tx&&relX<=_tx+_tabW){if(shopTab!==ti){shopTab=ti;shopIdx=0;snd('switch');}return;}
      }
    }
    if(relY>H-70&&relX>W/2-60&&relX<W/2+60){ doShop(); return; }
    if(relX<W*0.28) doLeft();
    else if(relX>W*0.72) doRight();
    else shopBuy();
    return;
  }

  // HOWTO screen
  if(gst===ST.HOWTO){
    const _CW=352,_CX=(W-_CW)/2,_CY=10,_cardH=H-20;
    const _navY=_CY+_cardH-70;
    const _navBY=_navY+10,_navBH=34;
    if(relX>=_CX+16&&relX<=_CX+80&&relY>=_navBY&&relY<=_navBY+_navBH){if(howtoPage>0){howtoPage--;snd('switch');}return;}
    if(relX>=_CX+_CW-80&&relX<=_CX+_CW-16&&relY>=_navBY&&relY<=_navBY+_navBH){if(howtoPage<4){howtoPage++;snd('switch');}return;}
    if(relX>=W/2-50&&relX<=W/2+50&&relY>=_navBY&&relY<=_navBY+_navBH){gst=ST.SPLASH;return;}
    return;
  }

  // STATS screen
  if(gst===ST.STATS){ initAC();gst=ST.SPLASH;return; }

  // SPLASH menu
  if(gst===ST.SPLASH&&_splashMenuBtns){
    const b=_splashMenuBtns;
    const hit=(r)=>r&&relX>=r.x&&relX<=r.x+r.w&&relY>=r.y&&relY<=r.y+r.h;
    if(showStats){showStats=false;return;}
    if(hit(b.play))  { showStats=false;reset();return; }
    if(hit(b.guide)) { initAC();gst=ST.INTRO;return; }
    if(hit(b.stats)) { initAC();gst=ST.STATS;return; }
    if(hit(b.shop))  { doShop();return; }
    if(hit(b.howto)) { initAC();gst=ST.HOWTO;return; }
    return;
  }

  // INTRO screen buttons
  if(gst===ST.INTRO){
    const _footY2=10+H-20-42;
    const _backY=_footY2+10;
    if(relX>=34&&relX<=110&&relY>=_backY&&relY<=_backY+22){stopMenuMusic();gst=ST.SPLASH;initVars();startMenuMusic();return;}
    if(relX>=286&&relX<=372&&relY>=_backY&&relY<=_backY+22){gst=ST.HOWTO;return;}
    if(relX>=158&&relX<=242&&relY>=_backY&&relY<=_backY+22){showStats=!showStats;return;}
    if(showStats&&relX>=152&&relX<=248&&relY>=490&&relY<=514){showStats=false;return;}
    const _pbY=_footY2-56;
    if(relX>=145&&relX<=255&&relY>=_pbY&&relY<=_pbY+34){showStats=false;reset();return;}
    if(showStats){showStats=false;return;}
    return;
  }

  // LEADERBOARD screen — close button
  if(gst===ST.LEADERBOARD){
    const _lbCloseY=H-60;
    if(relX>=W/2-60&&relX<=W/2+60&&relY>=_lbCloseY&&relY<=_lbCloseY+32){gst=ST.GAMEOVER;}
    return;
  }

  // GAMEOVER screen
  if(gst===ST.GAMEOVER){
    const _GOpy=(H-410)/2-20,_GOph=410;
    const _rbX=W/2-132-6,_rbY=_GOpy+_GOph-54,_rbW=132,_rbH=34;
    const _mbX=W/2+6,_mbY=_rbY,_mbW=132,_mbH=34;
    if(relX>=_rbX&&relX<=_rbX+_rbW&&relY>=_rbY&&relY<=_rbY+_rbH){doStart();return;}
    if(relX>=_mbX&&relX<=_mbX+_mbW&&relY>=_mbY&&relY<=_mbY+_mbH){
      stopBgMusic();stopWeatherSnd();
      gst=ST.SPLASH;showStats=false;initVars();
      const pb=document.getElementById('pauseBtn');if(pb)pb.textContent='⏸';
      startMenuMusic();
      return;
    }
    // Shop button (left of bottom pair)
    const _sbY=H-44,_sbH=28;
    if(relX>=W/2-106&&relX<=W/2-6&&relY>=_sbY&&relY<=_sbY+_sbH){doShop();return;}
    // Leaderboard button (right of bottom pair)
    if(relX>=W/2+6&&relX<=W/2+106&&relY>=_sbY&&relY<=_sbY+_sbH){_llOpenLeaderboard();return;}
    return;
  }

  // Exit confirm overlay
  if(exitConfirmActive){
    if(relX>=EXIT_CONFIRM_YES.x&&relX<=EXIT_CONFIRM_YES.x+EXIT_CONFIRM_YES.w&&
       relY>=EXIT_CONFIRM_YES.y&&relY<=EXIT_CONFIRM_YES.y+EXIT_CONFIRM_YES.h){
      exitConfirmActive=false;gamePaused=false;
      stopEngine();stopBgMusic();stopWeatherSnd();
      gst=ST.SPLASH;showStats=false;initVars();
      const pb=document.getElementById('pauseBtn');if(pb)pb.textContent='⏸';
      startMenuMusic();
      return;
    }
    if(relX>=EXIT_CONFIRM_NO.x&&relX<=EXIT_CONFIRM_NO.x+EXIT_CONFIRM_NO.w&&
       relY>=EXIT_CONFIRM_NO.y&&relY<=EXIT_CONFIRM_NO.y+EXIT_CONFIRM_NO.h){
      exitConfirmActive=false;gamePaused=false;
      const pb=document.getElementById('pauseBtn');if(pb)pb.textContent='⏸';
      return;
    }
    return;
  }

  // Pause overlay — click anywhere to resume
  if(gamePaused){
    gamePaused=false;
    const pb=document.getElementById('pauseBtn');if(pb)pb.textContent='⏸';
    if(masterGain)masterGain.gain.setTargetAtTime(bgMuted?0:1,AC.currentTime,0.08);
    return;
  }

  // REVIVE screen
  if(gst===ST.REVIVE) return;

  // Nitro tutorial tap-to-continue (Phase 12)
  if(_tutNitroTapReady && (gst===ST.PLAYING||gst===ST.RESPAWNING)){
    _tutNitroTapped=true; _tutNitroTapReady=false; return;
  }

  // In-game: left half = left, right half = right, top 40% = jump
  if(gst===ST.PLAYING||gst===ST.RESPAWNING||gst===ST.CRASHING){
    if(relY<H*0.4) doJump();
    else if(relX<W/2) doLeft();
    else doRight();
  }
});

canvas.addEventListener('touchmove', e=>{
  const t=e.touches[0];
  if(Math.abs(t.clientX-tsx)>8 || Math.abs(t.clientY-tsy)>8) tMoved=true;
  // Object guide scroll
  if(gst===ST.INTRO){
    const dy=(t.clientY-tsy)*(H/canvas.getBoundingClientRect().height);
    introScrollY=clamp(introScrollY-dy*0.6,0,Math.max(0,16*44-300));
    tsx=t.clientX;tsy=t.clientY;
  }
  e.preventDefault(); // scoped: prevents scroll while finger is on canvas
  e.stopPropagation();
},{passive:false});

// ── Mouse wheel scroll for Object Guide (desktop) ────────────────────────────
canvas.addEventListener('wheel', e=>{
  if(gst===ST.INTRO){
    e.preventDefault();
    introScrollY=clamp(introScrollY+e.deltaY*0.5,0,Math.max(0,16*44-300));
  }
},{passive:false});

canvas.addEventListener('touchend', e=>{
  e.preventDefault(); // suppress synthetic mousedown/click that would double-fire every tap
  initAC();
  const touch = e.changedTouches[0];
  const dx = touch.clientX - tsx;
  const dy = touch.clientY - tsy;
  const dt = Date.now() - tsTime;
  const {x:relX, y:relY} = getCanvasXY(touch);

  // Minimum swipe distance in logical game pixels (40 = reliable, not jumpy)
  const SWIPE = 28;  // reduced from 40 for snappier swipes
  // Short tap threshold: under 220ms and barely moved
  const isTap = dt < 220 && Math.abs(dx)<18 && Math.abs(dy)<18;

  // Convert physical px delta to game-coordinate delta for reliable swipe
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const gdx = dx * scaleX;
  const gdy = dy * (H / rect.height);

  if(gst===ST.SHOP){
    if(isTap){
      // ── Derive panel geometry (must match drawShop values) ──
      const _PW=316,_PH=450,_PX=(W-_PW)/2,_PY=(H-_PH)/2-10;
      const _tabW=(_PW-32)/3;

      // Back button — bottom of panel
      const _bbY=_PY+_PH-52,_bbH=28,_bbX=W/2-60;
      if(relY>=_bbY && relY<=_bbY+_bbH && relX>=_bbX && relX<=_bbX+120){
        doShop(); e.stopPropagation(); return;
      }

      // Tab row — ty=PY+68, th=22
      const _tabY=_PY+68,_tabH=22;
      if(relY>=_tabY && relY<=_tabY+_tabH){
        for(let ti=0;ti<3;ti++){
          const _tx=_PX+16+ti*(_tabW+4);
          if(relX>=_tx && relX<=_tx+_tabW){
            if(shopTab!==ti){shopTab=ti;shopIdx=0;snd('switch');}
            e.stopPropagation(); return;
          }
        }
      }

      // Old fallback SHOP close zone (belt-and-braces)
      if(relY>H-70 && relX>W/2-60 && relX<W/2+60){ doShop(); e.stopPropagation(); return; }

      // Left/right thirds = prev/next item; center = buy/equip
      if(relX < W*0.28) doLeft();
      else if(relX > W*0.72) doRight();
      else shopBuy();
    } else {
      // Swipe left/right = browse items, up/down = switch tabs
      if(Math.abs(gdy)>Math.abs(gdx) && Math.abs(gdy)>SWIPE){
        dy<0?doJump():doDown();
      } else if(Math.abs(gdx)>SWIPE){
        gdx<0?doLeft():doRight();
      }
    }
    e.stopPropagation(); return;
  }

  if(gst===ST.HOWTO){
    if(isTap){
      const _CW=352,_CX=(W-_CW)/2,_CY=10,_cardH=H-20;
      const _navY=_CY+_cardH-70;
      const _navBY=_navY+10, _navBH=34;
      // Left arrow: lbX=CX+16, lbW=64
      if(relX>=_CX+16 && relX<=_CX+80 && relY>=_navBY && relY<=_navBY+_navBH){
        if(howtoPage>0){howtoPage--;snd('switch');}
        e.stopPropagation();return;
      }
      // Right arrow: rbX=CX+CW-80, rbW=64
      if(relX>=_CX+_CW-80 && relX<=_CX+_CW-16 && relY>=_navBY && relY<=_navBY+_navBH){
        if(howtoPage<4){howtoPage++;snd('switch');}
        e.stopPropagation();return;
      }
      // Back button (center): bbX=W/2-50, bbW=100
      if(relX>=W/2-50 && relX<=W/2+50 && relY>=_navBY && relY<=_navBY+_navBH){
        gst=ST.SPLASH;e.stopPropagation();return;
      }
      // Swipe left = next page, swipe right = prev page
      if(Math.abs(gdx)>SWIPE){
        if(gdx<0&&howtoPage<4){howtoPage++;snd('switch');}
        else if(gdx>0&&howtoPage>0){howtoPage--;snd('switch');}
      }
    }
    e.stopPropagation();return;
  }

  if(gst===ST.STATS){
    // Any tap goes back to splash menu
    initAC();gst=ST.SPLASH;e.stopPropagation();return;
  }

  // ── ENGINE START screen: tap the button to unlock AC and launch the splash ──
  if(gst===ST.ENGINE){
    if(isTap && _engineBtnRect){
      const b=_engineBtnRect;
      const dist=Math.sqrt((relX-b.cx)*(relX-b.cx)+(relY-b.cy)*(relY-b.cy));
      if(dist<=b.r){
        initAC(); // unlock AudioContext on this user gesture
        gst=ST.SPLASH;
        splashTimer=0;
        e.stopPropagation();return;
      }
    }
    e.stopPropagation();return;
  }

  if(gst===ST.INTRO||gst===ST.GAMEOVER||gst===ST.REVIVE||gst===ST.SPLASH){
    // ── SPLASH menu overlay button detection ──
    if(gst===ST.SPLASH && isTap && _splashMenuBtns){
      const b=_splashMenuBtns;
      const hit=(r)=>r&&relX>=r.x&&relX<=r.x+r.w&&relY>=r.y&&relY<=r.y+r.h;
      // If stats panel is open, handle its close button or dismiss on any tap
      if(showStats){
        showStats=false;e.stopPropagation();return;
      }
      if(hit(b.play)) { showStats=false;reset();e.stopPropagation();return; }
      if(hit(b.guide)){ initAC();gst=ST.INTRO;e.stopPropagation();return; }
      if(hit(b.stats)){ initAC();gst=ST.STATS;e.stopPropagation();return; }
      if(hit(b.shop)) { doShop();e.stopPropagation();return; }
      if(hit(b.howto)){ initAC();gst=ST.HOWTO;e.stopPropagation();return; }
      e.stopPropagation();return;
    }
    // ── INTRO-only button hit detection ──
    if(gst===ST.INTRO && isTap){
      // BACK button — bottom-left: backX=CX+10=34, backY=footY+10, backW=76, backH=22
      const _footY2=10+H-20-42; // CY+cardH-42
      const _backY=_footY2+10;
      if(relX>=34 && relX<=110 && relY>=_backY && relY<=_backY+22){
        // Back to splash/main menu
        stopMenuMusic();gst=ST.SPLASH;initVars();startMenuMusic();
        e.stopPropagation();return;
      }
      // HOWTO button — bottom-right: ibX=290, ibY=_backY, ibW=76, ibH=22
      if(relX>=286 && relX<=372 && relY>=_backY && relY<=_backY+22){
        gst=ST.HOWTO;e.stopPropagation();return;
      }
      // STATS button — bottom-center: sbX=W/2-38=162, sbW=76
      if(relX>=158 && relX<=242 && relY>=_backY && relY<=_backY+22){
        showStats=!showStats;e.stopPropagation();return;
      }
      // STATS overlay Back button — center of panel, near bottom
      if(showStats && relX>=152 && relX<=248 && relY>=490 && relY<=514){
        showStats=false;e.stopPropagation();return;
      }
      // PLAY button — center: pbX=W/2-55=145, pbY=footY-56, pbW=110, pbH=34
      const _pbY=_footY2-56;
      if(relX>=145 && relX<=255 && relY>=_pbY && relY<=_pbY+34){
        showStats=false;reset();e.stopPropagation();return;
      }
      // Close stats panel on any tap outside
      if(showStats){showStats=false;e.stopPropagation();return;}
    }
  if(gst===ST.LEADERBOARD){
    const _lbCloseY=H-60;
    if(relX>=W/2-60&&relX<=W/2+60&&relY>=_lbCloseY&&relY<=_lbCloseY+40){
      gst=ST.GAMEOVER;e.stopPropagation();return;
    }
    e.stopPropagation();return;
  }

  if(gst!==ST.REVIVE&&gst!==ST.SPLASH && relY>H-56 && relX>=W/2-106 && relX<=W/2-6){ doShop(); return; }
  if(gst===ST.GAMEOVER && relY>H-56 && relX>=W/2+6 && relX<=W/2+106){ _llOpenLeaderboard(); return; }
    // GAMEOVER: RETRY and MENU buttons
    if(gst===ST.GAMEOVER && isTap){
      const _GOpy=(H-410)/2-20, _GOph=410;
      const _rbX=W/2-132-6, _rbY=_GOpy+_GOph-54, _rbW=132, _rbH=34;
      const _mbX=W/2+6, _mbY=_rbY, _mbW=132, _mbH=34;
      if(relX>=_rbX&&relX<=_rbX+_rbW&&relY>=_rbY&&relY<=_rbY+_rbH){
        doStart(); e.stopPropagation(); return;
      }
      if(relX>=_mbX&&relX<=_mbX+_mbW&&relY>=_mbY&&relY<=_mbY+_mbH){
        stopBgMusic();stopWeatherSnd();
        gst=ST.SPLASH;showStats=false;initVars();
        const pb=document.getElementById('pauseBtn');if(pb)pb.textContent='⏸';
        startMenuMusic();
        e.stopPropagation();return;
      }
      // Shop button (left of bottom pair)
      const _sbY=H-44,_sbH=28;
      if(relX>=W/2-106&&relX<=W/2-6&&relY>=_sbY&&relY<=_sbY+_sbH){doShop();e.stopPropagation();return;}
      // Leaderboard button (right of bottom pair)
      if(relX>=W/2+6&&relX<=W/2+106&&relY>=_sbY&&relY<=_sbY+_sbH){_llOpenLeaderboard();e.stopPropagation();return;}
      e.stopPropagation(); return;
    }
    if(gst!==ST.INTRO&&gst!==ST.GAMEOVER&&gst!==ST.SPLASH) doStart();
    e.stopPropagation(); return;
  }

  // ── Exit confirm overlay taps ──
  if(exitConfirmActive && isTap){
    // YES = exit to intro
    if(relX>=EXIT_CONFIRM_YES.x && relX<=EXIT_CONFIRM_YES.x+EXIT_CONFIRM_YES.w &&
       relY>=EXIT_CONFIRM_YES.y && relY<=EXIT_CONFIRM_YES.y+EXIT_CONFIRM_YES.h){
      exitConfirmActive=false;gamePaused=false;
      stopEngine();stopBgMusic();stopWeatherSnd();
      gst=ST.SPLASH;showStats=false;initVars();
      const pb=document.getElementById('pauseBtn');if(pb)pb.textContent='⏸';
      startMenuMusic();
      e.stopPropagation();return;
    }
    // NO = keep playing
    if(relX>=EXIT_CONFIRM_NO.x && relX<=EXIT_CONFIRM_NO.x+EXIT_CONFIRM_NO.w &&
       relY>=EXIT_CONFIRM_NO.y && relY<=EXIT_CONFIRM_NO.y+EXIT_CONFIRM_NO.h){
      exitConfirmActive=false;gamePaused=false;
      const pb=document.getElementById('pauseBtn');if(pb)pb.textContent='⏸';
      e.stopPropagation();return;
    }
    e.stopPropagation();return; // swallow all taps while confirm is open
  }

  // ── Pause overlay tap — tap anywhere to resume ──
  if(gamePaused && isTap){
    gamePaused=false;
    const pb=document.getElementById('pauseBtn');if(pb)pb.textContent='⏸';
    if(masterGain) masterGain.gain.setTargetAtTime(bgMuted?0:1, AC.currentTime, 0.08);
    e.stopPropagation();return;
  }
  if(gamePaused){e.stopPropagation();return;}

  // Tutorial skip — tap anywhere during an active hint dismisses it
  if(isTap && tut && (gst===ST.PLAYING||gst===ST.RESPAWNING)){
    _skipTutorial();
    e.stopPropagation();return;
  }

  // Nitro tutorial tap-to-continue (Phase 12)
  if(isTap && _tutNitroTapReady && (gst===ST.PLAYING||gst===ST.RESPAWNING)){
    _tutNitroTapped=true; _tutNitroTapReady=false;
    e.stopPropagation(); return;
  }

  // In-game controls
  if(Math.abs(gdy)>Math.abs(gdx) && gdy < -SWIPE) doJump();
  else if(gdx < -SWIPE) doLeft();
  else if(gdx >  SWIPE) doRight();
  else if(isTap){
    // Tap left half = left, tap right half = right, tap top 40% = jump
    if(relY < H*0.4) doJump();
    else if(relX < W/2) doLeft();
    else doRight();
  }
  e.stopPropagation();
},{passive:false});


// On-screen touch buttons (tbtn-l/u/r) removed — gestures replace them.
// Fire button listener below is kept (gun power-up has no gesture equivalent).


// Mute button
(function(){
  const mb=document.getElementById('muteBtn');
  if(!mb)return;
  mb.addEventListener('touchstart',e=>{initAC();toggleMute();e.preventDefault();},{passive:false});
  mb.addEventListener('mousedown',e=>{initAC();toggleMute();});
})();

// ── Machine Gun fire button ──────────────────────────────────────────────────
(function(){
  const fb=document.getElementById('tbtn-fire');
  if(!fb)return;
  fb.addEventListener('touchstart',e=>{
    initAC();doGunFire();
    const rpl=document.createElement('span');
    rpl.className='tbtn-ripple';
    rpl.style.cssText='width:60px;height:60px;left:6px;top:-2px;';
    fb.appendChild(rpl);
    setTimeout(()=>rpl.remove(),450);
    e.preventDefault();
  },{passive:false});
  fb.addEventListener('mousedown',e=>{initAC();doGunFire();});
})();

// ── Nitro reserve fire button ────────────────────────────────────────────────
(function(){
  const nb=document.getElementById('tbtn-nitro');
  if(!nb)return;
  nb.addEventListener('touchstart',e=>{
    initAC();doNitroFire();
    const rpl=document.createElement('span');
    rpl.className='tbtn-ripple';
    rpl.style.cssText='width:60px;height:60px;left:6px;top:-2px;';
    nb.appendChild(rpl);
    setTimeout(()=>rpl.remove(),450);
    e.preventDefault();
  },{passive:false});
  nb.addEventListener('mousedown',e=>{initAC();doNitroFire();});
})();

// ── Sound Controls Button & Panel ──────────────────────────────────────────
(function(){
  const scBtn=document.getElementById('soundCtrlBtn');
  const scPanel=document.getElementById('soundCtrlPanel');
  const scDim=document.getElementById('soundCtrlDim');
  const scClose=document.getElementById('soundCtrlClose');
  if(!scBtn||!scPanel)return;

  let scOpen=false;

  function showPanel(){
    initAC();
    scOpen=true;
    gamePaused=true;
    const pb=document.getElementById('pauseBtn');if(pb)pb.textContent='▶';
    // Keep audio playing — don't mute masterGain
    scPanel.classList.add('visible');
    if(scDim)scDim.classList.add('visible');
    scBtn.classList.add('sc-open');
    // Sync slider values
    const se=document.getElementById('sc-vol-engine');
    const ss=document.getElementById('sc-vol-sfx');
    const sb=document.getElementById('sc-vol-bg');
    const sw=document.getElementById('sc-vol-wx');
    if(se)se.value=Math.round(engineBusVol*100);
    if(ss)ss.value=Math.round(sfxBusVol*100);
    if(sb)sb.value=Math.round(bgBusVol*100);
    if(sw)sw.value=Math.round(weatherBusVol*100);
  }
  function hidePanel(){
    scOpen=false;
    gamePaused=false;
    const pb=document.getElementById('pauseBtn');if(pb)pb.textContent='⏸';
    scPanel.classList.remove('visible');
    if(scDim)scDim.classList.remove('visible');
    scBtn.classList.remove('sc-open');
    if(masterGain) masterGain.gain.setTargetAtTime(bgMuted?0:1, AC?AC.currentTime:0, 0.08);
  }

  scBtn.addEventListener('touchstart',e=>{initAC();scOpen?hidePanel():showPanel();e.preventDefault();},{passive:false});
  scBtn.addEventListener('mousedown',e=>{initAC();scOpen?hidePanel():showPanel();});
  if(scClose){
    scClose.addEventListener('touchstart',e=>{hidePanel();e.preventDefault();},{passive:false});
    scClose.addEventListener('mousedown',e=>{hidePanel();});
  }
  if(scDim){
    scDim.addEventListener('touchstart',e=>{hidePanel();e.preventDefault();},{passive:false});
    scDim.addEventListener('mousedown',e=>{hidePanel();});
  }

  // Sound button visibility is updated inside draw() — no polling needed

  // Engine slider
  const engSlider=document.getElementById('sc-vol-engine');
  if(engSlider){
    engSlider.addEventListener('input',()=>{
      engineBusVol=engSlider.value/100;
      saveLS('rr_vol_engine',engineBusVol);
      if(engineBus) engineBus.gain.setTargetAtTime(engineBusVol,AC?AC.currentTime:0,0.05);
    });
    engSlider.addEventListener('touchmove',e=>e.stopPropagation(),{passive:true});
    engSlider.addEventListener('touchstart',e=>{initAC();e.stopPropagation();},{passive:true});
  }
  // SFX slider
  const sfxSlider=document.getElementById('sc-vol-sfx');
  if(sfxSlider){
    sfxSlider.addEventListener('input',()=>{
      sfxBusVol=sfxSlider.value/100;
      saveLS('rr_vol_sfx',sfxBusVol);
      if(sfxBus) sfxBus.gain.setTargetAtTime(sfxBusVol,AC?AC.currentTime:0,0.05);
    });
    sfxSlider.addEventListener('touchmove',e=>e.stopPropagation(),{passive:true});
    sfxSlider.addEventListener('touchstart',e=>{initAC();e.stopPropagation();},{passive:true});
  }
  // Background slider
  const bgSlider=document.getElementById('sc-vol-bg');
  if(bgSlider){
    bgSlider.addEventListener('input',()=>{
      bgBusVol=bgSlider.value/100;
      saveLS('rr_vol_bg',bgBusVol);
      if(bgBus) bgBus.gain.setTargetAtTime(bgBusVol,AC?AC.currentTime:0,0.05);
    });
    bgSlider.addEventListener('touchmove',e=>e.stopPropagation(),{passive:true});
    bgSlider.addEventListener('touchstart',e=>{initAC();e.stopPropagation();},{passive:true});
  }
  // Weather slider
  const wxSlider=document.getElementById('sc-vol-wx');
  if(wxSlider){
    wxSlider.addEventListener('input',()=>{
      weatherBusVol=wxSlider.value/100;
      saveLS('rr_vol_wx',weatherBusVol);
      if(weatherBus) weatherBus.gain.setTargetAtTime(weatherBusVol,AC?AC.currentTime:0,0.05);
    });
    wxSlider.addEventListener('touchmove',e=>e.stopPropagation(),{passive:true});
    wxSlider.addEventListener('touchstart',e=>{initAC();e.stopPropagation();},{passive:true});
  }
})();

// Pause button
(function(){
  const pb=document.getElementById('pauseBtn');
  if(!pb)return;
  function togglePause(){
    initAC();
    if(exitConfirmActive)return;
    gamePaused=!gamePaused;
    pb.textContent=gamePaused?'▶':'⏸';
    // Mute all audio when paused, restore when resumed (respects bgMuted flag)
    if(masterGain){
      if(gamePaused){
        masterGain.gain.setTargetAtTime(0, AC.currentTime, 0.05);
      } else {
        masterGain.gain.setTargetAtTime(bgMuted?0:1, AC.currentTime, 0.08);
      }
    }
  }
  pb.addEventListener('touchstart',e=>{togglePause();e.preventDefault();},{passive:false});
  pb.addEventListener('mousedown',e=>{togglePause();});
})();

// Exit button
(function(){
  const eb=document.getElementById('exitBtn');
  if(!eb)return;
  function triggerExit(){
    initAC();
    if(!gamePaused) gamePaused=true; // also pause the game
    exitConfirmActive=true;
    const pb=document.getElementById('pauseBtn');
    if(pb) pb.textContent='▶';
  }
  eb.addEventListener('touchstart',e=>{triggerExit();e.preventDefault();},{passive:false});
  eb.addEventListener('mousedown',e=>{triggerExit();});
})();

if(bvalEl)bvalEl.textContent=bestScore;cvalEl.textContent=coinBank;
if(bdvalEl)bdvalEl.textContent=bestDistance;

// Apply saved slider volumes once AC is available (deferred until first interaction)
(function(){
  const _applyVolumes=()=>{
    if(engineBus) engineBus.gain.value=engineBusVol;
    if(sfxBus) sfxBus.gain.value=sfxBusVol;
    if(bgBus) bgBus.gain.value=bgBusVol;
    if(weatherBus) weatherBus.gain.value=weatherBusVol;
    const se=document.getElementById('sc-vol-engine');
    const ss=document.getElementById('sc-vol-sfx');
    const sb=document.getElementById('sc-vol-bg');
    const sw=document.getElementById('sc-vol-wx');
    if(se) se.value=Math.round(engineBusVol*100);
    if(ss) ss.value=Math.round(sfxBusVol*100);
    if(sb) sb.value=Math.round(bgBusVol*100);
    if(sw) sw.value=Math.round(weatherBusVol*100);
  };
  document.addEventListener('touchstart',_applyVolumes,{once:true,passive:true});
  document.addEventListener('mousedown',_applyVolumes,{once:true,passive:true});
})();

// ── iOS "Add to Home Screen" nudge ──
(function(){
  const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent||'');
  const isStandalone=('standalone' in navigator)&&navigator.standalone;
  const dismissed=localStorage.getItem('rr_ios_dismissed');
  if(isIOS&&!isStandalone&&!dismissed){
    const b=document.getElementById('iosBanner');
    if(b){
      b.style.display='block';
      // Auto-hide after 8 seconds
      setTimeout(()=>{b.style.display='none';},8000);
    }
  }
})();

