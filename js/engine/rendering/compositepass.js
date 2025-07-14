class CompositePass extends RenderPass
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

            uniform sampler2D A;
            uniform sampler2D B;

            in vec2 frag_uvs;

            out vec4 out_colour;

            void main ()
            {
                vec4 a = texture(A, frag_uvs);
                vec4 b = texture(B, frag_uvs);
                out_colour = mix(a, b, b.a);
            }`

        super(context, width, height, VertexSource, FragmentSource)

        this.output = createColourTexture(this.gl, this.width, this.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE)
        this.framebuffer = createFramebuffer(this.gl, [ this.gl.COLOR_ATTACHMENT0 ], [ this.output ])
    }
    
    Render(renderer, ScreenPrimitive, inTextureA, inTextureB, toScreen)
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
        this.gl.bindTexture(this.gl.TEXTURE_2D, inTextureA);
        this.gl.uniform1i(this.uniforms.get("A").location, 0);
        
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inTextureB);
        this.gl.uniform1i(this.uniforms.get("B").location, 1);

        renderer.GeometryPool.get(ScreenPrimitive.geometry).draw()
    }
}

class TransparencyCompositePass extends RenderPass
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

            uniform sampler2D A;
            uniform sampler2D B;

            in vec2 frag_uvs;

            out vec4 out_colour;

            void main ()
            {
                vec4 a = texture(A, frag_uvs);
                vec4 b = texture(B, frag_uvs);
                out_colour.xyz = mix(a.xyz, b.xyz, b.a);
                out_colour.a = a.a;
            }`

        super(context, width, height, VertexSource, FragmentSource)

        this.output = createColourTexture(this.gl, this.width, this.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE)
        this.framebuffer = createFramebuffer(this.gl, [ this.gl.COLOR_ATTACHMENT0 ], [ this.output ])
    }
    
    Render(renderer, ScreenPrimitive, inOpaque, inTransparent, toScreen)
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
        this.gl.bindTexture(this.gl.TEXTURE_2D, inOpaque);
        this.gl.uniform1i(this.uniforms.get("A").location, 0);
        
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inTransparent);
        this.gl.uniform1i(this.uniforms.get("B").location, 1);

        renderer.GeometryPool.get(ScreenPrimitive.geometry).draw()
    }
}

class VolumetricCompositePass extends RenderPass
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

            uniform sampler2D A;
            uniform sampler2D B;

            in vec2 frag_uvs;

            out vec4 out_colour;

            void main ()
            {
                vec4 a = texture(A, frag_uvs);
                vec4 b = texture(B, frag_uvs);
                out_colour = a + b;
            }`

        super(context, width, height, VertexSource, FragmentSource)

        this.output = createColourTexture(this.gl, this.width, this.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE)
        this.framebuffer = createFramebuffer(this.gl, [ this.gl.COLOR_ATTACHMENT0 ], [ this.output ])
    }
    
    Render(renderer, ScreenPrimitive, inTextureA, inTextureB, toScreen)
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
        this.gl.bindTexture(this.gl.TEXTURE_2D, inTextureA);
        this.gl.uniform1i(this.uniforms.get("A").location, 0);
        
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inTextureB);
        this.gl.uniform1i(this.uniforms.get("B").location, 1);

        renderer.GeometryPool.get(ScreenPrimitive.geometry).draw()
    }
}

class LightCompositePass extends RenderPass
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

            uniform sampler2D A; // Directional
            uniform sampler2D B; // Spot
            uniform sampler2D C; // Point
            uniform sampler2D D; // Spot Volumetric
            uniform sampler2D PositionTexture;
            uniform float FogColor;    // #expose min=0.0 max=1.0 step=0.01 default=0.3
            uniform float FogDistance; // #expose min=0.0  max=1000.0 step=1.0   default=43.0
            uniform float FogFalloff;  // #expose min=0.01 max=20.0   step=0.001 default=0.832
            uniform float FogMax;      // #expose min=0.0  max=1.0    step=0.01  default=1.0

            in vec2 frag_uvs;

            out vec4 out_colour;

            void main ()
            {
                vec4 a = texture(A, frag_uvs);
                vec4 b = texture(B, frag_uvs);
                vec4 c = texture(C, frag_uvs);
                vec4 d = texture(D, frag_uvs);
                out_colour.xyz = a.xyz + b.xyz + c.xyz ;
                out_colour.w = a.a;

                vec4 Position = texture(PositionTexture, frag_uvs);
                float fog = (Position.w > 0.0) ? Position.w : FogDistance;
                fog = clamp(0.0, FogDistance, fog) / FogDistance;
                fog = min(pow(fog, FogFalloff), FogMax);
                out_colour.xyz = mix(out_colour.xyz, vec3(FogColor), clamp(fog, 0.0, 1.0)); 

                out_colour.xyz += d.xyz;
            }`

        super(context, width, height, VertexSource, FragmentSource)
    }
    
    Render(renderer, ScreenPrimitive, framebuffer, inTextureA, inTextureB, inTextureC, inTextureD, inPositionTexture, toScreen)
    {
        if (toScreen)
        {
            this.gl.viewport(0, 0, this.width, this.height);
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        }
        else
        {
            this.gl.viewport(0, 0, this.width, this.height);
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
        }

        this.gl.clearColor(0.0, 0.0, 0.0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.useProgram(this.ShaderProgram);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inTextureA);
        this.gl.uniform1i(this.uniforms.get("A").location, 0);
        
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inTextureB);
        this.gl.uniform1i(this.uniforms.get("B").location, 1);

        this.gl.activeTexture(this.gl.TEXTURE2);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inTextureC);
        this.gl.uniform1i(this.uniforms.get("C").location, 2);
        
        this.gl.activeTexture(this.gl.TEXTURE3);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inTextureD);
        this.gl.uniform1i(this.uniforms.get("D").location, 3);

        this.gl.activeTexture(this.gl.TEXTURE4);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inPositionTexture);
        this.gl.uniform1i(this.uniforms.get("PositionTexture").location, 4);

        this.gl.uniform1f(this.uniforms.get("FogColor").location, this.uniforms.get("FogColor").value)
        this.gl.uniform1f(this.uniforms.get("FogDistance").location, this.uniforms.get("FogDistance").value)
        this.gl.uniform1f(this.uniforms.get("FogFalloff").location, this.uniforms.get("FogFalloff").value)
        this.gl.uniform1f(this.uniforms.get("FogMax").location, this.uniforms.get("FogMax").value)

        renderer.GeometryPool.get(ScreenPrimitive.geometry).draw()
    }
}
