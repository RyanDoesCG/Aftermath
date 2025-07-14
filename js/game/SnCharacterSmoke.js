class SnCharacterSmoke extends SceneObject
{
    constructor (engine, character)
    {
        const geometry = engine.rendering.requestGeometry("Quad")
        const material = engine.rendering.requestMaterial(BLEND_MODE_TRANSPARENT, 1.0, 0.0, 0.0, 0.2, 0.0,`
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

                n *= 1.0;

                return vec4(0.0, 0.0, 0.0, n * clamp(alpha, 0.0, 1.0)); 
            }`)

        super ({
            name      : "CharacterSmoke",
            transform : new Transform(Scale(0.5, 0.5, 1.0), Translation(0.0, 0.0, 0.0), Rotation(0.0, 0.0, 0.0)),
            render    : new RenderComponent(geometry, material)})

        this.character = character

        this.dir = -1.0;
        this.alpha = 0.0
        this.delta = 0.1
    }

    show ()
    {
        this.delta = 0.05
        this.dir = 1.0
    }

    hide ()
    {
        this.delta = 0.02
        this.dir = -1.0
    }

    update (engine)
    {
        this.transform.position[0] = this.character.transform.getWorldPosition()[0]
        this.transform.position[1] = this.character.transform.getWorldPosition()[1] + 1.0
        this.transform.position[2] = this.character.transform.getWorldPosition()[2]

        this.alpha += this.delta * this.dir
        this.alpha = Math.max(this.alpha, 0.0)
        this.alpha = Math.min(this.alpha, 1.0)

        engine.rendering.MaterialPool.get(this.getRenderComponents()[0].material)
            .TransparentPassUniforms.get("alpha").value = this.alpha
    }
}