class SnSearchLightBullet extends SceneObject 
{
    constructor (engine, params)
    {   
        const geometry = engine.rendering.requestGeometry("Sphere")
        // Emissive doesn't trigger for some reason
        const material = engine.rendering.requestMaterial(BLEND_MODE_OPAQUE, 0.0, 0.0, 0.0, 0.08, 0.0, `
            vec4 getMaterialAlbedo()
            {
                if (frag_uvs.y > 0.45 && frag_uvs.y < 0.55)
                {

                    vec4 Result = vec4(1.0, 0.4, 0.4, 1.0) 
                        * 
                        abs(sin(Time * 0.2)) 
                        * 
                        (1.0 - dot(frag_normal, vec3(0.0, 1.0, 0.0)));

                    return vec4(Result.xyz, Result.x);
                }
                else
                {
                    return vec4(0.0, 0.0, 0.0, 0.0);
                }
            }`)

        const smokeGeom = engine.rendering.requestGeometry("Quad")
        const smokeMat = engine.rendering.requestMaterial(BLEND_MODE_TRANSPARENT, 1.0, 0.0, 0.0, 0.2, 0.0,`
            
            float noise (vec2 uv)
            {
                float a = random(floor(uv));
                float b = random(floor(uv) + vec2(1.0, 0.0));
                float c = random(floor(uv) + vec2(0.0, 1.0));
                float d = random(floor(uv) + vec2(1.0, 1.0));
                vec2 t = smoothstep(vec2(0.0), vec2(1.0), fract(uv));
                return mix(a, b, t.x) +
                    (c - a) * t.y * (1.0 - t.x) +
                    (d - b) * t.x * t.y;
            }
            
            float octaves (vec2 uv)
            {
                return ((noise(uv * 11.5234) * 0.24332) + (noise(uv * 8.28344) * 0.16453) + 
                        (noise(uv * 6.32423) * 0.23514) + (noise(uv * 2.65444) * 0.65435) + 
                        (noise(uv * 1.35425) * 0.96546)) * 0.5;
            }
            
            uniform float alpha;
            vec4 getMaterialAlbedo() 
            { 
                float n = octaves(frag_uvs * 2.0 + vec2(sin(Time * 0.005), -(Time * 0.005)));

                n *= 1.0 - length(-1.0 + frag_uvs * 2.0);

                n *= 2.0;

                return vec4(0.1, 0.1, 0.1, n * alpha); 
            }`)


        engine.audio.requestSound("boom")
        engine.audio.requestSound("launch")
        engine.audio.requestSound("beeps")

        super ({
             name : "Bullet",
        transform : new Transform(Scale(0.1, 0.1, 0.1), params.start, Rotation(0.0, 0.0, 0.0)),
           render : new RenderComponent(geometry, material),
        collision : new SphereCollisionComponent(0.1),
          physics : new PhysicsComponent({ gravity : true, bouncy: true }) })

        this.lifetime = 850
        this.fusetime = 1000
        this.smoketime = 3000
        this.force = 100000.0
        this.range = 5.0
        this.firstUpdate = true
        this.beepsPlaying = false
        this.hasExploded = false
        
        this.vfx = new RenderComponent(smokeGeom, smokeMat)
        this.vfx.transform.position = Translation(0.0, 0.0, 0.0)
        this.vfx.transform.rotation = Rotation(0.0, 0.0, 0.0)
        this.vfx.transform.scale = Scale(10.0, 10.0, 10.0)
        this.vfx.visible = false
        this.addComponent(this.vfx)
        this.alpha = 1.0
        
    }

    fire (aim)
    {
        this.getPhysicsComponent().linearVel = aim
        this.spawntime = Date.now()
    }

    update (engine)
    {
        if (this.firstUpdate)
        {
            engine.audio.playSound("launch")
        }

        this.firstUpdate = false

        if ((Date.now() - this.spawntime) > this.lifetime)
        {
            // Freeze in mid air
            this.removePhysicsComponent()
            this.removeCollisionComponent()
            if (!this.beepsPlaying)
            {
                engine.audio.playSound("beeps")
                this.beepsPlaying = true
            }

            if ((Date.now() - this.spawntime) > (this.lifetime + this.fusetime) && !this.hasExploded)
            {
                engine.audio.playSound("boom")

                // blast player
                this.hasExploded = true
                this.getRenderComponents()[0].visible = false
                this.getRenderComponents()[1].visible = true

                const character = engine.scene.find("Character")
                if (character)
                {
                    const direction = subv(character.transform.getWorldPosition(), this.transform.getWorldPosition())
                    const distance = len(direction)
                    if (distance < this.range)
                    {
                        character.getPhysicsComponent().linearForce(multiplys(normalize([direction[0], 0.0, direction[2]]), this.force))
                        character.getPhysicsComponent().angularForce(vec3(0.0, (-1.0 + Math.random() * 2.0) * 0.01, 0.0))
                        character.takeDamage(0.6)
                    }
                }
            }

            this.alpha -= 0.005
            engine.rendering.MaterialPool.get(this.getRenderComponents()[1].material)
                .TransparentPassUniforms.get("alpha").value = this.alpha

            if (this.alpha <= 0.0)
            {
                engine.scene.remove(this.id)
            }
        }
    }
}