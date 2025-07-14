class PhysicsEngine 
{
    constructor(engine)
    {
        this.engine = engine
        
        this.collisions = new Map()

        this.movementFrametime = new RunningAverage()
        this.collisionNarrowFrametime = new RunningAverage()
        this.collisionBroadFrametime = new RunningAverage()
        this.integrationFrametime = new RunningAverage()
        this.frametime = new RunningAverage()
    }

    hash (a, b)
    {
        return (a + b) * (a + b + 1.0) / 2.0 + a
    }

    alreadyColliding  (a, b) 
    { 
        return (this.collisions.get(this.hash(a.id, b.id)) === 1) 
    }

    startColliding    (a, b) 
    { 
        this.collisions.set(this.hash(a.id, b.id), 1)
        if (a.getPhysicsComponent()) a.getPhysicsComponent().colliding = true
        if (b.getPhysicsComponent()) b.getPhysicsComponent().colliding = true
    }

    stopColliding     (a, b) 
    { 
        this.collisions.set(this.hash(a.id, b.id), 0) 
        if (a.getPhysicsComponent()) a.getPhysicsComponent().colliding = false
        if (b.getPhysicsComponent()) b.getPhysicsComponent().colliding = false
    } 

    update()
    {
        let start = Date.now()

        const n = 3.0
        const t = this.engine.input.d / n

        for (var i = 0; i < n; ++i)
        {        
            let movementStart = Date.now()
            this.engine.scene.traverse((object) => 
            {
                object.transform.update()
            })

            this.movementFrametime.add((Date.now() - movementStart) * n)
            this.update_internal(t, n)
        }

        this.frametime.add(Date.now() - start)
    }

    update_internal(d, n)
    {
        // Broad Phase
        let collisionBroadStart = Date.now()
        let pairs = []
        this.engine.scene.pairs((a, b) => 
        {
            const aPhysics = a.getPhysicsComponent()
            const bPhysics = b.getPhysicsComponent()
            const oneHasPhysics = (aPhysics || bPhysics)

            const aCollision = a.getCollisionComponent()
            const bCollision = b.getCollisionComponent()
            const bothHaveCollision = (aCollision != null) && (bCollision != null)

            if (bothHaveCollision && oneHasPhysics)
            {   
                /*
                if (aCollision instanceof BoxCollisionComponent)
                {
                    if (dot(aCollision.extents, aCollision.extents) > 100)
                    {
                        pairs.push({ 
                            a: a,
                            aCollision: aCollision,
                            aPhysics: aPhysics,

                            b: b,
                            bCollision: bCollision,
                            bPhysics: bPhysics }) 
                        return
                    }
                }

                if (bCollision instanceof BoxCollisionComponent)
                {
                    if (dot(aCollision.extents, aCollision.extents) > 100)
                    {
                        pairs.push({ 
                            a: a,
                            aCollision: aCollision,
                            aPhysics: aPhysics,

                            b: b,
                            bCollision: bCollision,
                            bPhysics: bPhysics }) 
                        return
                    }
                }

                if (aCollision instanceof PlaneCollisionComponent ||
                    bCollision instanceof PlaneCollisionComponent)
                {
                    pairs.push({ 
                        a: a,
                        aCollision: aCollision,
                        aPhysics: aPhysics,

                        b: b,
                        bCollision: bCollision,
                        bPhysics: bPhysics }) 
                    return
                }
                */

                let between = subv(a.transform.getWorldPosition(), b.transform.getWorldPosition())
                let biggest = Math.max(
                    dot(a.transform.getWorldScale(), a.transform.getWorldScale()), 
                    dot(b.transform.getWorldScale(), b.transform.getWorldScale()))

                if (dot(between, between) < (biggest))
                {
                    pairs.push({ 
                        a: a,
                        aCollision: aCollision,
                        aPhysics: aPhysics,

                        b: b,
                        bCollision: bCollision,
                        bPhysics: bPhysics }) 
                }
            }
        })
        this.collisionBroadFrametime.add((Date.now() - collisionBroadStart) * n)

        // Narrow Phase
        let collisionNarrowStart = Date.now()
        for (var i = 0; i < pairs.length; ++i)
        {
            var alreadyColliding = this.alreadyColliding(pairs[i].a, pairs[i].b)
            var collision = test(pairs[i].aCollision, pairs[i].bCollision)
            if (collision.hit)
            {
                if (!alreadyColliding) 
                {
                    this.startColliding(pairs[i].a, pairs[i].b)
                    if (pairs[i].aPhysics) pairs[i].aPhysics.bounce(collision.normal)
                    if (pairs[i].bPhysics) pairs[i].bPhysics.bounce(collision.normal)
                }
                else
                {
                    if (pairs[i].aPhysics) pairs[i].aPhysics.slide(collision.normal)
                    if (pairs[i].bPhysics) pairs[i].bPhysics.slide(collision.normal)
                }
            }
            else
            {
                if (alreadyColliding)
                {
                    this.stopColliding(pairs[i].a, pairs[i].b)   
                }
            }
        }
        this.collisionNarrowFrametime.add((Date.now() - collisionNarrowStart) * n)

        let integrationStart = Date.now()
        this.engine.scene.traverse((object) => 
        {
            const physics = object.getPhysicsComponent()
            if (physics)
            {
                physics.update(d)
            }
        })
        this.integrationFrametime.add((Date.now() - integrationStart) * n)
    }
}