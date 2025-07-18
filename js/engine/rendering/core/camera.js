class Camera extends SceneObject
{
    constructor(params)
    {
        super (params)
    }
}

class EditorCamera extends Camera
{
    constructor(params)
    {
        super (params)

        this.velocity        = vec4(0.0, 0.0, 0.0, 0.0)
        this.acceleration    = vec4(0.0, 0.0, 0.0, 0.0)
        this.angularVelocity = vec3(0.0, 0.0, 0.0)
        this.editor = true

        this.moveSpeed = 0.02
        this.lookSpeed = 0.002

        this.balls = []
    }

    update(engine)
    {
        if (engine.editor.editorShowing || engine.scene.getGameCamera() == this)
        {
            const view = new View(this.transform.position, this.transform.rotation)
            const forward = [
                view.forward[0],
                0.0,
                view.forward[2],
                0.0 ]
    
            if (!engine.input.CmdPressed)
            {
                if (engine.input.DPressed) this.velocity = addv(this.velocity, multiplys(view.right,  this.moveSpeed))
                if (engine.input.APressed) this.velocity = addv(this.velocity, multiplys(view.right, -this.moveSpeed))
                if (engine.input.WPressed) this.velocity = addv(this.velocity, multiplys(forward,  this.moveSpeed))
                if (engine.input.SPressed) this.velocity = addv(this.velocity, multiplys(forward, -this.moveSpeed))
                if (engine.input.QPressed) this.velocity[1] -= this.moveSpeed
                if (engine.input.EPressed) this.velocity[1] += this.moveSpeed

                if (engine.input.LeftArrowPressed)  this.angularVelocity[1] += this.lookSpeed;
                if (engine.input.RightArrowPressed) this.angularVelocity[1] -= this.lookSpeed;
                if (engine.input.UpArrowPressed)    this.angularVelocity[0] += this.lookSpeed;
                if (engine.input.DownArrowPressed)  this.angularVelocity[0] -= this.lookSpeed;
            }

            if (engine.input.rightMouseHeld)
            {
                this.angularVelocity[1] += engine.input.mouseChangeX * -0.01
                this.angularVelocity[0] += engine.input.mouseChangeY * -0.01
            }
    
            this.transform.position = addv(this.transform.position, this.velocity)
            this.velocity     = addv(this.velocity, this.acceleration)
            this.velocity     = multiplys(this.velocity, 0.9)
            this.acceleration = multiplys(this.acceleration, 0.9)
    
            this.transform.rotation = addv(this.transform.rotation, this.angularVelocity)
            this.angularVelocity = multiplys(this.angularVelocity, 0.9)

            if (engine.input.SpacePressed)
            {
                log ("fire!")
                engine.input.SpacePressed = false

                
                const projectile = new SceneObject({
                    name : "Bouncing Ball 5",
               transform : new Transform(Scale(0.1, 0.1, 0.1), this.transform.position, Rotation(0.0, 0.0, 0.0)),
                  render : new RenderComponent(engine.rendering.requestGeometry("Sphere"), engine.rendering.BlackMaterial),
               collision : new SphereCollisionComponent(0.1),
                 physics : new PhysicsComponent({
                    gravity:true, 
                    bouncy:true,
                    dampening:0.999
                })})

                projectile.ticks = false

                const f = normalize(addv(engine.rendering.view.forward, vec4((-1.0 + Math.random() * 2.0) * 0.2, (-1.0 + Math.random() * 2.0) * 0.2, 0.0, 0.0)))
                projectile.getPhysicsComponent().linearForce(multiplys(vec3(f[0], f[1], f[2]), 20.0))

                engine.scene.add(projectile)

                this.balls.push([ Date.now(), projectile ])
                log (this.balls.length + " balls")

            }

            for (var i = 0; i < this.balls.length; ++i)
            {
                if ((Date.now() - this.balls[i][0]) > 10000 || (this.balls[i][1].transform.getWorldPosition()[1] < -10))
                {
                    log ("cull ball")
                    engine.scene.remove(this.balls[i][1].id)
                    this.balls.splice(i, 1)
                }
            }
        }
    }
}
