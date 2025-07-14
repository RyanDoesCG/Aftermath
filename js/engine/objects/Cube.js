class Cube extends SceneObject
{
    constructor (engine, transform)
    {
        super ({
            name      : "Cube",
            transform : transform,
            render    : new RenderComponent(
                engine.rendering.requestGeometry("Box"), 
                engine.rendering.GridMaterial),
            collision : new BoxCollisionComponent(
                1.0,
                1.0,
                1.0)
        })
    }
}