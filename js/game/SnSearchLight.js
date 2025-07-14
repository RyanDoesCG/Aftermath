class SnSearchLight extends SceneObject 
{
    constructor (engine, transform)
    {   
        super ({ name:"SearchLight" })

        this.transform = transform

        this.geometry = engine.rendering.requestGeometry("Cylinder")
        this.cube = engine.rendering.requestGeometry("camera")
        this.material = engine.rendering.requestMaterial(BLEND_MODE_OPAQUE, 0.0, 0.0, 0.0, 0.08, 0.0)

        this.cameraMaterial = engine.rendering.requestMaterial(BLEND_MODE_OPAQUE, 0.0, 0.0, 0.0, 0.08, 0.0,`
            uniform sampler2D robot_albedo_black; // #texture path=images/robot_albedo_black.png
            uniform sampler2D robot_emissive; // #texture path=images/robot_emissive.png
            uniform float alert;
            vec4 getMaterialAlbedo () 
            { 
                vec3  ab = texture(robot_albedo_black, vec2(frag_uvs.x, 1.0 - frag_uvs.y)).xyz;
                float em = texture(robot_emissive, vec2(frag_uvs.x, 1.0 - frag_uvs.y)).a;
                return vec4(mix(vec3(em, em, em), vec3(1.0, 0.5, 0.5), alert) * em, em ); 
            }`)

        this.PoleComponent = new RenderComponent(this.geometry, this.material)
        this.PoleComponent.transform.position = Translation(0.0, 0.0, 0.0)
        this.PoleComponent.transform.scale = Scale(0.06, 1.25, 0.06)

        this.BaseComponent = new RenderComponent(this.geometry, this.material)
        this.BaseComponent.transform.position = Translation(0.0, 0.0, 0.0)
        this.BaseComponent.transform.scale = Scale(0.25, 0.025, 0.25)

        this.Housing = new RenderComponent(this.cube, this.cameraMaterial)
        this.Housing.transform.rotation = Rotation(-0.265, 0.0, 0.0)
        this.Housing.transform.position = Translation(0.0, 5.0, 0.0)
        this.Housing.transform.scale = Scale(1.3, 1.3, 1.0)

        this.LightComponent = new SpotLightComponent({
            intensity : 2.0,
            color     : vec3(1.0, 1.0, 1.0),
            range     : 10.0,
            angle     : 0.97 })
        this.LightComponent.transform.position = Translation(0.0, 0.0, -0.5)
        this.LightComponent.transform.rotation = Rotation(0.0, 0.0, 0.0)

        this.Collision = new BoxCollisionComponent(0.2, 2.0, 0.2)

        this.addComponent(this.Housing)
        this.addComponent(this.BaseComponent)
        this.addComponent(this.PoleComponent)
        this.addComponent(this.LightComponent)
        this.addComponent(this.Collision)

        this.LightComponent.transform.parent = this.Housing.transform
        this.Housing.transform.children.push(this.LightComponent.transform)

        this.timescale = (0.5 + Math.random() * 0.5) * 0.00025
        this.flip = 1.0

        this.shotInterval = 1000
        this.lastShot = Date.now()

      //  this.transform.rotation[1] += (-1.0 + Math.random() * 2.0) * 0.2

        this.initialYRotation = this.transform.rotation[1]

        this.bullets = []
        this.currentBullet = 0
        for (var i = 0; i < 32; ++i)
        {
            this.bullets.push(new SnSearchLightBullet(engine, { 
                start: this.LightComponent.transform.getWorldPosition() }))
        }
    }

    update (engine)
    {
        const character = engine.scene.find("Camera")
        if (character)
        {
            const lightForward = vec3(
                this.LightComponent.view.forward[0], 
                this.LightComponent.view.forward[1], 
                this.LightComponent.view.forward[2])
            
            const lightPlayer = normalize(subv(
                this.LightComponent.transform.getWorldPosition(), 
                character.transform.getWorldPosition()))
            
            const angle = dot(lightForward, lightPlayer)
    
            if (angle < -this.LightComponent.angle)
            {
                this.LightComponent.color = vec3(1.0, 0.0, 0.0)
    
                if ((Date.now() - this.lastShot) > this.shotInterval && character.health >= 0.0)
                {
                    
                    const projectile = this.bullets[this.currentBullet]
                    projectile.fire(multiplys(lightPlayer, -0.1))
                    engine.scene.add(projectile)
                    
                    this.lastShot = Date.now()
                    engine.rendering.MaterialPool.get(this.cameraMaterial)
                        .BasePassUniforms.get("alert").value = 1.0
                    this.currentBullet++
                }
            }
            else
            {
                this.transform.rotationDirty = true
                this.transform.dirty = true
                this.transform.rotation[1] += engine.input.d * this.timescale * this.flip;
        
                if (this.transform.rotation[1] < (this.initialYRotation))
                    this.flip *= -1
                if (this.transform.rotation[1] > (3.14159 + this.initialYRotation))
                    this.flip *= -1

                this.LightComponent.color = vec3(1.0, 1.0, 1.0)
                engine.rendering.MaterialPool.get(this.cameraMaterial)
                    .BasePassUniforms.get("alert").value = 0.0
            }
    
        }

        this.LightComponent.update() 
    }
}