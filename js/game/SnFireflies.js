class SnFireflies extends SceneObject
{
    constructor (engine)
    {
        const geometry = engine.rendering.requestGeometry("Grass")
        const material = engine.rendering.requestMaterial(BLEND_MODE_OPAQUE, 1.0, 1.0, 1.0, 0.2, 1.0, `
            vec4 getMaterialAlbedo()
            {
                return vec4(1.0, 1.0, 1.0, 0.0) * (0.5 + abs(sin(Time * 0.001)));
            }`,
            `vec3  getMaterialNormal()
            {
                return frag_normal;
            }`,
            `vec3 getMaterialLPO()
            {
                float t = Time * 0.1;
                float y = sin(t + float(gl_InstanceID)) * 4.0;
                return vec3(sin(t + float(gl_InstanceID)) * 2.0, y, cos(t + float(gl_InstanceID)) * 2.0) 
                    * 1.0;
            }`)

            super ({
                name      : "Fireflies",
                transform : new Transform(Scale(0.01, 0.01, 0.01), Translation(0.0, 0.0, 0.0), Rotation(0.0, 0.0, 0.0)),
                render    : new RenderComponent(geometry, material)
            })
    
            for (var i = 0; i < 28; ++i)
            {
                const component = new RenderComponent(geometry, material, false);
                component.transform.position[0] = (-1.0 + Math.random() * 2.0) * 2.0
                component.transform.position[1] = (-1.0 + Math.random() * 2.0) * 8.0
                component.transform.position[2] = (-1.0 + Math.random() * 2.0) * 2.0
    
                component.transform.position = normalize(component.transform.position)
                component.transform.position = multiplys(component.transform.position, 1.0 + Math.random() * 2.0)
                this.addComponent(component)
            }
    }
}