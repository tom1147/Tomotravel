// Run: node scripts/test_tomogame.cjs
// Exercise the shipped game logic with deterministic time/input and a small DOM/physics boundary.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fixture() {
    let now = 10000, timerId = 0;
    const timers = new Map(), elements = new Map(), saved = new Map();
    const makeElement = () => {
        const classes = new Set(), listeners = new Map();
        return {
            style: {}, children: [], textContent: '', innerHTML: '', disabled: false,
            classList: { add: (...names) => names.forEach(n => classes.add(n)), remove: (...names) => names.forEach(n => classes.delete(n)), contains: n => classes.has(n), toggle(n, force) { const yes = force ?? !classes.has(n); yes ? classes.add(n) : classes.delete(n); return yes; } },
            addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); },
            fire(type, event) { for (const fn of listeners.get(type) || []) fn(event); },
            appendChild(child) { this.children.push(child); },
            setAttribute() {}, remove() {}, focus() {}, closest() { return null; },
            setPointerCapture(id) { this.pointer = id; }, hasPointerCapture(id) { return this.pointer === id; }, releasePointerCapture() { this.pointer = null; },
            getBoundingClientRect: () => ({left: 100, right: 540, top: 50, bottom: 750, width: 440, height: 700}),
            querySelectorAll: () => [],
        };
    };
    const element = id => { if (!elements.has(id)) elements.set(id, makeElement()); return elements.get(id); };
    const doc = Object.assign(makeElement(), {hidden: false, body: makeElement(), getElementById: element, createElement: makeElement, querySelectorAll: () => []});
    for (const id of ['settings-panel', 'cast-panel', 'cast-detail-modal', 'game-over']) element(id).classList.add('hidden');
    const physics = {
        Engine: {}, Render: {}, Runner: {stop() {}}, Events: {}, Vector: {magnitude: v => Math.hypot(v.x, v.y)},
        Bodies: {circle: (x, y, r, options) => ({...options, position: {x, y}, circleRadius: r, velocity: {x: 0, y: 0}})},
        Body: {setVelocity(body, velocity) { body.velocity = velocity; }},
        Composite: {allBodies: world => world.bodies, add(world, body) { world.bodies.push(body); }, remove(world, body) { world.bodies = world.bodies.filter(b => b !== body); }},
    };
    const context = vm.createContext({
        document: doc, window: {matchMedia: () => ({matches: false}), addEventListener() {}},
        Matter: physics, console, Math, Date: class extends Date { static now() { return now; } },
        localStorage: {getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value)},
        Audio: function() { this.pause = () => {}; this.play = () => Promise.resolve(); },
        setTimeout: (fn, delay) => { const id = ++timerId; timers.set(id, {fn, at: now + delay}); return id; },
        clearTimeout: id => timers.delete(id), clearInterval() {},
    });
    const run = source => vm.runInContext(source, context);
    for (const name of ['objects.js', 'game.js']) run(fs.readFileSync(path.join(__dirname, '../TomoGame_V1.0/js', name), 'utf8'));
    run('engine = {world: {bodies: []}, timing: {timeScale: 1}}; runner = {enabled: true}; gamePreferences.sound = false; initSoundContext = () => {}; currentCat = CAT_OBJECTS[0]; nextCat = CAT_OBJECTS[1];');
    return {run, doc, element, context, saved, advance(ms) { now += ms; for (const [id, t] of [...timers]) if (t.at <= now) { timers.delete(id); t.fn(); } }};
}

let passed = 0;
function test(name, fn) { const f = fixture(); fn(f); passed++; console.log('PASS', name); }

test('first touch aims at its actual position and emits one drop', f => {
    f.run('setupInputEvents()');
    const area = f.element('game-area');
    const e = {isPrimary: true, pointerId: 1, pointerType: 'touch', button: 0, clientX: 440, clientY: 200, target: area};
    area.fire('pointerdown', e);
    area.fire('pointerup', e);
    area.fire('click', e); // Synthetic click must not create another body.
    assert.equal(f.run('engine.world.bodies.length'), 1);
    assert.equal(f.run('engine.world.bodies[0].position.x'), 340);
});

test('cancelled, secondary and outside gestures never drop', f => {
    f.run('setupInputEvents()');
    const area = f.element('game-area');
    const e = {isPrimary: true, pointerId: 1, button: 0, clientX: 200, clientY: 200, target: area};
    area.fire('pointerdown', e); area.fire('pointercancel', e); area.fire('pointerup', e);
    area.fire('pointerdown', {...e, isPrimary: false}); area.fire('pointerup', e);
    area.fire('pointerdown', e); area.fire('pointerup', {...e, clientX: 700});
    assert.equal(f.run('engine.world.bodies.length'), 0);
});

