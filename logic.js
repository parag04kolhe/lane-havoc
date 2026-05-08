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
  _updateComboBadge();
}
function reset(){
  stopMenuMusic();
  showStats=false;
  gamePaused=false;exitConfirmActive=false;
  const pb=document.getElementById('pauseBtn');if(pb)pb.textContent='⏸';
  initVars();gst=ST.PLAYING;
  // Activate guided tutorial on first-ever run
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
  const _eRate = s<=1?0.009 : s<=3?0.013 : s<=5?0.016 : s<=7?0.019 : s<=9?0.023 : 0.026;
  const _oRate = s<=1?0 : s===2?0.005 : s<=3?0.007 : s<=5?0.009 : s<=9?0.011 : 0.013;
  const _eGap  = s<=1?300 : s<=3?220 : s<=5?170 : 130;
  const _eMax  = s<=1?2 : s<=3?3 : s<=7?4 : 6;
  const _oMax  = s<=1?0 : s===2?1 : s<=3?2 : s<=7?2 : 3;

  return {
    // ── Enemy ──────────────────────────────────
    // Spawn probability per frame — scaled by post-stage multiplier, hard cap 0.036
    enemyRate:    Math.min(0.036, _eRate * _pm),
    // Max simultaneous enemies — grows by 1 every 5 post-stages (cap 8)
    maxEnemies:   s>20 ? Math.min(8, _eMax + Math.floor((s-20)/5)) : _eMax,
    // Min px gap shrinks post-stage but never below 80px (keeps game fair)
    enemyMinGap:  Math.max(80, Math.round(_eGap / _pm)),
    // Speed variation: fraction of enemies that get it, and ±range as fraction of base
    // Stage 3: 40% cars ±40%. Stage 6-7: 30% cars ±30%. Stage 8+: 40% cars ±20%.
    enemyVarChance: s===3?0.40 : (s>=6&&s<=7)?0.30 : s>=8?0.40 : 0,
    enemyVarRange:  s===3?0.40 : (s>=6&&s<=7)?0.30 : s>=8?0.20 : 0,

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
  const lane=f[Math.floor(Math.random()*f.length)];
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
// Lane weights: edges (0,3) = weight 3 each, centres (1,2) = weight 2 each → edges 50% more likely
const _COIN_LANE_WEIGHTS=[3,2,2,3];
const _COIN_LANE_CUM=[3,5,7,10];
function _weightedLane(cum){const r=Math.floor(Math.random()*cum[cum.length-1]);for(let i=0;i<cum.length;i++)if(r<cum[i])return i;return 3;}
function spawnCoin(dt){
  if(_COIN_POOL._count()>=6)return;
  if(Math.random()<0.018*dt){
    const lane=_weightedLane(_COIN_LANE_CUM),count=Math.random()<0.3?3:1;
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
    const lane=_weightedLane(_PU_LANE_CUM);
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
  const lane=Math.floor(Math.random()*4);
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
   MISSIONS SYSTEM
══════════════════════════════════════════════ */
const MISSION_DEFS=[
  {id:'coins15',   text:'Collect 15 coins in one run',  reward:30, check:()=>sessionCoins>=15},
  {id:'nearMiss3', text:'Get 3 near-misses in a row',   reward:20, check:()=>nearMissStreak>=3},
  {id:'nitroRain', text:'Use nitro while it\'s raining', reward:25, check:()=>runNitroRainDone},
  {id:'stages3',   text:'Survive 3 stages in one run',   reward:40, check:()=>runStagesSurvived>=3},
];
let activeMission=null,missionCompleteFlash=0,missionCompleteText='';
let missionProgress=0; // current progress value for display
function loadMission(){
  const today=new Date().toDateString();
  const saved=loadLS('rr_mission','{}');
  if(saved.date===today&&saved.id){
    activeMission=MISSION_DEFS.find(m=>m.id===saved.id)||null;
    if(saved.done) activeMission=null; // already completed today
  } else {
    const idx=Math.floor(Math.random()*MISSION_DEFS.length);
    activeMission=MISSION_DEFS[idx];
    saveLS('rr_mission',{date:today,id:activeMission.id,done:false});
  }
}
function checkMission(){
  if(!activeMission)return;
  if(activeMission.check()){
    const today=new Date().toDateString();
    saveLS('rr_mission',{date:today,id:activeMission.id,done:true});
    coinBank+=activeMission.reward;saveLS('rr_coins2',coinBank);cvalEl.textContent=coinBank;
    missionCompleteText='MISSION DONE! +'+activeMission.reward+' COINS';
    missionCompleteFlash=240;
    activeMission=null;
    snd('missionComplete');haptic([30,20,60,20,30]);
  }
}

/* ══════════════════════════════════════════════
   SHARE — Run Summary screenshot + text + link
══════════════════════════════════════════════ */
function _doShareRunSummary(){
  const _finalScore=Math.floor(score);
  const runDist=parseFloat((distanceTravelled/15120).toFixed(2));
  // ⚠️ Replace the URL below with your real Play Store link once approved
  const PLAY_URL='https://play.google.com/store/apps/details?id=com.youname.lanehavoc';
  const shareText=
    '🏎️ Lane Havoc — My Run!\n'+
    '📊 Score: '+_finalScore+'  |  Stage: '+stageNum+'\n'+
    '📏 Distance: '+runDist+'km  |  🪙 Coins: +'+sessionCoins+'\n'+
    '💨 Near-Misses: '+runNearMisses+'  |  ⚡ Best Streak: '+runMaxCombo+'×\n\n'+
    'Think you can beat me? Download Lane Havoc — the intelligent arcade racer:\n'+
    PLAY_URL;

  const _tryShare=function(file){
    const data={title:'Lane Havoc — My Run Summary',text:shareText};
    if(file&&navigator.canShare&&navigator.canShare({files:[file]})){data.files=[file];}
    if(navigator.share){
      navigator.share(data).catch(function(){});
    } else if(navigator.clipboard){
      navigator.clipboard.writeText(shareText).catch(function(){});
    }
  };

  try{
    canvas.toBlob(function(blob){
      if(blob){
        var f=new File([blob],'lane-havoc-run.png',{type:'image/png'});
        _tryShare(f);
      } else {
        _tryShare(null);
      }
    },'image/png');
  } catch(e){
    _tryShare(null);
  }
}
loadMission();


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
  // ── TUTORIAL PHASES 1-3: let crash play normally, then rewind instead of gameover ──
  // We flag it here so the real crash animation (particles, shake, sound) plays,
  // then _beginTutRewind() is called from the ST.CRASHING handler after 90 frames.
  if(tutPhase>=1&&tutPhase<=3&&!tutRewindActive&&!tutCrashPending&&nitroTimer<=0){
    _flagTutCrash(type);
    // Fall through — normal crash logic below handles the rest
  }
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
  coinBank++;sessionCoins++;saveLS('rr_coins2',coinBank);cvalEl.textContent=coinBank;
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
  snd('nitroOn');
  if(weatherType==='rain'&&!runNitroRainDone){runNitroInRain=true;runNitroRainDone=true;checkMission();}
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
      if(player.lives<=0){
        // Offer revive if score >= 300 and haven't used it this run
        if(Math.floor(score)>=300&&!reviveUsed){
          gst=ST.REVIVE;reviveTimer=600; // 10s at 60fps
        } else {
          if(Math.floor(score)>bestScore){bestScore=Math.floor(score);if(bvalEl)bvalEl.textContent=bestScore;saveLS('rr_best2',bestScore);}
          saveLifetimeStats();
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

  // dashOff advances only during active play — ties lane dashes and kerb stripes
  // directly to game speed. Stops during crash, revive, gameover.
  dashOff+=spd*dt;

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
        setTimeout(()=>{spawnBoss();},800);
      } else {
        stageFlash={stage:stageNum,timer:220,boss:false,bonus:stageBonus,isMilestone:(stageNum%5===0)};
      }
      if(s%2===0&&player.lives<3){
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
      bossActive=false;bossCar=null;
      const bossReward=80;
      score+=bossReward;coinBank+=3;saveLS('rr_coins2',coinBank);cvalEl.textContent=coinBank;
      _nmPush('BOSS ESCAPED! +'+bossReward,W/2,H/2-30,120,'#fbbf24',true);
      snd('bossDefeated');haptic([40,20,60,20,40]);
    } else if(gst===ST.PLAYING){
      // Boss collision — only check if boss is still alive
      const px=player.visualX,py=player.y-player.jumpOff;
      if(Math.abs(px-bossCar.x)<34&&Math.abs(py-bossCar.y)<52){
        bossActive=false;bossCar=null;
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

function shopBuy(){
  const item=SHOP_DATA[shopTab][shopIdx];if(!item)return;
  // Prestige gate — LEGENDARY items require reaching their prestige stage first
  if(item.prestige&&bestStageEver<item.prestige&&!isOwned(item.id)){snd('deny');return;}
  if(isOwned(item.id)){
    if(shopTab===0){equippedSkin=item.id;saveLS('rr_skin2',equippedSkin);}
    if(shopTab===1){equippedTrail=item.id;saveLS('rr_trail2',equippedTrail);}
    if(shopTab===2){equippedBoost=item.id;saveLS('rr_boost2',equippedBoost);}
    snd('buy');
  } else if(coinBank>=item.price){
    coinBank-=item.price;saveLS('rr_coins2',coinBank);cvalEl.textContent=coinBank;
    ownedItems.push(item.id);saveLS('rr_owned2',ownedItems);
    if(shopTab===0){equippedSkin=item.id;saveLS('rr_skin2',equippedSkin);}
    if(shopTab===1){equippedTrail=item.id;saveLS('rr_trail2',equippedTrail);}
    if(shopTab===2){equippedBoost=item.id;saveLS('rr_boost2',equippedBoost);}
    snd('buy');
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
  if(tutNitroMoveLocked)return; // movement locked during tutorial nitro smash
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
  if(tutNitroMoveLocked)return; // movement locked during tutorial nitro smash
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
