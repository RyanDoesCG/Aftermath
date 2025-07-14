class FogPass extends RenderPass
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
                gl_Position = vec4(vertex_position, 1.0);
                frag_uvs = vertex_uvs;
            }`

        const FragmentSource = 
           `#version 300 es
            precision lowp float;

            #define FOG_COLOUR vec3(0.5, 0.5, 0.5)

            uniform sampler2D PositionTexture;
            uniform float FogDistance; // #expose min=0.0  max=1000.0 step=1.0   default=43.0
            uniform float FogFalloff;  // #expose min=0.01 max=20.0   step=0.001 default=0.832
            uniform float FogMax;      // #expose min=0.0  max=1.0    step=0.01  default=1.0

            in vec2 frag_uvs;
            
            layout (location = 0) out vec4 out_colour;

            void main ()
            {
                vec4 Position = texture(PositionTexture, frag_uvs);
                float fog = (Position.w > 0.0) ? Position.w : FogDistance;
                fog = clamp(0.0, FogDistance, fog) / FogDistance;
                fog = min(pow(fog, FogFalloff), FogMax);
                out_colour = mix(out_colour, FOG_COLOUR, clamp(fog, 0.0, 1.0)); 
            }`

        super(context, width, height, VertexSource, FragmentSource)

        this.output = createColourTexture(
            this.gl,
            this.width,
            this.height,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE)

        this.Framebuffer =  createFramebuffer(this.gl, 
            [
                this.gl.COLOR_ATTACHMENT0
            ], 
            [
                this.output
            ])
    }

    Render (
        renderer, 
        ScreenPrimitive, 
        inPositionTexture, 
        toScreen)
    {
        if (toScreen)
        {
            this.gl.viewport(0, 0, this.width, this.height);
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        }
        else
        {
            this.gl.viewport(0, 0, this.width, this.height);
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.Framebuffer);
            this.gl.drawBuffers([
                this.gl.COLOR_ATTACHMENT0, 
                this.gl.COLOR_ATTACHMENT1 ]);
        }

        this.gl.useProgram(this.ShaderProgram);

        this.gl.uniform1i(this.uniforms.get("PositionTexture").location, 0);
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inPositionTexture);

        this.gl.uniform1f(this.uniforms.get("FogDistance").location, this.uniforms.get("FogDistance").value)
        this.gl.uniform1f(this.uniforms.get("FogFalloff").location, this.uniforms.get("FogFalloff").value)
        this.gl.uniform1f(this.uniforms.get("FogMax").location, this.uniforms.get("FogMax").value)

        renderer.GeometryPool.get(ScreenPrimitive.geometry).draw()
    }
}