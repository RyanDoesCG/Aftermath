class DeferredBasePass extends BasePass
{
    constructor(context, width, height)
    {
        super (context, width, height)

        this.outputAlbedo    = createColourTexture (this.gl, this.width, this.height, this.gl.RGBA,    this.gl.UNSIGNED_BYTE)
        this.outputNormal    = createColourTexture (this.gl, this.width, this.height, this.gl.RGBA,    this.gl.UNSIGNED_BYTE)
        this.outputPosition  = createColourTexture (this.gl, this.width, this.height, this.gl.RGBA32F, this.gl.FLOAT)
        this.outputID        = createColourTexture (this.gl, this.width, this.height, this.gl.RGBA,    this.gl.UNSIGNED_BYTE)
        this.depth           = createDepthTexture  (this.gl, this.width, this.height)

        this.framebuffer = createFramebuffer(this.gl, 
            [
                this.gl.COLOR_ATTACHMENT0, 
                this.gl.COLOR_ATTACHMENT1, 
                this.gl.COLOR_ATTACHMENT2, 
                this.gl.COLOR_ATTACHMENT3,
                this.gl.DEPTH_ATTACHMENT
            ], 
            [
                this.outputAlbedo, 
                this.outputNormal, 
                this.outputPosition, 
                this.outputID,
                this.depth
            ])
    }

    Render(renderer, scene, view, toScreen)
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
            this.gl.drawBuffers([
                this.gl.COLOR_ATTACHMENT0, 
                this.gl.COLOR_ATTACHMENT1,
                this.gl.COLOR_ATTACHMENT2,
                this.gl.COLOR_ATTACHMENT3 ]);
        }

        this.gl.clearColor(0.0, 0.0, 0.0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.gl.enable(this.gl.DEPTH_TEST)
        this.gl.enable(this.gl.CULL_FACE)
        this.gl.cullFace(this.gl.BACK);

        const batches = scene.batchMeshes(
            (object) => { return !object.editor && object.visible },
            (component) => { return component.visible })

        for (let [batch, components] of batches) 
        {
            const material = renderer.MaterialPool.get(components[0].material)
            const geometry = renderer.GeometryPool.get(components[0].geometry)

            if (material instanceof OpaqueMaterial)
            {
                this.gl.useProgram       (material.BasePassShaderProgram);

                for (const [name, uniform] of material.BasePassUniforms.entries())
                {
                    if (uniform instanceof UniformFloat)
                    {
                        this.gl.uniform1f(uniform.location, uniform.value);
                    }

                    if (uniform instanceof UniformVec3)
                    {
                        this.gl.uniform3fv(uniform.location, uniform.value);
                    }
                }
    
                this.gl.uniformMatrix4fv (material.BasePassUniforms.get("proj").location, false, view.projection)
                this.gl.uniformMatrix4fv (material.BasePassUniforms.get("view").location, false, view.worldToView)
                this.gl.uniform4fv       (material.BasePassUniforms.get("CameraPosition").location, [view.position[0], view.position[1], view.position[2], 1.0])            
    
                this.gl.uniform1f        (material.BasePassUniforms.get("Time").location, renderer.frameID)
                this.gl.uniform4fv       (material.BasePassUniforms.get("Albedo").location, material.albedo)
                this.gl.uniform4fv       (material.BasePassUniforms.get("Lighting").location, material.lighting)
    
                var u = 0
                for (const [name, uniform] of material.BasePassUniforms.entries())
                {
                    if (uniform.type == "sampler2D")
                    {
                        var texture = TexturePool.get(uniform.name)
                        if (texture)
                        {
                            this.gl.activeTexture(getTextureEnum(this.gl, u));
                            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
                            this.gl.uniform1i(uniform.location, u);
                        }
                        else
                        {
                            log("MISSED TEXTURE POOL : " + uniform.name);
                        }
                        ++u
                    }
                }
    
                const id = []
                const transform = []
                const scale = []
                for (var i = 0; i < components.length; ++i)
                {
                    id.push(components[i].id)
                    transform.push(...components[i].transform.matrix())
                    scale.push(...components[i].transform.getWorldScale())
                }
                this.gl.uniform1iv       (material.BasePassUniforms.get("ID").location, id)
                this.gl.uniformMatrix4fv (material.BasePassUniforms.get("transform").location, false, transform)
                this.gl.uniform3fv       (material.BasePassUniforms.get("scale").location, scale)

                if (components[0].twosided)
                {
                    this.gl.disable(this.gl.CULL_FACE)
                    geometry.draw(components.length)
                    this.gl.enable(this.gl.CULL_FACE)
                }
                else
                {
                    geometry.draw(components.length)
                }
            }
        }

        this.gl.disable(this.gl.DEPTH_TEST)
        this.gl.disable(this.gl.CULL_FACE)
    }
}
