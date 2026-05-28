/* ══════════════════════════════════════════════
   logic.js — Road Rash Runner
   Game mechanics: init, reset, weather, stages,
   spawning, missions, crash, collection, update,
   shop logic, and player input functions.
══════════════════════════════════════════════ */

/* ══════════════════════════════════════════════
   SPEED TABLES
   Hardcoded base and nitro speeds per stage.
   Index 1 = stage 1 … index 20 = stage 20+.
   Stages beyond 20 are capped at stage 20 values
   via Math.min(stageNum, 20).
══════════════════════════════════════════════ */
const STAGE_BASE_SPD  = [0,3.5000,3.7100,3.9326,4.1686,4.3770,4.5958,4.8256,5.0669,5.2696,5.4804,5.6996,5.9276,6.1054,6.2886,6.4772,6.6715,6.8050,6.9411,7.0105,7.0105];
const STAGE_NITRO_SPD = [0,6.3000,6.6780,7.0787,7.5034,7.8786,8.2725,8.6861,9.1204,9.4853,9.8647,10.000,10.000,10.000,10.000,10.000,10.000,10.000,10.000,10.000,10.000];

/* ══════════════════════════════════════════════
   RESET / INIT
══════════════════════════════════════════════ */
function initVars(){
  score=0;frameCount=0;dashOff=0;baseSpd=3.5;spd=3.5;distanceTravelled=0;bgScrollY=0;
  weatherType='clear';weatherTimer=0;weatherTotalDur=0;weatherCooldown=600;weatherPreview=null;
  _RAIN_POOL._reset();_DUST_POOL._reset();weatherMsg=null;
  stopBgMusic();stopWeatherSnd();
  lastStages=0;stageNum=1;exhaustTimer=0;shakeAmt=0;
  player={lane:1,visualX:LANE_XS[1],targetX:LANE_XS[1],y:Math.round(H*0.82),lives:1,invTimer:0,jumping:false,jumpProg:0,jumpOff:0,jumpCD:0};
  _ENEMY_POOL._reset();_OBST_POOL._reset();_CATTLE_POOL._reset();
  _EXHAUST_POOL._reset();_CRASH_POOL._reset();_BLOOD_POOL._reset();_SHIELD_POOL._reset();bloodPools=[];
  stageFlash=null;lifeMsg=null;
  crashTimer=0;crashType='';crashCattleIdx=-1;cattlePending=false;
  _COIN_POOL._reset();_PU_POOL._reset();sessionCoins=0;
  activeShield=false;magnetTimer=0;nitroTimer=0;ghostTimer=0;nitroMult=1;
  nitroReserve=false;nitroExpiryTimer=0;nitroTimerMax=240;
  nearMissStreak=0;comboDecay=0;comboMult=1;_NMPOP_POOL._reset();comboFlashTimer=0;
  coinStreak=0;coinStreakDecay=0;nitroSmashCount=0;
  _playerLaneDwellTimer=0;_playerLaneDwellLane=-1;
  _RING_POOL._reset();_SPEEDLINE_POOL._reset();playerTilt=0;playerLaneVel=0;
  puBanner=null;
  lastNearMissFrame=-999;lastNearMissScore=0;
  slowBumpTimer=0;
  clearStretchTimer=0;_shownMechanics={};
  tut=null;tutQueue=[];tutWatchList=[];tutSlowElapsed=-1; // tutorialShown persists
  tutPhase=-1;tutPhaseTimer=0;tutEnemyRef=null;tutCoinRef=null;tutObstRef=null;_tutPlayerLaneAtPhase2=1;
  tutPhase1EnemyRef2=null;tutPhase2EnemyRef1=null;tutPhase2EnemyRef2=null;
  tutJumpObstRef2=null;tutJumpEnemyRef1=null;tutJumpEnemyRef2=null;
  tutShieldRef=null;tutGunPickupRef=null;tutShootEnemyRef=null;
  tutShieldLabelTimer=0;tutHandoffTimer=0;
  tutSpeedTarget=1.0;tutSpeedCurrent=1.0;
  tutGunLane=-1;tutPhase1StartLane=1;
  tutShieldCollected=false;tutGunCollected=false;
  tutNitroPickupRef=null;tutNitroObst1Ref=null;tutNitroObst2Ref=null;tutNitroObst3Ref=null;
  tutNitroCollected=false;tutNitroObstLane1=-1;tutNitroObstLane2=-1;tutNitroObstLane3=-1;
  _tutNitroTapReady=false;_tutNitroTapped=false;
  tutNitroArrowActive=false;tutNitroArrowTapped=false;
  tutNitroArrowFading=false;tutNitroPostSmash1Timer=0;
  tutPhase9Enemies=[];
  // New tutorial vars
  tutPhase2Spawned=false;
  tutRewindActive=false;tutRewindTimer=0;tutCrashPopText='';tutCrashPopTimer=0;
  tutP3Spawned=false;tutP3GunUsed=false;
  tutP4Spawned=false;tutNitroMoveLocked=false;
  tutGunArrowTimer=0;tutCertifiedSndDone=false;
  tutCrashPending=false;
  tutP3CarBRef=null;tutP3CarCRef=null;
  tutNitroWarmupActive=false;tutNitroWarmupTimer=0;
  // Note: _nitroTutDone is NOT reset here — it is a run-persistent flag loaded from localStorage
  newRecordFlash=0;hasPassedBest=false;
  respawnFadeTimer=0;newBestCelebTimer=0;confettiParticles=[];
  runNearMisses=0;runCattleDodged=0;runMaxCombo=0;runStagesSurvived=0;
  runNitroInRain=false;runNitroRainDone=false;
  runNitroUsed=0;runBossKilled=false;_lastXpGained=0;
  reviveTimer=0;reviveUsed=false;
  postShieldGrace=0;
  savedFlash=0;
  bossActive=false;bossCar=null;bossTimer=0;bossWarned=false;
  gunActive=false;gunAmmo=0;gunRecoilTimer=0;bossShotWarningGiven=false;
  gunFireCooldown=0;gunSpawnCooldown=0;gunLastStageSpawned=-1;gunMuzzleFlash=0;
  gunPickupHintTimer=0;
  _BULLET_POOL._reset();
  _TRUCK_POOL._reset();trucksSpawnedThisStage=0;lastTruckStageNum=1;
  _redrawAmmoCanvas(false,0); // reset ammo display to inactive state
  setTimeout(()=>_redrawNitroCanvas(false),0); // reset nitro bolt to inactive
  dangerPulse=0;
  almostDeadTimer=0;almostDeadCooldown=0;
  perfectNmSlowMoTimer=0;perfectNmFlash=0;_prevPlayerLane=1;
  livesTextTimer=0;livesTextCount=0;
  roadworksWarnTimer=0;
  menuScrollY=0;
  _ftActiveLane=-1;
  _ftMoveCooldown=0;
  _mode2HintPhase=0;
  _mode2HintTimer=0;
  _trackSensPopup=false;
  _updateComboBadge();
}
function reset(){
  stopMenuMusic();
  showStats=false;
  gamePaused=false;exitConfirmActive=false;
  const pb=document.getElementById('pauseBtn');if(pb)pb.textContent='⏸';
  initVars();gst=ST.PLAYING;
  // Activate guided tutorial on first-ever run — for both swipe and track modes
  if(!tutorialShown.fullTutorial){ tutPhase=0; }
  _updateDistBoxVisibility(); // hide distance HUD during tutorial, show normally
  if(equippedBoost==='shield_start')activeShield=true;
  if(equippedBoost==='extra_life')player.lives=2;
  if(equippedBoost==='nitro_start'){nitroTimer=200;nitroMult=2;}
  stopEngine();startEngine();updateHUD();
}
function updateHUD(){
  _redrawHeartsCanvas(player.lives);
  cvalEl.textContent=coinBank;
  if(bvalEl)bvalEl.textContent=bestScore;
  svalEl.textContent=Math.floor(score);
  if(dvalEl)dvalEl.textContent=(distanceTravelled/15120).toFixed(2);
}
/* Hide/show distance HUD — hidden during tutorial, visible once game starts */
function _updateDistBoxVisibility(){
  const _db=document.getElementById('distbox');
  if(_db)_db.style.display=(tutPhase>=0)?'none':'';
}
function updateLivesHUD(){_redrawHeartsCanvas(player.lives);}

/* ── Combo multiplier badge on score circle ── */
function _updateComboBadge(){
  const badge=document.getElementById('combobadge');
  const circle=document.getElementById('scorebox');
  if(!badge||!circle)return;
  if(comboMult<=1){
    badge.textContent='';
    badge.className='';
    circle.className='';
  } else {
    badge.textContent='×'+comboMult;
    badge.className='combo-active combo-x'+comboMult;
    circle.className='combo-glow-x'+comboMult;
  }
}


/* ══════════════════════════════════════════════
   WEATHER & HAZARD EVENTS
══════════════════════════════════════════════ */
function _pickWeather(){
  // Gate roadworks to stage 8+ only — it's introduced as a new mechanic there
  const types = stageNum<8 ? ['clear','rain','fog','dust'] : WX_TYPES;
  const weights = stageNum<8 ? [0.54,0.22,0.14,0.10] : WX_WEIGHTS;
  let r=Math.random(),cum=0;
  for(let i=0;i<types.length;i++){cum+=weights[i];if(r<cum)return types[i];}
  return 'clear';
}
function _setWeather(type){
  weatherType=type;
  weatherTotalDur=(WX_DUR_MIN+Math.random()*(WX_DUR_MAX-WX_DUR_MIN))|0;
  weatherTimer=weatherTotalDur;
  if(type==='roadworks'&&player.lane>2){player.lane=2;player.targetX=LANE_XS[2];}
  if(type!=='clear') startWeatherSnd(type); else stopWeatherSnd();
  if(type==='rain') weatherMsg={text:'⚠  Slippery roads — be cautious!',timer:200,col:'#93c5fd'};
}
const WX_INCOMING={rain:'🌧  Rain incoming',fog:'🌫  Fog incoming',dust:'🌪  Dust storm incoming',roadworks:'🚧  Road works ahead'};
function _showWeatherWarning(type){
  if(type==='clear')return;
  weatherMsg={text:WX_INCOMING[type]||type,timer:180,col:'#e2e8f0'};
  // Extra: for roadworks specifically, also start lane-warning arrow countdown
  if(type==='roadworks') roadworksWarnTimer=180;
}
function updateWeather(dt){
  const _dt=dt||1;
  if(gst!==ST.PLAYING&&gst!==ST.RESPAWNING)return;
  if(tutPhase>=0)return; // no weather changes during any tutorial phase
  if(weatherMsg){weatherMsg.timer-=_dt;if(weatherMsg.timer<=0)weatherMsg=null;}
  if(roadworksWarnTimer>0) roadworksWarnTimer-=_dt;
  if(weatherTimer>0){
    weatherTimer-=_dt;
    if(weatherType==='rain')  _updateRain(_dt);
    if(weatherType==='dust')  _updateDust(_dt);
    if(weatherType==='roadworks'&&player.lane>2){player.lane=2;}
    if(weatherTimer<=0){
      weatherType='clear'; _RAIN_POOL._reset(); _DUST_POOL._reset();
      // Pre-pick next weather for early warning
      const wt=_pickWeather();
      if(wt!=='clear'){
        weatherPreview=wt;
        weatherCooldown=(280+Math.random()*280)|0;
      } else {
        weatherPreview=null;
        weatherCooldown=(220+Math.random()*220)|0;
      }
    }
  } else if(weatherCooldown>0){
    // Show "incoming" warning exactly 180 frames (3s) before weather starts
    if(weatherPreview&&weatherCooldown<=180&&weatherCooldown+_dt>180) _showWeatherWarning(weatherPreview);
    weatherCooldown-=_dt;
  } else if(frameCount>600){
    if(weatherPreview){
      _setWeather(weatherPreview); weatherPreview=null;
    } else {
      const wt=_pickWeather();
      if(wt!=='clear'){weatherPreview=wt;weatherCooldown=(280+Math.random()*280)|0;}
      else weatherCooldown=(220+Math.random()*220)|0;
    }
  }
}
function _updateRain(dt){
  const _dt=dt||1;
  // Fill empty pool slots up to maxRain
  let active=0;
  for(let i=0;i<_RAIN_POOL._n;i++)if(_RAIN_POOL[i]._active)active++;
  while(active<PERF.maxRain){
    const d=_RAIN_POOL._get();
    d.x=Math.random()*W*1.3;d.y=-20;d.spd=7+Math.random()*7;d.len=8+Math.random()*14;
    active++;
  }
  for(let i=0;i<_RAIN_POOL._n;i++){
    const d=_RAIN_POOL[i];if(!d._active)continue;
    d.y+=d.spd*_dt;d.x-=d.spd*0.25*_dt;
    if(d.y>H+30||d.x<-60)d._active=false;
  }
}
function _updateDust(dt){
  const _dt=dt||1;
  let active=0;
  for(let i=0;i<_DUST_POOL._n;i++)if(_DUST_POOL[i]._active)active++;
  while(active<PERF.maxDust){
    const fromLeft=Math.random()<0.5;
    const p=_DUST_POOL._get();
    p.x=fromLeft?-15:W+15;p.y=Math.random()*H;
    p.vx=(fromLeft?1:-1)*(3+Math.random()*5);p.vy=(Math.random()-0.5)*1.8;
    p.r=4+Math.random()*9;p.life=1;p.g=Math.floor(Math.random()*25);
    active++;
  }
  for(let i=0;i<_DUST_POOL._n;i++){
    const p=_DUST_POOL[i];if(!p._active)continue;
    p.x+=p.vx*_dt;p.y+=p.vy*_dt;p.life-=0.004*_dt;
    if(p.life<=0||p.x<-20||p.x>W+20)p._active=false;
  }
}

// ── Weather draw functions ─────────────────────────────

/* ══════════════════════════════════════════════
   STAGED DIFFICULTY CONFIG
   Each stage unlocks new mechanics gradually so
   the player can learn before complexity spikes.
══════════════════════════════════════════════ */
function getStageConfig(){
  const s=stageNum;

  // ── Post-Stage Multiplier: stages 21+ get progressively harder ──────────
  // +4% pressure per stage beyond 20, capped at 1.50× — always stays playable.
  // All spawn functions still enforce lane-availability safety checks so
  // there is always at least one free lane for the player to use.
  const _pm = s>20 ? Math.min(1.50, 1.0 + (s-20)*0.04) : 1.0;

  // Base values (at stage 20 cap)
  // Stages 1-3 enemy rate raised so the early game feels active and forces dodging.
  // Stage 1: 0.009→0.012, Stage 2: 0.013→0.016, Stage 3: 0.013→0.018.
  const _eRate = s<=1?0.012 : s===2?0.016 : s===3?0.018 : s<=5?0.016 : s<=7?0.019 : s<=9?0.023 : 0.026;
  // Stage 2 obstacle rate raised so rocks/manholes appear reliably.
  // Stages 13–20 stepped up in small increments so the late game doesn't plateau flat.
  const _oRate = s<=1?0 : s===2?0.008 : s<=3?0.009 : s<=5?0.010 : s<=9?0.011 : s<=12?0.013 : s<=14?0.014 : s<=17?0.015 : 0.016;
  // Stage 1-3 min-gap tightened. Stage 13+ tightened further for late-game pressure.
  const _eGap  = s<=1?240 : s===2?190 : s===3?170 : s<=5?170 : s<=12?130 : s<=15?110 : 90;
  // Stage 1: 2→3, Stage 2-3: 3→4 — early road feels genuinely busy.
  const _eMax  = s<=1?3 : s<=3?4 : s<=7?4 : 6;
  const _oMax  = s<=1?0 : s===2?1 : s<=3?2 : s<=7?2 : 3;

  return {
    // ── Enemy ──────────────────────────────────
    // Spawn probability per frame — scaled by post-stage multiplier, hard cap 0.036
    // Rush Hour (17:00–20:00): additional ×1.25 pressure on enemy rate
    enemyRate:    Math.min(0.036, _eRate * _pm * ((typeof rushHourActive!=='undefined'&&rushHourActive)?1.25:1.0)),
    // Max simultaneous enemies — grows by 1 every 5 post-stages (cap 8)
    // Rush Hour: +1 extra max enemy (still hard-capped at 8)
    maxEnemies:   Math.min(8, (s>20 ? Math.min(8, _eMax + Math.floor((s-20)/5)) : _eMax) + ((typeof rushHourActive!=='undefined'&&rushHourActive)?1:0)),
    // Min px gap shrinks post-stage but never below 80px (keeps game fair)
    enemyMinGap:  Math.max(80, Math.round(_eGap / _pm)),
    // Speed variation: fraction of enemies that get it, and ±range as fraction of base
    // Stage 3: 40% cars ±40%. Stage 6-7: 30% cars ±30%. Stage 8-12: 40% cars ±20%. Stage 13+: 40% cars ±30%.
    enemyVarChance: s===3?0.40 : (s>=6&&s<=7)?0.30 : s>=8?0.40 : 0,
    enemyVarRange:  s===3?0.40 : (s>=6&&s<=7)?0.30 : s>=13?0.30 : s>=8?0.20 : 0,

    // ── Obstacles ──────────────────────────────
    // Spawn probability per frame — scaled, hard cap 0.018
    obstRate:     Math.min(0.018, _oRate * _pm),
    // Max simultaneous obstacles — grows by 1 every 10 post-stages (cap 4)
    maxObst:      s>20 ? Math.min(4, _oMax + Math.floor((s-20)/10)) : _oMax,
    // Which types are unlocked (cumulative — same gates as stages 1-20)
    canStone:     s>=2,
    canManhole:   s>=2,
    canSpeedbump: s>=4,
    canBrokenCar: s>=6,

    // ── Other ──────────────────────────────────
    cattleAllowed: s>=4,
    breathingRoom: s>=10,
  };
}

/* ══════════════════════════════════════════════
   SPAWN
══════════════════════════════════════════════ */
function takenTop(){
  const taken=[];
  for(let i=0;i<_ENEMY_POOL._n;i++){const e=_ENEMY_POOL[i];if(e._active&&e.y<160)taken.push(e.lane);}
  for(let i=0;i<_OBST_POOL._n;i++){
    const o=_OBST_POOL[i];if(!o._active||o.y>=180)continue;
    taken.push(o.lane);
    if(o.type==='brokencar')taken.push(Math.min(o.lane+1,3));
  }
  return [...new Set(taken)];
}
function freeLanes(t){
  let lanes=[0,1,2,3].filter(l=>!t.includes(l));
  // During roadworks, lane 3 is physically blocked — never spawn anything there
  if(weatherType==='roadworks') lanes=lanes.filter(l=>l!==3);
  return lanes;
}

