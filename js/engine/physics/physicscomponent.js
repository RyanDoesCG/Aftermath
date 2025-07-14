class PhysicsComponent extends Component
{
    constructor (params)
    {
        super()

        this.linearVel = vec3(0.0, 0.0, 0.0)
        this.linearAcc = vec3(0.0, 0.0, 0.0) 
        this.linearForces = []
        
        this.angularVel = vec3(0.0, 0.0, 0.0)
        this.angularAcc = vec3(0.0, 0.0, 0.0)
        this.angularForces = []
        
        this.type = "PhysicsComponent"
        this.gravity = true
        this.colliding = false
        this.terminal = 0.01
        this.alive = false
        this.bouncy = false
        this.dampening = 0.9

        if (params)
        {
            this.dampening = params.dampening
            this.gravity = params.gravity  
            this.bouncy = params.bouncy 
        }
    }

    bounce(n)
    {
        if (this.bouncy)
        {
            this.linearVel = multiplys(reflect(normalize(this.linearVel), n), len(this.linearVel) * 0.8)
        }
    }

    slide(n)
    {
        
        if (n[0] > 0.999)
        {
            this.linearVel[0] = Math.min(this.linearVel[0], 0.0);
        }

        if (n[0] < -0.999)
        {
            this.linearVel[0] = Math.max(this.linearVel[0], 0.0);
        }

        if (n[1] > 0.999)
        {
            this.linearVel[1] = Math.max(this.linearVel[1], 0.0);
        }

        if (n[1] < -0.999)
        {            
            this.linearAcc = addv(this.linearAcc, vec3(0.0, 0.00001, 0.0))
            this.linearVel[1] = Math.max(this.linearVel[1], 0.0);
        }

        if (n[2] > 0.999)
        {
            this.linearVel[2] = Math.min(this.linearVel[2], 0.0);
        }

        if (n[2] < -0.999)
        {
            this.linearVel[2] = Math.max(this.linearVel[2], 0.0);
        }

        if (len(this.linearVel) > 0.00001)
        {
            const velmag = len(this.linearVel)
            this.linearVel = multiplys(normalize(this.linearVel), velmag * 0.9)
        }
        
    }

    linearForce (v)
    {
        this.linearForces.push(v)
    }

    angularForce (v)
    {
        this.angularForces.push(v)
    }

    update(t)
    {
        //if (this.alive)
        {
            // gravity
            let g = vec3(0.0, -0.00001, 0.0)
            if (this.gravity)
            {
                this.linearAcc = addv(this.linearAcc, g)
            }

            // external forces
            for (var i = 0; i < this.linearForces.length; ++i)
            {
                this.linearAcc = addv(this.linearAcc, this.linearForces[i])
            }

            if (len(this.linearVel) > 0.0001)
            {
                this.transform.parent.dirty = true
            }

            this.transform.parent.position = addv(this.transform.parent.position, multiplys(this.linearVel, t))
            this.linearVel = addv(this.linearVel, multiplys(this.linearAcc, t))
            this.linearVel = multiplys(this.linearVel, this.dampening)
            this.linearAcc = vec3(0.0, 0.0, 0.0) 
            this.linearForces = []

            if (len(this.linearVel) > this.terminal)
            {
                this.linearVel = multiplys(normalize(this.linearVel), this.terminal);
            }
        }

        {
            // external forces
            for (var i = 0; i < this.angularForces.length; ++i)
            {
                this.angularAcc = addv(this.angularAcc, this.angularForces[i])
            }

            if (len(this.angularVel) > 0.00001)
            {
                this.transform.parent.rotationDirty = true
            }

            this.transform.parent.rotation = addv(this.transform.parent.rotation, multiplys(this.angularVel, t))
            this.angularVel = addv(this.angularVel, multiplys(this.angularAcc, t))
            this.angularVel = multiplys(this.angularVel, this.dampening)
            this.angularAcc = vec3(0.0, 0.0, 0.0) 
            this.angularForces = []
        }

        this.alive = true
    }
}