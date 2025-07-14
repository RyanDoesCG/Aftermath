class DirectionalLightPass extends RenderPass
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
            uniform sampler2D AlbedoTexture;
            uniform sampler2D NormalTexture;
            uniform sampler2D PositionTexture;
            uniform sampler2D BlueNoise;
            uniform sampler2D IDTexture;
            uniform float     Time;

            uniform vec3 CameraPosition;

            uniform sampler2D DirectionalShadowTexture;
            uniform vec3      DirectionalLightDirection;
            uniform mat4      DirectionalLightProjection;
            uniform mat4      DirectionalLightView;
            uniform float     DirectionalShadowBiasMin;    // #expose min=-0.001 max=0.0002  step=0.0001 default=0.00005
            uniform float     DirectionalShadowBiasFactor; // #expose min=-0.001 max=0.0001  step=0.0001 default=-0.0001
            uniform float     DirectionalShadowSoftness;   // #expose min=0.0  max=2.0 step=0.01    default=0.000

            uniform float BounceLightHardness; // #expose min=0.0 max=10.0  step=0.0001 default=1.0

            uniform float DebugLighting; // #expose min=0.0 max=1.0 step=1.0 default=0.0
            
            #define FOG_COLOUR vec3(0.5, 0.5, 0.5)

            in vec2 frag_uvs;
            
            layout (location = 0) out vec4 out_colour;

            float seed = 0.0;
            float random ()
            {
                seed += 0.01;
                return -1.0 + texture(BlueNoise, (frag_uvs.xy + vec2(seed, seed))).x * 2.0;
            }

            float DirectionalShadowmapLookup (vec4 position, vec4 normal)
            {
                vec4 fragPosLightSpace = DirectionalLightProjection * DirectionalLightView * (vec4(position.xyz, 1.0));
                vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
                projCoords = projCoords * 0.5 + 0.5;

                vec2 shadowUV = projCoords.xy;
                if (shadowUV.y > 0.9) return 1.0;
                
                float closestDepth = texture(DirectionalShadowTexture, shadowUV).r; 
                float currentDepth = projCoords.z;

                float bias = max(DirectionalShadowBiasFactor * (1.0 - dot(normal.xyz, DirectionalLightDirection)), DirectionalShadowBiasMin);  
                float shadow = currentDepth - bias > closestDepth  ? 0.0 : 1.0;
                return shadow;
                
            } 

            float getDirectionalDiffuse (vec3 n, vec3 p)
            {
                vec3  l = normalize(-DirectionalLightDirection);
                float s = DirectionalShadowmapLookup(vec4(p.xyz, 1.0) + vec4(random(), random(), random(), 0.0) * DirectionalShadowSoftness, vec4(n.xyz, 1.0));

                return max(0.0, dot(l, n) * BounceLightHardness + 1.0 - BounceLightHardness) * s;
            }

            float getDirectionalSpecular (vec3 n, vec3 p)
            {
                vec3 l = normalize(-DirectionalLightDirection);
                vec3 v = normalize(CameraPosition.xyz - p.xyz);
                vec3 h = normalize(l + v);
                return pow(max(dot(n, h), 0.0), 16.0);
            }

            void main ()
            {
                vec4 Albedo = texture(AlbedoTexture, frag_uvs);
                if (DebugLighting == 1.0 && Albedo.a == 0.0)
                {
                    Albedo = vec4(0.5, 0.5, 0.5, 0.0);
                }
                vec4 Normal = vec4(-1.0) + texture(NormalTexture, frag_uvs) * 2.0;
                vec4 Position = texture(PositionTexture, frag_uvs);
                vec4 Lighting = texture(IDTexture, frag_uvs);


                vec3 n = Normal.xyz;
                vec3 p = Position.xyz;

                vec3 ambient = vec3(0.1);
                vec3 diffuse = vec3(getDirectionalDiffuse(n, p) * Lighting.y);
                vec3 specular = vec3(getDirectionalSpecular(n, p) * Lighting.z);

                vec3 light = ambient + diffuse + specular;

                out_colour = vec4(Albedo.xyz + light, Albedo.a);
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
        scene, 
        view, 
        framebuffer, 
        inAlbedoTexture, 
        inNormalTexture, 
        inPositionTexture, 
        inBlueNoise,
        inDirectionalShadows,
        inID,
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

        this.gl.uniform1i(this.uniforms.get("AlbedoTexture").location, 0);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inAlbedoTexture);

        this.gl.uniform1i(this.uniforms.get("NormalTexture").location, 1);
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inNormalTexture);

        this.gl.uniform1i(this.uniforms.get("PositionTexture").location, 2);
        this.gl.activeTexture(this.gl.TEXTURE2);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inPositionTexture);

        this.gl.uniform1i(this.uniforms.get("BlueNoise").location, 3);
        this.gl.activeTexture(this.gl.TEXTURE3);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inBlueNoise);

        this.gl.uniform1i(this.uniforms.get("IDTexture").location, 4);
        this.gl.activeTexture(this.gl.TEXTURE4);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inID);

        const directional = scene.getDirectionalLight()
        if (directional)
        {
            this.gl.uniform1i(this.uniforms.get("DirectionalShadowTexture").location, 5);
            this.gl.activeTexture(this.gl.TEXTURE5);
            this.gl.bindTexture(this.gl.TEXTURE_2D, inDirectionalShadows);

            this.gl.uniform3fv(this.uniforms.get("DirectionalLightDirection").location, [directional.view.forward[0], directional.view.forward[1], directional.view.forward[2]])
            this.gl.uniformMatrix4fv(this.uniforms.get("DirectionalLightProjection").location, false, directional.projection)
            this.gl.uniformMatrix4fv(this.uniforms.get("DirectionalLightView").location, false, directional.view.worldToView)
        }

        this.gl.uniform3fv(this.uniforms.get("CameraPosition").location, view.position)

        this.gl.uniform1f(this.uniforms.get("DirectionalShadowBiasMin").location, this.uniforms.get("DirectionalShadowBiasMin").value)
        this.gl.uniform1f(this.uniforms.get("DirectionalShadowBiasFactor").location, this.uniforms.get("DirectionalShadowBiasFactor").value)
        this.gl.uniform1f(this.uniforms.get("DirectionalShadowSoftness").location, this.uniforms.get("DirectionalShadowSoftness").value)

        this.gl.uniform1f(this.uniforms.get("BounceLightHardness").location, this.uniforms.get("BounceLightHardness").value)
        this.gl.uniform1f(this.uniforms.get("DebugLighting").location, this.uniforms.get("DebugLighting").value)

        renderer.GeometryPool.get(ScreenPrimitive.geometry).draw()
    }
}