/* Helper: spawn gun powerup in a different lane — called from Phase 5 and its timeout */
function _spawnTutGunPhase(){
  const _gLanes=[0,1,2,3].filter(l=>l!==player.lane);
  tutGunLane=_gLanes[Math.floor(Math.random()*_gLanes.length)];
  const _gp=_PU_POOL._get();
  _gp.lane=tutGunLane;_gp.x=LANE_XS[tutGunLane];_gp.y=-30;_gp.type='gun';
  tutGunPickupRef=_gp;
}

/* Mechanic intro banner — tracks which mechanics have been introduced this run.
   The stage flash banner already shows mechanic hints, so no scroll-up text needed. */
function _showMechanicBanner(key,text,col){
  if(_shownMechanics[key]) return;
  _shownMechanics[key]=true;
  // Scroll-up text removed — stage banner already shows the hint
}
function _nmPush(text,x,y,timer,col,big,popType){
  const p=_NMPOP_POOL._get();
  p.text=text;p.x=x;p.y=y;p.timer=timer;p.maxTimer=timer;p.col=col;p.big=big;p.popType=popType||'';
}

function spawnEnemy(dt){
  if(clearStretchTimer>0) return; // intentional breathing room (stage 10+)
  const cfg=getStageConfig();
  if(Math.random()>=cfg.enemyRate*dt) return;
  if(_ENEMY_POOL._count()>=cfg.maxEnemies) return;
  if(_ENEMY_POOL._count()>0){
    let closestY=H+100;
    for(let i=0;i<_ENEMY_POOL._n;i++){const e=_ENEMY_POOL[i];if(e._active&&e.y<closestY)closestY=e.y;}
    if(closestY+80<cfg.enemyMinGap)return;
  }
  const f=freeLanes(takenTop());
  if(f.length<1) return;

  // ── Lane bias (stages 1–3 only) ──────────────────────────────────────────
  // In the early game, enemies are weighted toward the player's lane and its
  // neighbours so the player can't safely camp a center lane. Weight 3× for
  // the player's own lane, 2× for adjacent lanes, 1× for far lanes.
  // Bias only applies while there are at least 2 free lanes (always fair).
  let lane;
  if(stageNum<=3 && f.length>=2){
    const _pl=player.lane;
    const _weights=f.map(l=>Math.abs(l-_pl)===0?3:Math.abs(l-_pl)===1?2:1);
    const _total=_weights.reduce((a,b)=>a+b,0);
    let _r=Math.random()*_total;
    lane=f[f.length-1]; // fallback
    for(let i=0;i<f.length;i++){_r-=_weights[i];if(_r<=0){lane=f[i];break;}}
  } else {
    lane=f[Math.floor(Math.random()*f.length)];
  }

  // Speed variation — tier changes by stage
  let speedMult=1.0;
  if(cfg.enemyVarChance>0 && Math.random()<cfg.enemyVarChance){
    const r=cfg.enemyVarRange;
    speedMult=clamp((1-r)+Math.random()*(r*2), 0.45, 1.80);
  }
  const e=_ENEMY_POOL._get();
  e.lane=lane;e.y=-80;e.nmChecked=false;e.speedMult=speedMult;e._perfectDodge=false;
  _watchTutorial('enemy', e);
}

function spawnObstacle(dt){
  if(clearStretchTimer>0) return;
  const cfg=getStageConfig();
  if(cfg.obstRate<=0) return;
  if(Math.random()>=cfg.obstRate*dt) return;
  if(_OBST_POOL._count()>=cfg.maxObst) return;

  // Build weighted type pool from currently-unlocked types
  const pool=[];
  if(cfg.canStone)    { pool.push('stone','stone','stone'); } // heavier weight
  if(cfg.canManhole)  { pool.push('manhole','manhole'); }
  if(cfg.canSpeedbump){ pool.push('speedbump'); }
  // Broken car only up to stage 12 — too punishing at very high speed
  if(cfg.canBrokenCar && stageNum<=12){ pool.push('brokencar'); }
  if(!pool.length) return;

  const type=pool[Math.floor(Math.random()*pool.length)];
  const taken=takenTop();
  let f=freeLanes(taken);

  if(type==='brokencar'){
    // Need 2 consecutive free lanes AND must leave ≥1 other lane open for the player.
    // Find valid consecutive pairs that preserve a free lane.
    const pairs=[[0,1],[1,2],[2,3]].filter(([a,b])=>
      f.includes(a)&&f.includes(b) &&
      f.filter(l=>l!==a&&l!==b).length>=1
    );
    if(!pairs.length) return;
    const [la]=pairs[Math.floor(Math.random()*pairs.length)];
    const _ob=_OBST_POOL._get();_ob.lane=la;_ob.y=-60;_ob.type='brokencar';_ob.nmChecked=false;
    _showMechanicBanner('brokencar','WRECK AHEAD!','#f97316');
    _watchTutorial('brokencar', _ob);
  } else {
    if(f.length<2) return;
    const validLanes=f.filter(lane=>f.filter(l=>l!==lane).length>=1);
    if(!validLanes.length) return;
    const lane=validLanes[Math.floor(Math.random()*validLanes.length)];
    const _ob=_OBST_POOL._get();_ob.lane=lane;_ob.y=-40;_ob.type=type;_ob.nmChecked=false;
    if(type==='speedbump') _showMechanicBanner('speedbump','SPEED BUMPS — JUMP OVER!','#fbbf24');
    _watchTutorial(type, _ob);
  }
}
function spawnCattle(){
  cattlePending=false;const dir=Math.random()<0.5?1:-1;const type=Math.random()<0.5?'cow':'bull';
  const sx=dir===1?ROAD_L-42:ROAD_R+42,sy=100;
  const frames=(player.y-sy)/spd;const hSpeed=Math.abs(ROAD_CX-sx)/frames;
  const c=_CATTLE_POOL._get();
  c.x=sx;c.y=sy;c.dir=dir;c.hSpeed=hSpeed;c.type=type;
  c.id=cattleCounter++;c.dead=false;c.mooed=false;c.nmChecked=false;c._dodged=false;
  _watchTutorial('cattle', c);
}

let coinIdCounter=0;
// Tracks how many frames the player has stayed in the same lane — used for
// lane-bias enemy spawning and coin pull in stages 1-3.
let _playerLaneDwellTimer=0;
let _playerLaneDwellLane=-1;
// Lane weights: edges (0,3) = weight 3 each, centres (1,2) = weight 2 each → edges 50% more likely
const _COIN_LANE_WEIGHTS=[3,2,2,3];
const _COIN_LANE_CUM=[3,5,7,10];
function _weightedLane(cum){const r=Math.floor(Math.random()*cum[cum.length-1]);for(let i=0;i<cum.length;i++)if(r<cum[i])return i;return 3;}

/* Returns lanes currently occupied by any active truck.
   Coins and power-ups must never spawn in these lanes: trucks travel at 0.75×
   speed so a coin/PU spawning behind a truck will catch up, visually embed
   inside it, and become completely inaccessible to the player. */
function _activeTruckLanes(){
  const lanes=[];
  for(let i=0;i<_TRUCK_POOL._n;i++){const t=_TRUCK_POOL[i];if(t._active)lanes.push(t.lane);}
  return lanes;
}

function spawnCoin(dt){
  if(_COIN_POOL._count()>=6)return;
  if(Math.random()<0.018*dt){
    // Exclude lanes that have active trucks — coins would catch up to the
    // slower truck and be unreachable by the player.
    const _blocked=_activeTruckLanes();
    let _avail=[0,1,2,3].filter(l=>!_blocked.includes(l));
    if(!_avail.length)return;

    // ── Coin pull (stages 1–3 only) ───────────────────────────────────────
    // Track how long the player has been in the same lane. Once they've
    // been stationary for 120+ frames (~2s), bias coins away from their lane
    // to reward lateral movement without ever blocking collection entirely.
    if(_playerLaneDwellLane!==player.lane){
      _playerLaneDwellLane=player.lane;
      _playerLaneDwellTimer=0;
    } else {
      _playerLaneDwellTimer++;
    }
    if(stageNum<=3 && _playerLaneDwellTimer>=120 && _avail.length>1){
      const _away=_avail.filter(l=>l!==player.lane);
      if(_away.length>0) _avail=_away; // redirect coins to other lanes
    }

    const lane=_avail[Math.floor(Math.random()*_avail.length)];
    const count=Math.random()<0.3?3:1;
    for(let i=0;i<count;i++){
      const c=_COIN_POOL._get();c.lane=lane;c.x=LANE_XS[lane];c.y=-20-i*50;c.id=coinIdCounter++;
    }
  }
}
const PU_TYPES=['shield','magnet','nitro','ghost','gun'];
// Power-up lane weights: same edge-bias as coins (30/20/20/30)
const _PU_LANE_CUM=[3,5,7,10];
function spawnPowerUp(dt){
  if(_PU_POOL._count()>0)return;
  if(Math.random()<0.005*dt){
    // Exclude truck lanes — a power-up sitting inside a truck is uncollectable.
    const _blocked=_activeTruckLanes();
    const _avail=[0,1,2,3].filter(l=>!_blocked.includes(l));
    if(!_avail.length)return;
    const lane=_avail[Math.floor(Math.random()*_avail.length)];
    const _regularTypes=PU_TYPES.filter(t=>t!=='gun');
    const type=_regularTypes[Math.floor(Math.random()*_regularTypes.length)];
    const pu=_PU_POOL._get();pu.lane=lane;pu.x=LANE_XS[lane];pu.y=-30;pu.type=type;
    _watchTutorial(type, pu);
  }
}
function spawnGunPowerUp(dt){
  if(clearStretchTimer>0)return;
  if(gunActive)return;
  if(stageNum<2&&gunLastStageSpawned<0)return; // only gate on stageNum when no prior gun
  if((stageNum-2)%3!==0&&stageNum>=2)return;   // normal stage-gating for stage 2+
  if(gunLastStageSpawned>=stageNum)return;
  if(gunSpawnCooldown>0)return;
  if(_PU_POOL._count()>0)return;
  if(Math.random()>=0.004*dt)return;
  // Exclude truck lanes — gun pickup must always be reachable.
  const _blocked=_activeTruckLanes();
  const _avail=[0,1,2,3].filter(l=>!_blocked.includes(l));
  if(!_avail.length)return;
  const lane=_avail[Math.floor(Math.random()*_avail.length)];
  const pu=_PU_POOL._get();
  pu.lane=lane;pu.x=LANE_XS[lane];pu.y=-30;pu.type='gun';
  gunLastStageSpawned=stageNum;
  gunSpawnCooldown=4800;
  _watchTutorial('gun', pu);
}

/* ── Truck spawn ─────────────────────────────────────────────────────────
   Trucks travel in the same direction as the player (downward on screen at
   75% of base enemy speed) and require 2 cannonball hits to destroy.
   Stage gates: stage 3-5 -> 2/stage, stage 6-9 -> 3/stage, stage 10+ -> 4/stage.
─────────────────────────────────────────────────────────────────────── */
function spawnTruck(dt){
  if(clearStretchTimer>0)return;
  if(tutPhase>=0)return;

  // Reset per-stage counter when stage advances
  if(stageNum!==lastTruckStageNum){
    trucksSpawnedThisStage=0;
    lastTruckStageNum=stageNum;
  }

  // Stage gates: 1-2 → 1/stage, 3-5 → 2/stage, 6-9 → 3/stage, 10-19 → 4/stage
  // Post-stage 20+: +1 every 5 stages beyond 20 (cap 6) for extra pressure
  const maxPerStage=stageNum>20?Math.min(6,4+Math.floor((stageNum-20)/5)):stageNum>=10?4:stageNum>=6?3:stageNum>=3?2:1;
  if(trucksSpawnedThisStage>=maxPerStage)return;

  // Max 2 trucks on screen simultaneously
  if(_TRUCK_POOL._count()>=2)return;

  if(Math.random()>=0.0028*dt)return;

  // ── Build list of lanes free from enemies, obstacles AND existing trucks at the top ──
  const topTaken=takenTop(); // lanes blocked by enemies/obstacles near top
  // Also block lanes where any obstacle exists anywhere on screen (not just near top)
  const obstLanes=[];
  for(let i=0;i<_OBST_POOL._n;i++){const o=_OBST_POOL[i];if(o._active)obstLanes.push(o.lane);}
  // Block lanes occupied by existing trucks
  const truckLanes=[];
  for(let i=0;i<_TRUCK_POOL._n;i++){const t=_TRUCK_POOL[i];if(t._active)truckLanes.push(t.lane);}

  let avail=[0,1,2,3].filter(l=>
    !topTaken.includes(l) &&
    !obstLanes.includes(l) &&
    !truckLanes.includes(l)
  );
  if(weatherType==='roadworks')avail=avail.filter(l=>l!==3);
  if(!avail.length)return;

  const lane=avail[Math.floor(Math.random()*avail.length)];
  const t=_TRUCK_POOL._get();
  t.lane=lane;
  t.y=-130;
  t.hits=0;
  t.nmChecked=false;
  t.ghosted=false;     // ghost pass-through flag — prevents re-trigger each frame
  t.shieldHit=false;   // shield-hit flag — true after first shield absorption; second hit = crash
  t.shieldGrace=0;     // per-truck grace countdown after shield absorption (trucks move slow — need own timer)
  trucksSpawnedThisStage++;
}

/* ══════════════════════════════════════════════
   WEEKLY MISSION CHAIN — 5 harder missions, resets every Monday.
   Chain advances on each completion. All 5 done = WEEK COMPLETE.
══════════════════════════════════════════════ */
const WEEKLY_MISSIONS=[
  {id:'wm_coins80',  text:'Collect 80 coins in one run',  reward:30, check:()=>sessionCoins>=80},
  {id:'wm_misses8',  text:'Get 8 near-misses in one run', reward:35, check:()=>runNearMisses>=8},
  {id:'wm_stage7',   text:'Survive to stage 7',           reward:45, check:()=>stageNum>=7},
  {id:'wm_combo4x',  text:'Hit a 4\u00d7 combo streak',  reward:40, check:()=>runMaxCombo>=10},
  {id:'wm_nitro5',   text:'Use nitro 5 times in one run', reward:60, check:()=>runNitroUsed>=5},
];
let activeMission=null,missionCompleteFlash=0,missionCompleteText='';
let missionProgress=0;

function loadWeeklyMission(){
  const monday=_getMondayStr(); // defined in game.js
  if(weeklyResetDate!==monday){
    weeklyMissionIdx=0;weeklyResetDate=monday;weeklyAllDone=false;
    saveLS('rr_weekly_mission_idx',0);saveLS('rr_weekly_reset_date',monday);saveLS('rr_weekly_all_done',false);
  }
  activeMission=(weeklyAllDone||weeklyMissionIdx>=WEEKLY_MISSIONS.length)?null:WEEKLY_MISSIONS[weeklyMissionIdx];
}

function checkMission(){
  if(!activeMission)return;
  if(activeMission.check()){
    const _r=activeMission.reward;
    coinBank+=_r;saveLS('rr_coins2',coinBank);cvalEl.textContent=coinBank;
    weeklyMissionIdx++;saveLS('rr_weekly_mission_idx',weeklyMissionIdx);
    if(weeklyMissionIdx>=WEEKLY_MISSIONS.length){
      weeklyAllDone=true;saveLS('rr_weekly_all_done',true);
      missionCompleteText='WEEK COMPLETE! +'+_r+' COINS \uD83C\uDF89';activeMission=null;
    } else {
      missionCompleteText='MISSION DONE! +'+_r+' COINS';
      activeMission=WEEKLY_MISSIONS[weeklyMissionIdx];
    }
    missionCompleteFlash=240;snd('missionComplete');haptic([30,20,60,20,30]);
  }
}

/* ── Achievement checker ─────────────────────────────────────────────────── */
function checkAchievements(){
  if(!ACHIEVEMENTS||!unlockedAchievements)return;
  ACHIEVEMENTS.forEach(a=>{
    if(unlockedAchievements.includes(a.id))return;
    let met=false;
    switch(a.id){
      case 'first_nm':   met=runNearMisses>=1;     break;
      case 'combo_4x':   met=runMaxCombo>=10;       break;
      case 'stage_5':    met=stageNum>=5;           break;
      case 'stage_10':   met=stageNum>=10;          break;
      case 'nitro3':     met=runNitroUsed>=3;       break;
      case 'coins50run': met=sessionCoins>=50;      break;
      case 'boss_gone':  met=runBossKilled;         break;
      case 'runs_10':    met=statTotalRuns>=10;     break;
      case 'runs_50':    met=statTotalRuns>=50;     break;
      case 'nm_100':     met=statTotalMisses>=100;  break;
    }
    if(met){
      unlockedAchievements.push(a.id);saveLS('rr_achievements',unlockedAchievements);
      coinBank+=a.reward;saveLS('rr_coins2',coinBank);cvalEl.textContent=coinBank;
      _nmPush('\uD83C\uDFC6 '+a.text+'! +'+a.reward,W/2,H/2-80,150,'#fbbf24',true);
      snd('missionComplete');haptic([30,20,60,20,30]);
    }
  });
}

