class SnGround extends SceneObject 
{
    constructor (engine, transform)
    {   
        super ({ name: "Ground" })
        this.material = engine.rendering.requestMaterial(BLEND_MODE_OPAQUE, 0.06, 0.06, 0.06, 0.0, 0.0)
        this.geometry = engine.rendering.requestGeometry("Box")
        this.transform = transform,
        this.addComponent(new RenderComponent(this.geometry, this.material))
        this.addComponent(new PlaneCollisionComponent(vec3(0.0, 1.0, 0.0), vec3(0.0, 1.0, 0.0)))
    }
}