(() => {
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const pad = (n, l = 2) => String(Math.floor(n)).padStart(l, '0');
const uid = () => 'i' + Math.random().toString(36).slice(2, 9);
const tc = v => { const t = String(v ?? ''); return (t.length > 3 && t === t.toUpperCase() && /[A-Z]/.test(t)) ? t.replace(/[A-Z][A-Z']*/g, w => w[0] + w.slice(1).toLowerCase()) : t; };
const fmt1 = n => (Math.round(n * 10) / 10).toString();

const SPECIAL_DEFS = [
  { k:'S', name:'STRENGTH',     img:'Strength',     desc:'Raw physical power. Governs how much you can carry and how hard you hit in melee and unarmed combat, and sets the minimum Strength many weapons require to be used without penalty.' },
  { k:'P', name:'PERCEPTION',   img:'Perception',   desc:'Awareness of your surroundings and your eye for detail. Improves your sense of enemies at a distance and feeds Energy Weapons, Explosives and Lockpick.' },
  { k:'E', name:'ENDURANCE',    img:'Endurance',    desc:'Stamina and resilience. Every point adds to your total Hit Points and strengthens Survival and Unarmed. HP = 100 + (Endurance x 20).' },
  { k:'C', name:'CHARISMA',     img:'Charisma',     desc:'Your charm and force of personality. Determines how well you haggle and persuade, boosting Barter and Speech.' },
  { k:'I', name:'INTELLIGENCE', img:'Intelligence', desc:'Raw mental capacity. Drives Medicine, Repair and Science, and decides how many skill points you gain each time you level.' },
  { k:'A', name:'AGILITY',      img:'Agility',      desc:'Coordination and reflexes. Sets your pool of Action Points for V.A.T.S. and boosts Guns and Sneak. AP = 65 + (Agility x 3).' },
  { k:'L', name:'LUCK',         img:'Luck',         desc:'Fate itself. Every point nudges every skill upward and shifts the odds of critical hits in your favor.' }
];

const SKILL_DEFS = [
  { id:'barter',  name:'BARTER',          a:'C', desc:'Skill at haggling with merchants. Better Barter means lower buying prices and higher selling prices.' },
  { id:'energy',  name:'ENERGY WEAPONS',  a:'P', desc:'Proficiency with laser, plasma and other energy-based firearms. Affects accuracy and condition wear.' },
  { id:'explo',   name:'EXPLOSIVES',      a:'P', desc:'Expertise with grenades, mines and heavy launchers. Also governs disarming mines and how far you can throw.' },
  { id:'guns',    name:'GUNS',            a:'A', desc:'Skill with conventional firearms, from pistols and rifles to shotguns and machine guns.' },
  { id:'lock',    name:'LOCKPICK',        a:'P', desc:'Ability to open locked doors and containers. Higher skill opens harder locks.' },
  { id:'med',     name:'MEDICINE',        a:'I', desc:'Knowledge of first aid and pharmacology. Makes Stimpaks and Doctor\'s Bags more effective.' },
  { id:'melee',   name:'MELEE WEAPONS',   a:'S', desc:'Skill with knives, bats, swords, spears and other hand-held weapons.' },
  { id:'repair',  name:'REPAIR',          a:'I', desc:'Know-how for restoring damaged weapons and armor, and for building improvised gear.' },
  { id:'science', name:'SCIENCE',         a:'I', desc:'Understanding of the physical sciences. Hacks terminals and operates advanced technology.' },
  { id:'sneak',   name:'SNEAK',           a:'A', desc:'Ability to move unseen and unheard, pick pockets and strike from the shadows.' },
  { id:'speech',  name:'SPEECH',          a:'C', desc:'Talent for conversation. Opens extra dialogue options and talks people down from violence.' },
  { id:'survive', name:'SURVIVAL',        a:'E', desc:'Wasteland know-how: cooking, crafting remedies, foraging and tracking, plus bonus from food and water.' },
  { id:'unarmed', name:'UNARMED',         a:'E', desc:'Skill at fighting with fists, knuckles and power gloves.' }
];

const PERK_DEFS = [
  { id:'swift',    name:'SWIFT LEARNER',     lvl:1, req:{},        fx:'+10% XP from every source.',                     desc:'You pick things up faster than most. All experience point gains are increased by ten percent.' },
  { id:'intense',  name:'INTENSE TRAINING',  lvl:2, req:{},        fx:'+1 to any SPECIAL attribute.',                   desc:'Dedicated practice pays off. Choose one SPECIAL attribute and raise it by one point (apply on the SPECIAL screen).' },
  { id:'tough',    name:'TOUGHNESS',         lvl:2, req:{E:5},     fx:'+3 Damage Resistance.',                          desc:'You have learned to take a hit. Your Damage Resistance is increased by 3.', dr:3 },
  { id:'aware',    name:'AWARENESS',         lvl:2, req:{P:5},     fx:'V.A.T.S. shows target DR and weapon info.',      desc:'Your sharp eye reveals your target\'s Damage Resistance and wielded weapon in V.A.T.S.' },
  { id:'lady',     name:'LADY KILLER / BLACK WIDOW', lvl:2, req:{}, fx:'+10% damage vs. the opposite sex.',            desc:'Your charm turns lethal. You deal ten percent more damage to the opposite sex and gain extra dialogue options.' },
  { id:'lightstep',name:'LIGHT STEP',        lvl:2, req:{A:6},     fx:'Immune to floor traps and mines.',               desc:'You tread so lightly that pressure plates and proximity mines will not trigger.' },
  { id:'educated', name:'EDUCATED',          lvl:4, req:{I:4},     fx:'+2 skill points on every level-up.',             desc:'Book-learning pays dividends: you gain two extra skill points each time you level up.' },
  { id:'rad',      name:'RAD RESISTANCE',    lvl:4, req:{E:5,I:5}, fx:'+25% radiation resistance.',                     desc:'You have studied the effects of radiation and know how to hold it at bay.' },
  { id:'pack',     name:'PACK RAT',          lvl:4, req:{},        fx:'Items under 2 lbs weigh half.',                  desc:'You never throw anything away. Items weighing two pounds or less count for half their weight.' },
  { id:'strong',   name:'STRONG BACK',       lvl:6, req:{S:6,E:6}, fx:'+50 carry weight.',                              desc:'A tougher spine means a heavier pack. Your carrying capacity is increased by fifty pounds.', carry:50 },
  { id:'finesse',  name:'FINESSE',           lvl:6, req:{},        fx:'+5% critical chance.',                           desc:'Precision over power: all of your attacks have a five percent greater chance to be critical hits.' },
  { id:'gunslinger',name:'GUNSLINGER',       lvl:8, req:{A:6},     fx:'+15% pistol damage; bonus accuracy.',            desc:'One in each hand is overkill. Your one-handed pistols hit harder and are more accurate.' }
];

const STATIONS = [
  { id:'rnv',  name:'RADIO NEW VEGAS',     f:91.2,  blurb:'Smooth tunes and smoother talk from the heart of the Strip.' },
  { id:'mmr',  name:'MOJAVE MUSIC RADIO',  f:96.8,  blurb:'Wasteland standards, played back-to-back, from a lonely transmitter.' },
  { id:'bmr',  name:'BLACK MOUNTAIN RADIO',f:101.4, blurb:'A crackling signal carrying out over the mountains. Listen at your own risk.' }
];

const LIMBS = [
  { k:'head',  name:'HEAD' },
  { k:'torso', name:'TORSO' },
  { k:'larm',  name:'LEFT ARM' },
  { k:'rarm',  name:'RIGHT ARM' },
  { k:'lleg',  name:'LEFT LEG' },
  { k:'rleg',  name:'RIGHT LEG' }
];

const NUMERIC_KEYS = new Set(['qty','wt','val','dmg','ap','rof','cnd','dr','strReq','vatsAmmo','hp','rads']);
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const SAVE_KEY = 'pipboy3000a.fnv.sheet.v1';
const SPECIAL_POOL = 40;
const CLOCK_START = Date.UTC(2281, 9, 22, 8, 0);
const CLOCK_SCALE = 30;

const mk = (cat, o) => Object.assign({ id: uid(), cat, qty: 1, wt: 1, val: 1, note: '' }, o);

function defaultState() {
  const items = [
    mk('weapons', { id:'w_pistol', name:'9mm Pistol',            dmg:18, ap:20, rof:2.2, cnd:100, wt:3,  val:90,  ammo:'9mm Round',       skill:'GUNS',          strReq:4, vatsAmmo:1, note:'Reliable sidearm. Standard issue for couriers.' }),
    mk('weapons', { id:'w_rifle',  name:'Hunting Rifle',         dmg:38, ap:28, rof:1.1, cnd:85,  wt:7,  val:200, ammo:'.308 Round',      skill:'GUNS',          strReq:6, vatsAmmo:1, note:'Bolt-action rifle with a worn but accurate scope.' }),
    mk('weapons', { id:'w_357',    name:'.357 Magnum Revolver',  dmg:41, ap:22, rof:1.4, cnd:70,  wt:3.5,val:195, ammo:'.357 Magnum Round', skill:'GUNS',        strReq:5, vatsAmmo:1, note:'Heavy hitting six-shooter.' }),
    mk('weapons', { id:'w_knife',  name:'Combat Knife',          dmg:20, ap:14, rof:2.5, cnd:90,  wt:1,  val:60,  ammo:'',                skill:'MELEE WEAPONS', strReq:2, vatsAmmo:0, note:'Fast, quiet, and good for sneak attacks.' }),
    mk('weapons', { id:'w_laser',  name:'Laser Pistol',          dmg:22, ap:20, rof:2.0, cnd:100, wt:3,  val:350, ammo:'Microfusion Cell',skill:'ENERGY WEAPONS',strReq:4, vatsAmmo:2, note:'Pre-War energy sidearm.' }),

    mk('apparel', { id:'a_jump',   name:'Vault 21 Jumpsuit',     slot:'BODY', dr:3,  cnd:100, wt:4,  val:30,  note:'Blue and yellow. Still smells faintly of the Vault.' }),
    mk('apparel', { id:'a_leather',name:'Leather Armor',         slot:'BODY', dr:10, cnd:80,  wt:15, val:120, note:'Boiled leather plates, riveted together.' }),
    mk('apparel', { id:'a_combat', name:'Combat Armor',          slot:'BODY', dr:20, cnd:60,  wt:25, val:350, note:'Pre-War military surplus.' }),
    mk('apparel', { id:'a_hat',    name:'Cowboy Hat',            slot:'HEAD', dr:2,  cnd:100, wt:1,  val:25,  note:'Keeps the sun off your neck.' }),

    mk('aid', { id:'d_stim',  name:'Stimpak',          qty:5, hp:30,  rads:0,    wt:0.1, val:25, fx:'RESTORES 30 HP',            note:'Pre-War medical injector.' }),
    mk('aid', { id:'d_rada',  name:'RadAway',          qty:2, hp:0,   rads:-100, wt:0.1, val:40, fx:'REMOVES 100 RADS',          note:'Flushes radiation from the bloodstream.' }),
    mk('aid', { id:'d_water', name:'Purified Water',   qty:3, hp:5,   rads:0,    wt:1,   val:20, fx:'RESTORES 5 HP, QUENCHES',   note:'Clean, safe drinking water.' }),
    mk('aid', { id:'d_nuka',  name:'Nuka-Cola',        qty:2, hp:10,  rads:2,    wt:1,   val:20, fx:'+10 HP, +2 RADS',           note:'Warm and flat, but still delicious.' }),
    mk('aid', { id:'d_radx',  name:'Rad-X',            qty:1, hp:0,   rads:0,    wt:0.1, val:30, fx:'+RAD RESISTANCE (3 MIN)',   note:'Take before entering irradiated areas.' }),

    mk('misc', { id:'m_tape',  name:'Duct Tape',          qty:2, wt:0.5, val:5,  note:'Repair component. Fixes almost everything.' }),
    mk('misc', { id:'m_scrap', name:'Scrap Metal',        qty:4, wt:2,   val:6,  note:'Salvaged for repairs and crafting.' }),
    mk('misc', { id:'m_tin',   name:'Tin Can',            qty:6, wt:0.2, val:1,  note:'Empty. Might be useful as a noisemaker.' }),
    mk('misc', { id:'m_money', name:'Pre-War Money',      qty:12,wt:0,   val:1,  note:'Worthless paper, mostly. Collectors may pay.' }),
    mk('misc', { id:'m_deck',  name:'Deck of Playing Cards', qty:1, wt:0, val:2,  note:'A well-worn deck. One card is missing.' }),

    mk('ammo', { id:'x_9mm',   name:'9mm Round',          qty:60, wt:0.03, val:1 }),
    mk('ammo', { id:'x_308',   name:'.308 Round',         qty:20, wt:0.1,  val:2 }),
    mk('ammo', { id:'x_357',   name:'.357 Magnum Round',  qty:24, wt:0.05, val:2 }),
    mk('ammo', { id:'x_mfc',   name:'Microfusion Cell',   qty:36, wt:0.05, val:3 })
  ];

  return {
    v: 1,
    level: 1,
    hp: 200, ap: 80, rads: 0, caps: 0,
    unlimited: false,
    special: { S:5, P:5, E:5, C:5, I:5, A:5, L:5 },
    tags: [],
    invested: {},
    perks: [],
    karma: 0,
    rep: {},
    limbs: { head:100, torso:100, larm:100, rarm:100, lleg:100, rleg:100 },
    items,
    equip: { w1:'w_pistol', w2:'w_rifle', head:'a_hat', body:'a_jump' },
    bio: {
      name: 'COURIER SIX', dob: '22 OCT 2250', physiology: 'Human', allegiance: 'NONE / INDEPENDENT',
      occupation: 'COURIER', rank: 'N/A',
      height: '5\'11"', weight: '170 LBS',
      hairDesc: 'SHORT, CROPPED, SLIGHTLY MATTED', hairColor: 'BROWN',
      eyes: 'GREEN', skin: 'TANNED, SUN-WEATHERED', bodyType: 'Mesomorphic',
      scars: 'BULLET SCAR ALONG THE LEFT TEMPLE',
      personality: 'Dry-witted and pragmatic. Keeps promises, holds grudges, and never turns down an honest job. Trusts slowly, but loyalty once earned is absolute.'
    },
    notes: [
      { id:'n1', title:'BACKGROUND', body:'> SUBJECT: COURIER SIX\n> STATUS: SURVIVED A BULLET TO THE HEAD IN GOODSPRINGS.\n\nOnce a Mojave Express courier with a simple delivery job. Left for dead in a shallow grave, now carrying a grudge and a Pip-Boy.\n\nLinks and longer lore can be pasted here.' },
      { id:'n2', title:'FIELD LOG 001',  body:'> 22 OCT 2281 08:00\n> Nothing to report yet. Stay alive. Find the man in the checkered suit.' }
    ],
    radio: { on: false, freq: 91.2 },
    clock: { real: Date.now(), game: CLOCK_START }
  };
}

let state = load();

function load() {
  const d = defaultState();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return d;
    const s = JSON.parse(raw);
    if (!s || s.v !== 1) return d;
    const out = Object.assign({}, d, s);
    out.special = Object.assign({}, d.special, s.special);
    out.limbs   = Object.assign({}, d.limbs, s.limbs);
    out.rep     = Object.assign({}, d.rep, s.rep);
    if (!Number.isFinite(out.karma)) out.karma = 0;
    out.equip   = Object.assign({}, d.equip, s.equip);
    out.bio     = Object.assign({}, d.bio, s.bio);
    out.radio   = Object.assign({}, d.radio, s.radio);
    out.clock   = Object.assign({}, d.clock, s.clock);
    if (!Array.isArray(out.items) || !Array.isArray(out.notes)) return d;
    return out;
  } catch (e) { return d; }
}
let saveTimer = 0;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {  } }, 250);
}

const getItem = id => state.items.find(i => i.id === id);
const getNote = id => state.notes.find(n => n.id === id);
const perkTaken = id => state.perks.includes(id);

const maxHp = () => 100 + state.special.E * 20;
const maxAp = () => 65 + state.special.A * 3;
const carryCap = () => 150 + state.special.S * 10 + PERK_DEFS.reduce((a, p) => a + (perkTaken(p.id) && p.carry ? p.carry : 0), 0);
const weightNow = () => state.items.reduce((a, i) => {
  let w = i.wt;
  if (perkTaken('pack') && i.wt <= 2) w = i.wt / 2;
  return a + w * (i.qty || 0);
}, 0);
const equippedApparel = () => ['head', 'body'].map(s => getItem(state.equip[s])).filter(Boolean);
const totalDR = () => equippedApparel().reduce((a, i) => a + i.dr, 0)
                    + PERK_DEFS.reduce((a, p) => a + (perkTaken(p.id) && p.dr ? p.dr : 0), 0);
const dps = it => Math.round(it.dmg * it.rof * 10) / 10;
const skillValue = d => {
  const s = state.special;
  const base = 2 + s[d.a] * 2 + Math.ceil(s.L / 2);
  const tag = state.tags.includes(d.id) ? 15 : 0;
  const inv = state.invested[d.id] || 0;
  return { base, tag, inv, total: clamp(base + tag + inv, 0, 100) };
};
const specialSpent = () => Object.values(state.special).reduce((a, b) => a + b, 0);
const radSickness = r => r >= 800 ? 'DEADLY' : r >= 600 ? 'CRITICAL' : r >= 400 ? 'ADVANCED' : r >= 200 ? 'MINOR' : 'NONE';
const limbPct = k => clamp(state.limbs[k], 0, 100);
const perkEligible = p => state.level >= p.lvl && Object.entries(p.req).every(([k, v]) => state.special[k] >= v);
const ammoCount = name => { const a = state.items.find(i => i.cat === 'ammo' && i.name.toLowerCase() === String(name).toLowerCase()); return a ? a.qty : null; };

function clampVitals() {
  state.hp = clamp(Math.round(state.hp), 0, maxHp());
  state.ap = clamp(Math.round(state.ap), 0, maxAp());
  state.rads = clamp(Math.round(state.rads), 0, 1000);
  state.level = clamp(Math.round(state.level), 1, 99);
  state.caps = Math.max(0, Math.round(state.caps || 0));
}

const Sound = {
  muted: false, ctx: null, files: {}, failed: {}, radioNodes: null,
  init() {
    const map = { tab:'horizontal_tab', focus:'item_focus', radioOn:'radio_on', radioOff:'radio_off' };
    Object.entries(map).forEach(([k, f]) => {
      try {
        const a = new Audio('./assets/sounds/' + f + '.wav');
        a.preload = 'auto';
        a.addEventListener('error', () => { this.failed[k] = true; });
        this.files[k] = a;
      } catch (e) { this.failed[k] = true; }
    });
  },
  ac() {
    if (!this.ctx) { const C = window.AudioContext || window.webkitAudioContext; if (C) this.ctx = new C(); }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  tone(freq, dur, type = 'square', vol = 0.04, to = 0, when = 0) {
    const c = this.ac(); if (!c) return;
    const t = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.linearRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol = 0.05) {
    const c = this.ac(); if (!c) return;
    const len = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(), g = c.createGain(); s.buffer = b; g.gain.value = vol;
    s.connect(g).connect(c.destination); s.start();
  },
  synth(n) {
    switch (n) {
      case 'tab':      this.tone(300, .05, 'square', .045); this.tone(470, .07, 'square', .045, 0, .05); break;
      case 'focus':    this.tone(920, .022, 'square', .03); break;
      case 'click':    this.tone(660, .03, 'square', .035); break;
      case 'use':      this.tone(440, .08, 'triangle', .06); this.tone(660, .1, 'triangle', .06, 0, .08); break;
      case 'error':    this.tone(150, .16, 'sawtooth', .05); break;
      case 'radioOn':  this.noise(.3, .07); this.tone(200, .25, 'sawtooth', .025, 520); break;
      case 'radioOff': this.noise(.2, .05); this.tone(520, .25, 'sawtooth', .025, 150); break;
      case 'boot':     this.noise(.5, .05); this.tone(110, .6, 'sawtooth', .04, 220); break;
    }
  },
  play(n, vol = 0.65) {
    if (this.muted) return;
    const a = this.files[n];
    if (a && !this.failed[n]) {
      try {
        const c = a.cloneNode(); c.volume = vol;
        const p = c.play();
        if (p && p.catch) p.catch(() => this.synth(n));
        return;
      } catch (e) {  }
    }
    this.synth(n);
  },
    radioStart() {
    const c = this.ac(); if (!c || this.radioNodes) return;
    const len = c.sampleRate * 2, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = b; src.loop = true;
    const filt = c.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 2400; filt.Q.value = 0.6;
    const ng = c.createGain(); ng.gain.value = 0;
    src.connect(filt).connect(ng).connect(c.destination); src.start();
    const o1 = c.createOscillator(), o2 = c.createOscillator(), tg = c.createGain();
    o1.type = 'sine'; o1.frequency.value = 196; o2.type = 'triangle'; o2.frequency.value = 294; tg.gain.value = 0;
    o1.connect(tg); o2.connect(tg); tg.connect(c.destination); o1.start(); o2.start();
    this.radioNodes = { src, ng, o1, o2, tg };
    this.radioSet(radioStrength());
  },
  radioSet(str) {
    if (!this.radioNodes || !this.ctx) return;
    const t = this.ctx.currentTime, v = this.muted ? 0 : 1;
    this.radioNodes.ng.gain.setTargetAtTime((0.015 + (1 - str) * 0.07) * v, t, 0.05);
    this.radioNodes.tg.gain.setTargetAtTime((str > 0.55 ? (str - 0.55) * 0.12 : 0) * v, t, 0.08);
    this.radioNodes.o1.frequency.setTargetAtTime(196 + str * 20, t, 0.2);
  },
  radioStop() {
    if (!this.radioNodes) return;
    const n = this.radioNodes; this.radioNodes = null;
    try { n.src.stop(); n.o1.stop(); n.o2.stop(); } catch (e) {  }
  }
};

const TABS = {
  stat: { label:'STATS', subs:[['status','Status'],['special','S.P.E.C.I.A.L.'],['skills','Skills'],['perks','Perks'],['general','General']] },
  inv:  { label:'ITEMS', subs:[['weapons','Weapons'],['apparel','Apparel'],['aid','Aid'],['misc','Misc'],['ammo','Ammo']] },
  data: { label:'DATA',  subs:[['bio','Bio'],['notes','Notes'],['radio','Radio']] }
};
const TAB_ORDER = ['stat', 'inv', 'data'];
const ui = { tab:'stat', sub:{ stat:'status', inv:'weapons', data:'bio' }, sel:{}, confirm:null };

const screenKey = () => ui.tab + '.' + ui.sub[ui.tab];
const getSel = () => ui.sel[screenKey()] || 0;
const setSel = i => { ui.sel[screenKey()] = i; };

const kv = (k, v) => `<div class="kv"><span class="k">${k}</span><span class="lead"></span><span class="v">${v}</span></div>`;
const bar = (pct, cls = '') => `<div class="bar ${cls}"><i style="width:${clamp(pct, 0, 100)}%"></i></div>`;
const dataAttrs = d => Object.entries(d).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ');
const btn = (label, act, d = {}, cls = '', extra = '') => `<button type="button" class="btn ${cls}" data-act="${act}" ${dataAttrs(d)} ${extra}>${label}</button>`;
const ico = name => `<img class="ico" src="./assets/images/status/${name}.svg" alt="">`;

/* ---------- icon library (assets/images/icons/<group>/<name>.png, listed in icons.js) ---------- */
const iconSrc = (g, n) => `./assets/images/icons/${g}/${n}.png`;
const iconHas = (g, n) => !!(typeof ICON_SETS !== 'undefined' && ICON_SETS[g] && ICON_SETS[g].includes(n));
const ICON_STOP = new Set(['item','items','weapons','apperal','appearal','apparel','perk','the','of','a']);
const iconToks = str => String(str).toLowerCase().replace(/[.']/g, '').split(/[^a-z0-9]+/).filter(t => t && !ICON_STOP.has(t));
function iconFuzzy(groups, name) {
  const want = new Set(iconToks(name)); if (!want.size || typeof ICON_SETS === 'undefined') return null;
  let best = null, bs = 0;
  for (const g of groups) for (const slug of (ICON_SETS[g] || [])) {
    const have = iconToks(slug); if (!have.length) continue;
    const hit = have.filter(t => want.has(t)).length; if (!hit) continue;
    const sc = hit / (have.length + want.size - hit) + (have.length === want.size && hit === want.size ? 1 : 0);
    if (sc > bs) { bs = sc; best = [g, slug]; }
  }
  return bs >= 0.5 ? best : null;
}
const ITEM_ICON_ID = {
  w_pistol:['weapons','weapons_9mm_pistol'], w_rifle:['weapons','weapons_hunting_rifle'], w_357:['weapons','weapons_357_revolver'],
  w_knife:['weapons','weapons_combat_knife'], w_laser:['weapons','weapons_laser_pistol'],
  a_jump:['apparel','apperal_vault_21_jumpsuit_armored'], a_leather:['apparel','apperal_leather_armor'],
  a_combat:['apparel','appearal_combat_armor'], a_hat:['apparel','apparel_ranger_hat_1'],
  d_stim:['items','items_stimpack'], d_rada:['items','items_radaway'], d_water:['items','items_water'], d_nuka:['items','items_cola'], d_radx:['items','item_rad_x'],
  m_tape:['items','item_junk'], m_scrap:['items','item_junk'], m_tin:['items','item_junk'], m_money:['items','items_money_ncr_20'], m_deck:['items','item_playing_card'],
  x_9mm:['items','items_9mm_ammo'], x_308:['items','items_308_ammo'], x_357:['items','items_357_magnum_round'], x_mfc:['items','items_energy_cell']
};
const CAT_ICON_GROUPS = { weapons:['weapons'], apparel:['apparel'], aid:['items'], misc:['items'], ammo:['items'] };
const CAT_ICON_FALLBACK = { weapons:['weapons','weapons_baton'], apparel:['apparel','vault_suit'], aid:['items','items_stimpack'], misc:['items','item_junk'], ammo:['items','items_5mm_box'] };
function itemIcon(i) {
  return ITEM_ICON_ID[i.id] || iconFuzzy(CAT_ICON_GROUPS[i.cat] || ['items'], i.name) || CAT_ICON_FALLBACK[i.cat];
}
const iconBox = (ic, label = '') => (ic && iconHas(ic[0], ic[1]))
  ? `<div class="tint icon-box"><img src="${iconSrc(ic[0], ic[1])}" alt="${esc(label)}"></div>` : '';
const PERK_ICON = { swift:'perk_swift_learner', intense:'perk_intense_training', tough:'perk_toughness', aware:'perk_enhanced_sensors', lady:'perk_lady_killer',
  lightstep:'perk_light_step', educated:'perk_educated', rad:'perk_rad_resistance', pack:'perk_pack_rat', strong:'perk_strong_back', finesse:'perk_finesse', gunslinger:'perk_gunslinger' };
const SKILL_ICON = { barter:'skills_barter', energy:'skills_energy_weapons', explo:'skills_explosives', guns:'skills_small_guns', lock:'skills_lockpick', med:'skills_medicine',
  melee:'skills_melee_weapons', repair:'skills_repair', science:'skills_science', sneak:'skills_sneak', speech:'skills_speech', unarmed:'skills_unarmed' };
const fld = (path, val, o = {}) => {
  const type = o.type || 'text';
  return `<input class="fld ${o.cls || ''}" type="${type}" ${type === 'number' ? 'step="any"' : ''} data-bind="${path}" value="${esc(val)}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ''} spellcheck="false" autocomplete="off" aria-label="${esc(o.label || path)}">`;
};
const sel = (path, val, options) => `<select class="fld" data-bind="${path}" aria-label="${esc(path)}">${options.map(o => `<option ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
const kvf = (label, path, val, o = {}) => kv(label, fld(path, val, Object.assign({ type:'number', cls:'num', label }, o)));
const titleRow = (name, tag = '') => `<div class="title-row"><h2>${tc(name)}</h2><span class="tag">${tag}</span></div>`;

/* ------------------------------------------------------------------ *
 *  SCREENS
 *  each: list(), head(), foot(), detail(item, idx, items), adjust(item, d), activate(item), after()
 * ------------------------------------------------------------------ */
const SCREENS = {};

/* ---------- character portrait (uploaded image, kept in localStorage separately from the sheet) ---------- */
const PORTRAIT_KEY = 'pipboy3000a.portrait.v1';
let portrait = loadPortrait();
function loadPortrait() {
  try {
    const o = JSON.parse(localStorage.getItem(PORTRAIT_KEY) || 'null');
    return o && typeof o.src === 'string' && o.src.startsWith('data:image/') ? { src:o.src, tint:o.tint !== false } : null;
  } catch (e) { return null; }
}
function savePortrait() {
  try { portrait ? localStorage.setItem(PORTRAIT_KEY, JSON.stringify(portrait)) : localStorage.removeItem(PORTRAIT_KEY); }
  catch (e) { toast('IMAGE TOO LARGE TO SAVE'); }
}
let portraitPicker = null;
function pickPortrait() {
  portraitPicker = document.createElement('input');
  portraitPicker.type = 'file'; portraitPicker.accept = 'image/*';
  portraitPicker.addEventListener('change', () => { const f = portraitPicker.files && portraitPicker.files[0]; if (f) loadPortraitFile(f); });
  portraitPicker.click();
}
function loadPortraitFile(file) {
  if (!file.type.startsWith('image/')) { toast('NOT AN IMAGE FILE'); return; }
  const url = URL.createObjectURL(file), img = new Image();
  img.onload = () => {
    const sc = Math.min(1, 520 / Math.max(img.width, img.height)), c = document.createElement('canvas');
    c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    portrait = { src: c.toDataURL('image/jpeg', .86), tint: portrait ? portrait.tint : true };
    savePortrait(); toast('PORTRAIT LOADED'); render();
  };
  img.onerror = () => { URL.revokeObjectURL(url); toast('COULD NOT READ IMAGE'); };
  img.src = url;
}
const portraitBox = (cls = '') => portrait
  ? `<div class="portrait ${portrait.tint ? 'tinted' : ''} ${cls}" data-act="portraitup" title="Click to change portrait"><img src="${portrait.src}" alt="Character portrait"></div>`
  : `<button type="button" class="portrait empty ${cls}" data-act="portraitup"><span>+<br>ADD<br>PORTRAIT</span></button>`;

/* ---------- STATUS IMAGE (replaces the Vault Boy limb diagram) ----------
 * One big picture on the Status screen. Upload your own; until then the stock
 * vault_boy.png is shown in Pip-Boy amber. Stored in this browser only. */
const STATUS_IMG_KEY = 'pipboy3000a.statusimg.v1';
const STATUS_IMG_DEFAULT = './assets/images/vault_boy.png';
let statusImg = loadStatusImg();
function loadStatusImg() {
  try {
    const o = JSON.parse(localStorage.getItem(STATUS_IMG_KEY) || 'null');
    return o && typeof o.src === 'string' && o.src.startsWith('data:image/') ? { src:o.src, tint:o.tint !== false } : null;
  } catch (e) { return null; }
}
function saveStatusImg() {
  try { statusImg ? localStorage.setItem(STATUS_IMG_KEY, JSON.stringify(statusImg)) : localStorage.removeItem(STATUS_IMG_KEY); }
  catch (e) { toast('IMAGE TOO LARGE TO SAVE'); }
}
let statusPicker = null;
function pickStatusImg() {
  statusPicker = document.createElement('input');
  statusPicker.type = 'file'; statusPicker.accept = 'image/*';
  statusPicker.addEventListener('change', () => { const f = statusPicker.files && statusPicker.files[0]; if (f) loadStatusFile(f); });
  statusPicker.click();
}
function loadStatusFile(file) {
  if (!file.type.startsWith('image/')) { toast('NOT AN IMAGE FILE'); return; }
  const url = URL.createObjectURL(file), img = new Image();
  img.onload = () => {
    const sc = Math.min(1, 900 / Math.max(img.width, img.height)), c = document.createElement('canvas');
    c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    statusImg = { src: c.toDataURL('image/jpeg', .88), tint: statusImg ? statusImg.tint : true };
    saveStatusImg(); toast('IMAGE LOADED'); render();
  };
  img.onerror = () => { URL.revokeObjectURL(url); toast('COULD NOT READ IMAGE'); };
  img.src = url;
}
const statusImgBox = () => {
  const custom = !!statusImg, tint = custom ? statusImg.tint : true;
  return `<div class="status-img ${tint ? 'tinted' : ''} ${custom ? '' : 'stock'}" data-act="statusup" title="Click to change image">
    <img src="${custom ? statusImg.src : STATUS_IMG_DEFAULT}" alt="Status image">
    ${custom ? '' : '<span class="status-hint">CLICK TO ADD IMAGE</span>'}</div>`;
};

/* ---------- STAT / STATUS ----------
 * Left list = pages. GENERAL is only the character-template identity + physical
 * description, so it fits in a single screenshot. Everything else (SPECIAL, items,
 * perks...) already lives on its own tab and is NOT repeated here. */
SCREENS['stat.status'] = {
  list: () => [
    { key:'general',  name:'GENERAL' },
    { key:'persona',  name:'PERSONALITY' },
    { key:'vitals',   name:'VITALS' },
    { key:'combat',   name:'WEAPONS' }
  ],
  head: () => '<span>CONDITION</span><span>STATE</span>',
  foot: () => `<span>HP ${state.hp}/${maxHp()}</span><span>DR ${totalDR()}</span>`,
  detail(item) {
    const b = state.bio;
    const f = (k, ph, label) => fld('bio.' + k, b[k], { ph, label });
    const key = item ? item.key : 'general';
    let right = '';

    if (key === 'general') {
      right = `
      ${titleRow('GENERAL', 'LVL ' + state.level)}
      <div class="panel"><div class="ph">IDENTITY</div>
        <div class="form">
          <label>Name / Nickname</label>${f('name', 'Full name or alias')}
          <label>Date of Birth</label>${f('dob', 'DD MON YYYY')}
          <label>Physiology</label>${sel('bio.physiology', b.physiology, ['Human', 'Ghoul', 'Supermutant', 'Robot'])}
          <label>Allegiance</label>${f('allegiance', 'Faction or none')}
          <label>Occupation</label>${f('occupation', 'Occupation')}
          <label>Rank / Title</label>${f('rank', 'If applicable')}
        </div></div>
      <div class="panel"><div class="ph">PHYSICAL DESCRIPTION</div>
        <div class="form">
          <label>Height</label>${f('height', `e.g. 5'11"`)}
          <label>Weight</label>${f('weight', 'e.g. 170 LBS')}
          <label>Hair Description</label>${f('hairDesc', 'Length, style')}
          <label>Hair Color</label>${f('hairColor', 'Color')}
          <label>Eye Color</label>${f('eyes', 'Color')}
          <label>Skin Color</label>${f('skin', 'Tone / condition')}
          <label>Body Type</label>${sel('bio.bodyType', b.bodyType, ['Endomorphic', 'Mesomorphic', 'Ectomorphic'])}
          <label>Scars / Blemishes</label>${f('scars', 'Distinguishing marks')}
        </div></div>`;
    }
    else if (key === 'persona') {
      const bgNote = state.notes[0];
      right = `
      ${titleRow('PERSONALITY', 'LVL ' + state.level)}
      <div class="panel"><div class="ph">PERSONALITY DESCRIPTION</div>
        <textarea class="fld" rows="6" data-bind="bio.personality" placeholder="How the character is expected to behave..." spellcheck="false" aria-label="Personality description">${esc(b.personality)}</textarea></div>
      <div class="panel"><div class="ph">BACKGROUND</div>
        ${bgNote ? `<textarea class="fld" rows="9" data-bind="note.${bgNote.id}.body" placeholder="Background, links are fine..." spellcheck="false" aria-label="Background">${esc(bgNote.body)}</textarea>` : '<div class="desc">Add a note on the DATA &gt; Notes tab.</div>'}</div>
      <div class="btnrow">${btn(statusImg ? 'CHANGE IMAGE' : 'ADD IMAGE', 'statusup')}${statusImg ? btn('TERMINAL TINT', 'statustint', {}, statusImg.tint ? 'on' : '') + btn('REMOVE', 'statusdel') : ''}</div>`;
    }
    else if (key === 'vitals') {
      const hpPct = state.hp / maxHp() * 100, apPct = state.ap / maxAp() * 100;
      const limbRows = LIMBS.map(l => {
        const p = limbPct(l.k);
        return `<div class="barline"><span class="lab" style="min-width:6.2em">${l.name}</span>${bar(p, p < 25 ? 'low' : '')}${fld('stat.limb.' + l.k, p, { type:'number', cls:'num', label:l.name })}</div>`;
      }).join('');
      right = `
      ${titleRow('VITALS', 'RPG MECHANICS')}
      <div class="panel"><div class="ph">RPG MECHANICS</div>
        <div class="barline"><span class="lab">HP</span>${bar(hpPct, hpPct < 25 ? 'low' : '')}<span class="num">${fld('stat.hp', state.hp, { type:'number', cls:'num', label:'HP' })}</span><span class="num">/ ${maxHp()}</span></div>
        <div class="desc">100 + Endurance x 20</div>
        ${kv(ico('armor') + ' DR (DAMAGE REDUCTION)', totalDR())}
        <div class="barline"><span class="lab">AP</span>${bar(apPct)}<span class="num">${fld('stat.ap', state.ap, { type:'number', cls:'num', label:'AP' })}</span><span class="num">/ ${maxAp()}</span></div>
        <div class="desc">65 + 3 x Agility</div>
        ${kv(ico('radiation') + ' RADIATION', fld('stat.rads', state.rads, { type:'number', cls:'num', label:'Rads' }))}
        ${kv('RAD SICKNESS', radSickness(state.rads))}
        ${kv('KARMA', karmaTier().name)}</div>
      <div class="panel"><div class="ph">LIMB CONDITION</div>${limbRows}</div>`;
    }
    else {
      const wpn = (w, n) => `
        <div class="ph">WEAPON NUMBER ${n}${w ? ' - ' + esc(w.name) : ''}</div>
        ${kv('DAM | AP COST', w ? `${w.dmg} DAM | ${w.ap} AP COST` : '# DAM | # AP COST')}
        ${w ? kv('AMMO / VATS USE', `${esc(w.ammo || 'N/A')} <small>x${w.vatsAmmo} per use</small>`) + kv('DPS', fmt1(dps(w))) : ''}`;
      const w1 = getItem(state.equip.w1), w2 = getItem(state.equip.w2);
      right = `
      ${titleRow('WEAPONS', 'DAM & AP USE')}
      <div class="panel"><div class="ph">DAM &amp; AP USE</div>${wpn(w1, 1)}<div style="height:.6em"></div>${wpn(w2, 2)}
        <div class="desc">Change equipped weapons on the ITEMS tab.</div></div>`;
    }
    return `<div class="vb-wrap ${key === 'general' ? 'gen' : ''}"><div class="status-stage">${statusImgBox()}</div><div class="vb-right" style="display:flex;flex-direction:column;gap:.7em;min-width:0">${right}</div></div>`;
  },
  adjust(item, d) { if (item && item.key === 'vitals') { state.hp += d * 5; clampVitals(); } }
};

SCREENS['stat.special'] = {
  list: () => SPECIAL_DEFS.map(d => ({ key:d.k, name:d.name, val:state.special[d.k] })),
  head: () => '<span>ATTRIBUTE</span><span>RANK</span>',
  foot() {
    const left = SPECIAL_POOL - specialSpent();
    return `<span>POINTS: ${state.unlimited ? '&infin;' : left}</span><span>${specialSpent()} / ${SPECIAL_POOL}</span>`;
  },
  detail(item) {
    const d = SPECIAL_DEFS.find(x => x.k === item.key), v = state.special[d.k];
    const left = SPECIAL_POOL - specialSpent();
    const canUp = v < 10 && (state.unlimited || left > 0), canDn = v > 1;
    return `
      ${titleRow(d.name, 'S.P.E.C.I.A.L.')}
      <div class="tint special-img"><img src="./assets/images/SPECIAL/${d.img}.gif" alt="${d.name}"></div>
      <div class="big-stat">${btn('&minus;','sp',{k:d.k,d:-1},'sq', canDn ? '' : 'disabled')}<span class="n">${v}</span>${btn('+','sp',{k:d.k,d:1},'sq', canUp ? '' : 'disabled')}</div>
      <div class="pips">${Array.from({ length: 10 }, (_, i) => `<i class="${i < v ? 'f' : ''}"></i>`).join('')}</div>
      <div class="desc">${esc(d.desc)}</div>
      <div class="panel">
        ${kv('MAX HP', `${maxHp()} <small>(100 + END ${state.special.E} x 20)</small>`)}
        ${kv('MAX AP', `${maxAp()} <small>(65 + AGI ${state.special.A} x 3)</small>`)}
        ${kv('CARRY WEIGHT', carryCap() + ' <small>LBS</small>')}
      </div>
      <div class="btnrow">${btn(state.unlimited ? 'LOCK POINT LIMIT' : 'UNLOCK POINT LIMIT', 'unlimited', {}, state.unlimited ? 'on' : '')}${btn('RESET TO 5', 'spreset')}</div>`;
  },
  adjust(item, d) { changeSpecial(item.key, d); }
};

SCREENS['stat.skills'] = {
  list: () => SKILL_DEFS.map(d => ({ key:d.id, name:d.name, val:skillValue(d).total, eq: state.tags.includes(d.id) ? '*' : '' })),
  head: () => '<span>SKILL</span><span>VALUE</span>',
  foot: () => `<span>TAGGED: ${state.tags.length} / 3</span><span>* = TAG</span>`,
  detail(item) {
    const d = SKILL_DEFS.find(x => x.id === item.key), s = skillValue(d), tagged = state.tags.includes(d.id);
    const an = SPECIAL_DEFS.find(x => x.k === d.a).name;
    return `
      ${titleRow(d.name, tagged ? 'TAGGED' : 'SKILL')}
      ${iconBox(SKILL_ICON[d.id] ? ['skills', SKILL_ICON[d.id]] : ['perks', 'perk_survivalist'], d.name)}
      <div class="big-stat"><span class="n">${s.total}</span></div>
      ${bar(s.total)}
      <div class="desc">${esc(d.desc)}</div>
      <div class="panel"><div class="ph">CALCULATION</div>
        ${kv('BASE', 2)}
        ${kv(an + ' <small>x2</small>', state.special[d.a] * 2)}
        ${kv('LUCK <small>(LCK / 2, round up)</small>', Math.ceil(state.special.L / 2))}
        ${kv('TAG BONUS', s.tag ? '+15' : '0')}
        ${kv('POINTS INVESTED', s.inv)}
      </div>
      <div class="btnrow">${btn('&minus;1 PT','skadj',{k:d.id,d:-1},'sq')}${btn('+1 PT','skadj',{k:d.id,d:1},'sq')}${btn(tagged ? 'UNTAG SKILL' : 'TAG SKILL','tag',{k:d.id}, tagged ? 'on' : '')}</div>`;
  },
  adjust(item, d) { skillInvest(item.key, d); },
  activate(item) { toggleTag(item.key); }
};

/* ---------- STAT / PERKS ---------- */
SCREENS['stat.perks'] = {
  list: () => PERK_DEFS.map(p => ({ key:p.id, name:p.name, val:'L' + p.lvl, eq: perkTaken(p.id) ? '[X]' : '' })),
  head: () => '<span>PERK</span><span>REQ</span>',
  foot: () => `<span>TAKEN: ${state.perks.length}</span><span>PERK EVERY 2 LVLS</span>`,
  detail(item) {
    const p = PERK_DEFS.find(x => x.id === item.key), taken = perkTaken(p.id), ok = perkEligible(p);
    const reqs = Object.entries(p.req).map(([k, v]) => `${SPECIAL_DEFS.find(x => x.k === k).name} ${v}`);
    return `
      ${titleRow(p.name, taken ? 'ACTIVE' : ok ? 'AVAILABLE' : 'LOCKED')}
      ${iconBox(['perks', PERK_ICON[p.id]], p.name)}
      <div class="panel"><div class="ph">PERK CARD</div>
        ${kv('REQUIRED LEVEL', p.lvl)}
        ${kv('REQUIRED ATTRIBUTES', reqs.length ? reqs.join(', ') : 'NONE')}
        ${kv('REQUIREMENTS', ok ? 'MET' : 'NOT MET')}
        ${kv('EFFECT', esc(p.fx))}
      </div>
      <div class="desc">${esc(p.desc)}</div>
      <div class="btnrow">${btn(taken ? 'REMOVE PERK' : 'TAKE PERK', 'perk', { k:p.id }, taken ? 'on' : '')}</div>`;
  },
  activate(item) { togglePerk(item.key); }
};

/* ---------- STAT / GENERAL (karma, reputation, derived statistics) ---------- */
const KARMA_TIERS = [
  { max:-750, name:'VERY EVIL', ic:'karma_evil',    desc:'Your name is spoken in whispers. Good folk cross the road to avoid you.' },
  { max:-250, name:'EVIL',      ic:'karma_bad',     desc:'You have done more harm than good, and the Mojave remembers.' },
  { max: 250, name:'NEUTRAL',   ic:'karma_neutral', desc:'A little good, a little bad. The wasteland has not made up its mind about you.' },
  { max: 750, name:'GOOD',      ic:'karma_good',    desc:'People are glad to see you coming. Mostly.' },
  { max:1001, name:'VERY GOOD', ic:'karma_saintly', desc:'A shining example in a place that has very few. Try not to let it go to your head.' }
];
const karmaTier = () => KARMA_TIERS.find(t => state.karma < t.max) || KARMA_TIERS[KARMA_TIERS.length - 1];
const REP_LEVELS = ['VILIFIED', 'SHUNNED', 'MIXED', 'NEUTRAL', 'ACCEPTED', 'LIKED', 'IDOLIZED'];
const FACTIONS = [
  ['boomers','BOOMERS','reputations_boomers'], ['bos','BROTHERHOOD OF STEEL','reputations_brotherhood_of_steel'], ['legion',"CAESAR'S LEGION",'reputations_caesars_legion'],
  ['followers','FOLLOWERS OF THE APOCALYPSE','reputations_followers_apocalypse'], ['freeside','FREESIDE','reputations_freeside'],
  ['goodsprings','GOODSPRINGS','reputations_goodsprings'], ['khans','GREAT KHANS','reputations_great_khans'], ['ncr','NEW CALIFORNIA REPUBLIC','reputations_ncr'],
  ['novac','NOVAC','reputations_novac'], ['powder','POWDER GANGERS','reputations_powder_ganger'], ['primm','PRIMM','reputations_primm'],
  ['strip','THE STRIP','reputations_the_strip'], ['wgs','WHITE GLOVE SOCIETY','reputations_white_glove_society']
];
const repLevel = id => clamp(state.rep && id in state.rep ? state.rep[id] : 3, 0, REP_LEVELS.length - 1);
const critChance = () => state.special.L + (perkTaken('finesse') ? 5 : 0);
const DERIVED = [
  { k:'hp',   name:'HIT POINTS',           ic:'hit_points',           v: () => maxHp(),                                  d:'Total health. 100 + Endurance x 20.' },
  { k:'ap',   name:'ACTION POINTS',        ic:'actions_points',       v: () => maxAp(),                                  d:'Fuel for V.A.T.S. 65 + Agility x 3.' },
  { k:'cw',   name:'CARRY WEIGHT',         ic:'carry_weight',         v: () => carryCap() + ' LBS',                      d:'How much you can haul before you are slowed. 150 + Strength x 10, plus perks.' },
  { k:'dr',   name:'DAMAGE RESISTANCE',    ic:'damage_resistance',    v: () => totalDR(),                                d:'Flat damage soaked by your equipped apparel and perks.' },
  { k:'rr',   name:'RADIATION RESISTANCE', ic:'radiation_resistance', v: () => ((state.special.E - 1) * 2 + (perkTaken('rad') ? 25 : 0)) + '%', d:'Share of incoming radiation shrugged off. (Endurance - 1) x 2%, plus Rad Resistance.' },
  { k:'pr',   name:'POISON RESISTANCE',    ic:'poison_resistance',    v: () => ((state.special.E - 1) * 5) + '%',        d:'Share of poison damage resisted. (Endurance - 1) x 5%.' },
  { k:'cc',   name:'CRITICAL CHANCE',      ic:'critical_chance',      v: () => critChance() + '%',                       d:'Chance for any attack to be a critical hit. Equal to Luck, plus Finesse.' },
  { k:'md',   name:'MELEE DAMAGE',         ic:'melee_damage',         v: () => fmt1(state.special.S * 0.5),              d:'Bonus damage on melee and unarmed attacks. Strength x 0.5.' }
];
SCREENS['stat.general'] = {
  list: () => [
    { key:'karma', name:'KARMA', val: karmaTier().name },
    { type:'sep', name:'REPUTATION' },
    ...FACTIONS.map(f => ({ key:'rep:' + f[0], name:f[1], val: REP_LEVELS[repLevel(f[0])] })),
    { type:'sep', name:'DERIVED STATISTICS' },
    ...DERIVED.map(x => ({ key:'d:' + x.k, name:x.name, val:x.v() }))
  ],
  head: () => '<span>GENERAL</span><span>STANDING</span>',
  foot: () => `<span>KARMA ${state.karma > 0 ? '+' : ''}${state.karma}</span><span>${karmaTier().name}</span>`,
  detail(item) {
    if (item.key === 'karma') {
      const t = karmaTier();
      return `
        ${titleRow('KARMA', t.name)}
        ${iconBox(['karma', t.ic], t.name)}
        <div class="big-stat">${btn('&minus;','karma',{d:-50},'sq')}<span class="n">${state.karma}</span>${btn('+','karma',{d:50},'sq')}</div>
        <div class="desc">${esc(t.desc)}</div>
        <div class="btnrow">${btn('RESET TO 0','karma',{d:0})}</div>`;
    }
    if (item.key.startsWith('rep:')) {
      const f = FACTIONS.find(x => 'rep:' + x[0] === item.key), lv = repLevel(f[0]);
      return `
        ${titleRow(f[1], 'REPUTATION')}
        ${iconBox(['rep', f[2]], f[1])}
        <div class="big-stat">${btn('&minus;','rep',{k:f[0],d:-1},'sq', lv > 0 ? '' : 'disabled')}<span class="n sm">${REP_LEVELS[lv]}</span>${btn('+','rep',{k:f[0],d:1},'sq', lv < REP_LEVELS.length - 1 ? '' : 'disabled')}</div>
        <div class="pips">${REP_LEVELS.map((_, i) => `<i class="${i <= lv ? 'f' : ''}"></i>`).join('')}</div>
        <div class="desc">How ${tc(f[1])} regards you right now. Adjust it as your story unfolds.</div>`;
    }
    const x = DERIVED.find(y => 'd:' + y.k === item.key);
    return `
      ${titleRow(x.name, 'DERIVED')}
      ${iconBox(['derived', x.ic], x.name)}
      <div class="big-stat"><span class="n sm">${x.v()}</span></div>
      <div class="desc">${esc(x.d)}</div>`;
  },
  adjust(item, d) {
    if (item.key === 'karma') changeKarma(d * 50);
    else if (item.key.startsWith('rep:')) changeRep(item.key.slice(4), d);
  }
};
function changeKarma(d) { state.karma = d === 0 ? 0 : clamp(state.karma + d, -1000, 1000); save(); }
function changeRep(id, d) { state.rep[id] = clamp(repLevel(id) + d, 0, REP_LEVELS.length - 1); save(); }

/* ---------- INVENTORY (shared factory) ---------- */
const CAT_LABEL = { weapons:'WEAPON', apparel:'APPAREL', aid:'AID', misc:'MISC ITEM', ammo:'AMMO' };
const NEW_ITEM = {
  weapons: () => mk('weapons', { name:'NEW WEAPON', dmg:10, ap:20, rof:1, cnd:100, wt:1, val:10, ammo:'', skill:'GUNS', strReq:5, vatsAmmo:1 }),
  apparel: () => mk('apparel', { name:'NEW APPAREL', slot:'BODY', dr:1, cnd:100, wt:1, val:10 }),
  aid:     () => mk('aid',     { name:'NEW AID ITEM', hp:0, rads:0, wt:0.1, val:5, fx:'NO EFFECT' }),
  misc:    () => mk('misc',    { name:'NEW ITEM', wt:0.5, val:1 }),
  ammo:    () => mk('ammo',    { name:'NEW AMMO', qty:10, wt:0.05, val:1 })
};

function invFoot() {
  return `<span>WG ${fmt1(weightNow())}/${carryCap()}</span><span>CAPS ${state.caps}</span>`;
}
function equipTag(i) {
  if (i.cat === 'weapons') return state.equip.w1 === i.id ? '[1]' : state.equip.w2 === i.id ? '[2]' : '';
  if (i.cat === 'apparel') return (state.equip.head === i.id || state.equip.body === i.id) ? '[E]' : '';
  return '';
}
function invItems(cat) { return state.items.filter(i => i.cat === cat); }

function loadoutPanel() {
  const slot = (n, id) => {
    const w = getItem(id);
    return w ? kv(`${ico('weapon')} WEAPON ${n}: ${esc(w.name)}`, `${w.dmg} DAM | ${w.ap} AP COST`)
             : kv(`${ico('weapon')} WEAPON ${n}`, '<small>- EMPTY -</small>');
  };
  return `<div class="panel"><div class="ph">DAM &amp; AP USE</div>${slot(1, state.equip.w1)}${slot(2, state.equip.w2)}</div>`;
}

function invScreen(cat) {
  return {
    list() {
      const out = invItems(cat).map(i => ({
        id: i.id, name: esc(i.name),
        eq: equipTag(i),
        val: (cat === 'weapons' || cat === 'apparel') ? i.cnd + '%' : 'x' + i.qty
      }));
      out.push({ type:'add', name:'+ ADD ITEM' });
      return out;
    },
    head: () => cat === 'weapons' || cat === 'apparel' ? '<span>ITEM</span><span>CND</span>' : '<span>ITEM</span><span>QTY</span>',
    foot: invFoot,
    detail(item) {
      if (item.type === 'add') return `${titleRow('ADD ITEM', CAT_LABEL[cat])}<div class="desc">Create a new ${CAT_LABEL[cat].toLowerCase()} entry. Everything is inline-editable once created.</div><div class="btnrow">${btn('CREATE ITEM','additem')}</div>`;
      const i = getItem(item.id); if (!i) return '';
      const nameRow = `<div class="title-row">${fld(`item.${i.id}.name`, i.name, { cls:'name', label:'Item name' })}<span class="tag">${CAT_LABEL[cat]}</span></div>${iconBox(itemIcon(i), i.name)}`;
      const dropBtn = btn(ui.confirm === 'drop:' + i.id ? 'CONFIRM DROP?' : 'DROP ITEM', 'drop', { id:i.id });
      const cndBar = `<div class="barline"><span class="lab">CND</span>${bar(i.cnd, i.cnd < 25 ? 'low' : '')}<span class="num">${i.cnd}%</span></div>`;
      const note = `<div class="kv"><span class="k">NOTES</span></div>${fld(`item.${i.id}.note`, i.note, { ph:'Description / notes', label:'Notes' })}`;
      const common = kvf('WEIGHT (WG)', `item.${i.id}.wt`, i.wt) + kvf('VALUE (CAPS)', `item.${i.id}.val`, i.val);

      if (cat === 'weapons') {
        const ammo = i.ammo ? ammoCount(i.ammo) : null;
        return `${nameRow}
          <div class="panel"><div class="ph">${ico('damage')} COMBAT STATS</div>
            <div class="grid2">
              <div>${kvf('DAM', `item.${i.id}.dmg`, i.dmg)}${kv('DPS', `<span id="dpsOut">${fmt1(dps(i))}</span>`)}${kvf('AP COST', `item.${i.id}.ap`, i.ap)}${kvf('RATE OF FIRE', `item.${i.id}.rof`, i.rof)}</div>
              <div>${kvf('STR REQ', `item.${i.id}.strReq`, i.strReq)}${kvf('AMMO / VATS USE', `item.${i.id}.vatsAmmo`, i.vatsAmmo)}${common}</div>
            </div>
            ${kv('SKILL', fld(`item.${i.id}.skill`, i.skill, { cls:'', label:'Skill' }))}
            ${kv('AMMO TYPE', fld(`item.${i.id}.ammo`, i.ammo, { ph:'e.g. 9mm Round', label:'Ammo type' }))}
            ${kv('AMMO IN STOCK', ammo === null ? '<small>N/A</small>' : ammo)}
            ${cndBar}${kvf('CONDITION %', `item.${i.id}.cnd`, i.cnd)}
          </div>
          <div class="btnrow">${btn('EQUIP SLOT 1','equipw',{id:i.id,s:1}, state.equip.w1 === i.id ? 'on' : '')}${btn('EQUIP SLOT 2','equipw',{id:i.id,s:2}, state.equip.w2 === i.id ? 'on' : '')}${dropBtn}</div>
          <div class="desc">${note}</div>
          ${loadoutPanel()}`;
      }
      if (cat === 'apparel') {
        const eq = state.equip.head === i.id || state.equip.body === i.id;
        return `${nameRow}
          <div class="panel"><div class="ph">${ico('armor')} PROTECTION</div>
            ${kvf('DAMAGE RESIST. (DR)', `item.${i.id}.dr`, i.dr)}
            ${kv('SLOT', sel(`item.${i.id}.slot`, i.slot, ['HEAD', 'BODY']))}
            ${common}${cndBar}${kvf('CONDITION %', `item.${i.id}.cnd`, i.cnd)}
          </div>
          <div class="btnrow">${btn(eq ? 'UNEQUIP' : 'EQUIP','equipa',{id:i.id}, eq ? 'on' : '')}${dropBtn}</div>
          <div class="desc">${note}</div>
          <div class="panel"><div class="ph">CURRENT PROTECTION</div>${kv('TOTAL DR', totalDR())}${equippedApparel().map(a => kv(esc(a.name), a.dr)).join('')}</div>`;
      }
      if (cat === 'aid') {
        return `${nameRow}
          <div class="panel"><div class="ph">EFFECTS</div>
            ${kv('EFFECT', fld(`item.${i.id}.fx`, i.fx, { label:'Effect text' }))}
            ${kvf('HP RESTORED', `item.${i.id}.hp`, i.hp)}
            ${kvf('RADS CHANGE', `item.${i.id}.rads`, i.rads)}
            ${kvf('QUANTITY', `item.${i.id}.qty`, i.qty)}
            ${common}
          </div>
          <div class="btnrow">${btn('USE ITEM','use',{id:i.id}, '', i.qty > 0 ? '' : 'disabled')}${btn('&minus;1','qty',{id:i.id,d:-1},'sq')}${btn('+1','qty',{id:i.id,d:1},'sq')}${dropBtn}</div>
          <div class="desc">${note}</div>`;
      }
      if (cat === 'ammo') {
        const users = invItems('weapons').filter(w => w.ammo && w.ammo.toLowerCase() === i.name.toLowerCase());
        return `${nameRow}
          <div class="panel"><div class="ph">STOCK</div>
            ${kvf('QUANTITY', `item.${i.id}.qty`, i.qty)}${common}
          </div>
          <div class="btnrow">${btn('&minus;10','qty',{id:i.id,d:-10},'sq')}${btn('&minus;1','qty',{id:i.id,d:-1},'sq')}${btn('+1','qty',{id:i.id,d:1},'sq')}${btn('+10','qty',{id:i.id,d:10},'sq')}${dropBtn}</div>
          <div class="panel"><div class="ph">USED BY</div>${users.length ? users.map(w => kv(esc(w.name), `${w.vatsAmmo} / VATS`)).join('') : '<small>NO MATCHING WEAPON</small>'}</div>
          <div class="desc">${note}</div>`;
      }
      return `${nameRow}
        <div class="panel"><div class="ph">ITEM</div>${kvf('QUANTITY', `item.${i.id}.qty`, i.qty)}${common}</div>
        <div class="btnrow">${btn('&minus;1','qty',{id:i.id,d:-1},'sq')}${btn('+1','qty',{id:i.id,d:1},'sq')}${dropBtn}</div>
        <div class="desc">${note}</div>`;
    },
    adjust(item, d) {
      if (!item.id) return;
      const i = getItem(item.id);
      if (cat === 'weapons' || cat === 'apparel') i.cnd = clamp(i.cnd + d * 5, 0, 100);
      else i.qty = Math.max(0, i.qty + d);
    },
    activate(item) {
      if (item.type === 'add') return actions.additem();
      const i = getItem(item.id);
      if (cat === 'weapons') {
        const slot = state.equip.w1 === i.id ? 1 : state.equip.w2 === i.id ? 2 : (state.equip.w1 ? (state.equip.w2 ? 1 : 2) : 1);
        equipWeapon(i.id, slot);
      } else if (cat === 'apparel') actions.equipa({ id:i.id });
      else if (cat === 'aid') actions.use({ id:i.id });
    }
  };
}
['weapons', 'apparel', 'aid', 'misc', 'ammo'].forEach(c => { SCREENS['inv.' + c] = invScreen(c); });

/* ---------- DATA / BIO ---------- */
const BIO_SECTIONS = [
  { key:'identity', name:'IDENTITY' }, { key:'portrait', name:'PORTRAIT' }, { key:'physical', name:'PHYSICAL FEATURES' },
  { key:'personality', name:'PERSONALITY' }, { key:'export', name:'EXPORT SHEET' }, { key:'reset', name:'RESET ALL DATA' }
];
function exportSheet() {
  const b = state.bio, s = state.special, w1 = getItem(state.equip.w1), w2 = getItem(state.equip.w2);
  const inv = state.items.filter(i => i.qty > 0 || i.cat === 'weapons' || i.cat === 'apparel')
    .map(i => `- ${i.name}${(i.cat === 'weapons' || i.cat === 'apparel') && i.qty <= 1 ? '' : ' x' + i.qty}${equipTag(i) ? ' ' + equipTag(i) : ''}`).join('\n');
  const bg = state.notes[0] ? state.notes[0].body : '';
  const ws = (w, n) => `(Weapon Number ${n})\n ${w ? `${w.dmg} DAM | ${w.ap} AP COST` : '# DAM | # AP COST'}${w ? `   [${w.name}${w.ammo ? ', ' + w.ammo : ''}, ${w.vatsAmmo} ammo/VATS use, DPS ${fmt1(dps(w))}]` : ''}`;
  return [
`> Name/Nickname
${b.name}`,
`> Date of Birth
${b.dob}`,
`> Physiology
${b.physiology}`,
`> Allegiance
${b.allegiance}`,
`> Occupation
${b.occupation}`,
`> Rank/Title
${b.rank}`,
`> Physical Description
Height: ${b.height} | Weight: ${b.weight}
Hair: ${b.hairDesc} (${b.hairColor})
Eyes: ${b.eyes} | Skin: ${b.skin} | Body type: ${b.bodyType}
Distinguishing marks: ${b.scars}`,
`> Personality Description
${b.personality}`,
`> S.P.E.C.I.A.L.
S ${s.S} | P ${s.P} | E ${s.E} | C ${s.C} | I ${s.I} | A ${s.A} | L ${s.L}`,
`> Inventory
${inv}`,
`> Background
${bg}`,
`(RPG Mechanics players only)

> HP
${state.hp} / ${maxHp()}   (100 + Endurance x 20)`,
`> DR (Damage Reduction)
${totalDR()}`,
`> AP
${state.ap} / ${maxAp()}   (65 + 3 x Agility)`,
`> DAM & AP USE
${ws(w1, 1)}

${ws(w2, 2)}`
  ].join('\n\n');
}
SCREENS['data.bio'] = {
  list: () => BIO_SECTIONS.map(s => ({ key:s.key, name:s.name })),
  head: () => '<span>CHARACTER FILE</span>',
  foot: () => `<span>${esc(state.bio.name)}</span><span>LVL ${state.level}</span>`,
  detail(item) {
    const b = state.bio, f = (k, ph, label) => fld('bio.' + k, b[k], { ph, label });
    if (item.key === 'identity') return `
      ${titleRow('IDENTITY', 'BIO / PROFILE')}
      <div class="form">
        <label>Name / Nickname</label>${f('name', 'Full name or alias')}
        <label>Date of Birth</label>${f('dob', 'DD MON YYYY')}
        <label>Physiology</label>${sel('bio.physiology', b.physiology, ['Human', 'Ghoul', 'Supermutant', 'Robot'])}
        <label>Allegiance</label>${f('allegiance', 'Faction or none')}
        <label>Occupation</label>${f('occupation', 'Occupation')}
        <label>Rank / Title</label>${f('rank', 'If applicable')}
      </div>`;
    if (item.key === 'portrait') return `
      ${titleRow('PORTRAIT', 'BIO / PROFILE')}
      <div class="portrait-stage">${portraitBox('lg')}</div>
      <div class="desc">Upload any image of your character (PNG, JPG, WEBP). It is shrunk and stored in this browser only, and appears on the Status screen.</div>
      <div class="btnrow">${btn(portrait ? 'CHANGE IMAGE' : 'UPLOAD IMAGE', 'portraitup')}${portrait ? btn('TERMINAL TINT', 'portraittint', {}, portrait.tint ? 'on' : '') + btn('REMOVE', 'portraitdel') : ''}</div>`;
    if (item.key === 'physical') return `
      ${titleRow('PHYSICAL FEATURES', 'BIO / PROFILE')}
      <div class="form">
        <label>Height</label>${f('height', `e.g. 5'11"`)}
        <label>Weight</label>${f('weight', 'e.g. 170 LBS')}
        <label>Hair Description</label>${f('hairDesc', 'Length, style')}
        <label>Hair Color</label>${f('hairColor', 'Color')}
        <label>Eye Color</label>${f('eyes', 'Color')}
        <label>Skin Color</label>${f('skin', 'Tone / condition')}
        <label>Body Type</label>${sel('bio.bodyType', b.bodyType, ['Endomorphic', 'Mesomorphic', 'Ectomorphic'])}
        <label>Scars / Blemishes</label>${f('scars', 'Distinguishing marks')}
      </div>`;
    if (item.key === 'personality') return `
      ${titleRow('PERSONALITY NOTES', 'BIO / PROFILE')}
      <div class="desc">Give a general understanding of how the character is expected to behave.</div>
      <textarea class="fld" rows="9" data-bind="bio.personality" placeholder="Personality description..." spellcheck="false" aria-label="Personality notes">${esc(b.personality)}</textarea>`;
    if (item.key === 'export') return `
      ${titleRow('EXPORT SHEET', 'CHARACTER TEMPLATE')}
      <div class="desc">Generates your full character sheet in the standard forum template, ready to paste.</div>
      <textarea class="fld" id="exportBox" rows="14" readonly aria-label="Exported sheet">${esc(exportSheet())}</textarea>
      <div class="btnrow">${btn('COPY TO CLIPBOARD','copy')}${btn('DOWNLOAD .TXT','download')}</div>`;
    return `
      ${titleRow('RESET ALL DATA', 'DANGER')}
      <div class="desc">Restores every stat, item, note and bio field to the placeholder defaults. This cannot be undone.</div>
      <div class="btnrow">${btn(ui.confirm === 'reset' ? 'CONFIRM RESET?' : 'RESET EVERYTHING', 'reset')}</div>`;
  }
};

SCREENS['data.notes'] = {
  list() {
    const out = state.notes.map(n => ({ id:n.id, name:esc(n.title || 'UNTITLED') }));
    out.push({ type:'add', name:'+ NEW ENTRY' });
    return out;
  },
  head: () => '<span>TERMINAL LOG</span>',
  foot: () => `<span>${state.notes.length} ENTRIES</span>`,
  detail(item) {
    if (item.type === 'add') return `${titleRow('NEW ENTRY', 'NOTES')}<div class="desc">Start a fresh terminal log entry.</div><div class="btnrow">${btn('CREATE ENTRY','addnote')}</div>`;
    const n = getNote(item.id); if (!n) return '';
    return `
      <div class="title-row">${fld(`note.${n.id}.title`, n.title, { cls:'name', label:'Entry title' })}<span class="tag">LOG</span></div>
      <div class="term">
        <div class="term-head">ROBCO INDUSTRIES (TM) TERMLINK
        <textarea data-bind="note.${n.id}.body" spellcheck="false" aria-label="Log body" placeholder="> _">${esc(n.body)}</textarea>
        <div class="meta"><span id="noteCount">${n.body.length} CHARS</span><span>EDITABLE</span></div>
      </div>
      <div class="btnrow">${btn(ui.confirm === 'note:' + n.id ? 'CONFIRM DELETE?' : 'DELETE ENTRY', 'delnote', { id:n.id })}</div>`;
  }
};

/* ---------- DATA / RADIO ---------- */
const FREQ_MIN = 88, FREQ_MAX = 108;
function radioStrength(f = state.radio.freq) {
  return STATIONS.reduce((m, s) => Math.max(m, clamp(1 - Math.abs(f - s.f) / 1.2, 0, 1)), 0);
}
function radioStation(f = state.radio.freq) {
  return STATIONS.find(s => Math.abs(f - s.f) < 0.55) || null;
}
const needleX = f => 20 + (f - FREQ_MIN) / (FREQ_MAX - FREQ_MIN) * 360;
SCREENS['data.radio'] = {
  list: () => [
    ...STATIONS.map(s => ({ key:s.id, name:s.name, val:s.f.toFixed(1), eq: state.radio.on && radioStation() === s ? '>>' : '' })),
    { key:'off', name:'RADIO OFF', val: state.radio.on ? '' : '*' }
  ],
  head: () => '<span>STATION</span><span>MHZ</span>',
  foot: () => `<span>${state.radio.on ? 'RECEIVING' : 'STANDBY'}</span><span>${state.radio.freq.toFixed(1)} MHZ</span>`,
  detail(item) {
    const st = radioStation(), str = radioStrength();
    const ticks = Array.from({ length: 21 }, (_, i) => {
      const x = 20 + i * 18, major = i % 5 === 0;
      return `<line class="ax" x1="${x}" y1="${major ? 118 : 124}" x2="${x}" y2="132"/>${major ? `<text x="${x}" y="146" text-anchor="middle">${FREQ_MIN + i}</text>` : ''}`;
    }).join('');
    const marks = STATIONS.map(s => `<path d="M${needleX(s.f)} 112 l-4 -8 h8 z" fill="var(--dim)"/>`).join('');
    const sc = SCREENS['data.radio'].list()[Math.max(0, getSel())];
    const picked = STATIONS.find(s => s.id === (sc && sc.key));
    return `
      ${titleRow(st ? st.name : 'FREQUENCY TUNER', state.radio.on ? 'ON AIR' : 'STANDBY')}
      <div class="panel">
        <svg class="radio-dial" viewBox="0 0 400 156" role="img" aria-label="Radio signal graphic">
          <line class="ax" x1="20" y1="80" x2="380" y2="80"/>
          <path id="wave" class="wave" d="M20 80 H380"/>
          ${ticks}${marks}
          <line id="needle" class="needle" x1="${needleX(state.radio.freq)}" y1="14" x2="${needleX(state.radio.freq)}" y2="132"/>
        </svg>
        <input class="tuner" id="tuner" type="range" min="${FREQ_MIN}" max="${FREQ_MAX}" step="0.1" value="${state.radio.freq}" aria-label="Frequency tuner">
        <div class="kv"><span class="k">FREQUENCY</span><span class="lead"></span><span class="v" id="freqOut">${state.radio.freq.toFixed(1)} MHZ</span></div>
        <div class="kv"><span class="k">SIGNAL</span><span class="lead"></span><span class="v" id="sigOut">${state.radio.on ? Math.round(str * 100) + '%' : '--'}</span></div>
        <div class="signal" id="signal">${Array.from({ length: 12 }, () => '<i style="height:10%"></i>').join('')}</div>
      </div>
      <div class="btnrow">${btn(state.radio.on ? 'POWER: ON' : 'POWER: OFF','radiopower',{}, state.radio.on ? 'on' : '')}${btn('&minus;0.1','tune',{d:-0.1},'sq')}${btn('+0.1','tune',{d:0.1},'sq')}</div>
      <div class="desc" id="radioDesc">${esc(state.radio.on ? (st ? st.blurb : 'Only static. Keep turning the dial...') : (picked ? picked.blurb : 'Receiver is idle. Select a station or press POWER.'))}</div>`;
  },
  adjust(item, d) { tuneTo(state.radio.freq + d * 0.1); },
  activate(item) {
    if (item.key === 'off') { setRadio(false); return; }
    const s = STATIONS.find(x => x.id === item.key);
    if (s) { state.radio.freq = s.f; setRadio(true); }
  },
  clickActivates: true,
  after() { startRadioLoop(); }
};

let radioRAF = 0;
function startRadioLoop() { if (!radioRAF) radioRAF = requestAnimationFrame(radioLoop); }
function radioLoop(t) {
  const w = $('#wave');
  if (!w) { radioRAF = 0; return; }
  const on = state.radio.on, str = on ? radioStrength() : 0;
  const amp = on ? 5 + str * 30 : 1.5, nz = on ? (1 - str) * 22 : 2;
  let d = '';
  for (let x = 0; x <= 360; x += 4) {
    const y = 80 + Math.sin(x * 0.06 + t / 170) * amp * (0.3 + str) + Math.sin(x * 0.19 - t / 90) * amp * 0.25 + (Math.random() - 0.5) * nz;
    d += (x ? 'L' : 'M') + (20 + x) + ' ' + y.toFixed(1);
  }
  w.setAttribute('d', d);
  $$('#signal i').forEach((el, i) => {
    const lvl = on ? clamp(str * 100 * (0.45 + 0.55 * Math.abs(Math.sin(t / 220 + i * 0.9))) + Math.random() * (1 - str) * 40, 6, 100) : 6;
    el.style.height = lvl + '%';
  });
  radioRAF = requestAnimationFrame(radioLoop);
}
function setRadio(on) {
  const was = state.radio.on;
  state.radio.on = on;
  if (on && !was) { Sound.play('radioOn'); Sound.radioStart(); }
  if (!on && was) { Sound.play('radioOff'); Sound.radioStop(); }
  if (on) Sound.radioSet(radioStrength());
  save(); render();
}
function tuneTo(f) {
  state.radio.freq = Math.round(clamp(f, FREQ_MIN, FREQ_MAX) * 10) / 10;
  Sound.radioSet(radioStrength());
  updateTunerUI(); save();
}
function updateTunerUI() {
  const f = state.radio.freq, on = state.radio.on, st = radioStation(), str = radioStrength();
  const n = $('#needle'); if (!n) return;
  n.setAttribute('x1', needleX(f)); n.setAttribute('x2', needleX(f));
  const t = $('#tuner'); if (t && +t.value !== f) t.value = f;
  $('#freqOut').textContent = f.toFixed(1) + ' MHZ';
  $('#sigOut').textContent = on ? Math.round(str * 100) + '%' : '--';
  const h = $('#detail .title-row h2'); if (h) h.textContent = st ? st.name : 'FREQUENCY TUNER';
  const d = $('#radioDesc'); if (d) d.textContent = on ? (st ? st.blurb : 'Only static. Keep turning the dial...') : 'Receiver is idle. Press POWER to listen.';
}

function changeSpecial(k, d) {
  const v = state.special[k], left = SPECIAL_POOL - specialSpent();
  if (d > 0 && (v >= 10 || (!state.unlimited && left <= 0))) { Sound.synth('error'); toast(v >= 10 ? 'MAXIMUM RANK' : 'NO POINTS REMAINING'); return; }
  if (d < 0 && v <= 1) { Sound.synth('error'); toast('MINIMUM RANK'); return; }
  state.special[k] = clamp(v + d, 1, 10);
  clampVitals(); save();
}
function skillInvest(id, d) {
  const def = SKILL_DEFS.find(x => x.id === id), s = skillValue(def);
  if (d > 0 && s.total >= 100) { toast('SKILL AT MAXIMUM'); return; }
  if (d < 0 && s.inv <= 0) { toast('NO INVESTED POINTS'); return; }
  state.invested[id] = (state.invested[id] || 0) + d; save();
}
function toggleTag(id) {
  const i = state.tags.indexOf(id);
  if (i >= 0) state.tags.splice(i, 1);
  else if (state.tags.length >= 3) { Sound.synth('error'); toast('MAXIMUM 3 TAG SKILLS'); return; }
  else state.tags.push(id);
  save();
}
function togglePerk(id) {
  const i = state.perks.indexOf(id), p = PERK_DEFS.find(x => x.id === id);
  if (i >= 0) { state.perks.splice(i, 1); toast('PERK REMOVED'); }
  else { state.perks.push(id); toast(perkEligible(p) ? 'PERK ACQUIRED' : 'PERK ACQUIRED (REQUIREMENTS NOT MET)'); }
  save();
}
function equipWeapon(id, slot) {
  const k = 'w' + slot, other = slot === 1 ? 'w2' : 'w1';
  if (state.equip[k] === id) { state.equip[k] = null; toast('SLOT ' + slot + ' CLEARED'); }
  else { state.equip[k] = id; if (state.equip[other] === id) state.equip[other] = null; toast('EQUIPPED IN SLOT ' + slot); }
  save();
}
function removeItem(id) {
  state.items = state.items.filter(i => i.id !== id);
  Object.keys(state.equip).forEach(k => { if (state.equip[k] === id) state.equip[k] = null; });
}

const actions = {
  hp:    d => { state.hp += num(d.d); },
  hpfull:() => { state.hp = maxHp(); },
  ap:    d => { state.ap += num(d.d); },
  apfull:() => { state.ap = maxAp(); },
  rads:  d => { state.rads += num(d.d); },
  radsclear: () => { state.rads = 0; },
  lvl:   d => { state.level += num(d.d); },
  limb:  d => { state.limbs[d.k] = clamp(state.limbs[d.k] + num(d.d), 0, 100); },
  pickLimb: d => { const items = currentItems(); const i = items.findIndex(x => x.key === d.k); if (i >= 0) setSel(i); },
  sp:    d => changeSpecial(d.k, num(d.d)),
  spreset: () => { Object.keys(state.special).forEach(k => state.special[k] = 5); },
  unlimited: () => { state.unlimited = !state.unlimited; },
  skadj: d => skillInvest(d.k, num(d.d)),
  tag:   d => toggleTag(d.k),
  perk:  d => togglePerk(d.k),
  statusup: () => pickStatusImg(),
  statusdel: () => { statusImg = null; saveStatusImg(); toast('IMAGE REMOVED'); },
  statustint: () => { if (statusImg) { statusImg.tint = !statusImg.tint; saveStatusImg(); } },
  portraitup: () => pickPortrait(),
  portraitdel: () => { portrait = null; savePortrait(); toast('PORTRAIT REMOVED'); },
  portraittint: () => { if (portrait) { portrait.tint = !portrait.tint; savePortrait(); } },
  karma: d => changeKarma(num(d.d)),
  rep:   d => changeRep(d.k, num(d.d)),
  equipw:d => equipWeapon(d.id, num(d.s)),
  equipa:d => {
    const i = getItem(d.id), slot = i.slot === 'HEAD' ? 'head' : 'body';
    if (state.equip[slot] === i.id) { state.equip[slot] = null; toast('UNEQUIPPED'); }
    else { state.equip[slot] = i.id; toast('EQUIPPED'); }
    save();
  },
  use: d => {
    const i = getItem(d.id);
    if (!i || i.qty <= 0) { Sound.synth('error'); toast('NONE REMAINING'); return; }
    i.qty -= 1; state.hp += num(i.hp); state.rads += num(i.rads);
    Sound.synth('use'); toast('USED ' + i.name.toUpperCase());
  },
  qty: d => { const i = getItem(d.id); i.qty = Math.max(0, i.qty + num(d.d)); },
  additem: () => {
    const cat = ui.sub.inv, it = NEW_ITEM[cat]();
    state.items.push(it);
    const items = SCREENS['inv.' + cat].list();
    setSel(items.findIndex(x => x.id === it.id));
    toast('ITEM CREATED');
  },
  drop: d => {
    if (ui.confirm !== 'drop:' + d.id) { armConfirm('drop:' + d.id); return; }
    ui.confirm = null; removeItem(d.id);
    setSel(Math.max(0, getSel() - 1)); toast('ITEM DROPPED');
  },
  addnote: () => {
    const n = { id: uid(), title: 'NEW ENTRY', body: '> ' };
    state.notes.push(n); setSel(state.notes.length - 1); toast('ENTRY CREATED');
  },
  delnote: d => {
    if (ui.confirm !== 'note:' + d.id) { armConfirm('note:' + d.id); return; }
    ui.confirm = null; state.notes = state.notes.filter(n => n.id !== d.id);
    setSel(Math.max(0, getSel() - 1)); toast('ENTRY DELETED');
  },
  copy: () => {
    const box = $('#exportBox'); if (!box) return;
    const done = () => toast('COPIED TO CLIPBOARD');
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(box.value).then(done, () => { box.select(); document.execCommand('copy'); done(); });
    else { box.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('PRESS CTRL+C TO COPY'); } }
  },
  download: () => {
    const blob = new Blob([exportSheet()], { type:'text/plain' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = (state.bio.name || 'character').replace(/\W+/g, '_') + '_sheet.txt';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('SHEET DOWNLOADED');
  },
  reset: () => {
    if (ui.confirm !== 'reset') { armConfirm('reset'); return; }
    ui.confirm = null; Sound.radioStop(); portrait = null; savePortrait(); statusImg = null; saveStatusImg();
    const keepOn = false; state = defaultState(); state.radio.on = keepOn;
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {  }
    ui.sel = {}; toast('DATA RESET');
  },
  radiopower: () => { setRadio(!state.radio.on); },
  tune: d => { tuneTo(state.radio.freq + num(d.d)); }
};
const SOFT_ACTIONS = new Set(['tune', 'portraitup', 'statusup']);

function armConfirm(key) {
  ui.confirm = key; clearTimeout(armConfirm.t);
  armConfirm.t = setTimeout(() => { ui.confirm = null; renderDetail(); }, 3000);
}

const screen = () => SCREENS[screenKey()];
const currentItems = () => screen().list();
const selectable = it => it && it.type !== 'sep';

function renderTabs() {
  $$('#mainTabs .tab').forEach(b => {
    const on = b.dataset.tab === ui.tab;
    b.classList.toggle('active', on); b.setAttribute('aria-selected', on);
  });
  $$('.pb-btn').forEach(b => { const on = b.dataset.tab === ui.tab; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  const t = TABS[ui.tab];
  $('#subTabs').innerHTML = t.subs.map(([k, l]) =>
    `<button type="button" class="tab ${ui.sub[ui.tab] === k ? 'active' : ''}" role="tab" data-sub="${k}" aria-selected="${ui.sub[ui.tab] === k}">${l}</button>`).join('');
  const label = t.subs.find(s => s[0] === ui.sub[ui.tab])[1];
  $('#hdrSection').textContent = `${t.label} \u203A ${label}`;
  $('#split').dataset.screen = screenKey();
}

function renderList() {
  const sc = screen(), items = sc.list(), list = $('#list'), prev = list.scrollTop;
  let idx = clamp(getSel(), 0, items.length - 1);
  if (!selectable(items[idx])) idx = Math.max(0, items.findIndex(selectable));
  setSel(idx);
  list.innerHTML = items.map((it, i) => it.type === 'sep'
    ? `<li class="li sep">${it.name}</li>`
    : `<li class="li ${i === idx ? 'sel' : ''} ${it.type === 'add' ? 'add' : ''}" role="option" aria-selected="${i === idx}" data-i="${i}">
         <span class="nm">${it.eq ? `<span class="eq">${it.eq}</span>` : ''}${tc(it.name)}</span><span class="vl">${it.val ?? ''}</span></li>`).join('');
  list.scrollTop = prev;
  const cur = list.children[idx]; if (cur && cur.scrollIntoView) cur.scrollIntoView({ block:'nearest' });
  renderChrome();
}
function renderChrome() {
  const sc = screen();
  $('#listHead').innerHTML = sc.head ? sc.head() : '';
  $('#listFoot').innerHTML = sc.foot ? sc.foot() : '';
}
function renderDetail() {
  const sc = screen(), items = sc.list(), idx = clamp(getSel(), 0, items.length - 1), el = $('#detail'), prev = el.scrollTop;
  el.innerHTML = items[idx] ? sc.detail(items[idx], idx, items) : '';
  el.scrollTop = prev;
  if (sc.after) sc.after();
}
function syncLegend() { const l = $('#legendAdjust'); if (l) l.hidden = screenKey() === 'stat.status'; }
function render() { clampVitals(); renderTabs(); renderList(); renderDetail(); refreshHUD(); syncLegend(); }
function refreshAfterChange() { clampVitals(); renderList(); renderDetail(); refreshHUD(); save(); }

function refreshHUD() {
  const hpEl = $('#sbHp');
  hpEl.textContent = `${state.hp}/${maxHp()}`;
  hpEl.classList.toggle('low', state.hp / maxHp() < 0.25);
  $('#sbLvl').textContent = state.level;
  const pb = $('#pipboy'); if (pb) pb.style.setProperty('--rad', clamp(state.rads / 1000, 0, 1));
  $('#hdrLvl').textContent = 'LVL ' + state.level;
  $('#sbAp').textContent = `${state.ap}/${maxAp()}`;
  $('#sbRads').textContent = state.rads;
  const caps = $('#sbCaps'); if (document.activeElement !== caps) caps.textContent = pad(state.caps, 3);
}

function setTab(t, silent) {
  if (!TABS[t] || t === ui.tab) return;
  ui.tab = t; ui.confirm = null; if (!silent) Sound.play('tab'); render();
}
function setSub(k) {
  if (k === ui.sub[ui.tab]) return;
  ui.sub[ui.tab] = k; ui.confirm = null; Sound.play('tab'); render();
}
function stepTab(d) { setTab(TAB_ORDER[(TAB_ORDER.indexOf(ui.tab) + d + TAB_ORDER.length) % TAB_ORDER.length]); }
function stepSub(d) {
  const subs = TABS[ui.tab].subs.map(s => s[0]), i = subs.indexOf(ui.sub[ui.tab]);
  setSub(subs[(i + d + subs.length) % subs.length]);
}
function moveSel(d) {
  const items = currentItems(); let i = getSel();
  do { i += d; } while (items[i] && !selectable(items[i]));
  if (i < 0 || i >= items.length) return;
  setSel(i); ui.confirm = null; Sound.play('focus', 0.5); renderList(); renderDetail();
}
function selectIndex(i) {
  const items = currentItems(); if (!selectable(items[i])) return;
  const same = i === getSel(); setSel(i); ui.confirm = null; Sound.play('focus', 0.5);
  renderList(); renderDetail();
  if (items[i].type === 'add' && !same) {  }
}

function applyBind(path, raw) {
  const p = path.split('.'), kind = p[0];
  if (kind === 'bio') state.bio[p[1]] = raw;
  else if (kind === 'stat') {
    if (p[1] === 'rads') state.rads = num(raw);
    else if (p[1] === 'hp') state.hp = num(raw);
    else if (p[1] === 'ap') state.ap = num(raw);
    else if (p[1] === 'limb' && state.limbs[p[2]] !== undefined) state.limbs[p[2]] = clamp(num(raw), 0, 100);
  }
  else if (kind === 'item') {
    const it = getItem(p[1]); if (!it) return;
    const k = p[2];
    if (NUMERIC_KEYS.has(k)) {
      let v = num(raw);
      if (k === 'cnd') v = clamp(v, 0, 100);
      if (k !== 'hp' && k !== 'rads' && v < 0) v = 0;
      it[k] = v;
    } else it[k] = raw;
    if (k === 'cnd' || k === 'dmg' || k === 'rof') { const o = $('#dpsOut'); if (o) o.textContent = fmt1(dps(it)); }
  }
  else if (kind === 'note') {
    const n = getNote(p[1]); if (!n) return; n[p[2]] = raw;
    if (p[2] === 'body') { const c = $('#noteCount'); if (c) c.textContent = raw.length + ' CHARS'; }
  }
  save(); clampVitals(); refreshHUD(); renderChrome();
}

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 1400);
}

function tickClock() {
  const ms = state.clock.game + (Date.now() - state.clock.real) * CLOCK_SCALE, d = new Date(ms);
  $('#sbTime').textContent = `${pad(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

function runBoot() {
  const boot = $('#boot'), out = $('#bootText');
  const lines = [
    'ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL',
    'PIP-BOY 3000A  //  PIP-OS V2.77',
    '',
    '> INITIALIZING VAULT-TEC SYSTEMS ........ OK',
    '> MOJAVE WASTELAND UPLINK ............... OK',
    '> BIOMETRIC SYNC ........................ OK',
    '> LOADING CHARACTER FILE ................ OK',
    '',
    `WELCOME, ${String(state.bio.name || 'WANDERER').toUpperCase()}`
  ];
  let li = 0, ci = 0, done = false, timer;
  const finish = () => {
    if (done) return; done = true; clearInterval(timer);
    boot.classList.add('gone'); Sound.ac(); Sound.play('tab');
    if (state.radio.on) Sound.radioStart();
    document.removeEventListener('keydown', onKey, true);
    setTimeout(() => { boot.hidden = true; boot.style.display = 'none'; }, 400);
  };
  const onKey = e => { if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return; e.preventDefault(); e.stopPropagation(); finish(); };
  boot.addEventListener('click', finish);
  document.addEventListener('keydown', onKey, true);
  timer = setInterval(() => {
    if (li >= lines.length) { clearInterval(timer); return; }
    const L = lines[li];
    if (ci <= L.length) { out.textContent = lines.slice(0, li).join('\n') + (li ? '\n' : '') + L.slice(0, ci) + '\u2588'; ci += 2; }
    else { li++; ci = 0; }
  }, 22);
  boot.focus();
}

function wire() {
  $$('.pb-btn').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
  $('#mainTabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) setTab(b.dataset.tab); });
  $('#subTabs').addEventListener('click', e => { const b = e.target.closest('[data-sub]'); if (b) setSub(b.dataset.sub); });

  $('#list').addEventListener('click', e => {
    const li = e.target.closest('.li[data-i]'); if (!li) return;
    const i = +li.dataset.i, items = currentItems();
    if (items[i].type === 'add') { setSel(i); const sc = screen(); if (sc.activate) { sc.activate(items[i]); Sound.play('click'); refreshAfterChange(); } return; }
    selectIndex(i);
    const sc2 = screen();
    if (sc2.clickActivates) { sc2.activate(currentItems()[i]); refreshAfterChange(); }
  });
  $('#list').addEventListener('dblclick', e => {
    const li = e.target.closest('.li[data-i]'); if (!li) return;
    const sc = screen(), items = currentItems(), it = items[+li.dataset.i];
    if (sc.activate && it.type !== 'add') { sc.activate(it); Sound.play('click'); refreshAfterChange(); }
  });

  const detail = $('#detail');
  detail.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    const act = b.dataset.act, fn = actions[act]; if (!fn) return;
    if (act !== 'use') Sound.play(act === 'radiopower' ? 'focus' : 'click');
    fn(Object.assign({}, b.dataset));
    if (SOFT_ACTIONS.has(act)) return;
    if (act === 'radiopower') return;
    refreshAfterChange();
  });
  detail.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'tuner') { tuneTo(parseFloat(t.value)); return; }
    if (t.dataset.bind && t.tagName !== 'SELECT') applyBind(t.dataset.bind, t.value);
  });
  detail.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset && t.dataset.bind) {
      applyBind(t.dataset.bind, t.value);
      if (t.tagName === 'SELECT') { Sound.play('click'); refreshAfterChange(); } else renderList();
    }
  });
  detail.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.target.blur();
    if (e.key === 'Escape') e.target.blur();
  });

  detail.addEventListener('click', e => {
    const l = e.target.closest('[data-limb]'); if (!l) return;
    const items = currentItems(), i = items.findIndex(x => x.key === l.dataset.limb);
    if (i >= 0) { setSel(i); Sound.play('focus'); renderList(); renderDetail(); }
  });

  const caps = $('#sbCaps');
  caps.addEventListener('focus', () => { const r = document.createRange(); r.selectNodeContents(caps); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
  caps.addEventListener('input', () => { state.caps = Math.max(0, parseInt(caps.textContent.replace(/\D/g, ''), 10) || 0); save(); renderChrome(); });
  caps.addEventListener('blur', () => { state.caps = Math.max(0, parseInt(caps.textContent.replace(/\D/g, ''), 10) || 0); caps.textContent = pad(state.caps, 3); save(); renderChrome(); });
  caps.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); caps.blur(); } else if (e.key.length === 1 && !/\d/.test(e.key) && !e.ctrlKey && !e.metaKey) e.preventDefault(); });

  document.addEventListener('keydown', e => {
    const t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!$('#boot').classList.contains('gone')) return;
    const k = e.key, sc = screen(), items = currentItems(), item = items[getSel()];
    let handled = true;
    switch (k) {
      case 'q': case 'Q': case '[': stepTab(-1); break;
      case 'e': case 'E': case ']': stepTab(1); break;
      case 'ArrowLeft':  stepSub(-1); break;
      case 'ArrowRight': stepSub(1); break;
      case 'ArrowUp':    moveSel(-1); break;
      case 'ArrowDown':  moveSel(1); break;
      case '+': case '=': if (sc.adjust && item) { sc.adjust(item, 1); Sound.play('click'); refreshAfterChange(); } break;
      case '-': case '_': if (sc.adjust && item) { sc.adjust(item, -1); Sound.play('click'); refreshAfterChange(); } break;
      case 'Enter': if (sc.activate && item) { sc.activate(item); Sound.play('click'); refreshAfterChange(); } break;
      case '1': case '2': if (ui.tab === 'inv' && ui.sub.inv === 'weapons' && item && item.id) { equipWeapon(item.id, +k); Sound.play('click'); refreshAfterChange(); } else handled = false; break;
      case 'm': case 'M': Sound.muted = !Sound.muted; if (Sound.muted) Sound.radioSet(0); else Sound.radioSet(radioStrength()); toast(Sound.muted ? 'AUDIO MUTED' : 'AUDIO ON'); break;
      default: handled = false;
    }
    if (handled) e.preventDefault();
  });
}

function init() {
  Sound.init();
  clampVitals();
  render();
  wire();
  tickClock(); setInterval(tickClock, 1000);
  runBoot();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

})();
