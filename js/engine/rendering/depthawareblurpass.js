class DepthAwareBlurPass extends SubPass
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

            uniform sampler2D InputTexture;
            uniform sampler2D InputDepth;

            #define DEPTH_CUTOFF 0.001
            #define AWARENESS_RANGE 0.1
            
            uniform float OffsetScale;
            uniform int Horizontal;
            float weight[5] = float[] (0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
            in vec2 frag_uvs;
            out vec4 out_colour;
            void main()
            {
                vec2 offset = (1.0 / vec2(textureSize(InputTexture, 0))) * OffsetScale;

                vec3 thisPixel = texture(InputTexture, frag_uvs).rgb;

                vec3 result = thisPixel * weight[0];

                float currentDepth = texture(InputDepth, frag_uvs).r;

                if (Horizontal == 0)
                {
                    for (int i = 1; i < 5; ++i)
                    {
                        {
                            vec3 samp = texture(InputTexture, frag_uvs + vec2(offset.x * float(i), 0.0)).rgb * weight[i];
                            float depth = texture(InputDepth, frag_uvs + vec2(offset.x * float(i), 0.0)).r;
                            if (currentDepth > AWARENESS_RANGE || abs(currentDepth - depth) < DEPTH_CUTOFF)
                            {
                                result += samp;
                            }
                            else
                            {
                                result += thisPixel * weight[i];
                            }
                        }

                        {
                            vec3 samp = texture(InputTexture, frag_uvs - vec2(offset.x * float(i), 0.0)).rgb * weight[i];
                            float depth = texture(InputDepth, frag_uvs - vec2(offset.x * float(i), 0.0)).r;
                            if (currentDepth > AWARENESS_RANGE || abs(currentDepth - depth) < DEPTH_CUTOFF)
                            {
                                result += samp;
                            }
                            else
                            {
                                result += thisPixel * weight[i];
                            }
                        }
                    }
                }
                else
                {
                    for (int i = 1; i < 5; ++i)
                    {
                        {
                            vec3 samp = texture(InputTexture, frag_uvs + vec2(0.0, offset.y * float(i))).rgb * weight[i];
                            float depth = texture(InputDepth, frag_uvs + vec2(0.0, offset.y * float(i))).r;
                            if (currentDepth > AWARENESS_RANGE || abs(currentDepth - depth) < DEPTH_CUTOFF)
                            {
                                result += samp;
                            }
                            else
                            {
                                result += thisPixel * weight[i];
                            }
                        }

                        {
                            vec3 samp = texture(InputTexture, frag_uvs - vec2(0.0, offset.y * float(i))).rgb * weight[i];
                            float depth = texture(InputDepth, frag_uvs - vec2(0.0, offset.y * float(i))).r;
                            if (currentDepth > AWARENESS_RANGE || abs(currentDepth - depth) < DEPTH_CUTOFF)
                            {
                                result += samp;
                            }
                            else
                            {
                                result += thisPixel * weight[i];
                            }
                        }
                    }
                }

                out_colour = vec4(result, 1.0);
            }`

        super(context, width, height, VertexSource, FragmentSource)

        this.intermediate = createColourTexture(this.gl, this.width, this.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE)    
        this.intermediateFramebuffer = createFramebuffer(this.gl, [this.gl.COLOR_ATTACHMENT0], [this.intermediate] )

        this.output = createColourTexture(this.gl, this.width, this.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE)
        this.outputFramebuffer = createFramebuffer(this.gl, [this.gl.COLOR_ATTACHMENT0], [ this.output ])
    }

    Render(renderer, ScreenPrimitive, inTexture, inDepth, amount)
    {

        this.gl.viewport(0, 0, this.width, this.height);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.intermediateFramebuffer);

        this.gl.useProgram(this.ShaderProgram)

        this.gl.clearColor(0.0, 0.0, 0.0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);   

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inTexture);
        this.gl.uniform1i(this.uniforms.get("InputTexture").location, 0);

        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inDepth);
        this.gl.uniform1i(this.uniforms.get("InputDepth").location, 1);

        this.gl.uniform1f(this.uniforms.get("OffsetScale").location, amount);
        this.gl.uniform1i(this.uniforms.get("Horizontal").location, 0);

        renderer.GeometryPool.get(ScreenPrimitive.geometry).draw()

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.outputFramebuffer);

        this.gl.clearColor(0.0, 0.0, 0.0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);   

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.intermediate);
        this.gl.uniform1i(this.uniforms.get("InputTexture").location, 0);

        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inDepth);
        this.gl.uniform1i(this.uniforms.get("InputDepth").location, 1);

        this.gl.uniform1f(this.uniforms.get("OffsetScale").location, amount);
        this.gl.uniform1i(this.uniforms.get("Horizontal").location, 1);

        renderer.GeometryPool.get(ScreenPrimitive.geometry).draw()
    }
}