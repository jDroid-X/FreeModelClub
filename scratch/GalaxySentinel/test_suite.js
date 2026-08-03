We are to write a test suite file: test_suite.js
 The test suite should assert:
   - engine delta updates
   - collision functions
   - key bindings validation

 We assume the following from the context:
   - We have an EventEmitter class (from engine.js)
   - We have a ResourceManager, InputManager, GameStateManager, GameLoop, GameEngine (from engine.js)
   - We have collision functions (we are to write physics.js, but we can test the collision functions we plan to write there)
   - We have key bindings (in InputManager)

 However, note: we are writing a test suite for the existing codebase? But we are also writing other files (like physics.js, etc.) in this session.

 Since we are to write a test suite that asserts engine delta updates, collision functions, and key bindings validation, we will:

   1. Test the GameEngine's delta time updates (i.e., that the game loop provides correct delta time).
   2. Test the collision functions (we'll assume we have a physics module with circle-circle, circle-AABB, etc. functions).
   3. Test the InputManager's key binding system.

 Approach:

   We'll create a test suite that uses a simple assertion function (since we don't have a testing framework, we'll write our own).

   We'll structure the test suite as:

      - A function to run tests and report results.
      - Test cases for each area.

   We'll need to mock or create instances of the classes we want to test.

   Steps:

     1. We'll create a mock canvas for the engine and input manager.
     2. We'll create an instance of GameEngine and then access its subsystems (inputManager, gameLoop, etc.).
     3. We'll test the delta time by simulating a few frames and checking that delta time is positive and reasonable.
     4. We'll test the collision functions by creating test objects and checking collisions.
     5. We'll test the key bindings by binding keys and then simulating key presses and checking if the action is triggered.

   However, note: we are to write the test suite for the codebase we are building. We assume that the codebase includes the classes we have been writing (like engine.js, and we are about to write physics.js, etc.).

   But note: the test suite must be self-contained and runnable in the browser? Or in Node? The prompt doesn't specify.

   Since the game is a canvas game, we assume the test suite will run in the browser.

   We'll write the test suite as a script that can be included in an HTML file for testing.

   We'll create:

        function assert(condition, message) { ... }
        function runTests() { ... }

   And then we'll run the tests and log the results.

   We'll test:

     A. Engine Delta Updates:
          - Create a GameEngine instance with a mock canvas.
          - Start the game loop for a short time (or we can mock the requestAnimationFrame?).
          - Alternatively, we can test the GameLoop class directly.

        However, note: the GameLoop is internal to the GameEngine. We can test the GameLoop by creating one and then calling its _tick method with mocked times.

     B. Collision Functions:
          - We'll assume we have a physics module (which we are writing in physics.js) that exports functions:
                circleCircleCollision(circle1, circle2)
                circleAABBCollision(circle, rect)
                AABBAABBCollision(rect1, rect2)
          - We'll test these functions with known cases.

     C. Key Bindings Validation:
          - Create an InputManager instance with a mock canvas.
          - Bind an action to a key.
          - Simulate a keydown event for that key and check if the action is pressed.
          - Also test unbinding and multiple keys.

   Since we are writing the test suite, we will include the necessary code to test the classes we are about to write? 
   But note: the test suite must work with the existing codebase (which we are building in this session).

   However, the user has not provided the full codebase for engine.js, etc. We have only seen a snippet of engine.js.

   We must assume that the classes we are testing (GameEngine, InputManager, etc.) are available in the global scope (as they are attached to window in engine.js).

   From engine.js we see:
        window.GameEngine = this;
        window.EventEmitter = EventEmitter;
        window.ResourceManager = ResourceManager;
        window.InputManager = InputManager;
        window.GameStateManager = GameStateManager;
        window.GameLoop = GameLoop;

   So in our test suite, we can access these as global variables.

   But note: we are also writing physics.js and we are to test collision functions. We don't know if they are exported globally.

   We'll assume that the collision functions are exported in a module called `Physics` or we can test them by requiring the physics.js file? 
   However, the test suite is a standalone file and we are to write it to be included in the same context as the game.

   Since we are writing the test suite for the game, we can assume that if we have written physics.js, then the collision functions are available in a way we can access.

   But note: the prompt does not specify how the collision functions are exposed. We'll assume we have a `Physics` object or we can import them.

   However, to keep the test suite simple and not depend on the exact structure of physics.js (which we are also writing), we will:

        - If we are writing physics.js to export a Physics class or functions, we will test them by creating an instance or calling the functions.

   But note: we are to write the test suite now, and we are also writing other files. We must write the test suite in a way that it can test the functions we are going to write.

   We'll design the test suite to be flexible: we'll test the collision functions by expecting them to be available in a global `Physics` object or as standalone functions.

   Alternatively, we can avoid testing the collision functions if they are not available? But the prompt requires it.

   Let's assume that in physics.js we will have:

        class Physics {
          static circleCircle(c1, c2) { ... }
          static circleAABB(circle, rect) { ... }
          static AABBAABB(r1, r2) { ... }
        }

   And then we attach it to window: window.Physics = Physics;

   Or we can just have the functions as globals? We'll do the class approach for now.

   However, note: we are writing the test suite without knowing the exact implementation of physics.js. We'll write the tests based on the expected interface.

   We'll write the test suite and then if the physics.js we write later matches the interface, the tests will pass.

   Steps for the test suite:

     1. We'll create a simple test runner.

     2. We'll test the GameLoop's delta time calculation.

     3. We'll test the InputManager's key bindings.

     4. We'll test the Physics class's collision functions.

   We'll write the test suite as follows:

        // Test Suite for the Canvas Game Engine
        // Tests: engine delta updates, collision functions, key bindings validation

        // Helper assertion function
        function assertTrue(value, message) {
          if (!value) {
            throw new Error(`Assertion failed: ${message}`);
          }
        }

        function assertEquals(actual, expected, message) {
          if (actual !== expected) {
            throw new Error(`Assertion failed: ${message}. Expected ${expected}, got ${actual}`);
          }
        }

        function runTests() {
          let passed = 0;
          let failed = 0;

          try {
            testEngineDeltaUpdates();
            passed++;
          } catch (e) {
            failed++;
            console.error(`testEngineDeltaUpdates failed: ${e.message}`);
          }

          try {
            testCollisionFunctions();
            passed++;
          } catch (e) {
            failed++;
            console.error(`testCollisionFunctions failed: ${e.message}`);
          }

          try {
            testKeyBindings();
            passed++;
          } catch (e) {
            failed++;
            console.error(`testKeyBindings failed: ${e.message}`);
          }

          console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
          return failed`);
        }

        // We'll now write the three test functions.

   However, note: we cannot run the game loop for a long time in a test because it uses requestAnimationFrame and we don't want to hang the test.

   We'll test the GameLoop by:

        - Creating a GameLoop instance (we can get it from the engine? or we can create one directly if we have access to the GameLoop class).
        - We'll mock the performance.now by overriding it? Or we can pass in a mock time function.

   But note: the GameLoop in engine.js uses performance.now. We can't easily mock that without modifying the class.

   Alternative: we can test the GameEngine's ability to update the delta time by creating a minimal engine and then checking that the update event is fired with a delta time.

   We'll do:

        - Create a GameEngine instance with a mock canvas.
        - We'll listen to the 'update' event and record the delta times.
        - We'll start the game loop for a short duration (by setting a timeout to stop it after 100ms).
        - Then we'll check that we got some update events and that the delta times are positive and reasonable.

   However, note: we are in a test and we don't want to wait for real time. We can use fake timers? But that's complex.

   Alternatively, we can test the GameLoop class directly by providing a mock time function.

   Since we are allowed to modify the code for testing? But we are not supposed to change the existing codebase.

   We'll do: we'll create a subclass of GameLoop for testing that allows us to inject a time function.

   But note: we are writing the test suite and we are not changing the existing code. We cannot change the GameLoop class.

   Another idea: we can test the delta time calculation by looking at the source code? Not really.

   We'll instead test the GameLoop by simulating two timestamps and see what delta time it computes.

   We can do:

        const gameLoop = new GameLoop(engine); // but we need an engine for the GameLoop constructor? 
        Looking at engine.js: 
            class GameLoop {
              constructor(engine) {
                this.engine = engine;
                ...
              }
            }

        So we need to pass an engine. We can create a mock engine that is just an object with an emit method.

   We'll create a mock engine:

        const mockEngine = {
          emit: function(event, deltaTime, fps) {
            // We'll record the deltaTime and fps for testing
            this.lastDeltaTime = deltaTime;
            this.lastFPS = fps;
          }
        };

   Then we can create a GameLoop with that mock engine.

   Then we can call the _tick method with two different timestamps and see what delta time it computes.

   Steps for testing GameLoop:

        let mockEngine = {
          emit: function(event, deltaTime, fps) {
            if (event === 'update') {
              this.lastDeltaTime = deltaTime;
              this.lastFPS = fps;
            }
          }
        };

        let gameLoop = new GameLoop(mockEngine);

        // First tick
        gameLoop._tick(1000); // time = 1000 ms
        assertEquals(mockEngine.lastDeltaTime, 0, "First delta time should be 0 (since lastTime is set to currentTime)");

        // Second tick
        gameLoop._tick(1100); // time = 1100 ms
        assertEquals(mockEngine.lastDeltaTime, 100, "Delta time should be 100ms");

        // Third tick with a large delta (to test clamping)
        gameLoop._tick(1100 + 300); // 1400 ms -> delta = 300, but we clamp to 250? 
        // In the GameLoop: const clampedDelta = Math.min(this.deltaTime, 250);
        // So we expect 250
        assertEquals(mockEngine.lastDeltaTime, 250, "Delta time should be clamped to 250ms");

   However, note: the GameLoop's _tick method also updates the lastTime. We'll do:

        _tick(currentTime) {
          this.deltaTime = currentTime - this.lastTime;
          this.lastTime = currentTime;
          const clampedDelta = Math.min(this.deltaTime, 250);
          ... 
          this.engine.emit('update', clampedDelta, this.fps);
        }

   So we'll test accordingly.

   But note: we are not testing the FPS part, just the delta time.

   Now, for the collision functions:

        We'll assume we have a Physics class with static methods.

        We'll test:

          circleCircle:
            - Two circles that are overlapping -> true
            - Two circles that are not overlapping -> false
            - One circle inside the other -> true (if the distance plus the smaller radius is less than the bigger radius? Actually, circle-circle collision: if the distance between centers is less than the sum of radii)

          circleAABB:
            - Circle overlapping the AABB -> true
            - Circle not overlapping -> false
            - Circle exactly touching the edge -> true? (we'll use <= for the distance)

          AABBAABB:
            - Two overlapping AABBs -> true
            - Two non-overlapping -> false
            - One completely inside the other -> true

   We'll create test cases for each.

   For key bindings:

        We'll create an InputManager