test('holding a bigger ball at the wall clamps its drop position', f => {
    f.run('dropX = 45; holdCat = CAT_OBJECTS[4]; useHold(); dropCat();');
    assert.equal(f.run('holdCount'), 4);
    assert.equal(f.run('engine.world.bodies[0].position.x'), 86);
});

test('hold and bomb-skip preserve bomb mode when the next ball is also a bomb', f => {
    f.run('nextCat = BOMB_OBJECT; useHold();');
    assert.equal(f.run('isBombMode'), true);
    assert.equal(f.element('skip-bomb-btn').classList.contains('hidden'), false);
    f.run('nextCat = BOMB_OBJECT; skipBomb();');
    assert.equal(f.run('isBombMode'), true);
});

test('five merges activate fever with doubled points on the fifth merge', f => {
    f.run(`for (let i = 0; i < 5; i++) {
        const a = Bodies.circle(180, 500, 25, {plugin: {catLevel: 1}});
        const b = Bodies.circle(210, 500, 25, {plugin: {catLevel: 1}});
        Composite.add(engine.world, a); Composite.add(engine.world, b); mergeCats(a, b);
    }`);
    assert.equal(f.run('score'), 56); // 3 + (3+4) + (3+6) + (3+8) + (6+20)
    assert.equal(f.run('isFever'), true);
    assert.equal(f.run('runMaxCombo'), 5);
    assert.equal(f.run('runMerges'), 5);
    f.advance(2401);
    assert.equal(f.run('comboCount'), 0);
    assert.equal(f.run('isFever'), false);
});

test('pause freezes physics, blocks consumables, and preserves combo time', f => {
    f.run('comboCount = 3; comboDeadline = Date.now() + 2400; comboTimer = setTimeout(resetComboClock, 2400);');
    f.advance(400);
    f.element('settings-panel').classList.remove('hidden');
    f.run('syncGameplayPause(); dropCat(); useHold(); useReroll();');
    assert.equal(f.run('runner.enabled'), false);
    assert.equal(f.run('holdCount'), 5);
    assert.equal(f.run('rerollCount'), 5);
    assert.equal(f.run('engine.world.bodies.length'), 0);
    f.advance(10000);
    assert.equal(f.run('comboCount'), 3);
    f.element('settings-panel').classList.add('hidden');
    f.run('syncGameplayPause()');
    assert.equal(f.run('runner.enabled'), true);
    assert.equal(f.run('comboDeadline - Date.now()'), 2000);
    f.advance(2001);
    assert.equal(f.run('comboCount'), 0);
});

test('a nested character detail keeps the board paused until all panels close', f => {
    f.element('cast-panel').classList.remove('hidden'); f.run('syncGameplayPause()');
    f.element('cast-detail-modal').classList.remove('hidden'); f.element('cast-panel').classList.add('hidden'); f.run('syncGameplayPause()');
    assert.equal(f.run('runner.enabled'), false);
    f.element('cast-detail-modal').classList.add('hidden'); f.run('syncGameplayPause()');
    assert.equal(f.run('runner.enabled'), true);
});

test('keyboard hold-to-repeat cannot auto-drop balls', f => {
    f.run('setupInputEvents()');
    const key = {key: ' ', code: 'Space', target: f.element('game-area'), preventDefault() {}};
    f.doc.fire('keydown', {...key, repeat: false});
    f.advance(301);
    f.doc.fire('keydown', {...key, repeat: true});
    assert.equal(f.run('engine.world.bodies.length'), 1);
});

test('sound preference also applies to newly created background audio', f => {
    f.run('gamePreferences.sound = false; initAudio();');
    assert.equal(f.run('bgm.muted'), true);
    f.run('gamePreferences.sound = true; applyGamePreferences();');
    assert.equal(f.run('bgm.muted'), false);
    assert.equal(JSON.parse(f.saved.get('tomogame_preferences')).sound, true);
});

test('unavailable browser storage does not prevent a game from loading', f => {
    f.context.localStorage.getItem = () => { throw new Error('blocked'); };
    f.context.localStorage.setItem = () => { throw new Error('blocked'); };
    assert.doesNotThrow(() => f.run('loadHighScore(); saveHighScore(); loadBgmIndex(); saveBgmIndex(); applyGamePreferences();'));
    assert.equal(f.run('highScore'), 0);
});

test('results show the real run stats and preserve the high score', f => {
    f.run('score = 120; runMaxCombo = 6; runMerges = 12; maxReachedLevel = 4; gameOver();');
    assert.equal(f.element('result-combo').textContent, 6);
    assert.equal(f.element('result-merges').textContent, 12);
    assert.equal(f.element('final-score').textContent, '120');
    assert.equal(f.saved.get('tomogame_highscore'), '120');
    assert.equal(f.element('continue-btn').textContent, '1回だけ復活する');
    assert.equal(f.element('game-over').classList.contains('hidden'), false);
});

console.log(`${passed} gameplay regression checks passed.`);