/* ══════════════════════════════════════════════
   SHARE — Run Summary screenshot + text + link
══════════════════════════════════════════════ */
function _doShareRunSummary(){
  const _finalScore = Math.floor(score);
  const km          = (distanceTravelled/15120*2.4).toFixed(2);
  const cm          = runMaxCombo>=10?4:runMaxCombo>=6?3:runMaxCombo>=3?2:1;

  // Share link — fixed game URL
  const _baseURL = 'https://parag04kolhe.github.io/lane-havoc/';

  const shareText =
    '\uD83C\uDFCE\uFE0F Lane Havoc \u2014 My Run!\n'+
    '\uD83D\uDCCA Score: '+_finalScore+'  |  Stage: '+stageNum+'\n'+
    '\uD83D\uDCCF '+km+' km  |  \uD83D\uDD25 '+runMaxCombo+'\u00D7 streak  |  \uD83E\uDE99 +'+sessionCoins+'\n\n'+
    '\uD83C\uDFAE Play Lane Havoc: '+_baseURL;

  /* ─────────────────────────────────────────────────────────────
     SHARE CAR IMAGE — high-quality PNG embedded at build time
     240×316 source, drawn at 160 logical units on 400-unit canvas
  ───────────────────────────────────────────────────────────── */
  var _OG_IMG_B64='data:image/jpeg;base64,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';
  var _ogImg=new Image();
  _ogImg.src=_OG_IMG_B64;

  /* ── Build the 1080×1080 share card ── */
  function _buildCard(cardCtx){
    /* Canvas is 1080×1080 physical pixels.
       We apply a 2.7× scale so all drawing uses a clean 400×400 logical space. */
    const PHYS=1080, SCALE=2.7;
    const CW=PHYS/SCALE, CH=PHYS/SCALE; // logical ~400×400

    cardCtx.save();
    cardCtx.scale(SCALE, SCALE);
    cardCtx.imageSmoothingEnabled=true;
    cardCtx.imageSmoothingQuality='high';

    // ── Background ──
    cardCtx.fillStyle='#0a0c14';
    cardCtx.fillRect(0,0,CW,CH);

    // ── OG Image (1080×540, 2:1 ratio) drawn at top ──
    const ogH=Math.round(CW*540/1080); // = 200 logical units
    if(_ogImg.complete&&_ogImg.naturalWidth>0){
      cardCtx.save();
      cardCtx.drawImage(_ogImg,0,0,CW,ogH);
      cardCtx.restore();
    }

    // Thin glowing separator below OG image
    cardCtx.save();
    cardCtx.globalAlpha=0.35;
    cardCtx.strokeStyle='#38bdf8';
    cardCtx.lineWidth=1;
    cardCtx.shadowColor='#38bdf8';
    cardCtx.shadowBlur=6;
    cardCtx.beginPath();
    cardCtx.moveTo(0,ogH);
    cardCtx.lineTo(CW,ogH);
    cardCtx.stroke();
    cardCtx.restore();

    // ── Skin colour from equipped skin ──
    const sc=(function(){
      try{const sk=(typeof getSkin==='function')?getSkin():null;return(sk&&sk.color)?sk.color:'#00e676';}
      catch(e){return '#00e676';}
    })();

    // ── Dual-rank ribbon — sits just below OG image ──
    const rY=ogH+8,rW=272,rH=22,rX=CW/2-rW/2;
    const rankStr=(typeof lbMyEstimatedRank!=='undefined'&&lbMyEstimatedRank>0)
      ?('#'+lbMyEstimatedRank):'#?';
    const runRankStr=(typeof lbRunEstimatedRank!=='undefined'&&lbRunEstimatedRank>0)
      ?('#'+lbRunEstimatedRank):'#?';
    const rg=cardCtx.createLinearGradient(rX,rY,rX+rW,rY);
    rg.addColorStop(0,'rgba(245,158,11,0)');
    rg.addColorStop(0.12,'rgba(245,158,11,0.92)');
    rg.addColorStop(0.88,'rgba(245,158,11,0.92)');
    rg.addColorStop(1,'rgba(245,158,11,0)');
    cardCtx.save();
    cardCtx.fillStyle=rg;cardCtx.fillRect(rX,rY,rW,rH);
    cardCtx.font="bold 9px 'Orbitron',monospace";
    cardCtx.fillStyle='#0a0c14';cardCtx.textAlign='center';cardCtx.textBaseline='middle';
    cardCtx.fillText('\uD83C\uDF0D Rank '+runRankStr+'  \u2502  All-Time Best '+rankStr,CW/2,rY+11);
    cardCtx.restore();

    // ── Score — large Orbitron ──
    const scoreStr=_finalScore.toLocaleString();
    const scoreY=rY+rH+36;
    cardCtx.save();
    cardCtx.shadowColor=sc;cardCtx.shadowBlur=24;
    cardCtx.font="900 36px 'Orbitron',monospace";
    cardCtx.fillStyle='#ffffff';cardCtx.textAlign='center';cardCtx.textBaseline='middle';
    cardCtx.fillText(scoreStr,CW/2,scoreY);
    cardCtx.restore();

    // ── Stat rows ──
    const sY=scoreY+18, rHH=25;
    const sc2=runMaxCombo>=10?'#ef4444':runMaxCombo>=5?'#f97316':'#fb923c';
    _statRow(cardCtx,CW,sY,        '\uD83D\uDD25',runMaxCombo+'\u00D7  NEAR-MISS STREAK',sc2);
    _statRow(cardCtx,CW,sY+rHH,    '\uD83C\uDFC6','BEST COMBO: '+cm+'\u00D7','#facc15');
    _statRow(cardCtx,CW,sY+rHH*2,  '\uD83D\uDCCF',km+' KM SURVIVED','#4ade80');

    // ── Divider ──
    const divY=sY+rHH*3+5;
    cardCtx.save();
    cardCtx.globalAlpha=0.14;cardCtx.strokeStyle='#fff';cardCtx.lineWidth=1;
    cardCtx.setLineDash([4,6]);
    cardCtx.beginPath();cardCtx.moveTo(44,divY);cardCtx.lineTo(CW-44,divY);cardCtx.stroke();
    cardCtx.setLineDash([]);
    cardCtx.restore();

    // ── Footer ──
    cardCtx.font="700 9px 'Orbitron',sans-serif";
    cardCtx.fillStyle='#ffffff';
    cardCtx.textAlign='center';cardCtx.textBaseline='middle';
    cardCtx.fillText('CAN YOU BEAT THIS?',CW/2,divY+14);

    cardCtx.restore(); // end scale
  }

  // Rounded rect helper for off-screen context
  function _rrC(c,x,y,w,h,r){
    c.beginPath();
    c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.arcTo(x+w,y,x+w,y+r,r);
    c.lineTo(x+w,y+h-r);c.arcTo(x+w,y+h,x+w-r,y+h,r);
    c.lineTo(x+r,y+h);c.arcTo(x,y+h,x,y+h-r,r);
    c.lineTo(x,y+r);c.arcTo(x,y,x+r,y,r);c.closePath();
  }

  function _statRow(c,CW,y,emoji,text,color){
    const rW=290,rH=22,rx=CW/2-rW/2;
    c.save();c.globalAlpha=0.16;c.fillStyle=color;
    _rrC(c,rx,y,rW,rH,5);c.fill();c.restore();
    c.fillStyle=color;c.fillRect(rx,y,3,rH);
    c.font="700 10px 'Orbitron',monospace";c.fillStyle=color;
    c.textAlign='left';c.textBaseline='middle';
    c.fillText(emoji+'  '+text,rx+12,y+11);
  }

  /* ── Share helper ── */
  function _tryShare(file){
    const shareData={title:'Lane Havoc \u2014 My Run',text:shareText};
    if(file&&navigator.canShare&&navigator.canShare({files:[file]})){shareData.files=[file];}
    if(navigator.share){navigator.share(shareData).catch(function(){});}
    else if(navigator.clipboard){navigator.clipboard.writeText(shareText).catch(function(){});}
  }

  /* ── Render card then export ── */
  function _renderAndShare(){
    try{
      var _oc,_octx;
      if(typeof OffscreenCanvas!=='undefined'){
        _oc=new OffscreenCanvas(1080,1080);
        _octx=_oc.getContext('2d');
        _buildCard(_octx);
        _oc.convertToBlob({type:'image/png'}).then(function(blob){
          _tryShare(new File([blob],'lane-havoc-run.png',{type:'image/png'}));
        }).catch(function(){_tryShare(null);});
      } else {
        var _hc=document.createElement('canvas');
        _hc.width=1080;_hc.height=1080;
        _octx=_hc.getContext('2d');
        _buildCard(_octx);
        _hc.toBlob(function(blob){
          if(blob)_tryShare(new File([blob],'lane-havoc-run.png',{type:'image/png'}));
          else _tryShare(null);
        },'image/png');
      }
    }catch(e){_tryShare(null);}
  }

  // If car image already loaded, render immediately; otherwise wait for it
  if(_ogImg.complete&&_ogImg.naturalWidth>0){
    _renderAndShare();
  } else {
    _ogImg.onload=_renderAndShare;
    _ogImg.onerror=function(){_renderAndShare();};
    // Safety timeout — if image fails to decode in 2s, share without it
    setTimeout(function(){
      if(!_ogImg.complete){_renderAndShare();}
    },2000);
  }
}
loadWeeklyMission();


/* ══════════════════════════════════════════════
   SPAWN — NEW OBSTACLE TYPES
══════════════════════════════════════════════ */
function triggerNearMiss(ex,ey){
  if(gst!==ST.PLAYING)return;
  nearMissStreak++;comboDecay=0;
  runNearMisses++;
  if(nearMissStreak>runMaxCombo)runMaxCombo=nearMissStreak;
  const prevMult=comboMult;
  comboMult=nearMissStreak>=10?4:nearMissStreak>=6?3:nearMissStreak>=3?2:1;
  const _blazeNmMult=equippedSkin==='red'?1.2:1;
  const bonusPts=Math.floor(10*comboMult*nitroMult*_blazeNmMult);
  score+=bonusPts;
  const px=player.visualX,py=player.y-player.jumpOff;
  const midX=(px+ex)/2;
  const _neonT=equippedTrail==='neon'?1.25:1.0; // Neon trail: popups stay longer
  _nmPush('CLOSE!',midX,py-20,Math.round(50*_neonT),'#f97316',false);
  _nmPush('+'+bonusPts,midX,py-36,Math.round(50*_neonT),'#fbbf24',false);
  if(comboMult>prevMult){
    _nmPush(comboMult+'× COMBO!',W/2,py-62,72,'#ef4444',true);
    comboFlashTimer=45;
    svalEl.classList.remove('score-pop');void svalEl.offsetWidth;svalEl.classList.add('score-pop');
    if(comboMult>=4)snd('combo4');
    else if(comboMult>=3)snd('combo3');
    else snd('comboUp');
  } else snd('nearmiss');
  _updateComboBadge();
  checkMission();
  checkAchievements();
}

// Called directly from doLeft()/doRight() at the exact moment of lane switch.
// All scoring, sound, and visuals fire immediately — no waiting for the enemy to pass.
// e._perfectDodge=true is set here so the update() loop can skip the regular near-miss
// for this enemy (prevents double-trigger).
function _firePerfectDodge(e){
  if(gst!==ST.PLAYING)return;
  if(frameCount-lastNearMissFrame<10)return; // per-enemy guard via nmChecked, this is extra safety
  e._perfectDodge=true;
  nearMissStreak++;comboDecay=0;
  runNearMisses++;
  if(nearMissStreak>runMaxCombo)runMaxCombo=nearMissStreak;
  const prevMult=comboMult;
  comboMult=nearMissStreak>=10?4:nearMissStreak>=6?3:nearMissStreak>=3?2:1;
  const _blazePdMult=equippedSkin==='red'?1.2:1;
  const bonusPts=Math.floor(25*comboMult*nitroMult*_blazePdMult);
  score+=bonusPts;
  // player.visualX is still at the OLD lane position right now — that IS where the car is visually.
  // Popup appears directly above the player car, not split between lanes.
  const px=player.visualX,py=player.y-player.jumpOff;
  const _neonPdT=equippedTrail==='neon'?1.25:1.0; // Neon trail: popups stay longer
  _nmPush('RAZOR THIN!',px,py-30,Math.round(70*_neonPdT),'#ffffff',true);
  _nmPush('+'+bonusPts,px,py-56,Math.round(65*_neonPdT),'#fbbf24',false);
  // Slow-mo 120ms, camera shake — no screen flash
  perfectNmSlowMoTimer=120;
  shakeAmt=Math.max(shakeAmt,8);
  haptic([20,10,30]);
  snd('nearmiss');
  if(comboMult>prevMult){
    _nmPush(comboMult+'\xd7 COMBO!',W/2,py-82,72,'#ef4444',true);
    comboFlashTimer=45;
    svalEl.classList.remove('score-pop');void svalEl.offsetWidth;svalEl.classList.add('score-pop');
    if(comboMult>=4)snd('combo4');
    else if(comboMult>=3)snd('combo3');
    else snd('comboUp');
  } else {
    snd('comboUp');
  }
  lastNearMissFrame=frameCount;
  _updateComboBadge();
  checkMission();
}

/* ══════════════════════════════════════════════
   TUTORIAL CRASH & REWIND HELPERS
   _flagTutCrash() — sets popup text; called just before normal crash flow.
   _beginTutRewind() — starts the reverse-scroll; called after crash anim ends.
══════════════════════════════════════════════ */
function _flagTutCrash(type){
  tutCrashPending=true;
  // Set contextual popup message shown during crash animation
  if(tutPhase===1){
    tutCrashPopText='Switch lanes! →';
  } else if(tutPhase===2&&type==='car'&&player.jumping){
    tutCrashPopText="Can't jump over car!";
  } else if(tutPhase===2&&type==='car'){
    tutCrashPopText='Wrong lane!  ←  Move left';
  } else if(tutPhase===2){
    tutCrashPopText='Watch out!';
  } else {
    tutCrashPopText='Try again!';
  }
  tutCrashPopTimer=90; // matches ST.CRASHING window (90 frames = 1.5s)
}
function _beginTutRewind(){
  tutRewindActive=true;
  tutRewindTimer=60; // 1s of reverse at 2× speed → 2s of reaction time
  player.invTimer=180;
  snd('tutRewind');haptic([20,10,30]);
}

/* ══════════════════════════════════════════════
   CRASH
══════════════════════════════════════════════ */
function triggerCrash(type,cx,cy,cattleIdx){
  if(gst!==ST.PLAYING)return;
  // ── NITRO INVINCIBILITY: car smashes through everything during boost ──
  if(nitroTimer>0){
    // Track smashes within this nitro window
    let smashPts=0;let doSmash=false;
    if(type==='cattle'&&cattleIdx>=0&&cattle[cattleIdx]&&!cattle[cattleIdx].dead){
      cattle[cattleIdx].dead=true;
      spawnBloodParticles(cx,cy);snd('bloodcrash');haptic([30,10,20]);
      smashPts=35;doSmash=true;
    } else if(type!=='cattle'){
      spawnShieldBurst(cx,cy);haptic([20,10]);
      smashPts=20;doSmash=true;
    }
    if(doSmash){
      nitroSmashCount++;
      score+=smashPts;
      if(nitroSmashCount>=3){
        _nmPush('🏆 LEGENDARY!',W/2,cy-60,90,'#fbbf24',true,'legendary');
        score+=60; // flat bonus on top of base smash pts
        snd('combo4');haptic([30,10,50,10,30]);
      } else if(nitroSmashCount===2){
        _nmPush('⚡ DOUBLE DOWN!',W/2,cy-50,75,'#fb923c',true,'streak');
        score+=35;
        snd('combo3');haptic([20,10,30]);
      } else {
        _nmPush('NITRO SMASH! 💥',W/2,cy-40,70,'#f59e0b',true);
        snd('comboUp');
      }
    }
    return; // no crash during nitro
  }
  // ── GHOST MODE: phases through ALL hazards — cars, obstacles, cattle ──
  // Checked BEFORE shield so ghost doesn't waste the shield on a car.
  if(ghostTimer>0){
    if(type==='car'){
      // Ghost pass-through: double near-miss points (20 × comboMult × nitroMult)
      // Blaze skin passive adds an extra +20% on top
      nearMissStreak++;comboDecay=0;
      runNearMisses++;
      if(nearMissStreak>runMaxCombo)runMaxCombo=nearMissStreak;
      const prevMult=comboMult;
      comboMult=nearMissStreak>=10?4:nearMissStreak>=6?3:nearMissStreak>=3?2:1;
      const _blazeM=equippedSkin==='red'?1.2:1;
      const ghostPts=Math.floor(20*comboMult*nitroMult*_blazeM);
      score+=ghostPts;
      const _gpx=player.visualX,_gpy=player.y-player.jumpOff;
      spawnShieldBurst(cx,cy);
      const _neonGT=equippedTrail==='neon'?1.25:1.0; // Neon trail: popups stay longer
      _nmPush('👻 PHASED!',_gpx,_gpy-20,Math.round(65*_neonGT),'#e2e8f0',true);
      _nmPush('+'+ghostPts,_gpx,_gpy-46,Math.round(55*_neonGT),'#fbbf24',false);
      if(comboMult>prevMult){
        _nmPush(comboMult+'× COMBO!',W/2,_gpy-72,72,'#ef4444',true);
        comboFlashTimer=45;
        svalEl.classList.remove('score-pop');void svalEl.offsetWidth;svalEl.classList.add('score-pop');
        if(comboMult>=4)snd('combo4');
        else if(comboMult>=3)snd('combo3');
        else snd('comboUp');
      } else snd('nearmiss');
      _updateComboBadge();
      checkMission();
    }
    return;
  }
  if(activeShield){
    activeShield=false;shakeAmt=6;spawnShieldBurst(cx,cy);snd('saved');
    nearMissStreak=0;comboMult=1;comboDecay=0;
    savedFlash=55; // show SAVED! moment
    score+=30; // bonus score for shield save
    _nmPush('SAVED! +30',player.visualX,player.y-player.jumpOff-30,80,'#3b82f6',true);
    // Mark cattle dead so it can't re-hit on the very next frame (shield is now gone)
    if(type==='cattle'&&cattleIdx>=0&&cattle[cattleIdx])cattle[cattleIdx].dead=true;
    // Grace period — skips all collision detection for 45 frames so a
    // still-overlapping obstacle can't immediately re-crash the now-shieldless player
    postShieldGrace=45;
    return;
  }
  // ── TUTORIAL PHASES 1-3: flag crash ONLY after all protections are exhausted ──
  // Placed here (after nitro/ghost/shield checks) so a shield/ghost/nitro save
  // during tutorial does NOT erroneously set tutCrashPending=true, which would
  // otherwise corrupt the rewind state and leave the player vulnerable on the next hit.
  if(tutPhase>=1&&tutPhase<=3&&!tutRewindActive&&!tutCrashPending&&nitroTimer<=0){
    _flagTutCrash(type);
    // Fall through — normal crash logic below plays the animation;
    // _beginTutRewind() fires from the ST.CRASHING handler after 90 frames.
  }
  // ── CERTAIN CRASH — all protection exhausted ──
  // Trigger cinematic slow-mo exactly when crash is guaranteed.
  // almostDeadTimer drives slow-mo and overlay; audio is handled by startAlmostDead().
  almostDeadTimer=750;
  // Lives-remaining banner: show for 1.5× the crash window (1125ms) if player survives
  if(player.lives>1){livesTextTimer=1125;livesTextCount=player.lives-1;}
  startAlmostDead();
  gst=ST.CRASHING;crashType=type;crashCattleIdx=cattleIdx;crashTimer=0;shakeAmt=24;
  crashX=cx;crashY=cy;
  haptic([60,30,90]);
  nearMissStreak=0;comboMult=1;comboDecay=0;nitroMult=1;
  spawnCrashParticles(cx,cy,type==='cattle');
  _updateComboBadge();
  if(type==='cattle'){
    spawnBloodParticles(cx,cy);
    if(cattleIdx>=0&&cattle[cattleIdx])cattle[cattleIdx].dead=true;
    setTimeout(()=>snd('bloodcrash'),720); // play just as slow-mo ends
  } else {
    setTimeout(()=>snd('crash'),720);
  }
  stopEngine();
}

