class VolumetricsPass extends RenderPass
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

            uniform float Brightness;  // #expose min=0.0 max=4.0 step=0.01 default=1.0

            uniform sampler2D Noise;
            uniform sampler2D Scene;
            uniform sampler2D WorldPositionBuffer;
            uniform vec3 CameraPosition;
            uniform float Time;

            uniform sampler2D DirectionalShadowMap;
            uniform vec3 DirectionalLightDirection;
            uniform mat4 DirectionalLightProjection;
            uniform mat4 DirectionalLightView;

            #define MAX_SPOT_LIGHTS 5
            uniform vec3      SpotLightPositions[MAX_SPOT_LIGHTS];
            uniform vec4      SpotLightDirections[MAX_SPOT_LIGHTS];
            uniform vec3      SpotLightColors[MAX_SPOT_LIGHTS];
            uniform float     SpotLightRanges[MAX_SPOT_LIGHTS];
            uniform float     SpotLightIntensities[MAX_SPOT_LIGHTS];
            uniform float     SpotLightAngles[MAX_SPOT_LIGHTS];
            uniform mat4      SpotLightProjections[MAX_SPOT_LIGHTS];
            uniform mat4      SpotLightViews[MAX_SPOT_LIGHTS];
            uniform sampler2D SpotLightShadowTextures[MAX_SPOT_LIGHTS];

            in vec2 frag_uvs;

            out vec4 out_colour;

            float DirectionalShadowmapLookup (vec4 position)
            {
                vec4 fragPosLightSpace = DirectionalLightProjection * DirectionalLightView * (vec4(position.xyz, 1.0));
                vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
                projCoords = projCoords * 0.5 + 0.5;

                vec2 shadowUV = projCoords.xy;
                
                float closestDepth = texture(DirectionalShadowMap, shadowUV).r; 
                float currentDepth = projCoords.z;

                float shadow = currentDepth > closestDepth  ? 0.0 : 1.0;
                return shadow;  
            } 

            float SpotShadowmapLookup (vec4 position, int light)
            {
                vec4 fragPosLightSpace = SpotLightProjections[light] * SpotLightViews[light] * (vec4(position.xyz, 1.0));
                vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
                projCoords = projCoords * 0.5 + 0.5;

                vec2 shadowUV = projCoords.xy;
                
                float closestDepth = 1000.0;
                if (light == 0)
                {
                    closestDepth = texture(SpotLightShadowTextures[0], shadowUV).r; 
                }

                if (light == 1)
                {
                    closestDepth = texture(SpotLightShadowTextures[1], shadowUV).r; 
                }

                if (light == 2)
                {
                    closestDepth = texture(SpotLightShadowTextures[2], shadowUV).r; 
                }

                if (light == 3)
                {
                    closestDepth = texture(SpotLightShadowTextures[3], shadowUV).r; 
                }

                if (light == 4)
                {
                    closestDepth = texture(SpotLightShadowTextures[4], shadowUV).r; 
                }

                float currentDepth = projCoords.z;

                float shadow = currentDepth > closestDepth  ? 0.0 : 1.0;

                vec3  l = normalize(position.xyz - SpotLightPositions[light].xyz);
                float a = dot(SpotLightDirections[light].xyz, l) * 1.0;
                float b = pow(a, 16.0) * 2.0;
                if (a < 0.0)
                {
                    a = 0.0; 
                    b = 0.0;
                }
                if (a < SpotLightAngles[0]) 
                {
                    a = 0.0;
                }

                return clamp(shadow, 0.0, 1.0) * (clamp(a + b, 0.0, 1.0));
            }

            void main ()
            {
                vec4 Frame = texture(Scene, frag_uvs);
                vec4 position = texture(WorldPositionBuffer, frag_uvs);
                vec4 Scattering = vec4(0.2, 0.0, 0.0, 0.0);

                float t = position.w;
                vec4 s = vec4(0.0);

                const float maximum = 32.0;
                const float samples = 64.0;
                float step = min(maximum, t) / samples;

                float dither = (-0.5 + texture(Noise, frag_uvs * 10.0).r * 2.0) * 2.0;

                vec3 origin = CameraPosition.xyz;
                vec3 direction = normalize(position.xyz - CameraPosition.xyz);

                origin += direction * dither;

                for (float rayT = 0.0; rayT < min(maximum, t); rayT += step)
                {
                    vec4 pos = vec4((origin + direction * rayT), 1.0);
                    vec4 shadow = vec4(0.0);
                    
                    shadow += DirectionalShadowmapLookup(pos) * 0.01;
                    
                    for (int i = 0; i < MAX_SPOT_LIGHTS; ++i)
                    {
                        float d = clamp(length(SpotLightPositions[i] - pos.xyz), 0.0, SpotLightRanges[i]) / SpotLightRanges[i];
                        shadow += vec4(SpotShadowmapLookup(pos, i)) * vec4(SpotLightColors[i], 1.0) * SpotLightIntensities[i]
                            * 1.0 ;//* (1.0 - d);
                    }

                    s += clamp(shadow, vec4(0.0), vec4(1.0));
                }
                s /= samples;

                out_colour = clamp(s, 0.0, 1.0) * Brightness;
                out_colour.a = 0.0;
            }`

        super(context, width / 4.0, height / 4.0, VertexSource, FragmentSource)

        this.output = createColourTexture(this.gl, this.width, this.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE)
        this.framebuffer = createFramebuffer(this.gl, [ this.gl.COLOR_ATTACHMENT0 ], [ this.output ])
    }
    
    Render(renderer, ScreenPrimitive, inNoise, inSceneTexture, inPositionTexture, inDirectionalShadows, inSpotLightShadows, toScreen)
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

        this.gl.uniform1f        (this.uniforms.get("Time").location, renderer.frameID)
        this.gl.uniform1f(this.uniforms.get("Brightness").location, this.uniforms.get("Brightness").value)

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inSceneTexture);
        this.gl.uniform1i(this.uniforms.get("Scene").location, 0);

        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inPositionTexture);
        this.gl.uniform1i(this.uniforms.get("WorldPositionBuffer").location, 1);

        this.gl.activeTexture(this.gl.TEXTURE2);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inNoise);
        this.gl.uniform1i(this.uniforms.get("Noise").location, 2);

        const directional = renderer.engine.scene.getDirectionalLight()
        if (directional)
        {
            this.gl.uniform1i(this.uniforms.get("DirectionalShadowMap").location, 3);
            this.gl.activeTexture(this.gl.TEXTURE3);
            this.gl.bindTexture(this.gl.TEXTURE_2D, inDirectionalShadows);

            this.gl.uniform3fv(this.uniforms.get("DirectionalLightDirection").location, [directional.view.forward[0], directional.view.forward[1], directional.view.forward[2]])
            this.gl.uniformMatrix4fv(this.uniforms.get("DirectionalLightProjection").location, false, directional.projection)
            this.gl.uniformMatrix4fv(this.uniforms.get("DirectionalLightView").location, false, directional.view.worldToView)
        }

        const spots = renderer.engine.scene.getSpotLights(vec3(renderer.view.position[0], renderer.view.position[1], renderer.view.position[2]))
        const MAX_SPOT_LIGHTS = 5
        if (spots.length > 0)
        {
            var positions   = []
            var directions  = []
            var colors      = []
            var ranges      = []
            var intensities = []
            var angles      = []
            var projections = []
            var views       = []
            var textures    = []

            var glTexIndex = 6
            for (var i = 0; i < Math.min(spots.length, MAX_SPOT_LIGHTS); ++i)
            {
                positions.push   (...spots[i].transform.getWorldPosition())
                directions.push  (...spots[i].view.forward)
                colors.push      (...spots[i].color)
                ranges.push      (spots[i].range)
                intensities.push (spots[i].intensity)
                angles.push      (spots[i].angle)
                projections.push (...spots[i].projection)
                views.push       (...spots[i].view.worldToView)
                textures.push    (glTexIndex++);
            }

            //log(textures)

            this.gl.uniform3fv(this.uniforms.get("SpotLightPositions").location, positions) 
            this.gl.uniform4fv(this.uniforms.get("SpotLightDirections").location, directions) 
            this.gl.uniform3fv(this.uniforms.get("SpotLightColors").location, colors) 
            this.gl.uniform1fv(this.uniforms.get("SpotLightRanges").location, ranges)
            this.gl.uniform1fv(this.uniforms.get("SpotLightIntensities").location, intensities)
            this.gl.uniform1fv(this.uniforms.get("SpotLightAngles").location, angles)
            
            this.gl.uniformMatrix4fv(this.uniforms.get("SpotLightProjections").location, false, projections, 0, projections.length)
            this.gl.uniformMatrix4fv(this.uniforms.get("SpotLightViews").location, false, views, 0, views.length)

            for (var i = 0; i < Math.min(spots.length, MAX_SPOT_LIGHTS); ++i)
            {

                this.gl.activeTexture(getTextureEnum(this.gl, textures[i]))
                this.gl.bindTexture(this.gl.TEXTURE_2D, inSpotLightShadows[i])
            }

            this.gl.uniform1iv(this.uniforms.get("SpotLightShadowTextures").location, textures)
        }


        this.gl.uniform3fv(this.uniforms.get("CameraPosition").location, 
            [renderer.view.position[0], renderer.view.position[1], renderer.view.position[2]])


        renderer.GeometryPool.get(ScreenPrimitive.geometry).draw()
    }
}