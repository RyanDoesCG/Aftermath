
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
                float t = length(-1.0 + frag_uvs * 2.0);
                out_colour = vec4(t, t, t, 1.0);
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

        this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.useProgram(this.ShaderProgram);

        this.gl.uniform2f(this.gl.getUniformLocation(this.ShaderProgram, "offset"), 0.0, 0.0)
        this.gl.uniform2f(this.gl.getUniformLocation(this.ShaderProgram, "scale"), 1.0, 1.0)

        renderer.GeometryPool.get("Quad").draw()
    }
}

class Grass extends SceneObject
{
    constructor (engine, transform)
    {
        const geometry = engine.rendering.requestGeometry("Grass")

        // Where to pass trails texture over?
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
                return vec3(0.0, 0.0, 1.0);
            }`,
            `

            float random (vec2 st) {
                return -1.0 + fract(sin(dot(st.xy, vec2(12.9898,78.233)))*43758.5453123) * 2.0;
            }

            float noise (vec2 uv)
            {
                float a = random(floor(uv));
                float b = random(floor(uv) + vec2(1.0, 0.0));
                float c = random(floor(uv) + vec2(0.0, 1.0));
                float d = random(floor(uv) + vec2(1.0, 1.0));
                vec2 t = smoothstep(vec2(0.0), vec2(1.0), fract(uv));
                return mix(a, b, t.x) +
                    (c - a) * t.y * (1.0 - t.x) +
                    (d - b) * t.x * t.y;
            }
                    
            uniform sampler2D trails;
            uniform float size; // TODO
            #define SIZE 32.0

            vec3 getMaterialLPO()
            {
                float t = Time * 0.1;
                float id = float(gl_InstanceID * 3481) + vertex_normal.y;
                float idX = mod(id, 59.0);
                float idY = floor(id / 59.0) * 59.0;

                // World Positioning
                vec3 world = vec3(
                    noise(vec2(idX, idY) / 59.0),
                    0.0, 
                    noise(vec2(idY, idX) / 59.0));
                world *= SIZE;

                world.y = (noise(vec2(world.x, world.z)) + 1.0) * 0.5 * vertex_uv.y * 0.1;

                vec2 uv = vec2(((world.x / SIZE) + 1.0) * 0.5, ((world.z / SIZE) + 1.0) * 0.5);

               // float minY = -0.4;
               // float maxY = world.y;
               // world.y = mix(minY, maxY, clamp(texture(trails, uv).r, 0.0, 1.0));
               // world.y *= vertex_position.y;

                // Tip Sway
                vec3 sway_mass = vec3(
                    sin(t + world.x + world.x) * vertex_uv.y,
                    0.0,
                    cos(t + world.x + world.z) * vertex_uv.y);
                sway_mass *= 0.1;
                vec3 sway_local = vec3(
                    sin(t + float(id) + world.x + world.x) * vertex_uv.y,
                    0.0,
                    cos(t + float(id) + world.x + world.z) * vertex_uv.y);
                sway_local *= 0.2;

                vec3 sway = (sway_mass + sway_local) * vertex_position.y;

                // Base Rotation
                mat2 m = mat2(
                     cos(id), sin(id),   // first column
                    -sin(id), cos(id));  // second column
                vec2 b = m * vec2(
                    vertex_position.x,
                    vertex_position.z);
                vec3 base = vec3(b.x, 0.0, b.y);
                
                // Integrate
                return world + base + sway;
            }`)

        super ({
            name      : "Grass",
            transform : transform
        })

        this.renderComponents = []
        for (var i = 0; i < 64; ++i)
        {
            const component = new RenderComponent(geometry, material, false);
            component.twosided = true;
            this.addComponent(component)
        }

        this.trails = new CharacterTrailRenderer(engine.rendering.gl, 1024, 1024)
    }

    update(engine)
    {

        // TO DO
        // Gather dynamic objects to render into trails texture

        this.trails.Render(engine.rendering);
        TexturePool.set("trails", this.trails.output);
    }
}