/* ══════════════════════════════════════════════
   COLLECTION
══════════════════════════════════════════════ */
function collectCoin(coin){
  // Rush Hour (17:00–20:00): double coin reward per coin collected
  const _coinAmt=(typeof rushHourActive!=='undefined'&&rushHourActive)?2:1;
  coinBank+=_coinAmt;sessionCoins+=_coinAmt;saveLS('rr_coins2',coinBank);cvalEl.textContent=coinBank;
  spawnCoinCollect(coin.x,coin.y);snd('coin');haptic(10);

  // Per-coin HUD pop on the coin counter + icon — fires every collect
  cvalEl.classList.remove('coin-pop');void cvalEl.offsetWidth;cvalEl.classList.add('coin-pop');
  const _ci=document.getElementById('cicon');
  if(_ci){_ci.classList.remove('coin-pop');void _ci.offsetWidth;_ci.classList.add('coin-pop');}

  // ── Coin streak ──
  coinStreak++;coinStreakDecay=0;

  // Score per coin based on streak tier
  // Gold Rush passive: +1 to every coin score
  const _goldBonus=equippedSkin==='gold'?1:0;
  let pts=2+_goldBonus;
  if(coinStreak>=15) pts=15+_goldBonus;
  else if(coinStreak>=10) pts=10+_goldBonus;
  else if(coinStreak>=5) pts=5+_goldBonus;
  score+=pts;

  // Small +pts popup on every coin — above coin burst particles
  const px=player.visualX, py=player.y-player.jumpOff-52;
  _nmPush('+'+pts,px,py-10,40,'#fbbf24',false);

  // Milestone popups anchored above player car roof
  if(coinStreak===15){
    _nmPush('💀 GODLIKE!',px,py,70,'#ff4500',true,'streak');
    svalEl.classList.remove('score-pop');void svalEl.offsetWidth;svalEl.classList.add('score-pop');
    // Coinbox orange glow + number colour shift at GODLIKE
    const _cb=document.getElementById('coinbox');
    if(_cb){_cb.classList.remove('coin-glow');void _cb.offsetWidth;_cb.classList.add('coin-glow');}
    cvalEl.classList.remove('coin-godlike');void cvalEl.offsetWidth;cvalEl.classList.add('coin-godlike');
    snd('combo4');
  } else if(coinStreak===10){
    _nmPush('🔥 BLAZING!',px,py,65,'#f97316',true,'streak');
    svalEl.classList.remove('score-pop');void svalEl.offsetWidth;svalEl.classList.add('score-pop');
    snd('combo3');
  } else if(coinStreak===5){
    _nmPush('⚡ SPARKING!',px,py,60,'#fbbf24',true,'streak');
    svalEl.classList.remove('score-pop');void svalEl.offsetWidth;svalEl.classList.add('score-pop');
    snd('comboUp');
  }

  checkMission();
}
const PU_BANNER_CFG={
  shield: {title:'Shield',sub:'Absorbs 1 crash — +30 pts'},
  magnet: {title:'Score Magnet',sub:'Pulls coins to you'},
  nitro:  {title:'Nitro Boost',sub:'2× speed — hang on!'},
  ghost:  {title:'Ghost Mode',sub:'Phase through ALL hazards! 3s'},
  gun:    {title:'Machine Gun',sub:'8 shots — aim at enemies!'}
};
function _updateGunBtn(){
  const _fb=document.getElementById('tbtn-fire');
  if(!_fb)return;
  if(gunActive&&gunAmmo>0){
    _fb.classList.add('gun-active');
  } else {
    _fb.classList.remove('gun-active');
  }
  _redrawAmmoCanvas(gunActive&&gunAmmo>0, gunAmmo);
}

/* ── Cannonball magazine canvas drawing ──────────────────────────────── */
function _redrawAmmoCanvas(active, ammo){
  const ac=document.getElementById('ammo-canvas');
  if(!ac)return;
  const c=ac.getContext('2d');
  // Canvas is 46×108 matching updated button size
  const CW=46, CH=108;
  c.clearRect(0,0,CW,CH);

  // ── Count label at top (above row 1 at y=22, so place at y=12) ──
  if(active && ammo>0){
    c.save();
    c.textAlign='center';c.textBaseline='alphabetic';
    c.font="900 11px 'Orbitron',monospace";
    c.shadowColor='rgba(255,100,0,0.95)';c.shadowBlur=8;
    c.fillStyle='#ff7020';
    c.fillText(ammo.toString(),CW/2,12);
    c.shadowBlur=0;c.restore();
  } else if(!active){
    // No cannon — rotated label
    c.save();
    c.translate(CW/2,CH/2);c.rotate(-Math.PI/2);
    c.textAlign='center';c.textBaseline='middle';
    c.font="bold 10px 'Orbitron',monospace";
    c.shadowColor='rgba(160,70,10,0.65)';c.shadowBlur=5;
    c.fillStyle='rgba(150,70,15,0.80)';
    c.fillText('CANNON',0,0);
    c.shadowBlur=0;c.restore();
  } else {
    // Active but empty
    c.save();
    c.translate(CW/2,CH/2);c.rotate(-Math.PI/2);
    c.textAlign='center';c.textBaseline='middle';
    c.font="bold 10px 'Orbitron',monospace";
    c.shadowColor='rgba(239,68,68,0.70)';c.shadowBlur=5;
    c.fillStyle='rgba(220,60,60,0.90)';
    c.fillText('EMPTY',0,0);
    c.shadowBlur=0;c.restore();
  }

  // ── 4 rows × 2 cols cannonballs ──
  // Layout fills bottom-right first: ballIdx 0=top-left, 7=bottom-right
  // loaded when: ballIdx >= 8-ammo  (same formula as before)
  // Canvas 46×108: 2 cols centred at x=12 and x=34, 4 rows at y=22,42,62,82
  const R=8.5;           // larger radius — more room with only 2 cols
  const COL_L=12;        // left column x
  const COL_R=34;        // right column x
  const ROW_YS=[22,44,66,88]; // 4 row y positions

  for(let row=0;row<4;row++){
    for(let col=0;col<2;col++){
      const ballIdx = row*2 + col;
      const loaded = active && (ballIdx >= 8-ammo);
      const cx = col===0 ? COL_L : COL_R;
      const cy = ROW_YS[row];
      _drawCannonballOnCanvas(c, cx, cy, R, loaded);
    }
  }

  // No bottom label — 4-row layout fills to y=88+R which is near bottom edge
}

function _drawCannonballOnCanvas(c, cx, cy, r, loaded){
  c.save();

  if(!loaded){
    // Empty slot — faint dark ring only
    c.globalAlpha=0.22;
    c.strokeStyle='#3a2212';
    c.lineWidth=1;
    c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.stroke();
    c.restore();
    return;
  }

  // Outer glow
  c.shadowColor='rgba(255,80,0,0.80)';
  c.shadowBlur=7;

  // Iron sphere body — top-left lit gradient
  const bg=c.createRadialGradient(cx-r*0.38,cy-r*0.38,0.5,cx,cy,r*1.05);
  bg.addColorStop(0,  '#7a6858');   // warm lit face
  bg.addColorStop(0.35,'#4a3828');  // mid
  bg.addColorStop(0.72,'#1e1208');  // dark side
  bg.addColorStop(1,  '#0c0805');   // rim
  c.fillStyle=bg;
  c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.fill();
  c.shadowBlur=0;

  // Hot orange equator ring — the "loaded and hot" indicator
  c.strokeStyle='#ff5500';
  c.lineWidth=1.4;
  c.shadowColor='rgba(255,70,0,0.90)';
  c.shadowBlur=6;
  c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.stroke();
  c.shadowBlur=0;

  // Primary specular — sharp white catch-light top-left
  c.globalAlpha=0.82;
  c.fillStyle='#ffffff';
  c.beginPath();
  c.ellipse(cx-r*0.38,cy-r*0.40,r*0.30,r*0.20,Math.PI*0.30,0,Math.PI*2);
  c.fill();

  // Soft secondary sheen — warm off-white
  c.globalAlpha=0.32;
  c.fillStyle='#ffe0b0';
  c.beginPath();
  c.ellipse(cx-r*0.15,cy-r*0.20,r*0.48,r*0.30,Math.PI*0.25,0,Math.PI*2);
  c.fill();

  // Rim bounce-light — faint amber bottom-right (reflected fire)
  c.globalAlpha=0.22;
  c.fillStyle='#ff8844';
  c.beginPath();
  c.ellipse(cx+r*0.42,cy+r*0.42,r*0.22,r*0.14,Math.PI*0.78,0,Math.PI*2);
  c.fill();

  c.restore();
}

/* ── Hearts HUD canvas drawing ───────────────────────────────────────── */
function _redrawHeartsCanvas(lives){
  const hc=document.getElementById('lbox-canvas');
  if(!hc)return;
  const c=hc.getContext('2d');
  c.clearRect(0,0,50,16);
  const r=6,spacing=17,cy=8;
  for(let i=0;i<3;i++){
    const cx=7+i*spacing;
    _drawSmallHeart(c,cx,cy,r,i<lives);
  }
}

function _drawSmallHeart(c,cx,cy,r,filled){
  c.save();
  c.beginPath();
  c.moveTo(cx,cy+r*0.90);
  c.bezierCurveTo(cx-r*0.05,cy+r*0.60,cx-r,cy+r*0.10,cx-r,cy-r*0.15);
  c.bezierCurveTo(cx-r,cy-r*0.70,cx-r*0.50,cy-r*0.95,cx,cy-r*0.42);
  c.bezierCurveTo(cx+r*0.50,cy-r*0.95,cx+r,cy-r*0.70,cx+r,cy-r*0.15);
  c.bezierCurveTo(cx+r,cy+r*0.10,cx+r*0.05,cy+r*0.60,cx,cy+r*0.90);
  c.closePath();
  if(filled){
    // Outer glow pass
    c.save();
    c.shadowColor='#ec4899';c.shadowBlur=5;
    c.fillStyle='#cc0000';c.fill();
    c.restore();
    // Gradient fill
    const gr=c.createRadialGradient(cx-r*0.20,cy-r*0.15,0,cx,cy,r*1.05);
    gr.addColorStop(0,'#ff5577');gr.addColorStop(0.40,'#dd0033');gr.addColorStop(1,'#7a0020');
    c.fillStyle=gr;c.fill();
    // Gloss highlight
    c.save();c.globalAlpha=0.62;
    c.fillStyle='rgba(255,255,255,0.82)';
    c.beginPath();
    c.ellipse(cx-r*0.24,cy-r*0.22,r*0.28,r*0.17,-0.38,0,Math.PI*2);
    c.fill();c.restore();
  } else {
    c.strokeStyle='rgba(120,60,60,0.45)';c.lineWidth=0.8;c.stroke();
  }
  c.restore();
}
/* ── Nitro helpers ───────────────────────────────────────────────────────────
   _fireNitro()        — activates stored nitro, stage-scaled duration
   _updateNitroBtn()   — syncs CSS classes on the left nitro button
   _redrawNitroCanvas()— draws the bolt icon on the nitro button canvas
   doNitroFire()       — called by nitro button tap; fires reserve if held
──────────────────────────────────────────────────────────────────────────── */
function _fireNitro(){
  const _dur = Math.round(4 * STAGE_BASE_SPD[1] / STAGE_BASE_SPD[Math.min(stageNum,20)] * 60);
  const _final = equippedTrail==='fire' ? _dur+30 : _dur;
  nitroTimer  = _final;
  nitroTimerMax = _final;
  nitroMult   = 2;
  exhaustTimer = _final;
  nitroReserve = false;
  nitroExpiryTimer = 0;
  runNitroUsed++;
  snd('nitroOn');
  if(weatherType==='rain'&&!runNitroRainDone){runNitroInRain=true;runNitroRainDone=true;checkMission();}
  checkAchievements();
  _updateNitroBtn();
}
function _updateNitroBtn(){
  const nb=document.getElementById('tbtn-nitro');
  if(!nb)return;
  if(nitroReserve){
    nb.classList.add('nitro-ready');
  } else {
    nb.classList.remove('nitro-ready');
  }
}
function _redrawNitroCanvas(active){
  const nc=document.getElementById('nitro-canvas');
  if(!nc)return;
  const c=nc.getContext('2d');
  const CW=46,CH=108;
  c.clearRect(0,0,CW,CH);
  const cx=CW/2, cy=CH/2;

  if(!active){
    // Inactive: dim "NITRO" label rotated vertically
    c.save();
    c.translate(cx,cy);c.rotate(-Math.PI/2);
    c.textAlign='center';c.textBaseline='middle';
    c.font="bold 10px 'Orbitron',monospace";
    c.shadowColor='rgba(160,100,10,0.65)';c.shadowBlur=5;
    c.fillStyle='rgba(150,100,15,0.80)';
    c.fillText('NITRO',0,0);
    c.shadowBlur=0;c.restore();
    return;
  }

  // Active: draw the lightning bolt — same shape as road pickup
  const sz=18; // bolt size
  const sw=1.20;
  function _pts(){
    return [[cx+sz*0.25*sw,cy-sz*0.52],[cx+sz*0.02*sw,cy-sz*0.02],[cx+sz*0.20*sw,cy-sz*0.02],
            [cx-sz*0.25*sw,cy+sz*0.52],[cx-sz*0.02*sw,cy+sz*0.02],[cx-sz*0.18*sw,cy+sz*0.02]];
  }
  function _bolt(){
    const p=_pts();
    c.beginPath();c.moveTo(p[0][0],p[0][1]);
    p.slice(1).forEach(q=>c.lineTo(q[0],q[1]));c.closePath();
  }
  // Glow layers
  [3,2,1].forEach(pass=>{
    const blurs=[sz*3.5,sz*2.2,sz*1.2],alphas=[0.28,0.45,0.65];
    c.save();c.globalAlpha=alphas[3-pass];
    c.shadowColor='#fbbf24';c.shadowBlur=blurs[3-pass];
    _bolt();c.fillStyle='rgba(253,224,71,0.35)';c.fill();c.restore();
  });
  // Main bolt
  c.shadowColor='#f59e0b';c.shadowBlur=sz*2.0;
  _bolt();
  const bG=c.createLinearGradient(cx,cy-sz*0.52,cx,cy+sz*0.52);
  bG.addColorStop(0,'#fef08a');bG.addColorStop(0.3,'#fbbf24');
  bG.addColorStop(0.7,'#f59e0b');bG.addColorStop(1,'#d97706');
  c.fillStyle=bG;c.fill();
  // White core highlight
  c.save();c.globalAlpha=0.60;c.fillStyle='#ffffff';
  c.beginPath();c.moveTo(cx+sz*0.20*sw,cy-sz*0.52);c.lineTo(cx+sz*0.04*sw,cy-sz*0.06);c.lineTo(cx+sz*0.16*sw,cy-sz*0.06);c.closePath();c.fill();c.restore();
  // Outline
  _bolt();
  c.shadowColor='#fde68a';c.shadowBlur=sz*0.6;
  c.strokeStyle='#fde68a';c.lineWidth=sz*0.07;c.stroke();
  c.shadowBlur=0;

  // "READY" label below bolt
  c.save();
  c.textAlign='center';c.textBaseline='alphabetic';
  c.font="900 8px 'Orbitron',monospace";
  c.shadowColor='rgba(245,158,11,0.95)';c.shadowBlur=6;
  c.fillStyle='#fbbf24';
  c.fillText('READY',cx,CH-8);
  c.shadowBlur=0;c.restore();
}
function doNitroFire(){
  if(gst!==ST.PLAYING&&gst!==ST.RESPAWNING)return;
  if(!nitroReserve)return;
  _fireNitro();
  _redrawNitroCanvas(false);
  haptic([20,10,40]);
  if(tutPhase===4&&tutNitroWarmupActive&&!tutNitroMoveLocked){
    tutNitroMoveLocked=true;
    tutNitroWarmupActive=false; // unlock lane switching — smash phase handles its own lock
    tutNitroArrowActive=false;
    tutNitroArrowFading=true;
  }
}

function activatePowerUp(pu){
  if(pu.type==='gun'){snd('gunEquip');}else{snd('powerup');}
  haptic([20,15,30]);
  const cfg=PU_BANNER_CFG[pu.type];
  // Suppress gun banner during tutorial phase 3 — tutorial overlay already handles guidance
  if(cfg && !(tutPhase===3 && pu.type==='gun')) puBanner={
    type:pu.type,title:cfg.title,sub:cfg.sub,
    timer:0,maxTimer:80,col:PU_COLS[pu.type],
    spawnX:player.visualX,
    spawnY:player.y-player.jumpOff
  };
  switch(pu.type){
    case 'shield':activeShield=true;break;
    case 'magnet':magnetTimer=360;break;
    case 'nitro':
      if(nitroTimer>0){
        // Nitro already running → extend by 1.5s
        nitroTimer=Math.min(nitroTimer+90,nitroTimerMax+90);
        snd('nitroOn');
        _nmPush('+1.5s',player.visualX,player.y-player.jumpOff-50,65,'#fbbf24',false);
      } else if(nitroReserve){
        // Reserve already full → fire the stored one immediately, then store the new one
        _fireNitro();
        // Now store the newly collected nitro as the next reserve
        nitroReserve=true;
        nitroExpiryTimer=720;
        _updateNitroBtn();
        _redrawNitroCanvas(true);
        _nmPush('NITRO QUEUED!',player.visualX,player.y-player.jumpOff-50,65,'#f59e0b',false);
      } else {
        // Empty reserve → store it
        nitroReserve=true;
        nitroExpiryTimer=720;
        snd('nitroOn');
        _updateNitroBtn();
        _redrawNitroCanvas(true);
        if(tutPhase===4){
          tutNitroCollected=true;
          tutNitroArrowActive=true;
        }
        if(weatherType==='rain'&&!runNitroRainDone){runNitroInRain=true;runNitroRainDone=true;checkMission();}
      }
      break;
    case 'ghost':ghostTimer=equippedSkin==='purple'?240:180;break; // Phantom: +1s ghost
    case 'gun':
      gunActive=true;gunAmmo=8;
      gunPickupHintTimer=300; // show fire-button hint for 5s
      if(tutPhase!==3){  // suppress during tutorial — phase overlay handles guidance
        _nmPush('GUN READY',player.visualX,player.y-player.jumpOff-50,80,'#ef4444',false);
      }
      _updateGunBtn();
      break;
  }
}

