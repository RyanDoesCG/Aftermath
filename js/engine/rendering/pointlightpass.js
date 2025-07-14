class PointLightPass extends RenderPass
{
    constructor(context, width, height)
    {
        const VertexSource = 
           `#version 300 es
            precision lowp float;
            
            uniform mat4  proj;
            uniform mat4  view;
            uniform mat4  transform;

            in vec3 vertex_position;
            in vec3 vertex_normal;
            in vec2 vertex_uvs;

            out vec2 frag_uvs;

            void main() 
            {
                gl_Position = proj * view * transform * vec4(vertex_position , 1.0);
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

            uniform float width;
            uniform float height;
            
            uniform float     Time;

            uniform vec3 CameraPosition;

            uniform vec3  PointLightPosition;
            uniform vec3  PointLightColor;
            uniform float PointLightRange;
            uniform float PointLightIntensity;

            uniform float DebugLighting; // #expose min=0.0 max=1.0 step=1.0 default=0.0

            in vec2 frag_uvs;
            
            layout (location = 0) out vec4 out_colour;

            vec3 getPointLightDiffuse (vec3 n, vec3 p)
            {
                vec3  l = normalize(PointLightPosition - p);
                float d = clamp(length(PointLightPosition - p), 0.0, PointLightRange) / PointLightRange;
                return max(0.0, dot(n, l) * (1.0 - d)) * PointLightIntensity * PointLightColor;
            }

            vec3 getPointLightSpecular (vec3 n, vec3 p)
            {
                vec3  l = normalize(p - PointLightPosition);
                float d = clamp(length(p - PointLightPosition), 0.0, PointLightRange) / PointLightRange;
                vec3  v = normalize(CameraPosition.xyz - p.xyz);
                vec3  h = normalize(l + v);
                return pow(max(dot(n, h), 0.0), 16.0) * PointLightColor;
            }

            void main ()
            {
                vec2 uvs = gl_FragCoord.xy / vec2(width, height);
                vec4 Normal = vec4(-1.0) + texture(NormalTexture, uvs) * 2.0;
                vec4 Position = texture(PositionTexture, uvs);
                vec4 Lighting = texture(IDTexture, uvs);

                vec3 n = Normal.xyz;
                vec3 p = Position.xyz;

                vec3 diffuse = getPointLightDiffuse(n, p) * Lighting.y;
                vec3 specular = getPointLightSpecular(n, p) * Lighting.z;

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

        this.gl.uniform3fv(this.uniforms.get("CameraPosition").location, view.position)

        this.gl.uniform1f(this.uniforms.get("DebugLighting").location, this.uniforms.get("DebugLighting").value)

        this.gl.uniform1f(this.uniforms.get("width").location, this.width)
        this.gl.uniform1f(this.uniforms.get("height").location, this.height)

        const points = scene.getPointLights(vec3(view.position[0],view.position[1],view.position[2]))
        const MAX_POINT_LIGHTS = 4
        if (points.length > 0)
        {
            for (var i = 0; i < Math.min(points.length, MAX_POINT_LIGHTS); ++i)
            {
                this.gl.uniform3fv(this.uniforms.get("PointLightPosition").location, points[i].transform.getWorldPosition()) 
                this.gl.uniform3fv(this.uniforms.get("PointLightColor").location, points[i].color) 
                this.gl.uniform1f(this.uniforms.get("PointLightRange").location, points[i].range)
                this.gl.uniform1f(this.uniforms.get("PointLightIntensity").location, points[i].intensity)
                this.gl.uniformMatrix4fv(this.uniforms.get("transform").location, false, points[i].transform.matrix())
                renderer.GeometryPool.get("Box").draw()
            }
        }

        this.gl.disable(this.gl.DEPTH_TEST)
        this.gl.disable(this.gl.CULL_FACE)
        this.gl.disable(this.gl.BLEND)
    }
}