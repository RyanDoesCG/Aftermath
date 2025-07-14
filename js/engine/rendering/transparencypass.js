class TransparencyPass extends BasePass
{
    constructor(context, width, height)
    {
        super (context, width, height)

        this.output = createColourTexture (this.gl, this.width, this.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE)
        this.depth = createDepthTexture (this.gl, this.width, this.height)
    
        this.framebuffer = createFramebuffer(this.gl, 
            [
                this.gl.COLOR_ATTACHMENT0,
                this.gl.DEPTH_ATTACHMENT
            ], 
            [
                this.output,
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
                this.gl.COLOR_ATTACHMENT1 ]);
        }

        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.gl.enable(this.gl.DEPTH_TEST)
        this.gl.enable(this.gl.CULL_FACE)
        this.gl.cullFace(this.gl.BACK)

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.blendEquation(this.gl.FUNC_ADD);

        const components = []
        scene.traverse((object) => 
        {
            if (!object.editor)
            {
                const renders = object.getRenderComponents()
                for (var i = 0; i < renders.length; ++i)
                {
                    if (renders[i].visible)
                    {
                        const material = renderer.MaterialPool.get(renders[i].material)
                        if (material instanceof TransparentMaterial)
                        {
                            components.push(renders[i])
                        }
                    }
                }
            }
        })

        components.sort((a, b) => 
        { 
            const distanceFromCameraA = len(subv(view.position, a.transform.getWorldPosition()))
            const distanceFromCameraB = len(subv(view.position, b.transform.getWorldPosition())) 
            return distanceFromCameraA < distanceFromCameraB;
        })

        for (var i = 0; i < components.length; ++i)
        {
            const material = renderer.MaterialPool.get(components[i].material)
            const geometry = renderer.GeometryPool.get(components[i].geometry)

            this.gl.useProgram       (material.TransparentPassShaderProgram);

            for (const [name, uniform] of material.TransparentPassUniforms.entries())
            {
                if (uniform instanceof UniformFloat)
                {
                    this.gl.uniform1f(uniform.location, uniform.value);
                }
            }

            this.gl.uniformMatrix4fv (material.TransparentPassUniforms.get("proj").location, false, view.projection)
            this.gl.uniformMatrix4fv (material.TransparentPassUniforms.get("view").location, false, view.worldToView)
            this.gl.uniform4fv       (material.TransparentPassUniforms.get("CameraPosition").location, [view.position[0], view.position[1], view.position[2], 1.0])            

            this.gl.uniform1f        (material.TransparentPassUniforms.get("Time").location, renderer.frameID)
            this.gl.uniform4fv       (material.TransparentPassUniforms.get("Albedo").location, material.albedo)
            this.gl.uniform4fv       (material.TransparentPassUniforms.get("Lighting").location, material.lighting)

            var u = 0
            for (const [name, uniform] of material.TransparentPassUniforms.entries())
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
                    ++u
                }
            }
            
            this.gl.uniform1iv       (material.TransparentPassUniforms.get("ID").location, [components[i].id])
            this.gl.uniformMatrix4fv (material.TransparentPassUniforms.get("transform").location, false, [...components[i].transform.matrix()])
            this.gl.uniform3fv       (material.TransparentPassUniforms.get("scale").location, [...components[i].transform.getWorldScale()])
                
            geometry.draw()
        }

        this.gl.disable(this.gl.DEPTH_TEST)
        this.gl.disable(this.gl.CULL_FACE)
        this.gl.disable(this.gl.BLEND)
    }
}