/* ══════════════════════════════════════════════
   UPDATE
══════════════════════════════════════════════ */
function update(dt){
  // ── Frozen when paused or exit-confirm is active ──
  if(gamePaused || exitConfirmActive){ frameCount+=dt; return; }
  frameCount+=dt;

  // ── ENGINE START screen: just animate (frameCount already incremented), do nothing else ──
  if(gst===ST.ENGINE){ return; }

  // ── SPLASH screen: 72 frames = 1.2s, then transition to INTRO ──
  if(gst===ST.SPLASH){
    splashTimer+=dt;
    menuScrollY=(menuScrollY+0.8*dt)%TILE_H;

    // Try to unlock AudioContext early (works on Chrome/Firefox without gesture)
    if(splashTimer===1){
      try{
        if(!AC){AC=new(window.AudioContext||window.webkitAudioContext)();}
        if(!masterGain){masterGain=AC.createGain();masterGain.gain.value=bgMuted?0:1;masterGain.connect(AC.destination);}
        try{AC.resume();}catch(e){}
      }catch(e){}
    }

    // ── Whoosh + idle rumble when car appears (t=20) ──
    if(splashTimer>=20&&splashTimer-dt<20&&AC&&AC.state!=='suspended'){
      _playSplashWhoosh();
    } else if(splashTimer>=20&&splashTimer-dt<20){
      splashWhooshPending=true; // will fire on first user gesture
    }

    // ── BIG LAUNCH sound at t=106 (green light — car takes off) ──
    if(splashTimer>=106&&splashTimer-dt<106&&AC&&AC.state!=='suspended'){
      _playSplashLaunch();
    } else if(splashTimer>=106&&splashTimer-dt<106){
      splashLaunchPending=true;
    }

    if(splashTimer>=144&&AC&&AC.state!=='suspended'&&!menuMusicActive)startMenuMusic();
    // Don't auto-transition — splash stays visible with menu overlay; player taps a button to proceed
    return;
  }

  // ── INTRO/GAMEOVER: animate menu background ──
  if(gst===ST.INTRO||gst===ST.GAMEOVER||gst===ST.HOWTO||gst===ST.STATS){
    menuScrollY=(menuScrollY+0.5*dt)%TILE_H;
  }

  // ── SHOP celebration timer + confetti physics ──
  if(gst===ST.SHOP){
    if(shopCelebrationTimer>0) shopCelebrationTimer-=dt;
    for(let _si=shopConfettiParticles.length-1;_si>=0;_si--){
      const _sp=shopConfettiParticles[_si];
      _sp.x+=_sp.vx*dt;
      _sp.y+=_sp.vy*dt;
      _sp.vy+=0.06*dt; // gravity
      _sp.rot+=_sp.rotV*dt;
      _sp.life-=0.009*dt;
      if(_sp.y>H+20||_sp.life<=0) shopConfettiParticles.splice(_si,1);
    }
  }

  let speedMult=1.0;
  // ── Nitro: boost to the stage-specific nitro speed from the lookup table ──
  if(nitroTimer>0){const _ns=STAGE_NITRO_SPD[Math.min(stageNum,20)];speedMult=Math.max(speedMult,_ns/baseSpd);}
  if(slowBumpTimer>0){speedMult*=0.55;slowBumpTimer-=dt;} // speed bump slows briefly
  // Tutorial 3-phase easing: 0.25s ramp→100%→40%, 1.25s hold at 40%, 0.2s ramp→100%
  if(tutSlowElapsed>=0){
    const rD=TUT_RAMP_DOWN,rH=TUT_HOLD,rU=TUT_RAMP_UP;
    let tutMult;
    if(tutSlowElapsed<rD)             tutMult=lerp(1.0,0.40,tutSlowElapsed/rD);
    else if(tutSlowElapsed<rD+rH)    tutMult=0.40;
    else if(tutSlowElapsed<rD+rH+rU) tutMult=lerp(0.40,1.0,(tutSlowElapsed-rD-rH)/rU);
    else                              {tutMult=1.0;tutSlowElapsed=-1;}
    speedMult*=tutMult;
    if(tutSlowElapsed>=0) tutSlowElapsed+=dt;
  }
  // Guided tutorial speed: linearly ramp tutSpeedCurrent toward tutSpeedTarget (0=stop, 1=full)
  // Rate: 0.0111/frame → ~90 frames (~1.5s) for full 0↔1 transition — gradual, not abrupt
  if(tutPhase>=0){
    const _step=0.0111*dt;
    if(tutSpeedCurrent<tutSpeedTarget) tutSpeedCurrent=Math.min(tutSpeedTarget,tutSpeedCurrent+_step);
    else tutSpeedCurrent=Math.max(tutSpeedTarget,tutSpeedCurrent-_step);
    speedMult*=tutSpeedCurrent;
  }
  spd=baseSpd*speedMult;
  tickEngine();
  updateWeather(dt);
  if(AC)updateMusicForTheme();

  // Gun timers
  if(gunFireCooldown>0)gunFireCooldown-=dt;
  if(gunRecoilTimer>0)gunRecoilTimer-=dt;
  if(gunMuzzleFlash>0)gunMuzzleFlash-=dt;
  if(gunSpawnCooldown>0)gunSpawnCooldown-=dt;
  if(gunPickupHintTimer>0)gunPickupHintTimer-=dt;
  // Saved flash
  if(savedFlash>0)savedFlash-=dt;
  if(postShieldGrace>0)postShieldGrace-=dt;
  if(shakeAmt>0)shakeAmt=Math.max(0,shakeAmt-dt);
  // Mission complete flash
  if(missionCompleteFlash>0)missionCompleteFlash-=dt;
  // New record flash
  if(newRecordFlash>0)newRecordFlash-=dt;
  // New best celebration
  if(newBestCelebTimer>0){
    newBestCelebTimer-=dt;
    // Update confetti particle positions
    for(let _ci=confettiParticles.length-1;_ci>=0;_ci--){
      const _cp=confettiParticles[_ci];
      _cp.x+=_cp.vx*dt;_cp.y+=_cp.vy*dt;_cp.rot+=_cp.rotV*dt;
      _cp.life-=0.009*dt;
      if(_cp.y>H+20||_cp.life<=0)confettiParticles.splice(_ci,1);
    }
  }
  // Respawn fade-in timer
  if(respawnFadeTimer>0)respawnFadeTimer-=dt;
  // Danger pulse (last life)
  if(player.lives<=1&&gst===ST.PLAYING)dangerPulse=(dangerPulse+0.045*dt)%(Math.PI*2);

  // ── REVIVE COUNTDOWN ──
  if(gst===ST.REVIVE){
    reviveTimer-=dt;
    tickParticles(crashP,0.12,dt);tickParticles(bloodP,0,dt);tickParticles(shieldBurstP,0,dt);
    if(reviveTimer<=0){
      // Time ran out — go to game over
      if(Math.floor(score)>bestScore){bestScore=Math.floor(score);if(bvalEl)bvalEl.textContent=bestScore;saveLS('rr_best2',bestScore);}
      saveLifetimeStats();
      lbLastRunScore=Math.floor(score);
      _llHandleGameOver(Math.floor(score));
      gst=ST.GAMEOVER;stopBgMusic();stopWeatherSnd();if(AC)startMenuMusic();
    }
    return;
  }

  if(gst===ST.CRASHING){
    crashTimer+=dt;tickParticles(crashP,0.12,dt);tickParticles(bloodP,0,dt);tickParticles(shieldBurstP,0,dt);
    if(tutCrashPopTimer>0) tutCrashPopTimer-=dt; // tick popup during crash anim
    if(crashTimer>=90){
      if(tutCrashPending){
        // Tutorial: rewind instead of losing a life
        tutCrashPending=false;
        gst=ST.PLAYING;
        _CRASH_POOL._reset();_BLOOD_POOL._reset();_SHIELD_POOL._reset();
        stopAlmostDead();almostDeadTimer=0;livesTextTimer=0;
        startEngine();
        _beginTutRewind();
        return;
      }
      player.lives--;updateLivesHUD();
      lifeMsg=null; // clear any pending life-gain animation — its newLives count is now stale and would overwrite the correct HUD
      if(player.lives<=0){
        // Offer revive if score >= 300 and haven't used it this run
        if(Math.floor(score)>=300&&!reviveUsed){
          gst=ST.REVIVE;reviveTimer=600; // 10s at 60fps
        } else {
          if(Math.floor(score)>bestScore){bestScore=Math.floor(score);if(bvalEl)bvalEl.textContent=bestScore;saveLS('rr_best2',bestScore);}
          saveLifetimeStats();
          lbLastRunScore=Math.floor(score);
          _llHandleGameOver(Math.floor(score));
          gst=ST.GAMEOVER;stopBgMusic();stopWeatherSnd();if(AC)startMenuMusic();
        }
      } else {
        gst=ST.RESPAWNING;player.invTimer=180;
        respawnFadeTimer=30;spawnLandingRing(player.visualX,player.y);
        const px=player.visualX;
        for(let i=0;i<_ENEMY_POOL._n;i++){const e=_ENEMY_POOL[i];if(e._active&&!(Math.abs(LANE_XS[e.lane]-px)>90||e.y<player.y-130))e._active=false;}
        for(let i=0;i<_OBST_POOL._n;i++){const o=_OBST_POOL[i];if(o._active&&!(Math.abs(LANE_XS[o.lane]-px)>90||o.y<player.y-130))o._active=false;}
        for(let i=0;i<_TRUCK_POOL._n;i++){const t=_TRUCK_POOL[i];if(t._active&&Math.abs(LANE_XS[t.lane]-px)<=60)t._active=false;}
        for(let i=0;i<_CATTLE_POOL._n;i++){const c=_CATTLE_POOL[i];if(c._active&&c.dead)c._active=false;}
        _CRASH_POOL._reset();_BLOOD_POOL._reset();_SHIELD_POOL._reset();startEngine();
      }
    }
    return;
  }
  if(gst===ST.RESPAWNING){player.invTimer-=dt;if(player.invTimer<=0)gst=ST.PLAYING;}
  if(gst!==ST.PLAYING&&gst!==ST.RESPAWNING)return;

  // ── Finger Track mode: per-frame car movement toward finger lane ──
  if(playMode==='track'&&_ftActiveLane!==-1){
    if(trackSensitivity==='high'){
      // HIGH: direct lane set each frame — ~1-frame lag (~16ms), any distance
      if(!tutNitroMoveLocked&&!tutNitroWarmupActive&&!tutRewindActive&&player.lane!==_ftActiveLane){
        const _mxLane=weatherType==='roadworks'?2:3;
        const _tgt=Math.min(_ftActiveLane,_mxLane);
        if(player.lane!==_tgt){player.lane=_tgt;snd('switch');haptic(18);}
      }
    } else {
      // LOW: one lane per step with cooldown — ~133ms per lane
      if(_ftMoveCooldown>0) _ftMoveCooldown-=dt;
      else if(player.lane!==_ftActiveLane){
        if(player.lane>_ftActiveLane) doLeft();
        else doRight();
        _ftMoveCooldown=8;
      }
    }
  }

  // ── Mode 2 hint advancement (first run in track mode only) ──
  if(playMode==='track'&&!_mode2TutShown&&tutPhase<0){
    _mode2HintTimer+=dt;
    if(_mode2HintPhase===0){ _mode2HintPhase=1; _mode2HintTimer=0; }
    if(_mode2HintPhase===1&&_mode2HintTimer>=240){ _mode2HintPhase=2; _mode2HintTimer=0; }
    if(_mode2HintPhase===2&&_mode2HintTimer>=240){
      _mode2HintPhase=3;
      _mode2TutShown=true;
      saveLS('rr_tut2_shown',true);
    }
  }

  // dashOff advances only during active play — ties lane dashes and kerb stripes
  // directly to game speed. Stops during crash, revive, gameover.
  dashOff+=spd*dt;
  // bgScrollY: parallax ambient background scroll — slower than road dashes,
  // creates depth sensation. Wraps at 1000 to prevent float growth.
  bgScrollY=(bgScrollY+spd*0.6*dt)%1000;

  // Score increases only when actually moving — zero during tutorial pauses
  const _sMov=(tutPhase>=0)?tutSpeedCurrent:1.0;
  score+=0.12*comboMult*nitroMult*_sMov*dt;
  const _scoreInt=Math.floor(score);
  if(_scoreInt!==svalEl._lastVal){svalEl.textContent=_scoreInt;svalEl._lastVal=_scoreInt;}
  const _distKm=(distanceTravelled/15120).toFixed(2);
  if(dvalEl&&_distKm!==dvalEl._lastVal){dvalEl.textContent=_distKm;dvalEl._lastVal=_distKm;}
  if(bdvalEl&&bestDistance!==bdvalEl._lastVal){bdvalEl.textContent=bestDistance.toFixed(2);bdvalEl._lastVal=bestDistance;}

  // ── Distance accumulation — ZERO during tutorial, starts on tutorial completion ──
  // This keeps distanceTravelled=0 throughout tutorial so Stage 1 starts fresh.
  if(tutPhase<0 && (gst===ST.PLAYING||gst===ST.RESPAWNING)) distanceTravelled+=baseSpd*dt;

  // ── Personal best tracking ──
  if(!hasPassedBest&&bestScore>0&&Math.floor(score)>bestScore){
    hasPassedBest=true;newRecordFlash=180;newBestCelebTimer=120;confettiParticles=_mkConfetti();
    snd('newRecord');snd('cheer');haptic([20,10,40,10,20]);
  }

  // ── Stage progression — driven by DISTANCE, not score ──
  // New stage every DIST_PER_STAGE units (~28s at starting speed).
  // Nitro and combos boost score only — they never fast-forward difficulty.
  const stages=Math.floor(distanceTravelled/DIST_PER_STAGE);
  if(stages>lastStages){
    for(let s=lastStages+1;s<=stages;s++){
      // ── Speed lookup table — hardcoded per stage, capped at stage 20 ──
      // Post-stage (21+): +1% per extra stage, capped at +15% over stage-20 speed
      baseSpd=STAGE_BASE_SPD[Math.min(s+1,20)];
      if(s+1>20) baseSpd=Math.min(baseSpd*1.15, baseSpd*(1.0+(s+1-20)*0.01));
      stageNum=s+1;
      runStagesSurvived++;
      exhaustTimer=65;snd('speedup');
      // Track lifetime best stage reached — used for prestige gate
      if(stageNum>bestStageEver){bestStageEver=stageNum;saveLS('rr_best_stage',bestStageEver);}
      // Stage clear bonus — scales with stage number
      const stageBonus=stageNum*25;
      score+=stageBonus;
      // Boss: first appears at stage 8 (chaos layer begins), then every 5 stages after
      if(stageNum>=8 && (stageNum-8)%5===0){
        stageFlash={stage:stageNum,timer:220,boss:true,bonus:0};
        bossWarned=true;
        snd('bossWarning');
        setTimeout(()=>{spawnBoss();},800);
      } else {
        stageFlash={stage:stageNum,timer:220,boss:false,bonus:stageBonus,isMilestone:(stageNum%5===0)};
      }
      // Extra life schedule — three phases to increase late-game tension:
      // Stages 2–8:  every 2 stages (safe onboarding window)
      // Stages 9–14: every 3 stages (safety net starts pulling away)
      // Stage 15+:   no free lives — chaos mode should feel genuinely dangerous
      // Hard cap at 2 lives from stage 12+ even if player has shield-start boost.
      const _lifeMaxAllowed = stageNum>=12 ? 2 : 3;
      const _lifeEligible = stageNum<=8 ? (s%2===0) : stageNum<=14 ? (s%3===0) : false;
      if(_lifeEligible && player.lives<_lifeMaxAllowed){
        player.lives++;
        // Show OLD heart count in HUD — new heart appears only when animation lands
        _redrawHeartsCanvas(player.lives-1);
        // Pre-compute heart particle positions for the animation
        const _hcx=W/2,_hcy=H*0.40,_scale=5.8;
        const _pts=[];
        for(let _pi=0;_pi<24;_pi++){
          const _t=(_pi/24)*Math.PI*2;
          const _hx=16*Math.pow(Math.sin(_t),3);
          const _hy=-(13*Math.cos(_t)-5*Math.cos(2*_t)-2*Math.cos(3*_t)-Math.cos(4*_t));
          _pts.push({
            tx:_hcx+_hx*_scale, ty:_hcy+_hy*_scale,
            sx:player.visualX+(Math.random()-0.5)*100,
            sy:(player.y-player.jumpOff)+(Math.random()-0.5)*50
          });
        }
        // Compute canvas-space position of the new heart slot in the lbox-canvas
        let _htx=70+(player.lives-1)*17, _hty=14; // fallback approximation
        try{
          const _lc=document.getElementById('lbox-canvas');
          const _cv=document.getElementById('game');
          if(_lc&&_cv){
            const _lr=_lc.getBoundingClientRect();
            const _cr=_cv.getBoundingClientRect();
            const _sx=W/_cr.width, _sy=H/_cr.height;
            // x of the specific heart slot within lbox-canvas (cx=7+slot*17)
            const _slotX=(7+(player.lives-1)*17)/_lc.width*_lr.width;
            _htx=(_lr.left+_slotX-_cr.left)*_sx;
            _hty=(_lr.top+_lr.height/2-_cr.top)*_sy;
          }
        }catch(e){}
        lifeMsg={timer:240,pts:_pts,cx:_hcx,cy:_hcy,htx:_htx,hty:_hty,
                 newLives:player.lives,hudUpdated:false};
        snd('extralife');
      }
      // Cattle: stage 4+ only (forces player to combine jump + lane-switch decisions)
      const cfg=getStageConfig();
      if(cfg.cattleAllowed) cattlePending=true;
      // First-time mechanic intro banners on key stage transitions
      if(stageNum===2){
        _showMechanicBanner('obstacles','ROCKS & MANHOLES!','#94a3b8');
      }
      if(stageNum===4) _showMechanicBanner('cattle','CATTLE ON ROAD — JUMP OR SWITCH!','#f97316');
      if(stageNum===8){ _showMechanicBanner('roadworks','ROADWORKS — LANE 4 BLOCKED!','#f59e0b'); _showMechanicBanner('boss_intro','BOSS PURSUIT BEGINS!','#ef4444'); }
      if(stageNum===10) _nmPush('⚡ FULL CHAOS MODE',W/2,H/2+50,240,'#ef4444',true);
    }
    lastStages=stages;
    checkMission();
    checkAchievements();
  }

  // Stage-2 nitro auto-trigger removed — nitro tutorial now flows directly from Phase 9

  if(stageFlash){stageFlash.timer-=dt;if(stageFlash.timer<=0)stageFlash=null;}
  if(lifeMsg){lifeMsg.timer-=dt;if(lifeMsg.timer<=0)lifeMsg=null;}
  if(comboFlashTimer>0)comboFlashTimer-=dt;

  // ── Tutorial tick ──
  if(tut){
    tut.slamT=Math.min(1,tut.slamT+dt/6);
    tut.elapsed+=dt;
    if(tut.dismissing){
      tut.fadeOut-=dt;
      if(tut.fadeOut<=0){tut=null;tutSlowElapsed=-1;_dequeueNextTut();}
    } else {
      // Dismiss when object is within TUT_DISMISS_ABOVE px above player
      const _obj=tut.objRef;
      const _ry=(_obj&&_obj._active)?(_obj.y+(TUT_RING_OFFSET[tut.key]||0)):(player.y-TUT_DISMISS_ABOVE);
      if(_ry>=player.y-TUT_DISMISS_ABOVE) tut.dismissing=true;
    }
  }
  _checkWatchList();

  // ── Breathing room (stage 10+) — rare ~5% chance to trigger a clear stretch ──
  // Only when the road is quiet enough. Gives the player a psychological reset before next threat.
  if(clearStretchTimer>0){
    clearStretchTimer-=dt;
  } else if(stageNum>=10 && _ENEMY_POOL._count()===0 && _OBST_POOL._count()===0 && Math.random()<0.0008*dt){
    clearStretchTimer=180; // ~3s of no spawns
  }

  if(magnetTimer>0)magnetTimer-=dt;
  if(nitroTimer>0){nitroTimer-=dt;if(nitroTimer<=0){nitroMult=1;nitroSmashCount=0;}}
  // Nitro reserve expiry — column opacity blinks in last 2s (handled in render.js), then disappears
  if(nitroReserve&&!tutNitroMoveLocked){
    nitroExpiryTimer-=dt;
    if(nitroExpiryTimer<=0){nitroReserve=false;nitroExpiryTimer=0;_updateNitroBtn();_redrawNitroCanvas(false);}
  }
  if(ghostTimer>0)ghostTimer-=dt;
  if(puBanner){puBanner.timer+=dt;if(puBanner.timer>=puBanner.maxTimer)puBanner=null;}

  if(nearMissStreak>0){comboDecay+=dt;if(comboDecay>=300){nearMissStreak=0;comboMult=1;comboDecay=0;_updateComboBadge();}}
  if(coinStreak>0){coinStreakDecay+=dt;if(coinStreakDecay>=90){coinStreak=0;coinStreakDecay=0;}}

  for(let _i=0;_i<_NMPOP_POOL._n;_i++){const _p=_NMPOP_POOL[_i];if(!_p._active)continue;_p.y-=0.9*dt;_p.timer-=dt;if(_p.timer<=0)_p._active=false;}
  tickLandingRings(dt);
  updateSpeedLines(dt);

  // ── Boss car update ──
  if(bossActive&&bossCar){
    bossCar.y+=spd*0.75*dt+1.5*dt;
    bossCar.x+=(player.visualX-bossCar.x)*0.012*dt;
    bossTimer-=dt;
    if(bossCar.y>H+120||bossTimer<=0){
      // Boss defeated / escaped — reward
      bossActive=false;bossCar=null;bossWarned=false;
      runBossKilled=true;
      const bossReward=80;
      score+=bossReward;coinBank+=3;saveLS('rr_coins2',coinBank);cvalEl.textContent=coinBank;
      _nmPush('BOSS ESCAPED! +'+bossReward,W/2,H/2-30,120,'#fbbf24',true);
      snd('bossDefeated');haptic([40,20,60,20,40]);
      checkAchievements();
    } else if(gst===ST.PLAYING){
      // Boss collision — only check if boss is still alive
      const px=player.visualX,py=player.y-player.jumpOff;
      if(Math.abs(px-bossCar.x)<34&&Math.abs(py-bossCar.y)<52){
        bossActive=false;bossCar=null;bossWarned=false;
        triggerCrash('car',px,py,-1);return;
      }
    }
  }

  if(cattlePending&&_CATTLE_POOL._count()===0&&getStageConfig().cattleAllowed)spawnCattle();

  player.targetX=LANE_XS[player.lane];
  // Ice King passive: rain handling improved (lerp 0.052 → 0.095 in rain)
  const _rainLerp=equippedSkin==='cyan'?0.095:0.052;
  const _lerpF=weatherType==='rain'?_rainLerp:0.14;
  const _lerpFdt=1-Math.pow(1-_lerpF,dt);
  const _prevX=player.visualX;
  player.visualX+=(player.targetX-player.visualX)*_lerpFdt;
  const _dxThisFrame=player.visualX-_prevX;
  playerLaneVel=playerLaneVel*Math.pow(0.80,dt)+_dxThisFrame*(0.20/Math.max(dt,0.1))*0.20;
  playerTilt=clamp(playerLaneVel*0.022,-0.22,0.22);

  if(player.jumping){
    player.jumpProg+=dt/JUMP_DUR;player.jumpOff=Math.sin(player.jumpProg*Math.PI)*JUMP_H;
    if(player.jumpProg>=1){player.jumping=false;player.jumpProg=0;player.jumpOff=0;player.jumpCD=JUMP_CD;snd('land');haptic(12);spawnLandingRing(player.visualX,player.y);}
  } else {
    player.jumpOff=0;if(player.jumpCD>0)player.jumpCD-=dt;
  }

  let fp;
  if(player.jumping)fp=((1-player.jumpProg)*100)|0;
  else if(player.jumpCD>0)fp=((JUMP_CD-player.jumpCD)/JUMP_CD*100)|0;
  else fp=100;
  const fpStr=fp+'%';
  const fpBg=player.jumping?'#facc15':player.jumpCD>0?'#f97316':'#00e676';
  // Only touch the DOM when value changes — avoids forced layout every frame
  if(jfillEl._lastHeight!==fpStr){jfillEl.style.height=fpStr;jfillEl._lastHeight=fpStr;}
  if(jfillEl._lastBg!==fpBg){jfillEl.style.background=fpBg;jfillEl._lastBg=fpBg;}

  const exhaustCount=nitroTimer>0?6:(exhaustTimer>0?3:1);
  if(exhaustTimer>0)exhaustTimer-=dt;
  const _exhaustSpawns=Math.round(exhaustCount*dt);
  const _rbwSz=equippedTrail==='rainbow'?1.4:1.0; // Rainbow trail: larger particles
  for(let i=0;i<_exhaustSpawns;i++){
    const _ep=_EXHAUST_POOL._get();
    _ep.nitro=nitroTimer>0;
    if(_ep.nitro){
      // Tight fire burst from exhaust pipes
      _ep.x=player.visualX+(Math.random()-0.5)*10;_ep.y=player.y-player.jumpOff+30;
      _ep.vx=(Math.random()-0.5)*2.2;_ep.vy=2.5+Math.random()*2.5;
      _ep.life=1;_ep.size=(3+Math.random()*5)*_rbwSz;_ep.gravity=0;
    } else {
      _ep.x=player.visualX+(Math.random()-0.5)*18;_ep.y=player.y-player.jumpOff+33;
      _ep.vx=(Math.random()-0.5)*1.4;_ep.vy=1.8+Math.random()*2;
      _ep.life=1;_ep.size=(5+Math.random()*8)*_rbwSz;_ep.gravity=0;
    }
  }
  for(let i=0;i<_EXHAUST_POOL._n;i++){
    const p=_EXHAUST_POOL[i];if(!p._active)continue;
    p.x+=p.vx*dt;p.y+=p.vy*dt;
    p.size+=(p.nitro?0.22:0.45)*dt;
    p.life-=(p.nitro?0.048:0.028)*dt;
    if(p.life<=0)p._active=false;
  }
  // exhaustP pool: hard cap enforced by pool size (_EXHAUST_POOL._n)

  // ── Tutorial rewind: reverse all objects at 2x speed ──
  if(tutRewindActive){
    tutRewindTimer-=dt;
    const _rws=baseSpd*2;
    for(let i=0;i<_ENEMY_POOL._n;i++){const e=_ENEMY_POOL[i];if(e._active)e.y-=_rws*dt;}
    for(let i=0;i<_OBST_POOL._n;i++){const o=_OBST_POOL[i];if(o._active)o.y-=_rws*dt;}
    for(let i=0;i<_COIN_POOL._n;i++){const c=_COIN_POOL[i];if(c._active){c.y-=_rws*dt;c.x=LANE_XS[c.lane];}}
    for(let i=0;i<_PU_POOL._n;i++){const p=_PU_POOL[i];if(p._active)p.y-=_rws*dt;}
    dashOff-=_rws*2*dt;
    player.invTimer=Math.max(player.invTimer,60);
    if(tutRewindTimer<=0){
      tutRewindActive=false;
      player.invTimer=90;
    }
    return;
  }

  // Move all game objects (normal forward movement)
  for(let i=0;i<_ENEMY_POOL._n;i++){const e=_ENEMY_POOL[i];if(!e._active)continue;e.y+=spd*(e.speedMult||1)*dt;if(e.y>H+100)e._active=false;}
  for(let i=0;i<_OBST_POOL._n;i++){const o=_OBST_POOL[i];if(!o._active)continue;o.y+=spd*dt;if(o.y>H+100)o._active=false;}
  for(let i=0;i<_CATTLE_POOL._n;i++){const c=_CATTLE_POOL[i];if(!c._active)continue;c.y+=spd*dt;c.x+=c.dir*c.hSpeed*dt;if(c.x<ROAD_L-120||c.x>ROAD_R+120||c.y>H+80)c._active=false;}
  // Trucks — travel same direction as player (downward on screen) at 75% enemy speed
  for(let i=0;i<_TRUCK_POOL._n;i++){const t=_TRUCK_POOL[i];if(!t._active)continue;t.y+=spd*0.75*dt;if(t.y>H+150)t._active=false;}

  // ── Truck vs Enemy separation pass ──────────────────────────────────────
  // Trucks are slower than enemies; without this an enemy spawned above a truck
  // will eventually catch up and visually drive through it.
  // Fix: after every move tick, push any enemy that overlaps a truck's vertical
  // span (in the same lane) back above the truck's cab top with a small buffer.
  for(let _ti=0;_ti<_TRUCK_POOL._n;_ti++){
    const _tr=_TRUCK_POOL[_ti];if(!_tr._active)continue;
    const _trContH=_tr.hits>=1?36:72;
    const _trBottom=_tr.y+39+_trContH; // cab(35)+gap(4)+container
    for(let _ei=0;_ei<_ENEMY_POOL._n;_ei++){
      const _e=_ENEMY_POOL[_ei];if(!_e._active)continue;
      if(_e.lane!==_tr.lane)continue;
      // Enemy overlaps truck vertically — push it above the truck cab
      if(_e.y+44>_tr.y&&_e.y-44<_trBottom){
        _e.y=_tr.y-48; // 44px half-height + 4px gap
      }
    }
  }
  if(magnetTimer>0){
    const px=player.visualX,py=player.y-player.jumpOff;
    const _magR=equippedSkin==='blue'?220:160; // Torpedo: wider radius
    for(let i=0;i<_COIN_POOL._n;i++){const c=_COIN_POOL[i];if(!c._active)continue;c.y+=spd*dt;const dx=px-c.x,dy=py-c.y,dist=Math.sqrt(dx*dx+dy*dy);if(dist<_magR){const pull=Math.min(8,800/Math.max(dist,10));c.x+=dx/dist*pull*dt;c.y+=dy/dist*pull*dt;}if(c.y>H+50)c._active=false;}
  } else {
    // Passive pull: Torpedo skin (60px) + Ice trail (50px), stacks up to 100px
    const _passiveR=Math.min(100,(equippedSkin==='blue'?60:0)+(equippedTrail==='ice'?50:0));
    if(_passiveR>0){
      const px=player.visualX,py=player.y-player.jumpOff;
      for(let i=0;i<_COIN_POOL._n;i++){const c=_COIN_POOL[i];if(!c._active)continue;c.y+=spd*dt;const dx=px-c.x,dy=py-c.y,dist=Math.sqrt(dx*dx+dy*dy);if(dist<_passiveR){const pull=Math.min(3,180/Math.max(dist,10));c.x+=dx/dist*pull*dt;c.y+=dy/dist*pull*dt;}if(c.y>H+50)c._active=false;}
    } else {
      for(let i=0;i<_COIN_POOL._n;i++){const c=_COIN_POOL[i];if(!c._active)continue;c.y+=spd*dt;if(c.y>H+50)c._active=false;}
    }
  }
  for(let i=0;i<_PU_POOL._n;i++){const p=_PU_POOL[i];if(!p._active)continue;p.y+=spd*dt;if(p.y>H+50)p._active=false;}
  // Bullet movement — travels upward
  for(let i=0;i<_BULLET_POOL._n;i++){const b=_BULLET_POOL[i];if(!b._active)continue;b.y+=b.vy*dt;if(b.y<-30)b._active=false;}

  // Cattle moo
  for(let i=0;i<_CATTLE_POOL._n;i++){const c=_CATTLE_POOL[i];if(!c._active)continue;if(!c.mooed&&c.y>0){c.mooed=true;snd('moo');}}

  // ── Guided tutorial state machine (first-run only, phases 0-5) ─────────
  if(tutPhase>=0&&(gst===ST.PLAYING||gst===ST.RESPAWNING)){
    tutPhaseTimer+=dt;
    tutSpeedTarget=1.0; // default: full speed — each phase overrides as needed

    // ── Phase 0: Setup — clear road 1s, lock player to lane 1 ─────────────
    if(tutPhase===0){
      player.lane=1;player.targetX=LANE_XS[1];
      if(tutPhaseTimer>=60){
        tutPhase=1;tutPhaseTimer=0;
        // Enemies: lane 1 at y=-200, lane 0 at y=-160 (40px gap)
        const _te1=_ENEMY_POOL._get();
        _te1.lane=1;_te1.y=-200;_te1.nmChecked=false;_te1.speedMult=1.0;_te1._perfectDodge=false;
        tutEnemyRef=_te1;
        const _te2=_ENEMY_POOL._get();
        _te2.lane=0;_te2.y=-160;_te2.nmChecked=false;_te2.speedMult=1.0;_te2._perfectDodge=false;
        tutPhase1EnemyRef2=_te2;
        // 2 coins in lane 2 at same y-level as the enemies, 30px apart
        // These reward the player for switching to the correct safe lane
        const _tc1=_COIN_POOL._get();_tc1.lane=2;_tc1.x=LANE_XS[2];_tc1.y=-200;_tc1.id=coinIdCounter++;
        const _tc2=_COIN_POOL._get();_tc2.lane=2;_tc2.x=LANE_XS[2];_tc2.y=-170;_tc2.id=coinIdCounter++;
      }
    }

    // ── Phase 1: Enemies in lanes 0+1 — full speed, crashes trigger rewind ──
    else if(tutPhase===1){
      // No auto-braking — game runs at full speed. Crash → rewind.
      if(player.lane>=2){
        tutEnemyRef=null;tutPhase1EnemyRef2=null;
        tutPhase=2;tutPhaseTimer=0;tutPhase2Spawned=false;
      }
    }

    // ── Phase 2: Enemy l3 (y=-400), enemy l2 (y=-430), manhole l0 + stone l1 (y=-460) ──
    //   2 coins in lane 1 at y=-400 and y=-430 guide player to correct lane.
    //   Full speed throughout. Crash (incl. jumping over cars) → rewind.
    else if(tutPhase===2){
      if(!tutPhase2Spawned){
        tutPhase2Spawned=true;
        // Enemy car lane 3 — arrives first (least negative y)
        const _tej2=_ENEMY_POOL._get();
        _tej2.lane=3;_tej2.y=-400;_tej2.nmChecked=false;_tej2.speedMult=1.0;_tej2._perfectDodge=false;_tej2._tutSmashed=false;
        tutJumpEnemyRef2=_tej2;
        // Enemy car lane 2 — 30px further above
        const _tej1=_ENEMY_POOL._get();
        _tej1.lane=2;_tej1.y=-430;_tej1.nmChecked=false;_tej1.speedMult=1.0;_tej1._perfectDodge=false;_tej1._tutSmashed=false;
        tutJumpEnemyRef1=_tej1;
        // Manhole lane 0 + stone lane 1 — both 30px above enemy l2
        const _tm=_OBST_POOL._get();_tm.lane=0;_tm.y=-460;_tm.type='manhole';_tm.nmChecked=false;_tm._tutSmashed=false;
        tutJumpObstRef2=_tm;
        const _ts=_OBST_POOL._get();_ts.lane=1;_ts.y=-460;_ts.type='stone';_ts.nmChecked=false;_ts._tutSmashed=false;
        tutObstRef=_ts;
        // 2 coins in lane 1 guiding player to jump lane:
        // coin A 60px before stone (y=-460+60=-400), coin B 30px before stone (y=-430)
        const _gca=_COIN_POOL._get();_gca.lane=1;_gca.x=LANE_XS[1];_gca.y=-400;_gca.id=coinIdCounter++;
        const _gcb=_COIN_POOL._get();_gcb.lane=1;_gcb.x=LANE_XS[1];_gcb.y=-430;_gcb.id=coinIdCounter++;
      }
      if(tutCrashPopTimer>0) tutCrashPopTimer-=dt;
      // Advance when player jumps from lane 0 or 1 (correct jump lane)
      if(player.jumping&&(player.lane===0||player.lane===1)){
        tutObstRef=null;tutJumpObstRef2=null;tutJumpEnemyRef1=null;tutJumpEnemyRef2=null;
        tutPhase=3;tutPhaseTimer=0;tutP3Spawned=false;
      }
    }

    // ── Phase 3: Coins A + Gun + Pre-spawned cars A/B/C ─────────────────
    else if(tutPhase===3){
      if(!tutP3Spawned){
        tutP3Spawned=true;tutP3GunUsed=false;tutGunCollected=false;
        // ── Coin group A ──
        const _c1a=_COIN_POOL._get();_c1a.lane=1;_c1a.x=LANE_XS[1];_c1a.y=-30;_c1a.id=coinIdCounter++;
        const _c1b=_COIN_POOL._get();_c1b.lane=1;_c1b.x=LANE_XS[1];_c1b.y=-60;_c1b.id=coinIdCounter++;
        const _l2ys=[-90,-120,-180,-210,-240,-270];
        for(let _ci=0;_ci<6;_ci++){
          const _c2=_COIN_POOL._get();_c2.lane=2;_c2.x=LANE_XS[2];_c2.y=_l2ys[_ci];_c2.id=coinIdCounter++;
        }
        // ── Gun pickup: lane 2, y=-320 ──
        tutGunLane=2;
        const _gp=_PU_POOL._get();
        _gp.lane=2;_gp.x=LANE_XS[2];_gp.y=-320;_gp.type='gun';
        tutGunPickupRef=_gp;
        // ── Car A: lane 2, 550px above gun (y=-870) — stays regardless of gun pickup ──
        const _ca=_ENEMY_POOL._get();
        _ca.lane=2;_ca.y=-870;_ca.nmChecked=false;_ca.speedMult=1.0;_ca._perfectDodge=false;_ca._tutSmashed=false;
        tutShootEnemyRef=_ca;
        // ── Car B: lane 1, ~350px above car A (y=-1220) ──
        const _cb=_ENEMY_POOL._get();
        _cb.lane=1;_cb.y=-1220;_cb.nmChecked=false;_cb.speedMult=1.0;_cb._perfectDodge=false;_cb._tutSmashed=false;
        tutP3CarBRef=_cb;
        // ── Car C: lane 2, ~350px above car B (y=-1570) ──
        const _cc=_ENEMY_POOL._get();
        _cc.lane=2;_cc.y=-1570;_cc.nmChecked=false;_cc.speedMult=1.0;_cc._perfectDodge=false;_cc._tutSmashed=false;
        tutP3CarCRef=_cc;
      }

      // Gun collected → activate fire button, start arrow timer
      if(tutGunCollected&&!tutP3GunUsed){
        tutGunCollected=false;tutP3GunUsed=true;
        tutGunPickupRef=null;
        tutGunArrowTimer=720; // up to 12s; expires when phase ends
      }
      if(tutGunArrowTimer>0) tutGunArrowTimer-=dt;

      // ── Braking rules ──
      // Pre-gun: brake if wrong lane and gun is within 227px
      if(!tutP3GunUsed&&tutGunPickupRef&&tutGunPickupRef._active){
        if(player.lane!==tutGunLane&&Math.abs(tutGunPickupRef.y-player.y)<227){
          tutSpeedTarget=0.0;
        }
      }
      // Post-gun: brake when car A is within 272px (so player can aim)
      if(tutP3GunUsed&&tutShootEnemyRef&&tutShootEnemyRef._active){
        if(Math.abs(tutShootEnemyRef.y-player.y)<272) tutSpeedTarget=0.0;
      }
      // (No braking for car A when gun not picked — player must dodge)

      // ── Phase 3 ends when car C is gone (shot or passed player) ──
      const _cCGone = !tutP3CarCRef || !tutP3CarCRef._active || (tutP3CarCRef._active && tutP3CarCRef.y > player.y + 80);
      if(_cCGone){
        // Clean up refs — let cars scroll off naturally (don't force-deactivate)
        tutShootEnemyRef=null;tutP3CarBRef=null;tutP3CarCRef=null;
        tutGunPickupRef=null;tutGunArrowTimer=0;
        tutSpeedTarget=1.0;
        tutPhase=4;tutPhaseTimer=0;tutP4Spawned=false;
        gunActive=false;gunAmmo=0;_updateGunBtn();
      }
    }

    // ── Phase 4: Coins (lane3→2→1) + Nitro reserve + Tap button + 3 Smashes ──
    else if(tutPhase===4){
      if(!tutP4Spawned){
        tutP4Spawned=true;tutNitroCollected=false;tutNitroMoveLocked=false;
        tutNitroWarmupActive=false;tutNitroWarmupTimer=0;
        tutNitroObst1Ref=null;tutNitroObst2Ref=null;tutNitroObst3Ref=null;
        // ── Coins: guide player lane 3 → 2 → 1 ──
        const _c3a=_COIN_POOL._get();_c3a.lane=3;_c3a.x=LANE_XS[3];_c3a.y=-30;_c3a.id=coinIdCounter++;
        const _c3b=_COIN_POOL._get();_c3b.lane=3;_c3b.x=LANE_XS[3];_c3b.y=-60;_c3b.id=coinIdCounter++;
        for(let _ci=0;_ci<3;_ci++){
          const _c2=_COIN_POOL._get();_c2.lane=2;_c2.x=LANE_XS[2];_c2.y=-90-_ci*30;_c2.id=coinIdCounter++;
        }
        for(let _ci=0;_ci<6;_ci++){
          const _c1=_COIN_POOL._get();_c1.lane=1;_c1.x=LANE_XS[1];_c1.y=-180-_ci*30;_c1.id=coinIdCounter++;
        }
        // Nitro pickup: lane 1, 60px after last coin
        tutNitroObstLane1=1;
        const _np=_PU_POOL._get();
        _np.lane=1;_np.x=LANE_XS[1];_np.y=-390;_np.type='nitro';
        tutNitroPickupRef=_np;
      }

      // ── After nitro collected and stored → spawn obstacles, stop game, show button arrow ──
      // tutNitroCollected is set by activatePowerUp when tutPhase===4
      // tutNitroWarmupActive is repurposed as "obstacles-spawned / waiting-for-tap" flag
      if(tutNitroCollected&&!tutNitroWarmupActive&&!tutNitroMoveLocked){
        tutNitroCollected=false;tutNitroPickupRef=null;
        tutNitroWarmupActive=true; // obstacles spawned, waiting for tap
        tutNitroArrowActive=true;
        nitroSmashCount=0;
        const _lane4=player.lane;
        tutNitroObstLane1=_lane4;tutNitroObstLane2=_lane4;tutNitroObstLane3=_lane4;
        // Spawn obstacles just above screen — they rush down once nitro fires
        const _to1=_OBST_POOL._get();_to1.lane=_lane4;_to1.y=player.y-350;_to1.type='stone';_to1.nmChecked=true;_to1._tutSmashed=false;
        tutNitroObst1Ref=_to1;
        const _te3=_ENEMY_POOL._get();_te3.lane=_lane4;_te3.y=player.y-550;_te3.nmChecked=true;_te3.speedMult=1.0;_te3._perfectDodge=false;_te3._tutSmashed=false;
        tutNitroObst2Ref=_te3;
        const _to3=_OBST_POOL._get();_to3.lane=_lane4;_to3.y=player.y-750;_to3.type='manhole';_to3.nmChecked=true;_to3._tutSmashed=false;
        tutNitroObst3Ref=_to3;
      }

      // ── Waiting for tap: stop game so player can read the button arrow ──
      if(tutNitroWarmupActive&&!tutNitroMoveLocked){
        tutSpeedTarget=0.0; // freeze until player taps
      }

      // ── Nitro smash mode — tutNitroMoveLocked set by doNitroFire() ──
      if(tutNitroMoveLocked){
        tutSpeedTarget=1.0;
        const _allSmashed=(!tutNitroObst1Ref||tutNitroObst1Ref._tutSmashed)&&
                          (!tutNitroObst2Ref||tutNitroObst2Ref._tutSmashed)&&
                          (!tutNitroObst3Ref||tutNitroObst3Ref._tutSmashed);
        if(_allSmashed||nitroTimer<=0){
          tutSpeedTarget=1.0;
          tutPhase=5;tutPhaseTimer=0;
          tutNitroMoveLocked=false;
          nitroTimer=0;nitroMult=1;nitroSmashCount=0;
          tutCertifiedSndDone=false;
        }
      } else if(!tutNitroWarmupActive){
        // Pre-collect: guide player to nitro pickup lane
        if(tutNitroPickupRef&&tutNitroPickupRef._active){
          if(player.lane!==tutNitroObstLane1&&Math.abs(tutNitroPickupRef.y-player.y)<270){
            tutSpeedTarget=0.0;
          } else {
            tutSpeedTarget=1.0;
          }
        }
        // Safety: if nitro scrolled off, respawn
        if(tutNitroPickupRef&&!tutNitroPickupRef._active&&!tutNitroMoveLocked&&!nitroReserve){
          const _np2=_PU_POOL._get();
          _np2.lane=tutNitroObstLane1;_np2.x=LANE_XS[tutNitroObstLane1];_np2.y=-30;_np2.type='nitro';
          tutNitroPickupRef=_np2;
        }
      }
    }

    // ── Phase 5: 1s coast at normal speed → Certified Driver banner (2s) → Stage 1 ──
    else if(tutPhase===5){
      tutSpeedTarget=1.0;
      // Play triumphant sound once banner appears (at 1s = frame 60)
      if(!tutCertifiedSndDone&&tutPhaseTimer>=65){
        tutCertifiedSndDone=true;
        snd('certifiedDriver');haptic([30,15,60,15,30]);
      }
      // Banner visible from frame 60–180 (2 sec). Coast from frame 0–60.
      // End tutorial at frame 180 (1s coast + 2s banner = 3s total)
      if(tutPhaseTimer>=180){
        tutPhase=-1;tutSpeedTarget=1.0;tutSpeedCurrent=1.0;
        _nitroTutDone=true;_saveNitroTutDone();
        tutorialShown.fullTutorial=true;_saveTutShown();
        _mode2TutShown=true;saveLS('rr_tut2_shown',true); // full tutorial replaces mode2 hints
        distanceTravelled=0;_updateDistBoxVisibility();
        clearStretchTimer=180;
        // Restore cannon balls from Phase 3 — fire button active at Stage 1 start
        // Set gunLastStageSpawned high so spawnGunPowerUp won't immediately overwrite
        // Player keeps these 8 balls until fired; normal gun spawns resume after they're gone
        gunActive=true;gunAmmo=8;
        gunLastStageSpawned=1; // stage 1 — prevents double-spawn on first stage
        gunSpawnCooldown=0;    // cooldown starts fresh; player earned this gun in tutorial
        _updateGunBtn();
      }
    }

    // Block normal spawning during tutorial
    tickParticles(crashP,0.12,dt);tickParticles(bloodP,0,dt);tickParticles(shieldBurstP,0.05,dt);
    if(gst===ST.PLAYING||gst===ST.CRASHING||gst===ST.RESPAWNING)tickBloodPools(dt);
  } else {
    // Normal spawning (non-tutorial)
    spawnEnemy(dt);spawnObstacle(dt);spawnCoin(dt);spawnPowerUp(dt);spawnGunPowerUp(dt);spawnTruck(dt);
    tickParticles(crashP,0.12,dt);tickParticles(bloodP,0,dt);tickParticles(shieldBurstP,0.05,dt);
    if(gst===ST.PLAYING||gst===ST.CRASHING||gst===ST.RESPAWNING)tickBloodPools(dt);
  }

  if(gst===ST.PLAYING){
    const px=player.visualX,py=player.y-player.jumpOff;
    // Collect coins
    for(let i=0;i<_COIN_POOL._n;i++){const c=_COIN_POOL[i];if(!c._active)continue;if(Math.abs(px-c.x)<22&&Math.abs(py-c.y)<28){collectCoin(c);c._active=false;}}
    // Collect power-ups
    for(let i=0;i<_PU_POOL._n;i++){const pu=_PU_POOL[i];if(!pu._active)continue;if(Math.abs(px-pu.x)<28&&Math.abs(py-pu.y)<28){activatePowerUp(pu);pu._active=false;if(tutPhase===3&&pu===tutGunPickupRef)tutGunCollected=true;if(tutPhase===4&&pu===tutNitroPickupRef)tutNitroCollected=true;}}

    // ── Skip hazard collisions during post-shield grace period ──
    if(postShieldGrace>0){
      for(let i=0;i<_ENEMY_POOL._n;i++){const e=_ENEMY_POOL[i];if(!e._active)continue;if(!e.nmChecked&&e.y>player.y+30)e.nmChecked=true;}
      for(let i=0;i<_OBST_POOL._n;i++){const o=_OBST_POOL[i];if(!o._active)continue;if(!o.nmChecked&&o.y>player.y+30)o.nmChecked=true;}
    } else {
    // Enemy collision
    for(let i=0;i<_ENEMY_POOL._n;i++){
      const e=_ENEMY_POOL[i];if(!e._active)continue;
      // Phase 1: crashes ARE allowed — triggers rewind (enemies no longer pass through)
      // Phase 2: jump blockade enemies cause crashes (triggers rewind)
      // Phase 3: shoot enemy passes through (game stops before collision)
      // Phase 1: enemies pass through when player already moved away (handled by advance condition)
      // Phase 3: ALL cars (A, B, C) can collide → crash → rewind (no pass-through)
      // Phase 3: shoot enemy passes through — REMOVED; all phase-3 cars cause real crashes
      if(e._tutSmashed)continue;
      if(Math.abs(px-LANE_XS[e.lane])<27&&Math.abs(py-e.y)<43){
        e.nmChecked=true;
        if(nitroTimer>0){
          // Phase 4 nitro smash: enemy car (2nd target) — mark but keep active
          if(tutPhase===4&&e===tutNitroObst2Ref){
            if(!e._tutSmashed){e._tutSmashed=true;triggerCrash('car',px,py,-1);}
            continue;
          }
          e._active=false; // normal nitro smash
        }
        triggerCrash('car',px,py,-1);return;
      }
      if(tutPhase===2&&player.jumping&&(e===tutJumpEnemyRef1||e===tutJumpEnemyRef2)){
        // Jump-over-car detection moved to dedicated block below obstacle loop
        continue;
      }
    }
    // Obstacles
    if(!player.jumping){
      for(let i=0;i<_OBST_POOL._n;i++){
        const o=_OBST_POOL[i];if(!o._active)continue;
        // Phase 2: stone and manhole are SOLID — player must jump over them (no pass-through)
        // (they previously passed through; now they cause a real crash → rewind)
        if(o._tutSmashed)continue;
        const ox=o.type==='brokencar'?((LANE_XS[Math.min(o.lane,2)]+LANE_XS[Math.min(o.lane+1,3)])/2):LANE_XS[o.lane];
        const oHitW=o.type==='brokencar'?Math.abs(LANE_XS[Math.min(o.lane+1,3)]-LANE_XS[Math.min(o.lane,2)])/2+28:27;
        if(Math.abs(px-ox)<oHitW&&Math.abs(py-o.y)<43){
          o.nmChecked=true;
          if(ghostTimer>0){continue;}
          if(o.type==='speedbump'){slowBumpTimer=45;o._active=false;continue;}
          if(nitroTimer>0){
            // Phase 4 nitro smash: manhole and stone obstacles
            if(tutPhase===4&&(o===tutNitroObst1Ref||o===tutNitroObst3Ref)){
              if(!o._tutSmashed){o._tutSmashed=true;triggerCrash(o.type,px,py,-1);}
              continue;
            }
            o._active=false;
          }
          triggerCrash(o.type,px,py,-1);return;
        }
      }
      for(let i=0;i<_CATTLE_POOL._n;i++){const c=_CATTLE_POOL[i];if(!c._active||c.dead)continue;if(Math.abs(c.x-px)<44&&Math.abs(c.y-py)<30){if(ghostTimer>0){continue;}runCattleDodged--;triggerCrash('cattle',px,py,i);return;}}
    }
    // Phase 2: detect jumping over enemy cars (not allowed — causes crash)
    if(tutPhase===2&&player.jumping){
      for(let i=0;i<_ENEMY_POOL._n;i++){
        const e=_ENEMY_POOL[i];if(!e._active||e.nmChecked)continue;
        if(e===tutJumpEnemyRef1||e===tutJumpEnemyRef2){
          // Check horizontal alignment — player must be in the same lane as the enemy
          if(Math.abs(px-LANE_XS[e.lane])<40&&e.y>player.y-20&&e.y<player.y+90){
            e.nmChecked=true;
            triggerCrash('car',px,py,-1);return;
          }
        }
      }
    }
    // ── Perfect near-miss cleanup ──
    for(let i=0;i<_ENEMY_POOL._n;i++){
      const e=_ENEMY_POOL[i];if(!e._active||e.nmChecked)continue;
      if(e._perfectDodge&&e.y>player.y+5)e.nmChecked=true;
    }
    _prevPlayerLane=player.lane;
    // Near-miss (adjacent lane)
    for(let i=0;i<_ENEMY_POOL._n;i++){const e=_ENEMY_POOL[i];if(!e._active)continue;if(!e.nmChecked&&e.y>player.y+30){e.nmChecked=true;const ld=Math.abs(LANE_XS[e.lane]-player.visualX);if(ld>=27&&ld<92)triggerNearMiss(LANE_XS[e.lane],e.y);}}
    for(let i=0;i<_OBST_POOL._n;i++){
      const o=_OBST_POOL[i];if(!o._active)continue;
      if(!o.nmChecked&&o.y>player.y+30&&!player.jumping){
        o.nmChecked=true;
        if(o.type==='brokencar'){const ox=(LANE_XS[Math.min(o.lane,2)]+LANE_XS[Math.min(o.lane+1,3)])/2;const ld=Math.abs(ox-player.visualX);if(ld>=55&&ld<130)triggerNearMiss(ox,o.y);}
        else{const ld=Math.abs(LANE_XS[o.lane]-player.visualX);if(ld>=27&&ld<92)triggerNearMiss(LANE_XS[o.lane],o.y);}
      }
    }
    if(player.jumping){for(let i=0;i<_OBST_POOL._n;i++){const o=_OBST_POOL[i];if(!o._active)continue;if(!o.nmChecked&&Math.abs(o.y-player.y)<50&&Math.abs(LANE_XS[o.lane]-player.visualX)<30){o.nmChecked=true;triggerNearMiss(LANE_XS[o.lane],o.y);}}}
    // ── TRUCK collisions ─────────────────────────────────────────────────────
    // Trucks cannot be jumped over (uses player.y not py).
    // Ghost  → phase through once per truck; awards ghost near-miss bonus.
    // Nitro  → smashes truck (deactivates + score), same as any obstacle.
    // Shield → first hit consumes shield; truck stays active.
    //           Per-truck shieldGrace (120 frames) lets it physically clear the
    //           player (trucks move at 75% speed so postShieldGrace=45 is too short).
    //           After grace: if AABB still true (player re-entered lane) → crash.
    // None   → crash.
    for(let i=0;i<_TRUCK_POOL._n;i++){
      const t=_TRUCK_POOL[i];if(!t._active)continue;
      const _tContH=t.hits>=1?36:72;
      const _tBottom=t.y+39+_tContH; // cab(35)+gap(4)+container
      if(Math.abs(px-LANE_XS[t.lane])<36 &&
         player.y-34 < _tBottom &&
         player.y+34 > t.y){

        // ── Per-truck shield grace: truck is still physically passing through ──
        // Decrement and skip — truck has not yet cleared the player's y-zone.
        if(t.shieldGrace>0){t.shieldGrace-=dt;continue;}

        // ── Ghost: phase through once, award near-miss bonus ──
        if(ghostTimer>0){
          if(!t.ghosted){
            t.ghosted=true;
            t.nmChecked=true; // suppress the regular near-miss for this truck
            nearMissStreak++;comboDecay=0;
            runNearMisses++;
            if(nearMissStreak>runMaxCombo)runMaxCombo=nearMissStreak;
            const _gPrev=comboMult;
            comboMult=nearMissStreak>=10?4:nearMissStreak>=6?3:nearMissStreak>=3?2:1;
            const _gBlaze=equippedSkin==='red'?1.2:1;
            const _gPts=Math.floor(20*comboMult*nitroMult*_gBlaze);
            score+=_gPts;
            spawnShieldBurst(px,player.y);
            const _nGT=equippedTrail==='neon'?1.25:1.0;
            _nmPush('👻 PHASED!',player.visualX,player.y-player.jumpOff-20,Math.round(65*_nGT),'#e2e8f0',true);
            _nmPush('+'+_gPts,player.visualX,player.y-player.jumpOff-46,Math.round(55*_nGT),'#fbbf24',false);
            if(comboMult>_gPrev){
              _nmPush(comboMult+'× COMBO!',W/2,player.y-player.jumpOff-72,72,'#ef4444',true);
              comboFlashTimer=45;
              svalEl.classList.remove('score-pop');void svalEl.offsetWidth;svalEl.classList.add('score-pop');
              if(comboMult>=4)snd('combo4');
              else if(comboMult>=3)snd('combo3');
              else snd('comboUp');
            } else snd('nearmiss');
            _updateComboBadge();
            checkMission();
          }
          continue; // ghost is active — never crash
        }

        // ── Nitro: smash truck, score once (truck deactivated, normal smash path) ──
        if(nitroTimer>0){
          t._active=false;
          triggerCrash('car',px,player.y,-1);
          return;
        }

        // ── Shield: first hit consumes shield, starts per-truck grace window ──
        // 120-frame grace (2s at 60fps) guarantees the truck clears the player
        // at any stage speed — trucks move at 75% spd so global postShieldGrace
        // (45 frames) was too short and caused an immediate second-hit crash.
        if(activeShield&&!t.shieldHit){
          t.shieldHit=true;
          t.shieldGrace=120;   // per-truck: replaces postShieldGrace for this truck
          activeShield=false;
          shakeAmt=6;
          spawnShieldBurst(px,player.y);
          snd('saved');
          nearMissStreak=0;comboMult=1;comboDecay=0;
          savedFlash=55;
          score+=30;
          _nmPush('SAVED! +30',player.visualX,player.y-player.jumpOff-30,80,'#3b82f6',true);
          _updateComboBadge();
          continue;
        }

        // ── No protection (or player re-entered lane after grace expired): crash ──
        t._active=false;
        triggerCrash('car',px,player.y,-1);
        return;
      }
    }
    // ── TRUCK near-miss ──────────────────────────────────────────────────────
    for(let i=0;i<_TRUCK_POOL._n;i++){
      const t=_TRUCK_POOL[i];if(!t._active)continue;
      const _tContH=t.hits>=1?36:72;
      const _tBottom=t.y+39+_tContH;
      // Fire once: when the truck has fully cleared the player vertically
      if(!t.nmChecked && t.y > player.y+40){
        t.nmChecked=true;
        const ld=Math.abs(LANE_XS[t.lane]-player.visualX);
        if(ld>=27&&ld<92)triggerNearMiss(LANE_XS[t.lane],t.y);
      }
    }
    } // end postShieldGrace else
    // Count cattle that pass safely
    for(let i=0;i<_CATTLE_POOL._n;i++){const c=_CATTLE_POOL[i];if(!c._active||c.dead)continue;if(c.y>H+20&&!c._dodged){c._dodged=true;runCattleDodged++;}}

  }
  // ── Bullet collision — runs during both PLAYING and RESPAWNING (blinking) ──
  if(gst===ST.PLAYING||gst===ST.RESPAWNING){
    for(let _bi=0;_bi<_BULLET_POOL._n;_bi++){
      const _blt=_BULLET_POOL[_bi];if(!_blt._active)continue;
      // vs enemies
      let _bHit=false;
      for(let _ei=0;_ei<_ENEMY_POOL._n;_ei++){
        const _e=_ENEMY_POOL[_ei];if(!_e._active)continue;
        if(Math.abs(_blt.x-LANE_XS[_e.lane])<30&&Math.abs(_blt.y-_e.y)<30){
          _e._active=false;_blt._active=false;_bHit=true;
          score+=20;
          spawnBulletHit(_blt.x,_blt.y,_e._drawColor||'#e84118');snd('gunHit');
          const _epx=_blt.x+(LANE_XS[_e.lane]<W/2?18:-18);
          _nmPush('+20',_epx,_e.y,55,'#fbbf24',false);
          break;
        }
      }

      if(_bHit)continue;
      // vs cattle
      for(let _ci=0;_ci<_CATTLE_POOL._n;_ci++){
        const _c=_CATTLE_POOL[_ci];if(!_c._active||_c.dead)continue;
        if(Math.abs(_blt.x-_c.x)<30&&Math.abs(_blt.y-_c.y)<30){
          _c.dead=true;_blt._active=false;_bHit=true;
          score+=30;
          spawnBulletHit(_blt.x,_blt.y,'#8B5A2B');spawnBloodParticles(_blt.x,_blt.y);snd('gunHitCattle');
          const _cpx=_c.x+(_c.x<W/2?18:-18);
          _nmPush('+30',_cpx,_c.y,55,'#f97316',false);
          break;
        }
      }
      if(_bHit)continue;
      // vs trucks — 2 hits to destroy; first hit shortens container
      for(let _ti=0;_ti<_TRUCK_POOL._n;_ti++){
        const _tr=_TRUCK_POOL[_ti];if(!_tr._active)continue;
        const _trContH=_tr.hits>=1?36:72;
        const _trBottom=_tr.y+35+4+_trContH;
        if(Math.abs(_blt.x-LANE_XS[_tr.lane])<32&&_blt.y>=_tr.y-8&&_blt.y<=_trBottom+8){
          _blt._active=false;_bHit=true;
          _tr.hits++;
          spawnBulletHit(_blt.x,_blt.y,'#d0d0d0');snd('gunHit');
          if(_tr.hits>=2){
            // Truck destroyed on second hit
            _tr._active=false;
            score+=30;
            const _epx=LANE_XS[_tr.lane]+(LANE_XS[_tr.lane]<W/2?20:-20);
            _nmPush('+30',_epx,_tr.y+30,65,'#fbbf24',false);
            _nmPush('TRUCK DOWN!',W/2,_tr.y,80,'#ef4444',true);
            snd('gunHit');haptic([20,10,30]);
          } else {
            // First hit — container shortened
            score+=15;
            const _epx=LANE_XS[_tr.lane]+(LANE_XS[_tr.lane]<W/2?20:-20);
            _nmPush('+15',_epx,_tr.y+20,55,'#fbbf24',false);
            _nmPush('TRUCK HIT!',LANE_XS[_tr.lane],_tr.y-10,70,'#fb923c',false);
            haptic([15,8]);
          }
          break;
        }
      }
      if(_bHit)continue;
      // vs boss — penalty only, no damage
      if(bossActive&&bossCar){
        if(Math.abs(_blt.x-bossCar.x)<40&&Math.abs(_blt.y-bossCar.y)<40){
          _blt._active=false;
          coinBank=Math.max(0,coinBank-5);saveLS('rr_coins2',coinBank);cvalEl.textContent=coinBank;
          snd('gunPenalty');
          if(!bossShotWarningGiven){
            bossShotWarningGiven=true;
            _nmPush('⚠ DONT SHOOT THE COPS',W/2,120,100,'#ef4444',false);
          }
        }
      }
    }
  }
}


