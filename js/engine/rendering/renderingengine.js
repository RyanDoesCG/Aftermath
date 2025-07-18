class RenderingEngine
{
    constructor(engine)
    {
        this.engine = engine

        let params = { 
            alpha:false,
            depth:true,
            stencil:false,
            desynchronized:false,
            antialias:false,
            powerPreference:"low-power" 
        }
        
        this.canvas = document.getElementById('viewport')
        this.ui = document.getElementById('ui')
        this.gl = this.canvas.getContext("webgl2", params)
        this.gl.getExtension('EXT_color_buffer_float')
        this.gl.getExtension("EXT_texture_filter_anisotropic")
        this.gl.getExtension("MOZ_EXT_texture_filter_anisotropic")
        this.gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic")

        //this.canvas.addEventListener("click", async () => {
        //    await this.canvas.requestPointerLock();
        //});

        this.width = this.canvas.width
        this.height = this.canvas.height

        var timeout
        window.onresize = (e) => 
        { 
            clearTimeout(timeout)
            timeout = setTimeout(
                () => {
                    this.allocateRenderTargets()

                    log("RESIZE")
                    log(" window: " + this.canvas.clientWidth + "x" + this.canvas.clientHeight)
                    log(" render: " + this.canvas.width + "x" + this.canvas.height)
                }, 256)
        }

        this.BaseRenderPass
        this.DirectionalShadowRenderPass
        this.SpotLightShadowRenderPasses
        this.LightCompositePass
        this.SpotLightRenderPass
        this.spotLightVolumetricRenderPass
        this.DirectionalLightRenderPass
        this.TransparentRenderPass
        this.VolumetricRenderPass
        this.VolumetricComposireRenderPass
        this.TAARenderPass
        this.BlurRenderPass
        this.MaskBlurRenderPass
        this.DepthOfFieldRenderPass
        this.PostProcessRenderPass
        this.TonemappingRenderPass
        this.EditorRenderPass
        this.EditorAARenderPass
        this.OutlineRenderPass
        this.ColourCompositeRenderPass
        this.IDCompositeRenderPass
        this.TransparentComposireRenderPass
        this.VisualizeTexturePass
        this.passes
        this.NumHistorySamples
        this.LightingBuffer
        this.FrameBuffer
        this.view

        this.allocateRenderTargets()
        this.settings

        // Textures
        this.WhiteNoiseTexture = loadTexture(this.gl, 'images/noise/white.png')
        this.STBNBlueNoiseTextures = []
        this.NBlueNoise = 64;
        for (var i = 0; i < this.NBlueNoise; ++i)
        {
            this.STBNBlueNoiseTextures.push(loadTexture(this.gl, 'images/noise/STBN/stbn_scalar_2Dx1Dx1D_128x128x64x1_' + i + '.png'))
        }

        this.VisualizeTexture = this.SpotLightVolumetricRenderPass.output

        // View
        this.Near = 0.1
        this.Far = 1000.0
        this.FOV = 45.0;

        this.frameID = 0
        
        this.GeometryPool = new Map()
        this.MaterialPool = new Map()

        this.ScreenPrimitive = new RenderComponent(this.requestGeometry("Quad"))

        this.basepassFrametime = new RunningAverage()
        this.shadowpassFrametime = new RunningAverage()
        this.lightpassFrametime = new RunningAverage()
        this.volumepassFrametime = new RunningAverage()
        this.antialiasingFrametime = new RunningAverage()
        this.posteffectsFrametime = new RunningAverage()
        this.posteffectsTotal = 0.0

        this.frametime = new RunningAverage()

        this.needsMouseEvents = false

        // ENGINE DEFAULT MATERIAL
        this.GridMaterial  = this.requestMaterial(BLEND_MODE_OPAQUE, 0.5, 0.5, 0.5, 0.5, 0.05, `
            uniform sampler2D grid; // #texture path=images/grid.png
            vec4 getMaterialAlbedo() 
            { 
                vec2 gridScale = 
                    (abs(frag_worldnormal.x) >= 0.9) ? frag_scale.yz :
                    (abs(frag_worldnormal.y) >= 0.9) ? frag_scale.xz :
                    (abs(frag_worldnormal.z) >= 0.9) ? frag_scale.xy :
                    vec2(1.0, 1.0);

                vec4 a = texture(grid, frag_uvs * gridScale * 4.0);
                a.xyz = vec3(1.0, 1.0, 1.0) - a.xyz;
                return vec4(a.xyz, 0.0); 
            }`)
        this.BlackMaterial = this.requestMaterial(BLEND_MODE_OPAQUE, 0.05, 0.05, 0.05, 0.1, 0.0)
    }


    allocateRenderTargets()
    {
        // we should probably just allocate the full size buffer
        // and resize via glViewport. This can lead to nasty hangs
        const MAX_BUFFER_WIDTH = Number.MAX_VALUE
        const MAX_BUFFER_HEIGHT = Number.MAX_VALUE
        log("allocating render targets at " + Math.min(this.canvas.clientWidth, MAX_BUFFER_WIDTH) + "x" +  Math.min(this.canvas.clientHeight, MAX_BUFFER_HEIGHT))
        this.canvas.width = Math.min(this.canvas.clientWidth, MAX_BUFFER_WIDTH)
        this.canvas.height = Math.min(this.canvas.clientHeight, MAX_BUFFER_HEIGHT)

        this.width = this.canvas.width
        this.height = this.canvas.height

        this.BaseRenderPass              = new DeferredBasePass (this.gl, this.width, this.height)
        this.DirectionalShadowRenderPass = new ShadowPass       (this.gl, 16000, 16000)
        this.SpotLightShadowRenderPasses = [
                new ShadowPass       (this.gl, 1024, 1024),
                new ShadowPass       (this.gl, 1024, 1024),
                new ShadowPass       (this.gl, 1024, 1024),
                new ShadowPass       (this.gl, 1024, 1024),
                new ShadowPass       (this.gl, 1024, 1024)]

        this.SpotLightRenderPass            = new SpotLightPass             (this.gl, this.width, this.height)
        this.SpotLightVolumetricRenderPass  = new SpotLightVolumetricPass   (this.gl, this.width, this.height)
        this.DirectionalLightRenderPass     = new DirectionalLightPass      (this.gl, this.width, this.height)
        this.PointLightRenderPass           = new PointLightPass            (this.gl, this.width, this.height)
        this.LightCompositeRenderPass       = new LightCompositePass        (this.gl, this.width, this.height)
        this.TransparentRenderPass          = new TransparencyPass          (this.gl, this.width, this.height)
        this.VolumetricRenderPass           = new VolumetricsPass           (this.gl, this.width, this.height)
        this.VolumetricComposireRenderPass  = new VolumetricCompositePass   (this.gl, this.width, this.height)
        this.TAARenderPass                  = new TAAPass                   (this.gl, this.width, this.height)
        this.BlurRenderPass                 = new DepthAwareBlurPass        (this.gl, this.width, this.height)
        this.MaskBlurRenderPass             = new MaskBlurPass              (this.gl, this.width, this.height)
        this.DepthOfFieldRenderPass         = new DepthOfFieldPass          (this.gl, this.width, this.height)
        this.PostProcessRenderPass          = new PostProcessPass           (this.gl, this.width, this.height)
        this.TonemappingRenderPass          = new TonemappingPass           (this.gl, this.width, this.height)
        this.VisualizeTexturePass           = new VisualizationPass         (this.gl, this.width, this.height)
        this.EditorRenderPass               = new EditorPass                (this.gl, this.width, this.height)
        this.EditorAARenderPass             = new TAAPass                   (this.gl, this.width, this.height)
        this.OutlineRenderPass              = new OutlinePass               (this.gl, this.width, this.height)
        this.ColourCompositeRenderPass      = new CompositePass             (this.gl, this.width, this.height)
        this.IDCompositeRenderPass          = new CompositePass             (this.gl, this.width, this.height)
        this.TransparentCompositeRenderPass = new TransparencyCompositePass (this.gl, this.width, this.height)
        this.passes = [
            this.DirectionalLightRenderPass,
            this.SpotLightRenderPass,
            this.SpotLightVolumetricRenderPass,
            this.PointLightRenderPass,
            this.LightCompositeRenderPass,
            this.VolumetricRenderPass  ,
            this.TAARenderPass         ,
            this.DepthOfFieldRenderPass,
            this.TonemappingRenderPass
        ]

        this.VisualizeTexture = this.SpotLightVolumetricRenderPass.output

        this.LightingBuffer = createColourTexture(
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
                this.LightingBuffer
            ])

        this.idFramebuffer = createFramebuffer(this.gl, 
            [ this.gl.COLOR_ATTACHMENT0 ], 
            [ this.IDCompositeRenderPass.output ])

        this.view = new View (
            vec4(0.0, 0.0, 0.0, 0.0), 
            vec4(0.0, 0.0, 0.0, 0.0), 
            this.width, 
            this.height,
            this.canvas.clientHeight / this.canvas.clientWidth,
            this.Near, 
            this.Far, 
            this.FOV,
            false)

        if (this.settings)
        {
            this.settings.generateHTML()
            this.settings.attachHandlers()
        }
    }

    requestMaterial(blend, albedoR, albedoG, albedoB, diffuse, specular, albedoShader, normalShader, localPositionShader, worldPositionShader)
    {
        let CurrentMaterialCount = this.MaterialPool.size
        for (var i = 0; i < CurrentMaterialCount; ++i)
        {
            if (this.MaterialPool.get(i).blend          === blend        &&
                this.MaterialPool.get(i).albedo[0]      === albedoR      &&
                this.MaterialPool.get(i).albedo[1]      === albedoG      &&
                this.MaterialPool.get(i).albedo[2]      === albedoB      &&
                this.MaterialPool.get(i).lighting[0]    === diffuse      &&
                this.MaterialPool.get(i).lighting[1]    === specular     &&
                this.MaterialPool.get(i).albedoShader   === albedoShader &&
                this.MaterialPool.get(i).normalShader   === normalShader &&
                this.MaterialPool.get(i).localPositionShader === localPositionShader && 
                this.MaterialPool.get(i).worldPositionShader === worldPositionShader)
            {
                return i;
            }
        }

        if (blend == BLEND_MODE_OPAQUE)
        {
            const material = new OpaqueMaterial(this.gl, [albedoR, albedoG, albedoB] , diffuse, specular, albedoShader, normalShader, localPositionShader, worldPositionShader)
            this.MaterialPool.set(CurrentMaterialCount, material)
        }

        if (blend == BLEND_MODE_TRANSPARENT)
        {
            const material = new TransparentMaterial(this.gl, [albedoR, albedoG, albedoB] , diffuse, specular, albedoShader, normalShader, localPositionShader, worldPositionShader)
            this.MaterialPool.set(CurrentMaterialCount, material)
        }

        return CurrentMaterialCount
    }

    createPostProcessMaterial(colorShader)
    {
        return new PostProcessMaterial(this.gl, colorShader)
    }

    requestGeometry (name)
    {
        if (EngineMeshes.has(name))
        {
            if (!this.GeometryPool.has(name))
            {
                //log ("created pooled engine geometry: " + name)
                this.GeometryPool.set(name, new Geometry(this.gl, EngineMeshes.get(name)))
            }
            else
            {
                //log ("found pooled engine geometry: " + name)
                return name
            }
        }
        else
        {
            if (!this.GeometryPool.has(name))
            {
                this.GeometryPool.set(name, new Geometry(this.gl, BoxMesh))
                fetch("models/" + name + ".obj")
                    .then((f) => { f.text()
                    .then((t) => { 
                        const mesh = objToMesh(t)
                        this.GeometryPool.set(name, new Geometry(this.gl, mesh))})})
            }
            else
            {
                //log ("found pooled geometry" + name)
                return name
            }
        }

        return name
    }

    setView (camera)
    {
        this.view = new View (
            camera.transform.getWorldPosition(), 
            camera.transform.getWorldRotation(), 
            this.width, 
            this.height,
            this.canvas.clientHeight / this.canvas.clientWidth,
            this.Near, 
            this.Far, 
            this.FOV,
            this.TAARenderPass.active())
    }

    update()
    {
        let start = Date.now()

        if (this.engine.editor.editorShowing)
        {
            this.setView(this.engine.scene.getEditorCamera())
        }
        else
        {
            this.setView(this.engine.scene.getGameCamera())
        }

        const renderEditor = this.engine.editor != undefined && this.engine.editor.editorShowing
        if (this.engine.input.rightMouseHeld)
        {
            this.canvas.style.cursor = "none"
        }
        else
        {
            this.canvas.style.cursor = "default"
        }

        let baseStart = Date.now()
        var LastBuffer = null
        this.BaseRenderPass.Render(
            this,
            this.engine.scene,
            this.view,
            false)
        LastBuffer = this.BaseRenderPass.outputAlbedo;
        this.basepassFrametime.add(Date.now() - baseStart)

        let shadowStart = Date.now()
        if (this.DirectionalLightRenderPass.active())
        {
            const directional = this.engine.scene.getDirectionalLight()
            if (directional)
            {
                this.DirectionalShadowRenderPass.Render(this, this.engine.scene, directional)
            }
        }

        if (this.SpotLightRenderPass.active())
        {
            const spots = this.engine.scene.getSpotLights(vec3(this.view.position[0], this.view.position[1], this.view.position[2]))
            const MAX_SPOT_LIGHTS = 5
            for (var i = 0; i < Math.min(spots.length, MAX_SPOT_LIGHTS); ++i)
            {
                if (spots[i])
                {
                    this.SpotLightShadowRenderPasses[i].Render(this, this.engine.scene, spots[i])
                }
            }
        }
        
        this.shadowpassFrametime.add(Date.now() - shadowStart)

        let lightStart = Date.now()
        if (this.DirectionalLightRenderPass.active())
        {
            this.DirectionalLightRenderPass.Render(
                this,
                this.ScreenPrimitive,
                this.engine.scene,
                this.view,
                this.Framebuffer,
                this.BaseRenderPass.outputAlbedo,
                this.BaseRenderPass.outputNormal,
                this.BaseRenderPass.outputPosition,
                this.STBNBlueNoiseTextures[this.frameID % this.NBlueNoise],
                this.DirectionalShadowRenderPass.output,
                this.BaseRenderPass.outputID,
                this.TAARenderPass.active()||
                this.DepthOfFieldRenderPass.active()||
                this.TonemappingRenderPass.active()||
                this.VolumetricRenderPass.active()?false:true)
        }

        if (this.SpotLightRenderPass.active())
        {
            this.SpotLightRenderPass.Render(
                this,
                this.engine.scene,
                this.view,
                this.BaseRenderPass.outputAlbedo,
                this.BaseRenderPass.outputNormal,
                this.BaseRenderPass.outputPosition,
                this.STBNBlueNoiseTextures[this.frameID % this.NBlueNoise],
                [
                    this.SpotLightShadowRenderPasses[0].output,
                    this.SpotLightShadowRenderPasses[1].output,
                    this.SpotLightShadowRenderPasses[2].output,
                    this.SpotLightShadowRenderPasses[3].output,
                    this.SpotLightShadowRenderPasses[4].output
                ],
                this.BaseRenderPass.outputID,
                this.TAARenderPass.active()||
                this.DepthOfFieldRenderPass.active()||
                this.TonemappingRenderPass.active()||
                this.VolumetricRenderPass.active()?false:true)

            if (this.SpotLightVolumetricRenderPass.active())
            {
                this.SpotLightVolumetricRenderPass.Render(
                    this,
                    this.engine.scene,
                    this.view,
                    this.BaseRenderPass.outputPosition,
                    this.STBNBlueNoiseTextures[this.frameID % this.NBlueNoise],
                    [
                        this.SpotLightShadowRenderPasses[0].output,
                        this.SpotLightShadowRenderPasses[1].output,
                        this.SpotLightShadowRenderPasses[2].output,
                        this.SpotLightShadowRenderPasses[3].output,
                        this.SpotLightShadowRenderPasses[4].output
                    ])
            }
        }

        if (this.PointLightRenderPass.active())
        {
            this.PointLightRenderPass.Render(
                this,
                this.engine.scene,
                this.view,
                this.BaseRenderPass.outputAlbedo,
                this.BaseRenderPass.outputNormal,
                this.BaseRenderPass.outputPosition,
                this.STBNBlueNoiseTextures[this.frameID % this.NBlueNoise],
                this.BaseRenderPass.outputID,
                this.TAARenderPass.active()||
                this.DepthOfFieldRenderPass.active()||
                this.TonemappingRenderPass.active()||
                this.VolumetricRenderPass.active()?false:true)
        }

        this.LightCompositeRenderPass.Render(
            this,
            this.ScreenPrimitive,
            this.Framebuffer,
            this.DirectionalLightRenderPass.output,
            this.SpotLightRenderPass.output,
            this.PointLightRenderPass.output,
            this.SpotLightVolumetricRenderPass.output,
            this.BaseRenderPass.outputPosition,
            false)

        LastBuffer = this.LightingBuffer
        this.lightpassFrametime.add(Date.now() - lightStart)

        // render transparency
        this.TransparentRenderPass.Render(
            this,
            this.engine.scene,
            this.view,
            false)

        this.TransparentCompositeRenderPass.Render(
            this,
            this.ScreenPrimitive,
            this.LightingBuffer,
            this.TransparentRenderPass.output,
            false)
        LastBuffer = this.TransparentCompositeRenderPass.output;

        if (false)
        {
            let volumestart = performance.now()
            this.VolumetricRenderPass.Render(
                this, 
                this.ScreenPrimitive,
                this.STBNBlueNoiseTextures[this.frameID % this.NBlueNoise],
                LastBuffer,
                this.BaseRenderPass.outputPosition,
                this.DirectionalShadowRenderPass.output,
                [
                    this.SpotLightShadowRenderPasses[0].output,
                    this.SpotLightShadowRenderPasses[1].output,
                    this.SpotLightShadowRenderPasses[2].output,
                    this.SpotLightShadowRenderPasses[3].output,
                    this.SpotLightShadowRenderPasses[4].output,
                ],
                this.TAARenderPass.active()||
                this.DepthOfFieldRenderPass.active()||
                this.TonemappingRenderPass.active()?false:true)

            this.VolumetricComposireRenderPass.Render(
                this,
                this.ScreenPrimitive,
                this.VolumetricRenderPass.output,
                LastBuffer,
                false)
            LastBuffer = this.VolumetricComposireRenderPass.output

            this.volumepassFrametime.add(performance.now() - volumestart)
        }

        const PostProcessObject = this.engine.scene.getPostProcessObject()
        if (PostProcessObject)
        {
            let poststart = Date.now()
            this.PostProcessRenderPass.Render(
                this, 
                this.ScreenPrimitive,
                LastBuffer,
                this.STBNBlueNoiseTextures[this.frameID % this.NBlueNoise],
                this.WhiteNoiseTexture,
                PostProcessObject.material,
                this.TonemappingRenderPass.active()?false:true)

            // copy post pass output to LightingBuffer to TAA it
            this.gl.viewport(0, 0, this.width, this.height);
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.PostProcessRenderPass.framebuffer);
            this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
            
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.LightingBuffer)
            this.gl.copyTexImage2D(
                this.gl.TEXTURE_2D, 
                0,
                this.gl.RGBA, 
                0, 0,
                this.width,
                this.height,
                0);
            this.posteffectsTotal = Date.now() - poststart
        }    

        if (this.TAARenderPass.active()) 
        {
            let aastart = Date.now()
            this.TAARenderPass.Render(
                this,
                this.ScreenPrimitive,
                this.BaseRenderPass.outputPosition,
                this.Framebuffer,
                this.view,
                [ this.width, this.height ],
                this.TonemappingRenderPass.active() ||
                this.DepthOfFieldRenderPass.active()?false:true
            )
            LastBuffer = this.TAARenderPass.outputColour
            this.antialiasingFrametime.add(Date.now() - aastart)
        }
        
        // bloom
        {
            this.MaskBlurRenderPass.Render(
                this,
                this.ScreenPrimitive,
                LastBuffer,
                2.0)
            this.MaskBlurRenderPass.Render(
                this,
                this.ScreenPrimitive,
                this.MaskBlurRenderPass.output,
                2.0)       
        }
    
        let poststart = Date.now()
        if (this.DepthOfFieldRenderPass.active())
        {
            this.BlurRenderPass.Render(
                this,
                this.ScreenPrimitive,
                LastBuffer,
                this.BaseRenderPass.depth,
                2.0)
            
            this.BlurRenderPass.Render(
                this,
                this.ScreenPrimitive,
                this.BlurRenderPass.output,
                this.BaseRenderPass.depth,
                3.0)

            this.DepthOfFieldRenderPass.Render(
                this,
                this.ScreenPrimitive,
                LastBuffer,
                this.BlurRenderPass.output,
                this.BaseRenderPass.outputPosition,
                this.TonemappingRenderPass.active() || 
                this.engine.scene.getPostProcessObject()?false:true
            )
            LastBuffer = this.DepthOfFieldRenderPass.output
        }

        if (this.TonemappingRenderPass.active())
        {
            this.TonemappingRenderPass.Render(
                this,
                this.ScreenPrimitive,
                LastBuffer,
                this.MaskBlurRenderPass.output,
                !renderEditor
            )
        }
        this.posteffectsTotal += Date.now() - poststart
        this.posteffectsFrametime.add(this.posteffectsTotal)

        if (renderEditor)
        {
            this.EditorRenderPass.Render(
                this,
                this.engine.scene,
                this.view)

            if (this.engine.editor.selected)
            {
                this.OutlineRenderPass.Render(
                    this,
                    this.ScreenPrimitive,
                    this.engine.editor.selected.id,
                    this.BaseRenderPass.outputID,
                    this.EditorRenderPass.framebufferColourOnly
                )
            }

           // this.EditorAARenderPass.Render(
           //     this,
           //     this.ScreenPrimitive,
           //     this.EditorRenderPass.outputPosition,
           //     this.EditorRenderPass.framebuffer,
           //     this.view,
           //     [this.width,this.height],
           //     false)

            // composite colour
            this.ColourCompositeRenderPass.Render(
                this, 
                this.ScreenPrimitive,
                this.TonemappingRenderPass.output,
                this.EditorRenderPass.output,
                true)
        }

        // composite IDs
        this.IDCompositeRenderPass.Render(
            this, 
            this.ScreenPrimitive,
            this.BaseRenderPass.outputID,
            this.EditorRenderPass.outputID,
            false)

        if (this.engine.input.leftMouseClicked && this.engine.editor != undefined)
        {
            // Expensive Call
            const id = this.getMouseOverObjectID(this.engine.input.mouseX, this.engine.input.mouseY)
            this.engine.events.addUnique(new Event(
                id, 
                EVENT_TYPE_OBJECT_SELECTION))
        }

        if (this.engine.input.VPressed)
        {
            this.VisualizeTexturePass.Render(this, this.ScreenPrimitive, this.VisualizeTexture)
        }

        this.frametime.add(Date.now() - start)

        ++this.frameID

        if (this.engine.input.SPressed && this.engine.input.CmdPressed && this.engine.editor && !this.engine.input.ShiftPressed)
        {
            this.engine.input.SPressed = false
            this.engine.input.CmdPressed = false
            this.saveScreenshot()
        }
    }

    getMouseOverObjectID (mouseX, mouseY)
    {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.idFramebuffer)
        var pixels = new Uint8Array(4);
        this.gl.readPixels(
            Math.floor(mouseX), Math.floor(mouseY), 
            1, 1, 
            this.gl.RGBA, this.gl.UNSIGNED_BYTE, 
            pixels);
        return pixels[0]
    }

    saveScreenshot()
    {
        var image = document.createElement('a');        
        image.download = 'render.png';
        image.href = this.canvas.toDataURL();
        image.click();
    }
}