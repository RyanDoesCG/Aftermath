class SnBarrier extends SceneObject 
{
    constructor (engine, transform)
    {   
        super ({name:"barrier"})
        this.geometry = engine.rendering.requestGeometry("barrier")
        this.material = engine.rendering.requestMaterial(BLEND_MODE_OPAQUE, 0.0, 0.0, 0.0, 0.08, 0.1,`
            vec4 getMaterialAlbedo() 
            { 
                return vec4(0.01, 0.01, 0.01, 0.0); 
            }`)

        this.transform = transform

        if ((transform.rotation[1]/Math.PI) == 0.0 || (transform.rotation[1]/Math.PI) == 1.0)
        {
            this.addComponent(new BoxCollisionComponent(1.5, 1.5, 0.1))
        }
        else
        {
            this.addComponent(new BoxCollisionComponent(0.1, 1.5, 1.5))
        }

        this.addComponent(new RenderComponent(this.geometry, this.material))
    }

    update (engine)
    {

    }
}