/* ── Confetti particles for new personal best ── */
function _mkConfetti(){
  const cols=['#fbbf24','#fde68a','#f59e0b','#fcd34d','#fffbeb','#fef3c7'];
  const arr=[];
  for(let i=0;i<45;i++){
    arr.push({
      x:Math.random()*W,
      y:-10-Math.random()*80,
      vx:(Math.random()-0.5)*2.8,
      vy:1.8+Math.random()*2.5,
      size:3+Math.random()*5,
      color:cols[Math.floor(Math.random()*cols.length)],
      rot:Math.random()*Math.PI*2,
      rotV:(Math.random()-0.5)*0.18,
      life:1
    });
  }
  return arr;
}

// ── BOSS SPAWN ──────────────────────────────────────────
function spawnBoss(){
  if(!bossActive){
    bossActive=true;
    bossWarned=false; // cinematic ends the instant boss spawns
    bossCar={x:player.visualX,y:-100,id:'boss'};
    bossTimer=480; // 8 seconds at 60fps
    snd('bossAppear');haptic([80,20,80]);
    _nmPush('⚠ PURSUIT!',W/2,H/2-20,150,'#ef4444',true);
  }
}


/* ══════════════════════════════════════════════
   SHOP
══════════════════════════════════════════════ */
const SHOP_TABS=['SKINS','TRAILS','BOOSTS'];
const SHOP_DATA=[SKINS,TRAILS,BOOSTS];
function isOwned(id){return ownedItems.includes(id);}

