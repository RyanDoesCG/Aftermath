class SnPlayer extends Camera
{
    constructor(engine, transform)
    {
        super ({ 
            name: "Camera",
            transform : transform,
         })

        this.addComponent(new PhysicsComponent({
            gravity:false, 
            bouncy:false,
            dampening:0.965
        }))

        this.addComponent(new SphereCollisionComponent(1.3))

        this.moveSpeed = 0.00005
        this.sprintSpeed = 0.0001
        this.lookSpeed = 0.00002
    }

    update(engine)
    {
        if (!engine.editor.editorShowing)
        {
            const physics = this.getPhysicsComponent()
            if (physics)
            {
                const view = new View(this.transform.position, this.transform.rotation)
                const forward = [
                    view.forward[0],
                    0.0,
                    view.forward[2] ]
                const right = [
                    view.right[0],
                    0.0,
                    view.right[2]]

                const speed = (engine.input.ShiftPressed)?this.sprintSpeed:this.moveSpeed;
    
                if (engine.input.WPressed) 
                    physics.linearForce(multiplys(forward, speed))
                if (engine.input.SPressed) 
                    physics.linearForce(multiplys(forward, -speed))
                if (engine.input.APressed) 
                {
                    physics.linearForce(multiplys(right, -speed))
                    if (this.transform.rotation[2] < 0.02)
                        this.transform.rotation[2] += 0.002
                }
                if (engine.input.DPressed) 
                {
                    physics.linearForce(multiplys(right, speed))
                    if (this.transform.rotation[2] > -0.02)
                        this.transform.rotation[2] -= 0.002
                }
                if (engine.input.LeftArrowPressed)
                    physics.angularForce([0.0, this.lookSpeed, 0.0])
                if (engine.input.RightArrowPressed) 
                    physics.angularForce([0.0, -this.lookSpeed, 0.0])
                if (engine.input.UpArrowPressed) 
                    physics.angularForce([this.lookSpeed, 0.0, 0.0])
                if (engine.input.DownArrowPressed) 
                    physics.angularForce([-this.lookSpeed, 0.0, 0.0])
    
                physics.angularForce([0.0, -this.lookSpeed * Math.sign(engine.input.mouseChangeX), 0.0])
                physics.angularForce([-this.lookSpeed * Math.sign(engine.input.mouseChangeY), 0.0, 0.0])

                if (!engine.input.APressed && !engine.input.DPressed)
                {
                    this.transform.rotation[2] *= 0.9
                }
   
    
                // head bob
                physics.angularForce([
                    Math.sin(engine.input.time * 0.0016 + 0.245) * 0.000001 * (len(physics.linearVel) + 1.0) * 0.2, 
                    0.0, 
                    0.0])
    
            }
        }
    }
}