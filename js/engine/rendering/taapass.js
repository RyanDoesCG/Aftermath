class TAAPass extends RenderPass
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

            #define NFrames 15

            uniform sampler2D Frames[NFrames];
            uniform sampler2D WorldPositionBuffer;
            uniform mat4      View0;
            uniform mat4      View1;
            uniform mat4      View2;
            uniform mat4      View3;
            uniform mat4      View4;
            uniform mat4      View5;
            uniform mat4      View6;
            uniform mat4      View7;
            uniform mat4      View8;
            uniform mat4      View9;
            uniform mat4      View10;
            uniform mat4      View11;
            uniform mat4      View12;
            uniform mat4      View13;
            uniform mat4      View14;
            

            uniform vec2 WindowSize;

            uniform float CopyAAFrame; // #expose min=0 max=1 step=1 default=1
            uniform float NeighbourhoodClamp; // #expose min=0 max=1 step=1 default=1

            in vec2 frag_uvs;

            layout (location = 0) out vec4 out_color;

            void main() 
            {
                vec4 Result = vec4(0.0, 0.0, 0.0, 0.0);

                vec4 position = texture(WorldPositionBuffer, frag_uvs);
                position.w = 1.0;

                vec4 NeighbourMin = vec4(1.0);
                vec4 NeighbourMax = vec4(0.0);

                if (NeighbourhoodClamp > 0.0)
                {
                    ivec2 frag_uvs_int = ivec2(frag_uvs * WindowSize);
    
                    vec4 Neighbour0 = texelFetch(Frames[0], frag_uvs_int + ivec2(0, 1), 0);
                    NeighbourMin = min(NeighbourMin, Neighbour0);
                    NeighbourMax = max(NeighbourMax, Neighbour0);
    
                    vec4 Neighbour1 = texelFetch(Frames[0], frag_uvs_int + ivec2(0, -1), 0);
                    NeighbourMin = min(NeighbourMin, Neighbour1);
                    NeighbourMax = max(NeighbourMax, Neighbour1);
    
                    vec4 Neighbour2 = texelFetch(Frames[0], frag_uvs_int + ivec2(1, 0), 0);
                    NeighbourMin = min(NeighbourMin, Neighbour2);
                    NeighbourMax = max(NeighbourMax, Neighbour2);
    
                    vec4 Neighbour3 = texelFetch(Frames[0], frag_uvs_int + ivec2(-1, 0), 0);
                    NeighbourMin = min(NeighbourMin, Neighbour3);
                    NeighbourMax = max(NeighbourMax, Neighbour3);
                }
                else
                {
                    NeighbourMin = vec4(0.0);
                    NeighbourMax = vec4(1.0);
                }

                vec4 pl = position;
                vec2 uv = frag_uvs;
                Result += clamp(texture(Frames[0], uv), NeighbourMin, NeighbourMax);

                pl = View1 * position;
                uv = (0.5 * (pl.xy/ pl.w) + 0.5);
                Result += clamp(texture(Frames[1], uv), NeighbourMin, NeighbourMax);

                pl = View2 * position;
                uv = (0.5 * (pl.xy/ pl.w) + 0.5);
                Result += clamp(texture(Frames[2], uv), NeighbourMin, NeighbourMax);

                pl = View3 * position;
                uv = (0.5 * (pl.xy/ pl.w) + 0.5);
                Result += clamp(texture(Frames[3], uv), NeighbourMin, NeighbourMax);

                pl = View4 * position;
                uv = (0.5 * (pl.xy/ pl.w) + 0.5);
                Result += clamp(texture(Frames[4], uv), NeighbourMin, NeighbourMax);

                pl = View5 * position;
                uv = (0.5 * (pl.xy / pl.w) + 0.5);
                Result += clamp(texture(Frames[5], uv), NeighbourMin, NeighbourMax);

                pl = View6 * position;
                uv = (0.5 * (pl.xy/ pl.w) + 0.5);
                Result += clamp(texture(Frames[6], uv), NeighbourMin, NeighbourMax);

                pl = View7 * position;
                uv = (0.5 * (pl.xy/ pl.w) + 0.5);
                Result += clamp(texture(Frames[7], uv), NeighbourMin, NeighbourMax);

                pl = View8 * position;
                uv = (0.5 * (pl.xy/ pl.w) + 0.5);
                Result += clamp(texture(Frames[8], uv), NeighbourMin, NeighbourMax);

                pl = View9 * position;
                uv = (0.5 * (pl.xy/ pl.w) + 0.5);
                Result += clamp(texture(Frames[9], uv), NeighbourMin, NeighbourMax);

                pl = View10 * position;
                uv = (0.5 * (pl.xy / pl.w) + 0.5);
                Result += clamp(texture(Frames[10], uv), NeighbourMin, NeighbourMax);

                pl = View11 * position;
                uv = (0.5 * (pl.xy/ pl.w) + 0.5);
                Result += clamp(texture(Frames[11], uv), NeighbourMin, NeighbourMax);

                pl = View12 * position;
                uv = (0.5 * (pl.xy/ pl.w) + 0.5);
                Result += clamp(texture(Frames[12], uv), NeighbourMin, NeighbourMax);

                pl = View13 * position;
                uv = (0.5 * (pl.xy/ pl.w) + 0.5);
                Result += clamp(texture(Frames[13], uv), NeighbourMin, NeighbourMax);

                pl = View14 * position;
                uv = (0.5 * (pl.xy/ pl.w) + 0.5);
                Result += clamp(texture(Frames[14], uv), NeighbourMin, NeighbourMax);

                out_color = Result * 0.066666;


            }`

        super(context, width, height, VertexSource, FragmentSource)

        // HISTORY
        this.NumHistorySamples = 15;
        this.LightingBuffers = new Array(this.NumHistorySamples)
        for (var i = 0; i < this.NumHistorySamples; ++i)
            this.LightingBuffers[i] = createColourTexture(this.gl, 
                this.width, 
                this.height, 
                this.gl.RGBA, this.gl.UNSIGNED_BYTE)
    
        this.ViewTransforms = new Array(this.NumHistorySamples)
        for (var i = 0; i < this.NumHistorySamples; ++i)
            this.ViewTransforms[i] = identity()

        // OUTPUT
        this.outputColour = createColourTexture(this.gl, this.width, this.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE)
        this.framebuffer = createFramebuffer(this.gl, 
            [ this.gl.COLOR_ATTACHMENT0 ],
            [ this.outputColour ])
    }

    Render(renderer, ScreenPrimitive, inWorldPositionBuffer, inFramebuffer, View, WindowSize, toScreen)
    {
        // copy inLightingBuffer into element [0]
        const nextBuffer = this.LightingBuffers.pop();
        this.LightingBuffers.unshift(nextBuffer);
        this.gl.viewport(0, 0, this.width, this.height);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, inFramebuffer);
        this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, nextBuffer)
        this.gl.copyTexImage2D(
            this.gl.TEXTURE_2D, 
            0,
            this.gl.RGBA, 
            0, 0,
            this.width,
            this.height,
            0);

        const nextView = this.ViewTransforms.pop();
        this.ViewTransforms.unshift(multiplym(View.projection, View.worldToView))

        if (toScreen)
        {
            this.gl.viewport(0, 0, this.width, this.height);
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        }
        else
        {
            this.gl.viewport(0, 0, this.width, this.height);
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
            this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
        }

        this.gl.clearColor(0.0, 0.0, 0.0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.useProgram(this.ShaderProgram);

        for (var i = 0; i < this.ViewTransforms.length; ++i)
        {
            this.gl.uniformMatrix4fv(this.uniforms.get("View" + i).location,  false, this.ViewTransforms[i])
        }
        
        for (var i = 0; i < this.LightingBuffers.length; ++i)
        {
            this.gl.activeTexture(getTextureEnum(this.gl, i))
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.LightingBuffers[i])
        }
        
        this.gl.uniform1iv(this.uniforms.get("Frames").location, [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 ])

        this.gl.activeTexture(this.gl.TEXTURE15);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inWorldPositionBuffer);
        this.gl.uniform1i(this.uniforms.get("WorldPositionBuffer").location, 15)
        this.gl.uniform1f(this.uniforms.get("NeighbourhoodClamp").location, this.uniforms.get("NeighbourhoodClamp").value)
        
        this.gl.uniform2fv(this.uniforms.get("WindowSize").location, WindowSize);

        renderer.GeometryPool.get(ScreenPrimitive.geometry).draw()

        // Using the anti-aliased image as the history sample
        // much better quality, bad ghosting
        if (this.uniforms.get("CopyAAFrame").value == 1.0)
        {
            this.gl.viewport(0, 0, this.width, this.height);
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
            this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);

            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.LightingBuffers[0])
            this.gl.copyTexImage2D(
                this.gl.TEXTURE_2D, 
                0,
                this.gl.RGBA, 
                0, 0,
                this.width,
                this.height,
                0);
        }
    }
}