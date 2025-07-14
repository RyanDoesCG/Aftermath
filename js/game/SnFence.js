class SnFence extends SceneObject 
{
    constructor (engine, transform)
    {   
        super ({name:"fence"})
        this.geometry = engine.rendering.requestGeometry("fence")
        this.material = engine.rendering.requestMaterial(BLEND_MODE_OPAQUE, 0.0, 0.0, 0.0, 0.08, 0.0,`
            vec4 getMaterialAlbedo() 
            { 
                return vec4(0.1, 0.1, 0.1, 0.0); 
            }`)

        this.transform = transform

        if ((transform.rotation[1]/Math.PI) == 0.0 || (transform.rotation[1]/Math.PI) == 1.0)
        {
            this.addComponent(new BoxCollisionComponent(2.9, 2.9, 0.1))
        }
        else
        {
            this.addComponent(new BoxCollisionComponent(0.1, 2.9, 2.9))
        }

        this.addComponent(new RenderComponent(this.geometry, this.material))
    }

    update (engine)
    {

    }
}