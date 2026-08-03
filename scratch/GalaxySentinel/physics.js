We are to write the file `physics.js` for the Physics Controller.
 The file must handle:
   - circle-to-circle collisions
   - AABB (axis-aligned bounding box) rectangle colliders
   - for: player lasers, enemy ships, shield deflectors, and power-up collections.

 We assume the following from the context:
   - We have an EventEmitter class (from engine.js) for communication.
   - We have a Player class (from player.js) that has lasers and can be collided with.
   - We have enemy ships (from enemies.js) that have lasers and can be collided with.
   - We might have shield deflectors (perhaps as a property of the player or a separate entity) and power-ups.

 However, note that the provided code snippets do not include a shield or power-up class.
 We must design the physics system to be generic enough to handle these.

 Approach:
   We'll create a PhysicsSystem class that:
     - Is initialized with a reference to the game engine (or at least the game world entities).
     - Maintains lists of collidable objects (or we can have it check against known groups: player, enemies, lasers, power-ups, shields).
     - Uses an EventEmitter to emit collision events.

 But note: the existing codebase uses an EventEmitter for communication. We can have the PhysicsSystem emit events when collisions occur.

 Steps for the PhysicsSystem:

   1. We'll have methods to add and remove collidable objects (or we can have it scan the game world each frame?).
      However, for efficiency, we might want to have the game world maintain lists of different types of objects.

   2. Since we don't have a game world manager in the provided code, we'll assume that the PhysicsSystem is given:
        - player: the player object (which has a laser array and a shield? we'll assume shield is a property of the player for now)
        - enemies: an array of enemy objects
        - powerUps: an array of power-up objects
        - (optional) shields: but if shield is part of the player, then we don't need a separate list.

   3. We'll check for:
        a) Player lasers vs Enemies
        b) Enemy lasers vs Player
        c) Player vs Power-ups
        d) Player vs Shield (if shield is separate) OR if shield is a property of the player, then we might check for enemy lasers hitting the shield.

   4. However, note the prompt mentions "shield deflectors". We assume that the player has a shield that can deflect enemy lasers.

   5. We'll design the colliders:
        - For circles: we have a position (x, y) and a radius.
        - For AABB: we have a position (x, y) and width and height.

   6. We'll create helper functions for:
        - circle vs circle collision
        - circle vs AABB collision
        - AABB vs AABB collision (though we might not need this for the mentioned entities, but it's good to have)

   7. We'll assume the following about the objects:

        Player:
          - Has a position (x, y)
          - Has a radius (for circular collision) OR we might use AABB? The player.js uses a radius (16) and width/height (24x24).
          - We can use either. Let's use circle for player for simplicity? But note: the player.js uses a radius of 16 and width/height 24.
          - We'll use circle for player collision (with radius 16) for simplicity, unless we need more precision.

        Enemy ships (from enemies.js):
          - Each enemy has: x, y, width, height, radius (they use radius for collision? In enemies.js, we see:
                this.radius = config.RADIUS;
                this.width = config.WIDTH;
                this.height = config.HEIGHT;
            and in checkCollision (which is incomplete in the provided snippet) they were doing circle-circle? 
            Actually, in the provided enemies.js snippet, the checkCollision method was incomplete, but it started with circle-circle.

          - We'll assume enemies use circular collision (with the given radius) for simplicity.

        Lasers (both player and enemy):
          - In player.js, the laser is an object with: x, y, vx, vy, angle, speed, damage, width, height.
          - In enemies.js, the laser is an object with: x, y, vx, vy, angle, speed, damage, width, height, lifetime, etc.
          - We can treat lasers as rectangles (AABB) or as a line? But for simplicity, we'll use AABB.

        Power-ups: 
          - We don't have a power-up class in the provided code, but we can assume they are circular or AABB.

        Shield deflectors:
          - We don't have a shield class. We'll assume the player has a shield that is a circle around the player (with a larger radius) 
            that can deflect enemy lasers. When an enemy laser hits the shield, it is destroyed and maybe spawns a particle effect.

   8. We'll design the PhysicsSystem to have:

        - update(deltaTime): 
            * Update the positions of all moving objects? (No, that's the game's responsibility. The physics system only checks for collisions.)
            * Check for collisions between:
                  a) Player lasers and Enemies
                  b) Enemy lasers and Player (and possibly the shield)
                  c) Player and Power-ups
                  d) (Optional) Enemy lasers and Shield (if we treat shield as a separate circle)

        - We'll need to know the current state of the player's shield (if active, and its radius).

   9. We'll assume the following structure for objects that we check:

        For circular objects (player, enemies, power-ups if circular):
          { x: number, y: number, radius: number }

        For AABB objects (lasers, and possibly power-ups if they are rectangular):
          { x: number, y: number, width: number, height: number } 
          Note: the x,y is the center? or the top-left? 
          In the provided code:
            - In player.js, the laser has x,y (which is the center? because they set x: this.x, y: this.y) and then width and height.
            - In enemies.js, the laser similarly has x,y (center) and width, height.

          So we'll assume that for AABB, the given x,y is the center.

        Therefore, for AABB we can compute:
          halfWidth = width / 2
          halfHeight = height / 2
          left = x - halfWidth
          right = x + halfWidth
          top = y - halfHeight
          bottom = y + halfHeight

   10. Collision functions:

        circleCircle(circle1, circle2):
          dx = circle1.x - circle2.x
          dy = circle1.y - circle2.y
          distanceSquared = dx*dx + dy*dy
          radiusSum = circle1.radius + circle2.radius
          return distanceSquared <= radiusSum * radiusSum

        circleAABB(circle, rect):
          Find the closest point on the AABB to the circle's center:
            closestX = clamp(circle.x, rect.x - rect.width/2, rect.x + rect.width/2)
            closestY = clamp(circle.y, rect.y - rect.height/2, rect.y + rect.height/2)
          Then compute distance from (circle.x, circle.y) to (closestX, closestY)
          If distance <= circle.radius -> collision

        AABBAABB(rect1, rect2):
          // Assuming rect: {x, y, width, height} with x,y as center
          return !(rect1.x - rect1.width/2 > rect2.x + rect2.width/2 ||
                   rect1.x + rect1.width/2 < rect2.x - rect2.width/2 ||
                   rect1.y - rect1.height/2 > rect2.y + rect2.height/2 ||
                   rect1.y + rect1.height/2 < rect2.y - rect2.height/2);

   11. We'll create the PhysicsSystem class that extends EventEmitter so it can emit events.

   12. Events we might emit:
        - 'playerHit': when the player is hit by an enemy laser (and shield is not active or overwhelmed)
        - 'shieldHit': when an enemy laser hits the shield (so we can play a shield hit effect)
        - 'enemyHit': when an enemy is hit by a player laser (we can pass the enemy and the laser)
        - 'powerUpCollected': when the player collects a power-up (we can pass the power-up and the type)

   13. We'll also need to remove objects that are destroyed (like lasers that hit something, or enemies that are destroyed).

   14. However, note: the physics system should not modify the game state directly? 
        It should emit events and let the game logic handle the consequences (like removing an enemy, reducing player health, etc.)

   15. We'll design the update method to:

        // Player lasers vs Enemies
        for each laser in player.lasers:
            for each enemy in enemies:
                if circleCircle(laser as circle? or AABB?) vs enemy (circle) -> 
                    Actually, we decided to treat laser as AABB and enemy as circle -> use circleAABB
                    But note: the laser is very thin and long, so AABB is appropriate.
                if collision:
                    emit 'enemyHit' with { enemy, laser }
                    mark laser for removal (we'll return a list of things to remove)
                    mark enemy for damage (we'll let the game handle the damage via the event)

        // Enemy lasers vs Player (and shield)
        for each laser in enemyLasers (we need to collect all enemy lasers):
            // First, check if shield is active and if the laser hits the shield
            if player.shieldActive and circleAABB( {x: player.x, y: player.y, radius: player.shieldRadius}, laser as AABB ):
                emit 'shieldHit' with { laser }
                mark laser for removal
            else if !player.shieldActive and circleAABB( {x: player.x, y: player.y, radius: player.radius}, laser as AABB ):
                emit 'playerHit' with { laser }
                mark laser for removal

        // Player vs Power-ups
        for each powerUp in powerUps:
            if circleCircle( {x: player.x, y: player.y, radius: player.radius}, powerUp ) [if powerUp is circular] 
                OR circleAABB( player as circle? vs powerUp as AABB) [if powerUp is rectangular] 
                -> we don't know the shape of power-up, so we'll assume circular for simplicity? 
                But to be generic, we can have the power-up object provide a method to get its collider? 
                However, we don't have that in the current codebase.

        Since we don't have power-up classes, we'll assume they are circular for now (with a radius property).

        Alternatively, we can make the PhysicsSystem accept colliders in a unified way? 
        But to keep it simple and given the context, we'll assume:

          - Player: circle (x, y, radius)
          - Enemies: circle (x, y, radius)
          - Player lasers: AABB (x, y, width, height) [centered]
          - Enemy lasers: AABB (x, y, width, height) [centered]
          - Power-ups: circle (x, y, radius)   [we'll assume this for now]
          - Shield: circle (x, y, radius) [centered on player, with a radius larger than the player]

   16. We'll need to collect all enemy lasers. We can do:
        let allEnemyLasers = [];
        enemies.forEach(enemy => {
            allEnemyLasers.push(...enemy.lasers);
        });

   17. We'll also need to remove the lasers that have collided. We can return two arrays: 
        - lasersToRemove (from player and enemies)
        - enemiesToDamage (or we rely on the event to handle it)

        But note: the physics system should not directly modify the game state? 
        We'll have it return an object with:
            {
                playerLasersToRemove: [laser, ...],
                enemyLasersToRemove: [laser, ...],
                enemiesToDamage: [ { enemy, laser } , ... ],   // or just enemy and let the game know which laser hit it?
                powerUpsToCollect: [powerUp, ...],
                playerHit: [laser, ...],   // or just a boolean? but we might want to know which laser
                shieldHits: [laser, ...]
            }

        However, to avoid tight coupling, we can just emit events and let the listeners handle the removal and effects.

        We choose: 
          - When a collision is detected, we emit an event with the relevant objects.
          - The listener (e.g., the game logic) will then handle removing the laser and applying damage.

        But note: if we don't remove the laser immediately, it might collide again in the same frame? 
        So we should mark it for removal and then remove it after the physics step.

        We'll have the PhysicsSystem return a list of objects to remove (or we can have it modify the arrays by removing the collided objects? 
        but that might cause concurrent modification issues).

        Alternatively, we can have the PhysicsSystem not remove anything,