class SnCharacter extends SceneObject
{
    constructor (engine, transform)
    {
        const geometry = engine.rendering.requestGeometry("robot")
        const material = engine.rendering.requestMaterial(BLEND_MODE_OPAQUE, 0.125, 0.125, 0.125, 0.2, 0.0, `
            uniform sampler2D robot_albedo_black; // #texture path=images/robot_albedo_black.png
            uniform sampler2D robot_emissive; // #texture path=images/robot_emissive.png
            uniform float emissive;
            vec4 getMaterialAlbedo () 
            { 
                vec3  ab = texture(robot_albedo_black, vec2(frag_uvs.x, 1.0 - frag_uvs.y)).xyz;
                float em = texture(robot_emissive, vec2(frag_uvs.x, 1.0 - frag_uvs.y)).a;

                if (em > 0.0)
                {
                    return vec4(ab.xyz, em * emissive);
                }
                else
                {
                    return vec4(0.01, 0.01, 0.01, 0.0);
                }
            }
            `,`
            vec3  getMaterialNormal()
            {
                return frag_normal;
            }`,`
            vec3 getMaterialLPO()
            {
                return vec3(0.0, 0.0, 0.0);
            }
            `,`
            uniform float velx;
            uniform float velz;
            vec3 getMaterialWPO()
            {
                float t = Time * 0.25;
                if (vertex_position.y < 0.22 && length(vec2(vertex_position.x, vertex_position.z)) > 0.125)
                {
                    // Legs
                    float ceilx = ceil(vertex_position.x * 0.1) * 2.0;
                    
                    float ceilz = ceil(vertex_position.z * 0.1) * 2.0;

                    // this needs to be rotated?
                    vec3  movement = vec3(
                        (-cos(t + ceilx + ceilz)), 
                        max(sin(t + ceilx + ceilz), 0.0) * 1.6, 
                        (-cos(t + ceilx + ceilz)));

                    return movement * vec3(
                        clamp(velx * 60.0, -1.0, 1.0), 
                        clamp((abs(velx) + abs(velz)) * 60.0, 0.0, 1.0), 
                        clamp(velz * 60.0, -1.0, 1.0));
                }
                else
                {
                    // Body
                    return 
                        vec3(sin(Time * 0.1), 0.0, cos(Time * 0.1)) 
                        * 
                        0.05
                        * 
                        clamp((abs(velx) + abs(velz)) * 40.0, 0.2, 1.0);  
                } 
            }`)

        engine.audio.requestSound("walking")

        super ({
            name      : "Character",
            transform : transform,
            render    : new RenderComponent(geometry, material),
            collision : new SphereCollisionComponent(0.05),
            physics   : new PhysicsComponent() })

        this.speed = 0.00005
        this.rotationSpeed = 0.000212

        this.lightOn = true
        this.light = new SpotLightComponent({
            intensity : 6.0,
            color     : vec3(0.2, 1.0, 1.0),
            range     : 10.0,
            angle     : 0.96 }) // Doesn't match reality
        this.light.transform.position = Translation(0.0, 0.5, -0.2)
        this.addComponent(this.light)

        this.debugCube = new RenderComponent(
                engine.rendering.requestGeometry("Box"), 
                engine.rendering.GridMaterial)
        this.debugCube.transform.scale = Scale(0.2, 0.2, 0.2);
        this.debugCube.transform.position = Translation(0.0, 2, 0.0)
      //  this.addComponent(this.debugCube)

        this.spottedPlayer = false;
        this.toPlayer = vec3(0.0, 0.0, 0.0);
        
    }

    updateStealth (engine)
    {
        const character = engine.scene.find("Camera")
        if (character)
        {
            const lightForward = vec3(
                this.light.view.forward[0], 
                this.light.view.forward[1], 
                this.light.view.forward[2])
            
            const lightPlayer = normalize(subv(
                character.transform.getWorldPosition(),
                this.light.transform.getWorldPosition()))
            
            const angle = dot(lightForward, lightPlayer)

            if (angle > this.light.angle)
            {
                this.light.color = vec3(1.0, 0.0, 0.0)
                this.spottedPlayer = true;
                this.toPlayer = lightPlayer;
            }
            else
            {
                this.light.color = vec3(0.2, 1.0, 1.0)
                this.spottedPlayer = false;
                this.toPlayer = lightPlayer;
            }
        }
    }

    updateLight (engine)
    {

        this.light.update()
    }

    updateMaterials (engine)
    {
        const physics = this.getPhysicsComponent()
        engine.rendering.MaterialPool.get(this.getRenderComponents()[0].material)
            .BasePassUniforms.get("velx").value = (physics.linearVel[0])
        engine.rendering.MaterialPool.get(this.getRenderComponents()[0].material)
            .BasePassUniforms.get("velz").value = (physics.linearVel[2])
        engine.rendering.MaterialPool.get(this.getRenderComponents()[0].material)
            .ShadowPassUniforms.get("velx").value = (physics.linearVel[0])
        engine.rendering.MaterialPool.get(this.getRenderComponents()[0].material)
            .ShadowPassUniforms.get("velz").value = (physics.linearVel[2])
        engine.rendering.MaterialPool.get(this.getRenderComponents()[0].material)
            .BasePassUniforms.get("emissive").value = this.light.intensity

    }


    updateMovement (engine)
    {
        const physics = this.getPhysicsComponent()
        if (physics)
        {
            if (this.spottedPlayer)
            {
                // FREEZE
            }
            else
            {
                // WANDER
                const view = new View(this.transform.position, this.transform.rotation)
                physics.linearForce(multiplys(view.forward, 0.0001));
                physics.angularForce(vec3(0.0, Math.cos(engine.input.time * 0.001) * 0.00005, 0.0))
            }
        }
    }

    update (engine)
    {
        if (!engine.editor.editorShowing)
        {
            this.updateMovement(engine)
        }

        this.updateStealth(engine)
        this.updateMaterials(engine)
        this.updateLight(engine)
    }
}