function _mkShopConfetti(){
  // Colourful confetti burst for shop purchase celebration
  const cols=['#fbbf24','#fde68a','#f59e0b','#4ade80','#60a5fa','#c084fc','#f87171','#fb923c','#ffffff'];
  const arr=[];
  for(let i=0;i<60;i++){
    arr.push({
      x:Math.random()*W,
      y:-10-Math.random()*60,
      vx:(Math.random()-0.5)*3.5,
      vy:2.2+Math.random()*3.2,
      size:3+Math.random()*6,
      color:cols[Math.floor(Math.random()*cols.length)],
      rot:Math.random()*Math.PI*2,
      rotV:(Math.random()-0.5)*0.22,
      life:1
    });
  }
  return arr;
}

function shopBuy(){
  const item=SHOP_DATA[shopTab][shopIdx];if(!item)return;
  // Prestige gate — LEGENDARY items require reaching their prestige stage first
  if(item.prestige&&bestStageEver<item.prestige&&!isOwned(item.id)){snd('deny');return;}
  if(isOwned(item.id)){
    // Already owned — just equip it
    if(shopTab===0){equippedSkin=item.id;saveLS('rr_skin2',equippedSkin);}
    if(shopTab===1){equippedTrail=item.id;saveLS('rr_trail2',equippedTrail);}
    if(shopTab===2){equippedBoost=item.id;saveLS('rr_boost2',equippedBoost);}
    snd('equip');
    shopCelebrationTimer=55;
    shopBoughtNewItem=false;
    shopConfettiParticles=[];
  } else if(coinBank>=item.price){
    // New purchase — deduct coins, equip, celebrate!
    coinBank-=item.price;saveLS('rr_coins2',coinBank);cvalEl.textContent=coinBank;
    ownedItems.push(item.id);saveLS('rr_owned2',ownedItems);
    if(shopTab===0){equippedSkin=item.id;saveLS('rr_skin2',equippedSkin);}
    if(shopTab===1){equippedTrail=item.id;saveLS('rr_trail2',equippedTrail);}
    if(shopTab===2){equippedBoost=item.id;saveLS('rr_boost2',equippedBoost);}
    snd('cheer');
    shopCelebrationTimer=130;
    shopBoughtNewItem=true;
    shopConfettiParticles=_mkShopConfetti();
    haptic([30,20,60,20,30]);
  } else snd('deny');
}

