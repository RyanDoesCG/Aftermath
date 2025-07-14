BLEND_MODE_OPAQUE = 0
BLEND_MODE_TRANSPARENT = 1

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
//  
// OPAQUE BASS PASS SHADERS
//
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
const BaseVertexSourceHead = 
   `#version 300 es
    precision lowp float;
    precision highp int;
    uniform mat4  proj;
    uniform mat4  view;
    uniform float Time;

    uniform vec4  Albedo;
    uniform vec4  Lighting;
    uniform mat4  transform[128];
    uniform vec3  scale[128];
    uniform int   ID[128];

    in vec3 vertex_position;
    in vec3 vertex_normal;
    in vec2 vertex_uv;
    
    out vec4 frag_localpos;
    out vec4 frag_worldpos;
    out vec3 frag_normal;
    out vec3 frag_worldnormal;
    out vec2 frag_uvs;
    
    out vec3 frag_scale;
    out float frag_id;
    `
const BaseVertexWorldPositionOffsetSourceMaterial =
    `vec3 getMaterialWPO ()
     {
         return vec3(0.0, 0.0, 0.0);
     }`
const BaseVertexLocalPositionOffsetSourceMaterial =
   `vec3 getMaterialLPO ()
    {
        return vec3(0.0, 0.0, 0.0);
    }`
const BaseVertexSourceFoot =
   `void main() 
    {
        frag_localpos = vec4(vertex_position.xyz, 1.0);
        frag_worldpos = transform[gl_InstanceID] * vec4(vertex_position.xyz + getMaterialLPO(), 1.0);
        frag_worldpos = vec4(frag_worldpos.xyz + getMaterialWPO(), 1.0);
        frag_normal = normalize((transform[gl_InstanceID] * vec4(vertex_normal.xyz, 0.0)).xyz);
        frag_worldnormal = vertex_normal.xyz;
        frag_uvs = vertex_uv;

        frag_scale = scale[gl_InstanceID];
        frag_id = float(ID[gl_InstanceID]);

        gl_Position = proj * view * frag_worldpos;
    }`
const BaseFragmentSourceHead = 
   `#version 300 es
    precision lowp float;
    precision highp int;
    layout (location = 0) out vec4 out_albedo;
    layout (location = 1) out vec4 out_normal;
    layout (location = 2) out vec4 out_position;
    layout (location = 3) out vec4 out_id;

    uniform vec4  Albedo;
    uniform vec4  Lighting;

    uniform vec4  CameraPosition;
    uniform float Time;

    in vec4 frag_localpos;
    in vec4 frag_worldpos;
    in vec3 frag_normal;
    in vec3 frag_worldnormal;
    in vec2 frag_uvs;
    
    in vec3 frag_scale;
    in float frag_id;
    `
const BaseFragmentAlbedoSourceMaterial = `
    vec4 getMaterialAlbedo ()
    {
        return Albedo;
    }`
const BaseFragmentNormalSourceMaterial = 
   `vec3 getMaterialNormal()
    {
        return frag_normal;
    }`
const BaseFragmentSourceFoot =
   `void main ()
    {
        out_albedo = getMaterialAlbedo();
        out_normal = vec4((getMaterialNormal() + vec3(1.0)) * 0.5, 1.0);
        out_position = vec4(frag_worldpos.xyz, distance(CameraPosition.xyz, frag_worldpos.xyz));
        out_id = vec4(frag_id / 255.0, Lighting.x, Lighting.y, 1.0);
    }`

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
//  
// SHADOW PASS SHADERS
//
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
const ShadowVertexSourceHead = 
   `#version 300 es
    precision lowp float;
    uniform mat4  Projection;
    uniform mat4  View;
    uniform float Time;
    uniform mat4  transform[128];
    uniform int   ID[128];
    in vec3 vertex_position;
    in vec3 vertex_normal;
    in vec2 vertex_uv;`
const ShadowVertexSourceFoot = 
   `void main ()
    {
        vec4 worldPosition = transform[gl_InstanceID] * vec4(vertex_position + getMaterialLPO(), 1.0);
        worldPosition = vec4(worldPosition.xyz + getMaterialWPO(), 1.0);
        gl_Position = 
            Projection * 
            View * 
            worldPosition;
    }`
