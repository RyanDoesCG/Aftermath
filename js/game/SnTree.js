class SnTree extends SceneObject 
{
    constructor (engine, transform)
    {   
        super ({name:"Tree"})
        this.geometry = engine.rendering.requestGeometry("tree")
        this.material = engine.rendering.requestMaterial(BLEND_MODE_OPAQUE, 0.1, 0.1, 0.1, 0.2, 0.0)

        this.transform = transform

        this.transform.rotation[1] = (-1.0 + Math.random() * 2.0) * 1.0

        this.transform.scale[0] = 0.8 + Math.random() * 0.4
        this.transform.scale[1] = 1.0 + Math.random() * 0.2
        this.transform.scale[2] = 0.8 + Math.random() * 0.4

        this.addComponent(new BoxCollisionComponent(1.0, 1.0, 1.0))
        this.addComponent(new RenderComponent(this.geometry, this.material))
    }

    update (engine)
    {

    }
}