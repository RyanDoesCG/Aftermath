function createShader(gl, stage, source) 
{
    var shader = gl.createShader(stage);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) 
    {
        return shader;
    }

    var compileLog = gl.getShaderInfoLog(shader);
    log (compileLog)
    var error = compileLog.split(':')

    var lines = source.split('\n')
    var line = error[2];

    var goodcode = source.split(lines[line-1])[0]
    var badcode = (lines[line])
    var goodcode2 = source.split(lines[line-1])[1]

   log(goodcode + '%c'+lines[line-1]+'%c'+ goodcode2);
    gl.deleteShader(shader);
}

function createProgram(gl, vertexStage, FragmentStage) 
{
    var program = gl.createProgram();
    gl.attachShader(program, vertexStage);
    gl.attachShader(program, FragmentStage);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) 
    {
      return program;
    }
   
    alert(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

function extractUniforms(gl, vertexSource, fragmentSource)
{
    const uniforms = new Map()
    const processShader = (source) =>
    {
        const lines = source.split('\n')
        for (var i = 0; i < lines.length; ++i)
        {
            const words = lines[i].split(' ').filter ( v => v )
            const token = words.indexOf('uniform')
            if (token != -1)
            {
                const name = words[token + 2]
                    .replace(';', '')
                    .replace('[', ' ')
                    .replace(']', ' ')
                    .split(' ')[0]
                const type = words[token + 1]
                const exposed = words.includes("#expose")
                const texture = words.includes("#texture")
                if (type == "float")
                {
                    if (exposed)
                    {
                        const min = words
                            .filter(v => v.includes("min"))[0]
                            .split("=")[1]
                        const max = words
                            .filter(v => v.includes('max'))[0]
                            .split('=')[1]
                        const step = words
                            .filter(v => v.includes('step'))[0]
                            .split('=')[1]
                        const value = words
                            .filter(v => v.includes('default'))[0]
                            .split('=')[1]
                        uniforms.set(name, new UniformFloat(name, type, null, exposed, min, max, step, value))                
                    }
                    else
                    {
                        uniforms.set(name, new UniformFloat(name, type, null, false, -1000, 1000, 0, 0))
                    } 
                }
                else
                if (type == "vec3")
                {
                    uniforms.set(name, new UniformVec3(name, type, null, false))
                }
                else
                if (texture)
                {
                    const value = words
                        .filter(v => v.includes(name))
                        .filter(v => v.includes('path'))[0]
                        .split('=')[1]
                    log(name)
                    loadTexture(gl, value)
                    uniforms.set(name, new Uniform(name, type, null, exposed))

                }
                else
                {
                    
                    uniforms.set(name, new Uniform(name, type, null, exposed))
                }
            }
        }  
    }

    processShader(vertexSource)
    processShader(fragmentSource)

    return uniforms
}

function getTextureEnum(gl, i)
{
    if (i == 0) return gl.TEXTURE0
    if (i == 1) return gl.TEXTURE1
    if (i == 2) return gl.TEXTURE2
    if (i == 3) return gl.TEXTURE3
    if (i == 4) return gl.TEXTURE4
    if (i == 5) return gl.TEXTURE5
    if (i == 6) return gl.TEXTURE6
    if (i == 7) return gl.TEXTURE7
    if (i == 8) return gl.TEXTURE8
    if (i == 9) return gl.TEXTURE9
    if (i == 10) return gl.TEXTURE10
    if (i == 11) return gl.TEXTURE11
    if (i == 12) return gl.TEXTURE12
    if (i == 13) return gl.TEXTURE13
    if (i == 14) return gl.TEXTURE14
    if (i == 15) return gl.TEXTURE15
}

function getTextureEnumString(gl, i)
{
    if (i == gl.TEXTURE0) return "TEXTURE0"
    if (i == gl.TEXTURE1) return "TEXTURE1"
    if (i == gl.TEXTURE2) return "TEXTURE2"
    if (i == gl.TEXTURE3) return "TEXTURE3"
    if (i == gl.TEXTURE4) return "TEXTURE4"
    if (i == gl.TEXTURE5) return "TEXTURE5"
    if (i == gl.TEXTURE6) return "TEXTURE6"
    if (i == gl.TEXTURE7) return "TEXTURE7"
    if (i == gl.TEXTURE8) return "TEXTURE8"
    if (i == gl.TEXTURE9) return "TEXTURE9"
    if (i == gl.TEXTURE10) return "TEXTURE10"
    if (i == gl.TEXTURE11) return "TEXTURE11"
    if (i == gl.TEXTURE12) return "TEXTURE12"
    if (i == gl.TEXTURE13) return "TEXTURE13"
    if (i == gl.TEXTURE14) return "TEXTURE14"
    if (i == gl.TEXTURE15) return "TEXTURE15"
}