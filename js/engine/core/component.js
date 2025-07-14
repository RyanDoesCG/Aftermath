class Component
{
    constructor()
    {
        this.transform = new Transform(
            Scale       (1.0, 1.0, 1.0),
            Translation (0.0, 0.0, 0.0),
            Rotation    (0.0, 0.0, 0.0))
        this.type = "Component"
        this.id = -1
    }
}