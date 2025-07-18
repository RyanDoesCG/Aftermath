
// TO DO
//
//   - Currently uses character positions in uniforms to 
//     drive vertex shader transforms
//
//   - Need to support more characters
// 
//   - Render character breadcrumbs in to a texture, then
//     use this texture for the vertex shader transforms
//
//   NOTES
//
//   Heightmap render needs to happen _before_ base pass

class CharacterTrailRenderer extends RenderPass
{
    constructor(context, width, height)
    {
        const VertexSource = 
           `#version 300 es
            precision lowp float;

            uniform vec2 offset;
            uniform vec2 scale;

            in vec3 vertex_position;
            in vec3 vertex_normal;
            in vec2 vertex_uvs;
            out vec2 frag_uvs;
            void main() 
            {
                gl_Position = vec4(vertex_position.xy * scale + offset, 0.0, 1.0);
                frag_uvs = vertex_uvs;
            }`

        const FragmentSource = 
           `#version 300 es
            precision lowp float;

            in vec2 frag_uvs;

            out vec4 out_colour;

            void main ()
            {
                out_colour = vec4(1.0, 1.0, 1.0, 1.0);
            }`

        super (context, width, height, VertexSource, FragmentSource)

        this.output = createColourTexture(this.gl, this.width, this.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE)
        this.framebuffer = createFramebuffer(this.gl, [ this.gl.COLOR_ATTACHMENT0 ], [ this.output ])
    }

    Render(renderer)
    {
        renderer.VisualizeTexture = this.output

        this.gl.viewport(0, 0, this.width, this.height);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);

        this.gl.clearColor(0.0, 0.0, 0.0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.useProgram(this.ShaderProgram);

        this.gl.uniform2f(this.gl.getUniformLocation(this.ShaderProgram, "offset"), 0.0, 0.0)
        this.gl.uniform2f(this.gl.getUniformLocation(this.ShaderProgram, "scale"), 0.5, 0.5)

        renderer.GeometryPool.get("Quad").draw()
    }
}

class Grass extends SceneObject
{
    constructor (engine, transform)
    {
        const geometry = engine.rendering.requestGeometry("Grass")
        const material = engine.rendering.requestMaterial(BLEND_MODE_OPAQUE, 1.0, 1.0, 1.0, 0.1, 0.0, `
            float random (vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233)))*43758.5453123);
            }
            vec4 getMaterialAlbedo()
            {
                vec4 colorA = vec4(0.2, 0.2, 0.2, 0.0);
                vec4 colorB = vec4(0.3, 0.3, 0.3, 0.0);
                return mix(colorA, colorB, random(floor(frag_worldpos.xz * 10.0))) * (frag_uvs.y);
            }`,
            `vec3  getMaterialNormal()
            {
                return frag_normal;
            }`,
            `
            vec3 getMaterialLPO()
            {
                float t = Time * 0.1;
                vec4  p = (transform[gl_InstanceID] * vec4(vertex_position.xyz, 1.0));
                float d = 1.0;
                float f = (1.0 - clamp(d, 0.6, 1.0)) * 2.0;
                return vec3(
                        sin(t + float(gl_InstanceID) + p.x + p.z) * (vertex_uv.y), 
                        -f, 
                        cos(t + float(gl_InstanceID) + p.x + p.z) * (vertex_uv.y)) 
                    * 
                        vertex_position.y
                    * 
                        1.0;
            }`)

        super ({
            name      : "Grass",
            transform : transform
        })

        for (var i = 0; i < 32; ++i)
        {
            const component = new RenderComponent(geometry, material, false);
            component.transform.position[0] = (-1.0 + Math.random() * 2.0) * 2.0
            component.transform.position[2] = (-1.0 + Math.random() * 2.0) * 2.0
            component.transform.position = normalize(component.transform.position)
            component.transform.position = multiplys(component.transform.position, 1.0 + Math.random() * 2.0)
            component.transform.rotation[1] = (-1.0 + Math.random() * 2.0) * Math.PI
            this.addComponent(component)
        }

        this.trails = new CharacterTrailRenderer(engine.rendering.gl, 1024, 1024)
    }

    update(engine)
    {
        this.trails.Render(engine.rendering);
    }
}