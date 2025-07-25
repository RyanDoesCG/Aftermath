class RenderComponent extends Component
{
    constructor (geometry, material, shadows = true)
    {
        super()
        this.type = "RenderComponent"
        this.geometry = geometry
        this.material = material

        this.shadows = shadows
        this.visible = true
        this.twosided = false
    }

    toString()
    {
        return this.material.toString()
    }
}