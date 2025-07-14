class OutlinePass extends SubPass
{
    constructor (context, width, height)
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

         uniform sampler2D IDBuffer;
         uniform float SelectedID;

         uniform float width;
         uniform float height;

         in vec2 frag_uvs;

         out vec4 out_colour;

         void main ()
         {
            ivec2 frag_uvs_int = ivec2(frag_uvs * vec2(width, height));

            float ID = texelFetch(IDBuffer, frag_uvs_int, 0).r * 255.0;
            float ID0 = texelFetch(IDBuffer, frag_uvs_int + ivec2(0, 1), 0).r * 255.0;
            float ID1 = texelFetch(IDBuffer, frag_uvs_int + ivec2(0, -1), 0).r * 255.0;
            float ID2 = texelFetch(IDBuffer, frag_uvs_int + ivec2(-1, 0), 0).r * 255.0;
            float ID3 = texelFetch(IDBuffer, frag_uvs_int + ivec2(1, 0), 0).r * 255.0;

            if (ID == SelectedID)
            {
                if (ID0 != SelectedID || ID1 != SelectedID || ID2 != SelectedID || ID3 != SelectedID)
                {
                    out_colour = vec4(1.0, 1.0, 1.0, 1.0);
                    return;
                }
            }
            else
            {
                if (ID0 == SelectedID || ID1 == SelectedID || ID2 == SelectedID || ID3 == SelectedID)
                {
                    out_colour = vec4(1.0, 1.0, 1.0, 1.0);
                    return;
                }
            }
            
            out_colour = vec4(0.0, 0.0, 0.0, 0.0);
         }`

        super(context, width, height, VertexSource, FragmentSource)
    }

    Render(renderer, ScreenPrimitive, inSelectedID, inIDTexture, inFramebuffer)
    {
        this.gl.viewport(0, 0, this.width, this.height);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, inFramebuffer);

        this.gl.useProgram(this.ShaderProgram);

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.blendEquation(this.gl.FUNC_ADD);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inIDTexture);
        this.gl.uniform1i(this.uniforms.get("IDBuffer").location, 0);
        
        this.gl.uniform1f(this.uniforms.get("SelectedID").location, inSelectedID)
        this.gl.uniform1f(this.uniforms.get("width").location, this.width)
        this.gl.uniform1f(this.uniforms.get("height").location, this.height)

        renderer.GeometryPool.get(ScreenPrimitive.geometry).draw()

        this.gl.disable(this.gl.BLEND)
    }
}