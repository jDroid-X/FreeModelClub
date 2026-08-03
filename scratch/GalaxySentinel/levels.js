We are to write the file `levels.js` for a Canvas Game.
 The file must manage:
   - enemy spawning waves
   - boss battle triggers
   - star field density arrays
   - stage background color shifts

 We assume the following from the context:
   - We have an EventEmitter class (from engine.js) for communication.
   - We have enemy classes (from enemies.js) that we can spawn.
   - We have a particle system (from particles.js) for the star field? But note: the star field density arrays might be for the starfield background (which we might handle in ui.js or here?).
   - However, the prompt says: "star field density arrays" and "stage background color shifts", so we are to manage the data for these, and perhaps trigger changes in the UI or particle system.

 Approach:

   We'll create a `LevelManager` class that:
        - Is initialized with a reference to the game engine (or at least the enemy spawning system, and possibly the UI/particle system for starfield and background).
        - Manages the current level, wave, and state.
        - Defines level data (waves, boss triggers, starfield density, background colors).
        - Spawns enemies according to the wave.
        - Triggers boss battles when conditions are met.
        - Provides methods to update the starfield density and background color (which would be used by other systems, e.g., the UIRenderer for starfield and the game engine for background color).

   However, note: the starfield density arrays might be used by the starfield system (which we assumed in ui.js) to control how many stars are spawned or their speed.

   We'll design the LevelManager to emit events when:
        - A new wave starts.
        - A boss battle starts.
        - The starfield density should change.
        - The background color should change.

   Alternatively, we can have the LevelManager directly update the starfield and background if we have references to those systems.

   But to keep it decoupled, we'll use events.

   Steps:

   1. Define level data structure.

   2. The LevelManager will have:
        - currentLevel: integer
        - currentWave: integer (within the level)
        - waveTimer: to time the spawning of enemies in a wave
        - enemiesToSpawn: array of enemies for the current wave
        - spawnedEnemiesCount: how many we have spawned in the current wave
        - isBossLevel: boolean
        - bossTriggered: boolean

   3. We'll define a set of levels. Each level has:
        - waves: array of wave objects
        - boss: object (if applicable) that defines when the boss appears and what boss to spawn
        - starfieldDensity: array of densities (maybe per wave or per level) that we will use to set the starfield
        - backgroundColor: string or array for the background color shift

   4. Example wave object:
        {
          duration: 30000, // ms the wave lasts
          spawnInterval: 1500, // ms between enemy spawns
          enemyTypes: ['SCOUT', 'SCOUT', 'HUNTER'], // sequence of enemies to spawn
          // or we can have a spawn function that returns an enemy type based on time
        }

   5. We'll also have a method to start the level, update (called each frame), and handle wave completion.

   6. We'll assume that the LevelManager is given a way to spawn enemies (e.g., a reference to an enemy manager or the game world). 
        Since we don't have an enemy manager, we'll assume that the LevelManager will emit an event 'spawnEnemy' with the enemy type and position, 
        and let another system (like the game world) handle the actual spawning.

   7. Similarly, for starfield density and background color, we'll emit events.

   8. We'll also need to handle the boss battle: when the boss is triggered, we stop spawning regular waves and spawn the boss.

   9. We'll design the LevelManager to extend EventEmitter so it can emit events.

   10. Events we might emit:
        - 'waveStarted': { level, wave, waveData }
        - 'waveCompleted': { level, wave }
        - 'enemySpawnRequest': { type, x, y, ... }   // so the game world can spawn the enemy
        - 'bossBattleStart': { bossType, ... }
        - 'starfieldDensityChange': { density }   // density might be a number or an object
        - 'backgroundColorChange': { color }      // color string

   11. We'll also listen for events? Maybe for when all enemies in a wave are destroyed to complete the wave.

   12. However, note: the LevelManager might not know when enemies are destroyed. We can have it rely on a wave duration or a kill count.

   13. We'll design two types of waves:
        - Time-based: the wave lasts for a set duration, and enemies spawn at intervals.
        - Count-based: the wave ends when a certain number of enemies are killed.

   14. Given the complexity, we'll do time-based waves for simplicity, and then we can extend.

   15. We'll assume that the game will tell the LevelManager when a wave is over (by emitting a 'waveCompleted' event that the LevelManager listens to) 
        OR we can have the LevelManager manage the wave timer and then emit a waveCompleted event when the time is up.

   16. We'll have the LevelManager update its own timers and then when a wave is done, it will move to the next wave or level.

   17. We'll also need to handle the transition between levels.

   18. We'll define the levels as a static array or as a method that returns level data.

   19. We'll assume the following level structure for simplicity:

        const LEVEL_DATA = [
          {
            // Level 1
            waves: [
              {
                duration: 20000, // 20 seconds
                spawnInterval: 2000, // every 2 seconds
                enemyTypes: ['SCOUT', 'SCOUT', 'HUNTER', 'SCOUT'] // pattern
              },
              {
                duration: 15000,
                spawnInterval: 1000,
                enemyTypes: ['HUNTER', 'HUNTER', 'SCOUT', 'SCOUT', 'COMMANDER']
              }
            ],
            boss: {
              // If present, the boss will appear after the waves
              triggerAfterWave: 2, // after wave 2 (0-indexed? or 1-indexed? we'll do after the last wave)
              type: 'COMMANDER_BOSS', // or we can have a boss class
              health: 50,
              // ... other boss properties
            },
            starfieldDensity: [0.5, 0.8, 1.0], // density for each wave? or for the level? we'll do per wave
            backgroundColor: ['#0a0b10', '#11121a', '#0f1117'] // gradient or shift over the level
          },
          // Level 2, etc.
        ];

   20. However, note: the prompt says "star field density arrays", so we might have an array of densities that we cycle through or use per wave.

   21. We'll design the LevelManager to:
        - On initialization, set currentLevel = 0, currentWave = -1 (so first wave is 0).
        - When starting, load the first wave of the first level.
        - Update: 
             * If we are in a wave, update the wave timer and spawn enemies at the interval.
             * If the wave duration is over, then complete the wave and move to the next wave (or boss if applicable).
        - When a wave completes, we check if there is a next wave or if we should trigger the boss.

   22. We'll also need to handle the boss battle as a special wave.

   23. We'll assume that the boss is spawned as a single enemy (or a set of enemies) and when the boss is defeated, we complete the level.

   24. We'll emit events for:
        - 'waveStarted'
        - 'waveCompleted'
        - 'bossBattleStart'
        - 'levelCompleted'
        - 'starfieldDensityChange' (when the density for the current wave changes)
        - 'backgroundColorChange' (when the background color for the current wave or level changes)

   25. We'll also need to know when to update the starfield density and background color. We can do:
        - When the wave changes, we emit the starfieldDensity and backgroundColor for that wave.

   26. We'll assume that the LevelManager is updated every frame (via the engine's update event).

   27. We'll write the LevelManager class.

   28. We'll need to bind the update method to the engine's update event.

   29. We'll assume that the LevelManager is created and then started by the game.

   30. We'll also need to reset the level manager when the game restarts.

   31. Let's code accordingly.

   Note: We are not given the exact structure of the game world, so we will make the LevelManager emit events for spawning and let another system handle it.

   We'll create:

        class LevelManager extends EventEmitter {
          constructor(engine) {
            super();
            this.engine = engine;
            this.currentLevel = 0;
            this.currentWave = -1; // so that first wave is index 0 when we start
            this.waveTimer = 0;
            this.spawnTimer = 0;
            this.waveDuration = 0;
            this.spawnInterval = 0;
            this.enemyTypes = []; // for the current wave
            this.spawnedCount = 0;
            this.totalToSpawn = 0;
            this.isBossLevel = false;
            this.bossSpawned = false;
            this.levelData = LEVEL_DATA; // we'll define LEVEL_DATA inside the file or import it? We'll define it as a static property or inside the class.

            // Bind methods
            this._update = this._update.bind(this);
          }

          start() {
            // Start from the beginning
            this._loadLevel(0, 0);
            // Start listening to engine update
            this.engine.on('update', this._update);
          }

          stop() {
            this.engine.off('update', this._update);
          }

          _loadLevel(levelIndex, waveIndex) {
            this.currentLevel = levelIndex;
            this.currentWave = waveIndex;
            const level = LEVEL_DATA[levelIndex];
            if (!level) {
              // No more levels
              this.emit('gameCompleted');
              return;
            }

            this.isBossLevel = !!level.boss;
            if (waveIndex < level.waves.length) {
              this._loadWave(level.waves[waveIndex]);
            } else if (level.boss && !this.bossSpawned) {
              this._startBossBattle(level.boss);
            } else {
              // Level completed
              this.emit('levelCompleted', { level: this.currentLevel });
              // Move to next level
              this._loadLevel(levelIndex + 1, 0);
            }
          }

          _loadWave(waveData) {
            this.waveDuration = waveData.duration;
            this.spawnInterval = waveData.spawnInterval;
            this.enemyTypes = waveData.enemyTypes || [];
            this.spawnTimer = 0;
            this.spawnedCount = 0;
            this.totalToSpawn = Math.ceil(this.waveDuration / this.spawnInterval);
            this.waveTimer = 0;

            // Emit starfield density and background color for this wave
            // We assume level has starfieldDensity and backgroundColor arrays, and we use the current wave index
            const level = LEVEL_DATA[this.currentLevel];
            const density = level.starfieldDensity ? level.starfieldDensity[this.currentWave] : 1.0;
            const color = level.backgroundColor ? level.backgroundColor[this.currentWave] : level.backgroundColor[0] || '#0a0b10';

            this.emit('starfieldDensityChange', { density });
            this.emit('backgroundColorChange', { color });

            this.emit('waveStarted', {
              level: this.currentLevel,
              wave: this.currentWave,
              waveData
            });
          }

          _startBossBattle(bossData) {
            this.bossSpawned = true;
            this.emit('bossBattleStart', { boss: bossData });
            // We might set up a special wave for the boss? Or just emit the event and let the game handle spawning the boss.
            // For now, we just emit the event.
          }

          _update(deltaTime, fps) {
            if (this.currentWave < 0) return; // not started

            this.waveTimer += deltaTime;
            this.spawnTimer += deltaTime;

            // Check if it's time to spawn an enemy
            if (this.spawnTimer >= this.spawnInterval && this.spawnedCount < this.totalToSpawn) {
              this._spawnEnemy();
              this.spawnTimer = 0;
            }

            // Check if wave is over by time
            if (this.waveTimer >= this.waveDuration) {
              this._completeWave();
            }
          }

          _spawnEnemy() {
            if (this.enemyTypes.length === 0) return;

            // Cycle through enemyTypes or pick randomly? We'll cycle in order for now.
            const