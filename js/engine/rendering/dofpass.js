class DepthOfFieldPass extends RenderPass
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

            uniform sampler2D BlurredScene;
            uniform sampler2D UnblurredScene;
            uniform sampler2D WorldPositionBuffer;

            uniform float amount;  // #expose min=0.0 max=1.0 step=0.01 default=0.1

            in vec2 frag_uvs;

            out vec4 out_colour;

            void main ()
            {
                vec4 BlurSample      = texture(BlurredScene,        frag_uvs);
                vec4 UnblurredSample = texture(UnblurredScene,      frag_uvs);
                vec4 WorldPosition   = texture(WorldPositionBuffer, frag_uvs);

                vec4 FocalPoint      = texture(WorldPositionBuffer, vec2(0.5, 0.25));
                FocalPoint += texture(WorldPositionBuffer, vec2(0.5, 0.6));
                FocalPoint += texture(WorldPositionBuffer, vec2(0.5, 0.4));
                FocalPoint += texture(WorldPositionBuffer, vec2(0.6, 0.5));
                FocalPoint += texture(WorldPositionBuffer, vec2(0.4, 0.5));

                FocalPoint /= 5.0;

                if (WorldPosition.w == 0.0) 
                    WorldPosition.w = 10000.0;

                if (FocalPoint.w == 0.0) 
                    FocalPoint.w = 10000.0;

                float focus = abs(WorldPosition.w - FocalPoint.w) * amount;

                out_colour = mix(UnblurredSample, BlurSample, clamp(0.0, 1.0, focus));
            }`

        super(context, width, height, VertexSource, FragmentSource)

        this.output = createColourTexture(this.gl, this.width, this.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE)
        this.framebuffer = createFramebuffer(this.gl, [ this.gl.COLOR_ATTACHMENT0 ], [ this.output ])
    }
    
    Render(renderer, ScreenPrimitive, inSceneTexture, inBlurredSceneTexture, inPositionTexture, toScreen)
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
        }

        this.gl.clearColor(0.0, 0.0, 0.0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.useProgram(this.ShaderProgram);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inSceneTexture);
        this.gl.uniform1i(this.uniforms.get("UnblurredScene").location, 0);
        
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inBlurredSceneTexture);
        this.gl.uniform1i(this.uniforms.get("BlurredScene").location, 1);

        this.gl.activeTexture(this.gl.TEXTURE2);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inPositionTexture);
        this.gl.uniform1i(this.uniforms.get("WorldPositionBuffer").location, 2);

        this.gl.uniform1f(this.uniforms.get("amount").location, this.uniforms.get("amount").value)

        
        renderer.GeometryPool.get(ScreenPrimitive.geometry).draw()
    }
}