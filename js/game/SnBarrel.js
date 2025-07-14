class SnBarrel extends SceneObject 
{
    constructor (engine, transform)
    {   
        super ({name: "Barrel"})
        this.geometry = engine.rendering.requestGeometry("barrel")
        this.material = engine.rendering.requestMaterial(BLEND_MODE_OPAQUE, 0.0, 0.0, 0.0, 0.2, 0.0,`
            uniform sampler2D A; // #texture path=images/A.png
            vec4 getMaterialAlbedo() 
            { 
                vec4 a = texture(A, (frag_localpos.y > 1.0)? abs(frag_localpos.xy) + frag_uvs : vec2(0.0));
                return vec4(a.xyz, 0.0); 
            }`)

        this.transform = transform

        this.transform.rotation[1] = (-1.0 + Math.random() * 2.0) * 1.0

        this.addComponent(new BoxCollisionComponent(0.5, 0.5, 0.5))
        this.addComponent(new RenderComponent(this.geometry, this.material))
    }

    update (engine)
    {

    }
}