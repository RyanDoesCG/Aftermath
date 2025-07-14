class DirectionalLightComponent extends Component
{
    constructor (params)
    {
        super ()
        this.type = "DirectionalLightComponent"
        this.intensity = params.intensity
        this.color = params.color

        this.projection = null
        this.view = null

        this.update()
    }

    update ()
    {
        this.projection = orthographic(80.0, -256.0, 256.0)
        this.view = new View(this.transform.getWorldPosition(), this.transform.getWorldRotation())
    }
}

class PointLightComponent extends Component
{
    constructor (params)
    {
        super ()
        this.transform.scale = vec3(params.range, params.range, params.range)

        this.type = "PointLightComponent"
        this.intensity = params.intensity
        this.color = params.color
        this.range = params.range

        this.projection = null
        this.view = null

        this.update()
    }

    update ()
    {
        this.projection = orthographic(120.0, -256.0, 256.0)
        this.view = new View(this.transform.getWorldPosition(), this.transform.getWorldRotation())
    }
}

class SpotLightComponent extends Component
{
    constructor (params)
    {
        super ()
        this.transform.scale = vec3(1.0, 1.0, 1.0)

        this.type = "SpotLightComponent"
        this.intensity = params.intensity
        this.color = params.color
        this.range = params.range
        this.angle = params.angle

        this.projection = null
        this.view = null

        this.update()
    }

    update ()
    {
        this.projection = perspective(60.0, 0.1, 32.0, 1080, 1080, 1.0, false)
        this.view = new View(this.transform.getWorldPosition(), this.transform.getWorldRotation(), 1.0)
    }
}

class DirectionalLight extends SceneObject
{
    constructor (engine, transform)
    {
        const params = { 
            name : "DirectionalLight",
            transform : transform,
            intensity : 0.1
        }

        super (params)
        this.light = new DirectionalLightComponent(params)
        this.transform = params.transform
        this.addComponent(this.light)
    }

    update ()
    {
        this.light.update()
    }
}

class PointLight extends SceneObject
{
    constructor (params)
    {
        super (params)
        this.light = new PointLightComponent(params)
        this.addComponent(this.light);
    }

    update ()
    {
        this.light.update()
    }
}

class SpotLight extends SceneObject
{
    constructor (params)
    {
        super (params)
        this.light = new SpotLightComponent(params)
        this.addComponent(this.light)
    }

    update()
    {
        this.light.update()
    }
}
