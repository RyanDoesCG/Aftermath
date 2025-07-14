class Grass extends SceneObject
{
    constructor (engine, transform)
    {
        const geometry = engine.rendering.requestGeometry("Grass")
        const material = engine.rendering.requestMaterial(BLEND_MODE_OPAQUE, 1.0, 1.0, 1.0, 0.1, 0.0, `
            float random (vec2 st) {
                return fract(sin(dot(st.xy,
                                    vec2(12.9898,78.233)))*
                    43758.5453123);
            }
            vec4 getMaterialAlbedo()
            {
                vec4 colorA = vec4(0.2, 0.2, 0.2, 0.0);
                vec4 colorB = vec4(0.3, 0.3, 0.3, 0.0);
                return mix(colorA, colorB, random(floor(frag_worldpos.xz * 10.0))) * (frag_uvs.y);
            }`,
            `vec3  getMaterialNormal()
            {
                return frag_normal;
            }`,
            `
            uniform vec3 character;
            uniform vec3 character0;
            uniform vec3 character1;
            uniform vec3 character2;
            uniform vec3 character3;
            uniform vec3 character4;
            uniform vec3 character5;
            
            vec3 getMaterialLPO()
            {
                float t = Time * 0.1;

                vec4  p = (transform[gl_InstanceID] * vec4(vertex_position.xyz, 1.0));

                float d = length(character - p.xyz);

                d = min( length(character0 - p.xyz), d );
                d = min( length(character1 - p.xyz), d );
                d = min( length(character2 - p.xyz), d );
                d = min( length(character3 - p.xyz), d );
                d = min( length(character4 - p.xyz), d );
                d = min( length(character5 - p.xyz), d );

                float f = (1.0 - clamp(d, 0.6, 1.0)) * 2.0;

                return vec3(
                        sin(t + float(gl_InstanceID) + p.x + p.z) * (vertex_uv.y), 
                        -f, 
                        cos(t + float(gl_InstanceID) + p.x + p.z) * (vertex_uv.y)) 
                    * 
                        vertex_position.y
                    * 
                        1.0;
            }
            `)

        super ({
            name      : "Grass",
            transform : transform
        })

        for (var i = 0; i < 32; ++i)
        {
            const component = new RenderComponent(geometry, material, false);
            component.transform.position[0] = (-1.0 + Math.random() * 2.0) * 2.0
            component.transform.position[2] = (-1.0 + Math.random() * 2.0) * 2.0
            
            component.transform.rotation[1] = (-1.0 + Math.random() * 2.0) * Math.PI

            component.transform.position = normalize(component.transform.position)
            component.transform.position = multiplys(component.transform.position, 1.0 + Math.random() * 2.0)
            this.addComponent(component)
        }

        this.positions = [
            vec3(0.0, 0.0, 0.0),
            vec3(0.0, 0.0, 0.0),
            vec3(0.0, 0.0, 0.0),
            vec3(0.0, 0.0, 0.0),
            vec3(0.0, 0.0, 0.0),
            vec3(0.0, 0.0, 0.0)]

        this.breadcrumbIndex = 0
        this.breadcrumbCount = 6
        this.breadcrumbInterval = 1000
        this.breadcrumbDropped = 0.0
    }

    update(engine)
    {
        const character = engine.scene.find("Character")
        if (character)
        {
            const p = character.transform.getWorldPosition()
            engine.rendering.MaterialPool.get(this.getRenderComponents()[0].material)
                .BasePassUniforms.get("character").value = p

            if (Date.now() - this.breadcrumbDropped > this.breadcrumbInterval)
            {
                this.positions[this.breadcrumbIndex] = [p[0], p[1], p[2]]
                this.breadcrumbIndex = (this.breadcrumbIndex + 1) % this.breadcrumbCount
                this.breadcrumbDropped = Date.now()

            }
        }

        for (var i = 0; i < this.positions.length; ++i)
        {
            this.positions[i][1] += 0.005
        }

        engine.rendering.MaterialPool.get(this.getRenderComponents()[0].material)
            .BasePassUniforms.get("character0").value = this.positions[0]

        engine.rendering.MaterialPool.get(this.getRenderComponents()[0].material)
            .BasePassUniforms.get("character1").value = this.positions[1]

        engine.rendering.MaterialPool.get(this.getRenderComponents()[0].material)
            .BasePassUniforms.get("character2").value = this.positions[2]

        engine.rendering.MaterialPool.get(this.getRenderComponents()[0].material)
            .BasePassUniforms.get("character3").value = this.positions[3]

        engine.rendering.MaterialPool.get(this.getRenderComponents()[0].material)
            .BasePassUniforms.get("character4").value = this.positions[4]

        engine.rendering.MaterialPool.get(this.getRenderComponents()[0].material)
            .BasePassUniforms.get("character5").value = this.positions[5]
    }
}