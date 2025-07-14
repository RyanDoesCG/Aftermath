class Sky extends SceneObject
{
    constructor (engine, transform)
    {
        const SkyGeometry = engine.rendering.requestGeometry("Sky")
        const SkyMaterial = engine.rendering.requestMaterial(BLEND_MODE_OPAQUE, 1.0, 1.0, 1.0, 0.0, 0.0, `
            vec4 getMaterialAlbedo()
            {
                vec4  a = vec4(0.99607843, 0.99607843, 0.99607843, 0.0); 
                vec4  b = vec4(0.17647059, 0.29019608, 0.45882353, 0.0);
                float t = clamp((frag_worldpos.y /* / scale.y */) * 0.5, 0.0, 1.0);
                return mix(a, b, 1.0 - t);
            }`)

        super ({
            name      : "Sky",
            transform : transform,
            render    : new RenderComponent(SkyGeometry, SkyMaterial, false)
        })
    }
}