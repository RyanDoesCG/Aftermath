class PostProcessPass extends BasePass
{
    constructor(context, width, height)
    {
        super(context, width, height)

        this.output = createColourTexture(this.gl, this.width, this.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE)
        this.framebuffer = createFramebuffer(this.gl, [ this.gl.COLOR_ATTACHMENT0 ], [ this.output ])
    }

    Render (renderer, ScreenPrimitive, inSceneTexture, inBlueNoise, inWhiteNoise, material, toScreen)
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

        this.gl.useProgram(material.program)

        this.gl.uniform1f(material.uniforms.get("Time").location, renderer.frameID)

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inSceneTexture);
        this.gl.uniform1i(material.uniforms.get("Scene").location, 0);

        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inBlueNoise);
        this.gl.uniform1i(material.uniforms.get("BlueNoise").location, 1);

        this.gl.activeTexture(this.gl.TEXTURE2);
        this.gl.bindTexture(this.gl.TEXTURE_2D, inWhiteNoise);
        this.gl.uniform1i(material.uniforms.get("WhiteNoise").location, 2);

        for (const [name, uniform] of material.uniforms.entries())
        {
            if (uniform instanceof UniformFloat)
            {
                this.gl.uniform1f(uniform.location, uniform.value);
            }
        }

        renderer.GeometryPool.get(ScreenPrimitive.geometry).draw()
    }
}