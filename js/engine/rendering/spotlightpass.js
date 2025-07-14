class SpotLightPass extends RenderPass
{
    constructor(context, width, height)
    {
        const VertexSource = 
           `#version 300 es
            precision lowp float;

            uniform mat4  proj;
            uniform mat4  view;
            uniform mat4  transform;

            uniform vec3 translate;
            uniform vec3 scale;

            in vec3 vertex_position;
            in vec3 vertex_normal;
            in vec2 vertex_uvs;

            out vec2 frag_uvs;

            void main() 
            {
                gl_Position = proj * view * transform * vec4(vertex_position * scale + translate , 1.0);
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

            uniform float width;
            uniform float height;

            uniform vec3 CameraPosition;

            uniform vec3      SpotLightPosition      ;
            uniform vec4      SpotLightDirection     ;
            uniform vec3      SpotLightColor         ;
            uniform float     SpotLightRange         ;
            uniform float     SpotLightIntensity     ;
            uniform float     SpotLightAngle         ;
            uniform mat4      SpotLightProjection    ;
            uniform mat4      SpotLightView          ;
            uniform sampler2D SpotLightShadowTexture ;

            uniform float SpotShadowBiasMin;    // #expose min=-0.001 max=0.0011  step=0.00001 default=0.00011
            uniform float SpotShadowBiasFactor; // #expose min=-0.1 max=0.1  step=0.00001 default=-0.00219
            uniform float SpotShadowSoftness;   // #expose min=0.0  max=2.0 step=0.01    default=0.00

            uniform float DebugLighting; // #expose min=0.0 max=1.0 step=1.0 default=0.0

            in vec2 frag_uvs;
            
            layout (location = 0) out vec4 out_colour;

            float seed = 0.0;
            float random ()
            {
                seed += 0.01;
                return -1.0 + texture(BlueNoise, (frag_uvs.xy + vec2(seed, seed))).x * 2.0;
            }

            float SpotlightShadowmapLookup (vec4 position, vec4 normal)
            {
                vec4 fragPosLightSpace = SpotLightProjection * SpotLightView * (vec4(position.xyz, 1.0));
                vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
                projCoords = projCoords * 0.5 + 0.5;

                vec2 shadowUV = projCoords.xy;
                
                float closestDepth = texture(SpotLightShadowTexture, shadowUV).r; 
                float currentDepth = projCoords.z;

                float bias = max(SpotShadowBiasFactor * (1.0 - dot(normal.xyz, SpotLightDirection.xyz)), SpotShadowBiasMin);  
                float shadow = currentDepth - bias > closestDepth  ? 0.0 : 1.0;

                vec3  l = normalize(position.xyz - SpotLightPosition.xyz);
                float a = dot(SpotLightDirection.xyz, l) * 1.0;
                float b = pow(a, 16.0) * 2.0;
                if (a < 0.0)
                {
                    a = 0.0; 
                    b = 0.0;
                }
                if (a < SpotLightAngle) 
                {
                    a = 0.0;
                }

                return clamp(shadow, 0.314, 1.0) * (clamp(a + b, 0.0, 1.0));
                
            } 

            vec3 getSpotLightDiffuse (vec3 n, vec3 p)
            {
                vec3 result = vec3(0.0);


                vec3  l = normalize(SpotLightPosition - p);
                float d = 1.0 - (clamp(length(p - SpotLightPosition), 0.0, SpotLightRange) / SpotLightRange);
                float a = dot(SpotLightDirection.xyz, l) * 1.0;
                float b = pow(a, 16.0) * 2.0;
                float s = SpotlightShadowmapLookup(vec4(p.xyz, 1.0) + vec4(random(), random(), random(), 0.0) * SpotShadowSoftness, vec4(n.xyz, 1.0));
                result += max(0.0, dot(n, l) * (a + b) * d) * SpotLightIntensity * SpotLightColor * s;
        

                return result;
            }

            vec3 getSpotLightSpecular (vec3 n, vec3 p)
            {
                return vec3(0.0, 0.0, 0.0);
            }

            void main ()
            {
                vec2 uvs = gl_FragCoord.xy / vec2(width, height);
                vec4 Normal = vec4(-1.0) + texture(NormalTexture, uvs) * 2.0;
                vec4 Position = texture(PositionTexture, uvs);
                vec4 Lighting = texture(IDTexture, uvs);

                vec3 n = Normal.xyz;
                vec3 p = Position.xyz;

                vec3 diffuse = getSpotLightDiffuse(n, p) * Lighting.y;
                vec3 specular = getSpotLightSpecular(n, p) * Lighting.z;

                vec3 light = diffuse + specular;
                
                out_colour = vec4(light, 0.5);
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
        scene, 
        view, 
        inAlbedoTexture, 
        inNormalTexture, 
        inPositionTexture, 
        inBlueNoise,
        inSpotLightShadows, 
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
        }

        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.gl.useProgram(this.ShaderProgram);

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
        this.gl.blendEquation(this.gl.FUNC_ADD);

        this.gl.enable(this.gl.CULL_FACE)
        this.gl.cullFace(this.gl.FRONT);

        this.gl.uniformMatrix4fv (this.uniforms.get("proj").location, false, view.projection)
        this.gl.uniformMatrix4fv (this.uniforms.get("view").location, false, view.worldToView)

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

        this.gl.uniform1f(this.uniforms.get("width").location, this.width)
        this.gl.uniform1f(this.uniforms.get("height").location, this.height)

        this.gl.uniform3fv(this.uniforms.get("CameraPosition").location, view.position)

        this.gl.uniform1f(this.uniforms.get("SpotShadowBiasMin").location, this.uniforms.get("SpotShadowBiasMin").value)
        this.gl.uniform1f(this.uniforms.get("SpotShadowBiasFactor").location, this.uniforms.get("SpotShadowBiasFactor").value)
        this.gl.uniform1f(this.uniforms.get("SpotShadowSoftness").location, this.uniforms.get("SpotShadowSoftness").value)

        this.gl.uniform1f(this.uniforms.get("DebugLighting").location, this.uniforms.get("DebugLighting").value)

        const spots = scene.getSpotLights(vec3(view.position[0],view.position[1],view.position[2]))
        const MAX_SPOT_LIGHTS = 5
        if (spots.length > 0)
        {
            for (var i = 0; i < Math.min(spots.length, MAX_SPOT_LIGHTS); ++i)
            {
                this.gl.uniform3fv(this.uniforms.get("SpotLightPosition").location, spots[i].transform.getWorldPosition()) 
                this.gl.uniform4fv(this.uniforms.get("SpotLightDirection").location, spots[i].view.forward) 
                this.gl.uniform3fv(this.uniforms.get("SpotLightColor").location, spots[i].color) 
                this.gl.uniform1f(this.uniforms.get("SpotLightRange").location, spots[i].range)
                this.gl.uniform1f(this.uniforms.get("SpotLightIntensity").location, spots[i].intensity)
                this.gl.uniform1f(this.uniforms.get("SpotLightAngle").location, spots[i].angle)
                
                this.gl.uniformMatrix4fv(this.uniforms.get("SpotLightProjection").location, false, spots[i].projection)
                this.gl.uniformMatrix4fv(this.uniforms.get("SpotLightView").location, false, spots[i].view.worldToView)

                this.gl.uniform1i(this.uniforms.get("SpotLightShadowTexture").location, 5)
                this.gl.activeTexture(this.gl.TEXTURE5);
                this.gl.bindTexture(this.gl.TEXTURE_2D, inSpotLightShadows[i])
                
                this.gl.uniformMatrix4fv (this.uniforms.get("transform").location, false, spots[i].transform.matrix())
                this.gl.uniform3fv(this.uniforms.get("translate").location, [0.0, 0.0, -spots[i].range] )
                this.gl.uniform3fv(this.uniforms.get("scale").location, [3.0, 3.0, spots[i].range] )
                renderer.GeometryPool.get("Box").draw()
            }
        }

        this.gl.disable(this.gl.DEPTH_TEST)
        this.gl.disable(this.gl.CULL_FACE)
        this.gl.disable(this.gl.BLEND)
    }
}