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
  // Activate guided tutorial on first-ever run — skipped in Finger Track mode
  if(!tutorialShown.fullTutorial && playMode!=='track'){ tutPhase=0; }
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

  // Share link — just the base game URL
  const _baseURL = (function(){
    try{ return window.location.origin + window.location.pathname; }catch(e){ return 'https://lanehavoc.app/'; }
  })();

  const shareText =
    '\uD83C\uDFCE\uFE0F Lane Havoc \u2014 My Run!\n'+
    '\uD83D\uDCCA Score: '+_finalScore+'  |  Stage: '+stageNum+'\n'+
    '\uD83D\uDCCF '+km+' km  |  \uD83D\uDD25 '+runMaxCombo+'\u00D7 streak  |  \uD83E\uDE99 +'+sessionCoins+'\n\n'+
    '\uD83C\uDFAE Play Lane Havoc: '+_baseURL;

  /* ─────────────────────────────────────────────────────────────
     SHARE CAR IMAGE — high-quality PNG embedded at build time
     240×316 source, drawn at 160 logical units on 400-unit canvas
  ───────────────────────────────────────────────────────────── */
  var _SHARE_CAR_B64='data:image/png;base64,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';
  var _shareCarImg=new Image();
  _shareCarImg.src=_SHARE_CAR_B64;

  /* ── Build the 1080×1080 share card ── */
  function _buildCard(cardCtx){
    /* Canvas is 1080×1080 physical pixels.
       We apply a 2.7× scale so all drawing uses a clean 400×400 logical space —
       identical coordinate system to the rest of the game. */
    const PHYS=1080, SCALE=2.7;
    const CW=PHYS/SCALE, CH=PHYS/SCALE; // logical: ~400 × ~400

    cardCtx.save();
    cardCtx.scale(SCALE, SCALE);
    cardCtx.imageSmoothingEnabled=true;
    cardCtx.imageSmoothingQuality='high';

    // ── Background ──
    cardCtx.fillStyle='#0a0c14';
    cardCtx.fillRect(0,0,CW,CH);

    // Subtle cyan grid
    cardCtx.save();
    cardCtx.globalAlpha=0.04;cardCtx.strokeStyle='#38bdf8';cardCtx.lineWidth=1;
    for(let x=0;x<CW;x+=28){cardCtx.beginPath();cardCtx.moveTo(x,0);cardCtx.lineTo(x,CH);cardCtx.stroke();}
    for(let y=0;y<CH;y+=28){cardCtx.beginPath();cardCtx.moveTo(0,y);cardCtx.lineTo(CW,y);cardCtx.stroke();}
    cardCtx.restore();

    // ── Skin colour from equipped skin ──
    const sc=(function(){
      try{const sk=(typeof getSkin==='function')?getSkin():null;return(sk&&sk.color)?sk.color:'#00e676';}
      catch(e){return '#00e676';}
    })();

    // ── Car zone: car top at y=78, bottom ≈205, mid ≈141 ──
    const carCY=141;

    // Radial halo behind car
    const halo=cardCtx.createRadialGradient(CW/2,carCY,10,CW/2,carCY,105);
    halo.addColorStop(0,sc+'30');halo.addColorStop(0.55,sc+'0c');halo.addColorStop(1,'transparent');
    cardCtx.fillStyle=halo;cardCtx.fillRect(0,40,CW,200);

    // Speed lines radiating from car centre
    cardCtx.save();cardCtx.globalAlpha=0.09;
    for(let i=0;i<20;i++){
      const a=(i/20)*Math.PI*2;const len=55+(i*9)%80;
      const sx=CW/2+Math.cos(a)*28, sy=carCY+Math.sin(a)*18;
      const ex=CW/2+Math.cos(a)*(28+len), ey=carCY+Math.sin(a)*(18+len*0.42);
      const slG=cardCtx.createLinearGradient(sx,sy,ex,ey);
      slG.addColorStop(0,sc);slG.addColorStop(1,'transparent');
      cardCtx.strokeStyle=slG;cardCtx.lineWidth=0.8+(i%3)*0.45;
      cardCtx.beginPath();cardCtx.moveTo(sx,sy);cardCtx.lineTo(ex,ey);cardCtx.stroke();
    }
    cardCtx.restore();

    // Floor reflection ellipse
    const refG=cardCtx.createRadialGradient(CW/2,carCY+68,0,CW/2,carCY+68,72);
    refG.addColorStop(0,'rgba(0,230,118,0.14)');refG.addColorStop(1,'transparent');
    cardCtx.fillStyle=refG;cardCtx.beginPath();
    cardCtx.ellipse(CW/2,carCY+68,72,14,0,0,Math.PI*2);cardCtx.fill();

    // ── Game logo ──
    const _logo=window._LANE_HAVOC_LOGO;
    if(_logo&&_logo.complete&&_logo.naturalWidth>0){
      const lH=62, lW=Math.round(lH*_logo.naturalWidth/_logo.naturalHeight);
      cardCtx.save();
      cardCtx.shadowColor=sc;cardCtx.shadowBlur=18;
      cardCtx.drawImage(_logo, Math.round(CW/2-lW/2), 7, lW, lH);
      cardCtx.restore();
    } else {
      // Text fallback if logo not loaded
      cardCtx.save();
      cardCtx.font="900 22px 'Orbitron',sans-serif";
      cardCtx.fillStyle=sc;cardCtx.textAlign='center';cardCtx.textBaseline='middle';
      cardCtx.shadowColor=sc;cardCtx.shadowBlur=18;
      cardCtx.fillText('LANE HAVOC',CW/2,38);
      cardCtx.restore();
    }

    // ── Player car image (high-res embedded PNG) ──
    // Car is 0.6× the original 160px = 96 logical units wide
    // Logo occupies y≈7..69, so car starts at y=78 to avoid overlap
    if(_shareCarImg.complete&&_shareCarImg.naturalWidth>0){
      const cW=96, cH=Math.round(cW*_shareCarImg.naturalHeight/_shareCarImg.naturalWidth);
      // Centre horizontally; top of car at y=78 (well below logo bottom at ~69)
      const cX=Math.round(CW/2-cW/2), cY=78;

      // Skin colour tint overlay (if not default green)
      cardCtx.save();
      cardCtx.drawImage(_shareCarImg, cX, cY, cW, cH);
      if(sc!=='#00e676'&&sc!=='#22c55e'){
        cardCtx.globalAlpha=0.22;
        cardCtx.globalCompositeOperation='source-atop';
        cardCtx.fillStyle=sc;
        cardCtx.fillRect(cX, cY, cW, cH);
      }
      cardCtx.restore();

      // Exhaust glow flames matching gameplay style:
      // two thin jets from rear exhaust pipes, colour from skin tint
      const _exCarY = cY+cH;
      [cX+cW*0.30, cX+cW*0.70].forEach(function(exX){
        // Outer glow (wide, faint)
        const fgOuter=cardCtx.createLinearGradient(exX,_exCarY,exX,_exCarY+20);
        fgOuter.addColorStop(0,sc+'bb');fgOuter.addColorStop(0.5,sc+'44');
        fgOuter.addColorStop(1,'transparent');
        cardCtx.save();cardCtx.globalAlpha=0.55;cardCtx.fillStyle=fgOuter;
        cardCtx.beginPath();cardCtx.ellipse(exX,_exCarY+8,5,12,0,0,Math.PI*2);cardCtx.fill();
        cardCtx.restore();
        // Inner core (narrow, bright)
        const fgInner=cardCtx.createLinearGradient(exX,_exCarY,exX,_exCarY+14);
        fgInner.addColorStop(0,'#ffffff');fgInner.addColorStop(0.25,'#ffffa0');
        fgInner.addColorStop(0.6,'#ff8800');fgInner.addColorStop(1,'transparent');
        cardCtx.save();cardCtx.globalAlpha=0.90;cardCtx.fillStyle=fgInner;
        cardCtx.beginPath();cardCtx.ellipse(exX,_exCarY+5,2.2,8,0,0,Math.PI*2);cardCtx.fill();
        cardCtx.restore();
      });
    }

    // ── Stage cleared ribbon — starts just below car bottom (~205) ──
    const rY=212,rW=220,rH=22,rX=CW/2-rW/2;
    const rg=cardCtx.createLinearGradient(rX,rY,rX+rW,rY);
    rg.addColorStop(0,'rgba(245,158,11,0)');
    rg.addColorStop(0.12,'rgba(245,158,11,0.92)');
    rg.addColorStop(0.88,'rgba(245,158,11,0.92)');
    rg.addColorStop(1,'rgba(245,158,11,0)');
    cardCtx.save();
    cardCtx.fillStyle=rg;cardCtx.fillRect(rX,rY,rW,rH);
    cardCtx.font="bold 9.5px 'Orbitron',monospace";
    cardCtx.fillStyle='#0a0c14';cardCtx.textAlign='center';cardCtx.textBaseline='middle';
    cardCtx.fillText('\u2605  STAGE '+stageNum+' CLEARED  \u2605',CW/2,rY+11);
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
    cardCtx.font="500 9px 'Rajdhani',sans-serif";
    cardCtx.fillStyle='rgba(255,255,255,0.20)';
    cardCtx.textAlign='center';cardCtx.textBaseline='middle';
    cardCtx.fillText('Lane Havoc  \u2022  CAN YOU BEAT THIS?',CW/2,divY+14);

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
  if(_shareCarImg.complete&&_shareCarImg.naturalWidth>0){
    _renderAndShare();
  } else {
    _shareCarImg.onload=_renderAndShare;
    _shareCarImg.onerror=function(){_renderAndShare();};
    // Safety timeout — if image fails to decode in 2s, share without it
    setTimeout(function(){
      if(!_shareCarImg.complete){_renderAndShare();}
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
      if(!tutNitroMoveLocked&&!tutRewindActive&&player.lane!==_ftActiveLane){
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