const ShadowFragmentSource =
   `#version 300 es
   precision lowp float;
   void main()
   {

   }`

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
//  
// TRANSPARENT PASS SHADERS
//
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
const TransparentVertexSourceHead = 
   `#version 300 es
    precision lowp float;
    precision highp int;
    uniform mat4  proj;
    uniform mat4  view;
    uniform float Time;

    uniform vec4  Albedo;
    uniform vec4  Lighting;
    uniform mat4  transform[128];
    uniform vec3  scale[128];
    uniform int   ID[128];

    in vec3 vertex_position;
    in vec3 vertex_normal;
    in vec2 vertex_uv;
    
    out vec4 frag_worldpos;
    out vec3 frag_normal;
    out vec2 frag_uvs;
    
    out vec3 frag_scale;
    out float frag_id;
    `
const TransparentVertexWorldPositionOffsetSourceMaterial =
    `vec3 getMaterialWPO ()
     {
         return vec3(0.0, 0.0, 0.0);
     }`
const TransparentVertexLocalPositionOffsetSourceMaterial =
   `vec3 getMaterialLPO ()
    {
        return vec3(0.0, 0.0, 0.0);
    }`
const TransparentVertexSourceFoot =
   `void main() 
    {
        frag_worldpos = transform[gl_InstanceID] * vec4(vertex_position.xyz + getMaterialLPO(), 1.0);
        frag_worldpos = vec4(frag_worldpos.xyz + getMaterialWPO(), 1.0);
        frag_normal = normalize((transform[gl_InstanceID] * vec4(vertex_normal.xyz, 0.0)).xyz);
        frag_uvs = vertex_uv;

        frag_scale = scale[gl_InstanceID];
        frag_id = float(ID[gl_InstanceID]);

        gl_Position = proj * view * frag_worldpos;
    }`

const TransparentFragmentSourceHead = 
    `#version 300 es
     precision lowp float;
     precision highp int;
     layout (location = 0) out vec4 out_colour;
     layout (location = 1) out vec4 out_position;
     layout (location = 2) out float fragDepth;
 
     uniform vec4  Albedo;
     uniform vec4  Lighting;
 
     uniform vec4  CameraPosition;
     uniform float Time;
 
     in vec4 frag_worldpos;
     in vec3 frag_normal;
     in vec2 frag_uvs;
     
     in vec3 frag_scale;
     in float frag_id;

     float random (vec2 uv)
     {
         return fract(sin(dot(uv.xy, vec2(12.9898,78.233))) * 43758.5453123);
     }
     
     `
 const TransparentFragmentAlbedoSourceMaterial = `
     vec4 getMaterialAlbedo ()
     {
         return Albedo;
     }`
 const TransparentFragmentNormalSourceMaterial = 
    `vec3 getMaterialNormal()
     {
         return frag_normal;
     }`
 const TransparentFragmentSourceFoot =
    `
    void main ()
     {
        out_colour = getMaterialAlbedo();
        fragDepth = gl_FragCoord.z + (-0.5 + random(frag_uvs) * 2.0); 
     }`

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
//  
// POST-PROCESS PASS SHADERS
//
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
const DefaultPostProcessVertex = 
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

const DefaultPostProcessFragmentHeader = 
    `#version 300 es
    precision highp float;
    uniform float Time;
    uniform sampler2D Scene;
    uniform sampler2D BlueNoise;
    uniform sampler2D WhiteNoise;
    in vec2 frag_uvs;
    layout (location = 0) out vec4 out_colour;`

const DefaultPostProcessFragment = 
    `void main ()
    {
        out_colour = texture(Scene, frag_uvs);
    }`

class PostProcessMaterial
{
    constructor(gl, code = DefaultPostProcessSource)
    {
        this.program = createProgram(gl,
            createShader(gl, gl.VERTEX_SHADER,   DefaultPostProcessVertex),
            createShader(gl, gl.FRAGMENT_SHADER, DefaultPostProcessFragmentHeader + code))

        this.uniforms = extractUniforms(gl, DefaultPostProcessVertex, DefaultPostProcessFragmentHeader + code)
        for (const [name, uniform] of this.uniforms.entries())
        {
            uniform.location = gl.getUniformLocation(this.program, name)
        }
    }
}