/* ══════════════════════════════════════════════
   MACHINE GUN FIRE
══════════════════════════════════════════════ */
function doGunFire(){
  if(gst!==ST.PLAYING&&gst!==ST.RESPAWNING)return;
  if(!gunActive||gunAmmo<=0)return;
  if(gunFireCooldown>0)return;
  const b=_BULLET_POOL._get();
  const _py=player.y-player.jumpOff;
  b.x=player.visualX;b.y=_py-42;b.vy=-15;b.lane=player.lane;
  gunAmmo--;
  gunFireCooldown=9;  // ~150ms at 60fps
  gunRecoilTimer=4;
  gunMuzzleFlash=3;
  snd('gunFire');haptic(15);
  _updateGunBtn();
  if(gunAmmo<=0){
    gunActive=false;
    _updateGunBtn();
  }
}

/* ══════════════════════════════════════════════
   INPUT
══════════════════════════════════════════════ */
function doLeft(){
  if(gst===ST.SHOP){const it=SHOP_DATA[shopTab];shopIdx=(shopIdx-1+it.length)%it.length;snd('switch');return;}
  if(gst!==ST.PLAYING&&gst!==ST.RESPAWNING)return;
  if(tutNitroMoveLocked||tutNitroWarmupActive)return; // locked during nitro tap-wait and smash
  if(tutRewindActive)return;    // no input during rewind
  if(player.lane>0){
    const _oldLane=player.lane; // capture BEFORE decrement
    player.lane--;snd('switch');haptic(18);
    // Fire perfect near-miss immediately if an enemy was in the vacated lane within 80px
    for(let i=0;i<_ENEMY_POOL._n;i++){
      const e=_ENEMY_POOL[i];if(!e._active||e.nmChecked)continue;
      // Skip for all tutorial-spawned enemies — no perfect dodge awards during tutorial
      if(tutPhase>=0&&(e===tutEnemyRef||e===tutPhase1EnemyRef2||
         e===tutJumpEnemyRef1||e===tutJumpEnemyRef2||e===tutShootEnemyRef))continue;
      if(e.lane===_oldLane&&Math.abs(e.y-player.y)<=80){_firePerfectDodge(e);break;}
    }
  }
}
function doRight(){
  if(gst===ST.SHOP){const it=SHOP_DATA[shopTab];shopIdx=(shopIdx+1)%it.length;snd('switch');return;}
  if(gst!==ST.PLAYING&&gst!==ST.RESPAWNING)return;
  if(tutNitroMoveLocked||tutNitroWarmupActive)return; // locked during nitro tap-wait and smash
  if(tutRewindActive)return;    // no input during rewind
  const _mxLane=weatherType==='roadworks'?2:3;
  if(player.lane<_mxLane){
    const _oldLane=player.lane; // capture BEFORE increment
    player.lane++;snd('switch');haptic(18);
    // Fire perfect near-miss immediately if an enemy was in the vacated lane within 80px
    for(let i=0;i<_ENEMY_POOL._n;i++){
      const e=_ENEMY_POOL[i];if(!e._active||e.nmChecked)continue;
      // Skip for all tutorial-spawned enemies — no perfect dodge awards during tutorial
      if(tutPhase>=0&&(e===tutEnemyRef||e===tutPhase1EnemyRef2||
         e===tutJumpEnemyRef1||e===tutJumpEnemyRef2||e===tutShootEnemyRef))continue;
      if(e.lane===_oldLane&&Math.abs(e.y-player.y)<=80){_firePerfectDodge(e);break;}
    }
  }
}
function doJump(){
  if(gst===ST.SHOP){shopTab=(shopTab+1)%3;shopIdx=0;snd('switch');return;}
  if(gst!==ST.PLAYING&&gst!==ST.RESPAWNING)return;
  if(tutRewindActive)return;
  if(!player.jumping&&player.jumpCD<=0){player.jumping=true;player.jumpProg=0;snd('jump');haptic(24);}
}
function doDown(){if(gst===ST.SHOP){shopTab=(shopTab-1+3)%3;shopIdx=0;snd('switch');}}
function doStart(){
  initAC();
  // SPLASH with menu visible: do nothing (buttons handle navigation)
  if(gst===ST.SPLASH){return;}
  if(gst===ST.HOWTO){gst=ST.SPLASH;return;}
  if(gst===ST.REVIVE){doRevive();return;}
  if(gst===ST.GAMEOVER)reset();
  // ST.INTRO: only triggered by the explicit PLAY button tap in the touch handler above
}
function doRevive(){
  reviveUsed=true;
  gst=ST.RESPAWNING;player.lives=1;player.invTimer=200;
  const px=player.visualX;
  for(let i=0;i<_ENEMY_POOL._n;i++){const e=_ENEMY_POOL[i];if(e._active&&!(Math.abs(LANE_XS[e.lane]-px)>90||e.y<player.y-130))e._active=false;}
  for(let i=0;i<_OBST_POOL._n;i++){const o=_OBST_POOL[i];if(o._active&&!(Math.abs(LANE_XS[o.lane]-px)>90||o.y<player.y-130))o._active=false;}
  for(let i=0;i<_TRUCK_POOL._n;i++){const t=_TRUCK_POOL[i];if(t._active&&Math.abs(LANE_XS[t.lane]-px)<=60)t._active=false;}
  for(let i=0;i<_CATTLE_POOL._n;i++){const c=_CATTLE_POOL[i];if(c._active&&c.dead)c._active=false;}
  _CRASH_POOL._reset();_BLOOD_POOL._reset();_SHIELD_POOL._reset();
  updateLivesHUD();startEngine();
}
function doShop(){
  initAC();
  if(gst===ST.INTRO||gst===ST.GAMEOVER||gst===ST.SPLASH){preShop=gst;gst=ST.SHOP;shopTab=0;shopIdx=0;}
  else if(gst===ST.SHOP)gst=preShop;
}
function doSelect(){
  if(gst===ST.SHOP){shopBuy();return;}
  if(gst===ST.INTRO){showStats=false;reset();return;}
  if(gst===ST.SPLASH&&_splashMenuBtns){showStats=false;reset();return;}
  doStart();
}
