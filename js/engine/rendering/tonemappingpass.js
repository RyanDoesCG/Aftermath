class TonemappingPass extends RenderPass
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
 
            uniform sampler2D Scene;
            uniform sampler2D Bloom;

            uniform float Floor; // #expose min=0.0 max=1.0 step=0.01 default=0.2
            uniform float Gamma; // #expose min=0.0 max=10.0 step=0.1 default=1.2
            uniform float Gain;  // #expose min=0.0 max=10.0 step=0.1 default=1.0

            in vec2 frag_uvs;
            
            layout (location = 0) out vec4 out_colour;
            
            void main ()
            {
                vec3 color = 
                    texture(Scene, frag_uvs).rgb 
                    + 
                    texture(Bloom, frag_uvs).rgb;

                out_colour.rgb = pow(color, vec3(1.0/Gamma)) * Gain;
                out_colour.rgb = max(vec3(Floor), out_colour.rgb);
                out_colour.a = 1.0;
            }`
        super(context, width, height, VertexSource, FragmentSource)

        this.output = createColourTexture (this.gl, this.width, this.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE)
        this.framebuffer = createFramebuffer(this.gl, 
            [
                this.gl.COLOR_ATTACHMENT0
            ], 
            [
                this.output
            ])
    }

    Render(renderer, ScreenPrimitive, inSceneTexture, inBloomTexture, toScreen)
    {
        if (toScreen)
        {
            this.gl.viewport(0, 0, this.width, this.height);
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        }
        else
        {
            this.gl.viewport(0, 0, this.width, this.height);
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
            this.gl.drawBuffers([
                this.gl.COLOR_ATTACHMENT0]);
        }

        this.gl.useProgram(this.ShaderProgram);

        this.gl.uniform1f(this.uniforms.get("Floor").location, this.uniforms.get("Floor").value)
        this.gl.uniform1f(this.uniforms.get("Gamma").location, this.uniforms.get("Gamma").value)
        this.gl.uniform1f(this.uniforms.get("Gain").location, this.uniforms.get("Gain").value)

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inSceneTexture);
        this.gl.uniform1i(this.uniforms.get("Scene").location, 0);

        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inBloomTexture);
        this.gl.uniform1i(this.uniforms.get("Bloom").location, 1);

        renderer.GeometryPool.get(ScreenPrimitive.geometry).draw()
    }
}