class OpaqueMaterial
{
    constructor(gl, albedo, diffuse = 1.0, specular = 0.0, 
        fragmentAlbedoCode = BaseFragmentAlbedoSourceMaterial, 
        fragmentNormalCode = BaseFragmentNormalSourceMaterial, 
        vertexLocalPositionOffsetCode = BaseVertexLocalPositionOffsetSourceMaterial,
        vertexWorldPositionOffsetCode = BaseVertexWorldPositionOffsetSourceMaterial)
    {
        this.blend = BLEND_MODE_OPAQUE

        this.albedo = [...albedo, 0.0]
        this.lighting = [diffuse, specular, 0.0, 0.0]

        this.vertexLocalPositionOffsetCode = vertexLocalPositionOffsetCode
        this.vertexWorldPositionOffsetCode = vertexWorldPositionOffsetCode
        this.fragmentAlbedoCode = fragmentAlbedoCode
        this.fragmentNormalCode = fragmentNormalCode

        this.BasePassVertexCode = BaseVertexSourceHead + this.vertexLocalPositionOffsetCode + this.vertexWorldPositionOffsetCode + BaseVertexSourceFoot
        this.BasePassFragmentCode = BaseFragmentSourceHead + this.fragmentAlbedoCode + this.fragmentNormalCode + BaseFragmentSourceFoot
        this.BasePassShaderProgram = createProgram(gl,
            createShader(gl, gl.VERTEX_SHADER,   this.BasePassVertexCode),
            createShader(gl, gl.FRAGMENT_SHADER, this.BasePassFragmentCode))
        this.BasePassUniforms = extractUniforms(gl, this.BasePassVertexCode, this.BasePassFragmentCode)
        for (const [name, uniform] of this.BasePassUniforms.entries())
        {
            uniform.location = gl.getUniformLocation(this.BasePassShaderProgram, name)
        }

        this.ShadowPassVertexCode = ShadowVertexSourceHead + this.vertexLocalPositionOffsetCode + this.vertexWorldPositionOffsetCode + ShadowVertexSourceFoot
        this.ShadowPassFragmentCode = ShadowFragmentSource
        this.ShadowPassShaderProgram = createProgram(gl, 
            createShader(gl, gl.VERTEX_SHADER, this.ShadowPassVertexCode),
            createShader(gl, gl.FRAGMENT_SHADER, this.ShadowPassFragmentCode))
        this.ShadowPassUniforms = extractUniforms(gl, this.ShadowPassVertexCode, this.ShadowPassFragmentCode)
        for (const [name, uniform] of this.ShadowPassUniforms.entries())
        {
            uniform.location = gl.getUniformLocation(this.ShadowPassShaderProgram, name)
        }
    }

    toString()
    {
        return "</br><p>Shader</p><textarea class=\"shaderCode\">" + code + "</textarea>"
    }
}

class TransparentMaterial
{
    constructor(gl, albedo, diffuse = 1.0, specular = 0.0, 
        fragmentAlbedoCode = TransparentFragmentAlbedoSourceMaterial, 
        fragmentNormalCode = TransparentFragmentNormalSourceMaterial, 
        vertexLocalPositionOffsetCode = TransparentVertexLocalPositionOffsetSourceMaterial,
        vertexWorldPositionOffsetCode = TransparentVertexWorldPositionOffsetSourceMaterial)
    {
        this.albedo = [...albedo, 0.0]
        this.lighting = [diffuse, specular, 0.0, 0.0]

        this.vertexLocalPositionOffsetCode = vertexLocalPositionOffsetCode
        this.vertexWorldPositionOffsetCode = vertexWorldPositionOffsetCode
        this.fragmentAlbedoCode = fragmentAlbedoCode
        this.fragmentNormalCode = fragmentNormalCode

        this.TransparentPassVertexCode = TransparentVertexSourceHead + this.vertexLocalPositionOffsetCode + this.vertexWorldPositionOffsetCode + TransparentVertexSourceFoot
        this.TransparentPassFragmentCode = TransparentFragmentSourceHead + this.fragmentAlbedoCode + this.fragmentNormalCode + TransparentFragmentSourceFoot
        this.TransparentPassShaderProgram = createProgram(gl,
            createShader(gl, gl.VERTEX_SHADER,   this.TransparentPassVertexCode),
            createShader(gl, gl.FRAGMENT_SHADER, this.TransparentPassFragmentCode))
        this.TransparentPassUniforms = extractUniforms(gl, this.TransparentPassVertexCode, this.TransparentPassFragmentCode)
        for (const [name, uniform] of this.TransparentPassUniforms.entries())
        {
            uniform.location = gl.getUniformLocation(this.TransparentPassShaderProgram, name)
        }
    }
}