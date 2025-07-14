class ShadowPass extends BasePass
{
    constructor(context, width, height)
    {
        super(context, width, height)

        this.output = createShadowTexture(this.gl, this.width, this.height)
        this.framebuffer = createFramebuffer(this.gl, [ this.gl.DEPTH_ATTACHMENT ], [ this.output ])
    }

    Render(renderer, scene, light)
    {
        this.gl.viewport(0, 0, this.width, this.height);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);

        this.gl.clearColor(0.0, 0.0, 0.0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.gl.enable(this.gl.DEPTH_TEST)
      //  this.gl.enable(this.gl.CULL_FACE)
      //  this.gl.cullFace(this.gl.FRONT)

        const batches = scene.batchMeshes(
            (object) => { return !object.editor && object.visible },
            (component) => { return component.visible && component.shadows })
            
        for (let [batch, components] of batches) 
        {
            const material = renderer.MaterialPool.get(components[0].material)
            const geometry = renderer.GeometryPool.get(components[0].geometry)

            if (material instanceof OpaqueMaterial)
            {
                this.gl.useProgram       (material.ShadowPassShaderProgram);

                for (const [name, uniform] of material.ShadowPassUniforms.entries())
                {
                    if (uniform instanceof UniformFloat)
                    {
                      //  log("uniform " + name + " = " + uniform.value)
                        this.gl.uniform1f(uniform.location, uniform.value);
                    }
                }
    
                this.gl.uniform1f        (material.ShadowPassUniforms.get("Time").location, renderer.frameID)
                this.gl.uniformMatrix4fv (material.ShadowPassUniforms.get("Projection").location, false, light.projection)
                this.gl.uniformMatrix4fv (material.ShadowPassUniforms.get("View").location, false, light.view.worldToView)
    
                const id = []
                const transform = []
                const scale = []
                for (var i = 0; i < components.length; ++i)
                {
                    id.push(components[i].id)
                    transform.push(...components[i].transform.matrix())
                }
                this.gl.uniform1iv       (material.ShadowPassUniforms.get("ID").location, id)
                this.gl.uniformMatrix4fv (material.ShadowPassUniforms.get("transform").location, false, transform)
                    
                geometry.draw(components.length)
            }
        }

        this.gl.disable(this.gl.DEPTH_TEST)
       // this.gl.disable(this.gl.CULL_FACE)
    }

    Clear ()
    {
        this.gl.viewport(0, 0, this.width, this.height);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
        this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
    }
}