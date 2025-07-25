
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

            in vec3 vertex_position;
            in vec3 vertex_normal;
            in vec2 vertex_uvs;
            out vec2 frag_uvs;
            void main() 
            {
                gl_Position = vec4(vertex_position.xy, 0.0, 1.0);
                frag_uvs = vertex_uvs;
            }`

        const FragmentSource = 
           `#version 300 es
            precision lowp float;

            #define MAX_LOCATIONS 4
            uniform vec2 locations[MAX_LOCATIONS];

            in vec2 frag_uvs;

            out vec4 out_colour;

            void main ()
            {
                out_colour = vec4(1.0, 1.0, 1.0, 0.005);  
                for (int i = 0; i < MAX_LOCATIONS; ++i)
                {
                    vec2 between = frag_uvs - locations[i];
                    float distsqr = length(between);
                    if (distsqr < 0.01)
                    {
                        out_colour = vec4(0.0, 0.0, 0.0, 1.0);       
                    }
                }
            }`

        super (context, width, height, VertexSource, FragmentSource)

        this.output = createColourTexture(this.gl, this.width, this.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE)
        this.framebuffer = createFramebuffer(this.gl, [ this.gl.COLOR_ATTACHMENT0 ], [ this.output ])

        this.gl.viewport(0, 0, this.width, this.height);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);

        this.gl.clearColor(1.0, 1.0, 1.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    Render(renderer, characters, grassOffset, grassSize)
    {
//        renderer.VisualizeTexture = this.output

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.blendEquation(this.gl.FUNC_ADD);

        this.gl.viewport(0, 0, this.width, this.height);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
        
        this.gl.useProgram(this.ShaderProgram);

        let locations = []
        for (var i = 0; i < characters.length; ++i)
        {
            let corner = vec2(grassOffset[0] + (-grassSize[0] * 0.5), grassOffset[1] + (-grassSize[1] * 0.5))

            let relative = subv(vec2(characters[i].transform.position[0], characters[i].transform.position[2]), grassOffset);

            let to = subv(relative, corner)

            let scaled = dividev(to, grassSize)
           // let scaled = dividev(relative, grassSize/2.0);
            //let mapped = multiplys(addv(vec2(-0.5, 0.5), scaled), 2.0)
            
            locations.push(scaled[0])
            locations.push(scaled[1])
            /*
            this.gl.uniform2f(this.gl.getUniformLocation(this.ShaderProgram, "offset"), 
                (characters[i].transform.position[0] - grassOffset[0]) / grassSize[0], 
                (characters[i].transform.position[2] - grassOffset[1]) / grassSize[1])
            this.gl.uniform2f(this.gl.getUniformLocation(this.ShaderProgram, "scale"), 0.02, 0.02)
            */
        }

        this.gl.uniform2fv(this.gl.getUniformLocation(this.ShaderProgram, "locations"), locations)

        renderer.GeometryPool.get("Quad").draw()

        this.gl.disable(this.gl.BLEND)
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

                float minY = -0.45;
                float maxY = world.y;
                world.y = mix(minY, maxY, clamp(texture(trails, uv).r, 0.0, 1.0));
                world.y *= vertex_uv.y;

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
        for (var i = 0; i < 128; ++i)
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
        const characters = []
        engine.scene.traverse((object) => 
        {
            if (object.name == "Character" || object.name == "Camera")
            {
                characters.push(object);
            }
        })

        this.trails.Render(engine.rendering, characters, vec2(0.0, 0.0), vec2(64.0, 64.0));
        TexturePool.set("trails", this.trails.output);
    }
}