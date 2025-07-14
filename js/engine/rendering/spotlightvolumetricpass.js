class SpotLightVolumetricPass extends RenderPass
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
            uniform mat4 CameraProj;
            uniform mat4 CameraView;

            uniform vec3      SpotLightPosition      ;
            uniform vec4      SpotLightDirection     ;
            uniform vec3      SpotLightColor         ;
            uniform float     SpotLightRange         ;
            uniform float     SpotLightIntensity     ;
            uniform float     SpotLightAngle         ;
            uniform mat4      SpotLightProjection    ;
            uniform mat4      SpotLightView          ;
            uniform sampler2D SpotLightShadowTexture ;

            uniform sampler2D WorldPositionBuffer;
            uniform sampler2D FrontFaceBuffer;
            uniform sampler2D BackFaceBuffer;

            uniform float SpotShadowBiasMin;    // #expose min=-0.001 max=0.0011  step=0.00001 default=0.00011
            uniform float SpotShadowBiasFactor; // #expose min=-0.1 max=0.1  step=0.00001 default=-0.00219
            uniform float SpotShadowSoftness;   // #expose min=0.0  max=2.0 step=0.01    default=0.00

            uniform float DebugLighting; // #expose min=0.0 max=1.0 step=1.0 default=0.0

            in vec2 frag_uvs;
            
            layout (location = 0) out vec4 out_colour;

            float seed = 0.0;
            float random (vec2 uvs)
            {
                seed += 0.01;
                return -0.5 + texture(BlueNoise, (uvs * 4.0 + vec2(seed, seed))).r * 2.0;
            }

            float SpotlightShadowmapLookup (vec4 position)
            {
                vec4 fragPosLightSpace = SpotLightProjection * SpotLightView * (vec4(position.xyz, 1.0));
                vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
                projCoords = projCoords * 0.5 + 0.5;

                vec2 shadowUV = projCoords.xy;
                
                float closestDepth = texture(SpotLightShadowTexture, shadowUV).r; 
                float currentDepth = projCoords.z;

                float shadow = currentDepth > closestDepth  ? 0.0 : 1.0;

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

                return clamp(shadow, 0.0, 1.0) * (clamp(a + b, 0.0, 1.0));
                
            } 

            float worldDepthFromBuffer (float depth) 
            {
                vec2 uvs = gl_FragCoord.xy / vec2(width, height);
                float z = depth * 2.0 - 1.0;
                vec4 clipSpacePosition = vec4(uvs * 2.0 - 1.0, z, 1.0);
                vec4 viewSpacePosition = inverse(CameraProj) * clipSpacePosition;
                viewSpacePosition /= viewSpacePosition.w;
                vec4 worldSpacePosition = inverse(CameraView) * viewSpacePosition;
            
                return length(worldSpacePosition.xyz - CameraPosition.xyz);
            }

            void main ()
            {
                vec2 uvs = gl_FragCoord.xy / vec2(width, height);

                float FrontT = worldDepthFromBuffer(texture(FrontFaceBuffer, uvs).r);
                float BackT = worldDepthFromBuffer(texture(BackFaceBuffer, uvs).r);

                if (FrontT > BackT)
                {
                    FrontT = 0.0; 
                }

                vec3 position = texture(WorldPositionBuffer, uvs).xyz;
                vec3 direction = normalize(position.xyz - CameraPosition);

                float OpaqueT = length(position.xyz - CameraPosition.xyz);
                if (OpaqueT < FrontT)
                {
                    return;
                }

                vec3 result = vec3(0.0, 0.0, 0.0);

                float step = 0.05;

                FrontT += random(uvs);

                for (float t = FrontT; t < BackT; t += step)
                {
                    vec3 p = CameraPosition + direction * t;

                    if (OpaqueT < t)
                    {
                        break;
                    }

                    vec3  l = normalize(p.xyz - SpotLightPosition.xyz);
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

                    float d = 1.0 - (clamp(length(p - SpotLightPosition), 0.0, SpotLightRange) / SpotLightRange);

                    result += SpotlightShadowmapLookup(vec4(p, 1.0)) * 0.005 * (a + b) * d;
                }

                out_colour = vec4(result * SpotLightColor, 0.5);
               
            }`

        super(context, width / 2.0, height / 2.0, VertexSource, FragmentSource)

        this.front = createDepthTexture(this.gl, this.width, this.height)
        this.frontFramebuffer =  createFramebuffer(this.gl, 
            [ this.gl.DEPTH_ATTACHMENT ], 
            [ this.front ])

        this.back = createDepthTexture(this.gl, this.width, this.height)
        this.backFramebuffer = createFramebuffer(this.gl,
            [ this.gl.DEPTH_ATTACHMENT ],
            [ this.back ])

        this.output = createColourTexture(this.gl,
            this.width,
            this.height,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE)
        // Add base pass depth buffer here to avoid artefacts
        this.framebuffer = createFramebuffer(this.gl,
            [ this.gl.COLOR_ATTACHMENT0 ],
            [ this.output ])

        // Needed for shadow pass shader
        this.material = new OpaqueMaterial(this.gl, [0.0, 0.0, 0.0], 0, 0, `
            vec4 getMaterialAlbedo () 
            { 
                return vec4(0.0, 0.0, 0.0, 0.0);
            }`,`
            vec3  getMaterialNormal()
            {
                return frag_normal;
            }`,`
            uniform vec3 translate;
            uniform vec3 scl;
            vec3 getMaterialLPO()
            {
                vec3 sc = vertex_position * (scl - 1.0);
                return sc + translate;
            }`)

    }

    Render (
        renderer, 
        scene, 
        view, 
        inPositionTexture, 
        inBlueNoise,
        inSpotLightShadows)
    {

        this.gl.viewport(0, 0, this.width, this.height);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);

        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);


        const spots = scene.getSpotLights(vec3(view.position[0],view.position[1],view.position[2]))
        const MAX_SPOT_LIGHTS = 5
        if (spots.length > 0)
        {
            for (var i = 0; i < Math.min(spots.length, MAX_SPOT_LIGHTS); ++i)
            {
                if (spots[i].intensity == 0.0)
                {
                    continue;
                }
                
                {
                    // Render Front Face Buffer
                    this.gl.viewport(0, 0, this.width, this.height);
                    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frontFramebuffer);

                    this.gl.clearDepth(100.0);
                    this.gl.clear(this.gl.DEPTH_BUFFER_BIT);

                    this.gl.enable(this.gl.DEPTH_TEST)
                    this.gl.enable(this.gl.CULL_FACE)
                    this.gl.cullFace(this.gl.BACK);

                    this.gl.useProgram       (this.material.ShadowPassShaderProgram);
                    this.gl.uniform1i        (this.material.ShadowPassUniforms.get("ID").location, 0)
                    this.gl.uniformMatrix4fv (this.material.ShadowPassUniforms.get("Projection").location, false, view.projectionNoJitter)
                    this.gl.uniformMatrix4fv (this.material.ShadowPassUniforms.get("View").location, false, view.worldToView)
                    this.gl.uniform1f        (this.material.ShadowPassUniforms.get("Time").location, renderer.frameID)

                    this.gl.uniformMatrix4fv (this.material.ShadowPassUniforms.get("transform").location, false, spots[i].transform.matrix())
                    this.gl.uniform3fv       (this.material.ShadowPassUniforms.get("translate").location, [0.0, 0.0, -spots[i].range / 2.0] )
                    this.gl.uniform3fv       (this.material.ShadowPassUniforms.get("scl").location, [3.0, 3.0, spots[i].range / 2.0] )

                    renderer.GeometryPool.get("Box").draw()

                    this.gl.disable(this.gl.DEPTH_TEST)
                    this.gl.disable(this.gl.CULL_FACE)
                }

                {
                    // Render Back Face Buffer
                    this.gl.viewport(0, 0, this.width, this.height);
                    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.backFramebuffer);

                    this.gl.clearDepth(100.0);
                    this.gl.clear(this.gl.DEPTH_BUFFER_BIT);

                    this.gl.enable(this.gl.DEPTH_TEST)
                    this.gl.enable(this.gl.CULL_FACE)
                    this.gl.cullFace(this.gl.FRONT);

                    this.gl.useProgram       (this.material.ShadowPassShaderProgram);
                    this.gl.uniform1i        (this.material.ShadowPassUniforms.get("ID").location, 0)
                    this.gl.uniformMatrix4fv (this.material.ShadowPassUniforms.get("Projection").location, false, view.projectionNoJitter)
                    this.gl.uniformMatrix4fv (this.material.ShadowPassUniforms.get("View").location, false, view.worldToView)
                    this.gl.uniform1f        (this.material.ShadowPassUniforms.get("Time").location, renderer.frameID)
                    
                    this.gl.uniformMatrix4fv (this.material.ShadowPassUniforms.get("transform").location, false, spots[i].transform.matrix())
                    this.gl.uniform3fv       (this.material.ShadowPassUniforms.get("translate").location, [0.0, 0.0, -spots[i].range / 2.0] )
                    this.gl.uniform3fv       (this.material.ShadowPassUniforms.get("scl").location, [3.0, 3.0, spots[i].range / 2.0] )

                    renderer.GeometryPool.get("Box").draw()

                    this.gl.disable(this.gl.DEPTH_TEST)
                    this.gl.disable(this.gl.CULL_FACE)
                }

                {
                    // Render Output
                    this.gl.viewport(0, 0, this.width, this.height);
                    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);

                    this.gl.enable(this.gl.BLEND);
                    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
                    this.gl.blendEquation(this.gl.FUNC_ADD);

                    this.gl.enable(this.gl.CULL_FACE)
                    this.gl.cullFace(this.gl.FRONT);

                    this.gl.useProgram(this.ShaderProgram);

                    this.gl.uniformMatrix4fv (this.uniforms.get("proj").location, false, view.projection)
                    this.gl.uniformMatrix4fv (this.uniforms.get("view").location, false, view.worldToView)

                    this.gl.uniform1f(this.uniforms.get("width").location, this.width)
                    this.gl.uniform1f(this.uniforms.get("height").location, this.height)

                    this.gl.uniform3fv(this.uniforms.get("CameraPosition").location, [view.position[0], view.position[1], view.position[2]])
    
                    this.gl.uniformMatrix4fv (this.uniforms.get("CameraProj").location, false, view.projection)
                    this.gl.uniformMatrix4fv (this.uniforms.get("CameraView").location, false, view.worldToView)

                    this.gl.uniform1i(this.uniforms.get("FrontFaceBuffer").location, 0);
                    this.gl.activeTexture(this.gl.TEXTURE0);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, this.front);
            
                    this.gl.uniform1i(this.uniforms.get("BackFaceBuffer").location, 1);
                    this.gl.activeTexture(this.gl.TEXTURE1);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, this.back);

                    this.gl.uniform1i(this.uniforms.get("WorldPositionBuffer").location, 2);
                    this.gl.activeTexture(this.gl.TEXTURE2);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, inPositionTexture);

                    this.gl.uniform1i(this.uniforms.get("BlueNoise").location, 3);
                    this.gl.activeTexture(this.gl.TEXTURE3);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, inBlueNoise);

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
                    this.gl.uniform3fv(this.uniforms.get("translate").location, [0.0, 0.0, -spots[i].range / 2.0] )
                    this.gl.uniform3fv(this.uniforms.get("scale").location, [3.0, 3.0, spots[i].range / 2.0] )
                    renderer.GeometryPool.get("Box").draw()

                    this.gl.disable(this.gl.BLEND)
                }
            }
        }
    }
}