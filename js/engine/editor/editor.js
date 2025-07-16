class Editor
{
    constructor(engine)
    {
        this.engine = engine
        this.scene = engine.scene
        this.canvas = document.getElementById("viewport")

        this.selected = null
        this.lastDelete = null
        
        this.objectInspector = new ObjectInspector(engine)
        this.renderSettings  = new RenderSettings(engine)
        this.sceneOutliner   = new SceneOutliner(engine)
        this.stats           = new Stats(engine)

        this.statsShowing    = true
        this.editorShowing   = true
        this.consoleShowing  = true
        this.updateAllPanels = true

        this.frametime = new RunningAverage()

        this.ArrowGeometry   = engine.rendering.requestGeometry("Arrow")
        this.ScalerGeometry  = engine.rendering.requestGeometry("Scaler")
        this.RotatorGeometry = engine.rendering.requestGeometry("Rotator")
        this.RedMaterial     = engine.rendering.requestMaterial(BLEND_MODE_OPAQUE, 0.9, 0.6235, 0.6156, 0.0, 0.0)
        this.GreenMaterial   = engine.rendering.requestMaterial(BLEND_MODE_OPAQUE, 0.737, 0.939, 0.729, 0.0, 0.0)
        this.BlueMaterial    = engine.rendering.requestMaterial(BLEND_MODE_OPAQUE, 0.745, 0.858, 0.937, 0.0, 0.0)
        
        this.engine.rendering.MaterialPool.get(this.RedMaterial).albedo[3] = 1.0
        this.engine.rendering.MaterialPool.get(this.GreenMaterial).albedo[3] = 1.0       
        this.engine.rendering.MaterialPool.get(this.BlueMaterial).albedo[3] = 1.0

        this.transformArrows = [
            new SceneObject({
                    name : "ArrowX",
               transform : new Transform(Scale(1.0, 0.5, 1.0), Translation(0.0, 3.0, 0.0), Rotation(0.0, 0.0, -0.5)),
                  render : new RenderComponent(this.ArrowGeometry, this.RedMaterial, false),
                  editor : true }),
            new SceneObject({
                    name : "ArrowY",
               transform : new Transform(Scale(1.0, 0.5, 1.0), Translation(0.0, 3.0, 0.0), Rotation(0.0, 0.0, 0.0)),
                  render : new RenderComponent(this.ArrowGeometry, this.GreenMaterial, false),
                  editor : true }),
            new SceneObject({
                    name : "ArrowZ",
               transform : new Transform(Scale(1.0, 0.5, 1.0), Translation(0.0, 3.0, 0.0), Rotation(0.5, 0.0, 0.0)),
                  render : new RenderComponent(this.ArrowGeometry, this.BlueMaterial, false),
                  editor : true })]

        this.transformScalers = [
            new SceneObject({
                    name : "ScalerX",
               transform : new Transform(Scale(1.0, 0.5, 1.0), Translation(0.0, 3.0, 0.0), Rotation(0.0, 0.0, -0.5)),
                  render : new RenderComponent(this.ScalerGeometry, this.RedMaterial, false),
                  editor : true }),
            new SceneObject({
                    name : "ScalerY",
               transform : new Transform(Scale(1.0, 0.5, 1.0), Translation(0.0, 3.0, 0.0), Rotation(0.0, 0.0, 0.0)),
                  render : new RenderComponent(this.ScalerGeometry, this.GreenMaterial, false),
                  editor : true }),
            new SceneObject({
                    name : "ScalerZ",
               transform : new Transform(Scale(1.0, 0.5, 1.0), Translation(0.0, 3.0, 0.0), Rotation(0.5, 0.0, 0.0)),
                  render : new RenderComponent(this.ScalerGeometry, this.BlueMaterial, false),
                  editor : true })]

        this.transformRotators = [
                new SceneObject({
                    name : "RotatorX",
               transform : new Transform(Scale(1.0, 1.0, 1.0), Translation(0.0, 3.0, 0.0), Rotation(0.0, 0.0, 0.5)),
                  render : new RenderComponent(this.RotatorGeometry, this.RedMaterial, false),
                  editor : true }),
                new SceneObject({
                    name : "RotatorY",
               transform : new Transform(Scale(1.0, 1.0, 1.0), Translation(0.0, 3.0, 0.0), Rotation(-0.5, 0.0, 0.0)),
                  render : new RenderComponent(this.RotatorGeometry, this.GreenMaterial, false),
                  editor : true }),
                new SceneObject({
                    name : "RotatorZ",
               transform : new Transform(Scale(1.0,1.0, 1.0), Translation(0.0, 3.0, 0.0), Rotation(0.0, 0.0, 0.0)),
                  render : new RenderComponent(this.RotatorGeometry, this.BlueMaterial, false),
                  editor : true })]

        for (var i = 0; i < 3; ++i)
        {
            this.scene.add(this.transformArrows[i])
            this.scene.add(this.transformScalers[i])
            this.scene.add(this.transformRotators[i])

            this.transformScalers[i].visible = false
            this.transformRotators[i].visible = false
        }

        this.gizmos = [
            this.transformArrows,
            this.transformScalers,
            this.transformRotators]
        this.currentGizmo = 0

        this.showEditor()

      //  document.getElementById("bottombar").querySelector("#resize").addEventListener("mousedown", () => 
      //  {
      //      log ("clicked resize")
      //  })
        
        this.XArrowHeld = false
        this.YArrowHeld = false
        this.ZArrowHeld = false

        this.XScalerHeld = false
        this.YScalerHeld = false
        this.ZScalerHeld = false

        this.XRotatorHeld = false
        this.YRotatorHeld = false
        this.ZRotatorHeld = false

        this.LastMouseX = 0
        this.LastMouseY = 0

        this.lockMouseOnClick = async () => 
        {
            await this.canvas.requestPointerLock();
        }

        document.addEventListener('dragover', (e) => {
            e.preventDefault()
        });

        document.addEventListener('drop', 
            this.loadSceneFromDrop.bind(this), 
            true);
    }

    loadSceneFromDrop (e)
    {            
        e.preventDefault()
        var files = e.dataTransfer.files;
        var reader = new FileReader();  
        reader.addEventListener('load', this.spawnSceneFromDrop.bind(this), true)
        reader.readAsText(files[0],"UTF-8");
    }

    spawnSceneFromDrop (e)
    { 
        this.scene.spawn(event.target.result)

        log ("loading: ")
        log (e.target.result)

        this.selected = null
        this.updateAllPanels = true
    }

    cycleGizmos ()
    {
        this.currentGizmo = (this.currentGizmo + 1) % this.gizmos.length

        for (var g = 0; g < this.gizmos.length; ++g)
        {
            for (var i = 0; i < 3; ++i)
            {
                this.gizmos[g][i].visible = this.currentGizmo == g && this.selected != null
            }
        }
    }

    update()
    {
        const editorStart = Date.now()

        if (this.engine.input.KPressed && this.engine.input.CmdPressed)
        {
            clear()
        }

        if (this.engine.input.PPressed && this.engine.input.CmdPressed)
        {
            log ("saving level")

            this.engine.scene.save()

            this.engine.input.PPressed = false
        }

        if (this.engine.input.GPressed)
        {
            this.cycleGizmos()
            this.engine.input.GPressed = false
        }

        // UPDATE EDITOR VISIBILITY
        if (this.editorShowing)
        {
            this.objectInspector.needsUpdate = true
        }
        
        if (this.engine.input.FPressed)
        {
            if (this.editorShowing)
            {
                this.hideEditor()
            }
            else
            {
                this.showEditor()
            }

            this.engine.input.FPressed = false
        }

        if (this.engine.input.UPressed)
        {
            if (this.statsShowing)
            {
                this.hideStats()
            }
            else
            {
                this.showStats()
            }
            
            this.engine.input.UPressed = false
        }

        if (this.engine.input.CPressed && this.editorShowing)
        {
            if (this.consoleShowing)
            {
                this.hideConsole()
            }
            else
            {
                this.showConsole()
            }

            this.engine.input.CPressed = false
        }

        // SELECTED OBJECT INTERATIONS
        const lastSelectionEvent = this.engine.events.findType(EVENT_TYPE_OBJECT_SELECTION)
        if (lastSelectionEvent != null)
        {
            this.engine.events.remove(EVENT_TYPE_OBJECT_SELECTION)

            log("section event:")
            const object = this.scene.get(lastSelectionEvent.objectID)
            if (object == this.transformArrows[0])
            {
                this.XArrowHeld = true
            }
            else
            if (object == this.transformArrows[1])
            {
                this.YArrowHeld = true
            }
            else
            if (object == this.transformArrows[2])
            {
                this.ZArrowHeld = true
            }
            else
            if (object == this.transformScalers[0])
            {
                this.XScalerHeld = true
            }
            else
            if (object == this.transformScalers[1])
            {
                this.YScalerHeld = true
            }
            else
            if (object == this.transformScalers[2])
            {
                this.ZScalerHeld = true
            }
            else
            if (object == this.transformRotators[0])
            {
                this.XRotatorHeld = true
            }
            else
            if (object == this.transformRotators[1])
            {
                this.YRotatorHeld = true
            }
            else
            if (object == this.transformRotators[2])
            {
                this.ZRotatorHeld = true
            }
            else
            if (object && object != this.selected)
            {
                this.selected = object
                this.objectInspector.needsUpdate = true
                this.sceneOutliner.needsUpdate = true
                this.sceneOutliner.scrollTo = true
                log (" - selected " + object.id)
            }
            else
            if (object && object == this.selected)
            {
                this.selected = null
                this.objectInspector.needsUpdate = true
                this.sceneOutliner.needsUpdate = true
                log (" - deselected " + object.id)
            }
        }

        const mouseDiff = (this.engine.input.mouseX - this.LastMouseX) + (this.engine.input.mouseY - this.LastMouseY)
        
        // WORKS
        const viewToWorld = this.engine.rendering.view.viewToWorld
        const lastMouseWorldPos = multiplyvm(vec4(this.LastMouseX, this.LastMouseY, 0.0, 1.0), viewToWorld);
        const thisMouseWorldPos = multiplyvm(vec4(this.engine.input.mouseX, this.engine.input.mouseY, 0.0, 1.0), viewToWorld)
        const worldSpaceDiff = subv(lastMouseWorldPos, thisMouseWorldPos)
        
        const editorAdjustSpeed = 0.01

        if (len(worldSpaceDiff) > 0.0 && this.selected)
        {
            // TRANSLATE
            if (this.XArrowHeld)
            {
                this.selected.transform.position[0] -= worldSpaceDiff[0] * editorAdjustSpeed
            }

            if (this.YArrowHeld)
            {
                this.selected.transform.position[1] -= worldSpaceDiff[1] * editorAdjustSpeed
            }

            if (this.ZArrowHeld)
            {
                this.selected.transform.position[2] -= worldSpaceDiff[2] * editorAdjustSpeed
            }

            if (this.XArrowHeld || this.YArrowHeld || this.ZArrowHeld)
            {
                this.selected.transform.dirty = true
                this.selected.transform.rotationDirty = true
                this.objectInspector.needsUpdate = true
            }

            // SCALE - ISSUE
            if (this.XScalerHeld)
            {
                this.selected.transform.scale[0] -= worldSpaceDiff[0] * editorAdjustSpeed
            }

            if (this.YScalerHeld)
            {
                this.selected.transform.scale[1] -= worldSpaceDiff[1] * editorAdjustSpeed
            }

            if (this.ZScalerHeld)
            {
                this.selected.transform.scale[2] -= worldSpaceDiff[2] * editorAdjustSpeed
            }

            if (this.XScalerHeld || this.YScalerHeld || this.ZScalerHeld)
            {
                this.selected.transform.dirty = true
                this.selected.transform.rotationDirty = true
                this.objectInspector.needsUpdate = true
            }

            // ROTATE

        }

        // SCALES IN LOCAL SPACE, NOT WORLD
        /*
        if (this.selected && this.XScalerHeld)
        {
            this.selected.transform.scale[0] += mouseDiff * 0.01
            this.selected.transform.dirty = true
            this.selected.transform.rotationDirty = true
            this.objectInspector.needsUpdate = true
        }

        if (this.selected && this.YScalerHeld)
        {
            this.selected.transform.scale[1] += mouseDiff * 0.01
            this.selected.transform.dirty = true
            this.selected.transform.rotationDirty = true
            this.objectInspector.needsUpdate = true
        }

        if (this.selected && this.ZScalerHeld)
        {
            this.selected.transform.scale[2] -= mouseDiff * 0.01
            this.selected.transform.dirty = true
            this.selected.transform.rotationDirty = true
            this.objectInspector.needsUpdate = true
        }
        */

        if (this.selected && this.XRotatorHeld)
        {
            this.selected.transform.rotation[0] += mouseDiff * 0.01
            this.selected.transform.rotationDirty = true
            this.selected.transform.dirty = true
            this.objectInspector.needsUpdate = true
        }

        if (this.selected && this.YRotatorHeld)
        {
            this.selected.transform.rotation[2] += mouseDiff * 0.01
            this.selected.transform.rotationDirty = true
            this.selected.transform.dirty = true
            this.objectInspector.needsUpdate = true
        }

        if (this.selected && this.ZRotatorHeld)
        {
            this.selected.transform.rotation[1] -= mouseDiff * 0.01
            this.selected.transform.rotationDirty = true
            this.selected.transform.dirty = true
            this.objectInspector.needsUpdate = true
        }

        if (this.selected && this.engine.input.BackspacePressed)
        {
            this.engine.scene.remove(this.selected.id)
            this.updateAllPanels = true
            this.sceneOutliner.scrollTo = false
            this.lastDelete = this.selected
            this.selected = null
        }

        if (this.engine.input.CmdPressed && this.engine.input.DPressed)
        {
            if (this.selected)
            {
                this.selected = this.engine.scene.create(
                    this.selected.constructor.name,
                    new Transform(
                        vec3(this.selected.transform.scale[0], this.selected.transform.scale[1],this.selected.transform.scale[2]),
                        vec3(this.selected.transform.position[0] + 1.0,this.selected.transform.position[1],this.selected.transform.position[2]),
                        vec3(this.selected.transform.rotation[0],this.selected.transform.rotation[1],this.selected.transform.rotation[2])))
                this.updateAllPanels = true
                this.sceneOutliner.scrollTo = true
            }
        }

        if (this.engine.input.CmdPressed && this.engine.input.ZPressed)
        {
            if (this.lastDelete)
            {
                this.engine.scene.add(this.lastDelete)
                this.selected = this.lastDelete
                this.updateAllPanels = true
                this.sceneOutliner.scrollTo = true
                this.engine.input.ZPressed
            }
            this.lastDelete = null
        }

        if (this.selected)
        {   
            for (var g = 0; g < this.gizmos.length; ++g)
            {
                for (var i = 0; i < 3; ++i)
                {
                    this.gizmos[g][i].transform.position = this.selected.transform.getWorldPosition()
                    this.gizmos[g][i].transform.rotationDirty = true
                    this.gizmos[g][i].transform.dirty = true
                    this.gizmos[g][i].transform.update()
                    this.gizmos[g][i].visible = g == this.currentGizmo
                }
            }
        }
        else
        {
            for (var g = 0; g < this.gizmos.length; ++g)
            {
                for (var i = 0; i < 3; ++i)
                {
                    this.gizmos[g][i].visible = false
                }
            }
        }

        // UPDATE PANNELS
        if (this.updateAllPanels)
        {
            this.sceneOutliner.needsUpdate = true
            this.objectInspector.needsUpdate = true
        }

        if (this.editorShowing)
        {
            this.objectInspector .update()
            this.renderSettings  .update()
            this.sceneOutliner   .update()
        }

        if (this.statsShowing)
        {
            this.stats           .update()
        }

        this.updateAllPanels = false
        this.frametime.add(Date.now() - editorStart)

        this.LastMouseX = this.engine.input.mouseX
        this.LastMouseY = this.engine.input.mouseY

        if (!this.engine.input.leftMouseHeld)
        {
            this.XArrowHeld = false
            this.YArrowHeld = false
            this.ZArrowHeld = false           
            this.XScalerHeld = false
            this.YScalerHeld = false
            this.ZScalerHeld = false
            this.XRotatorHeld = false
            this.YRotatorHeld = false
            this.ZRotatorHeld = false
        }
    }

    hideEditor()
    {
        
        var editorPanes = document.getElementsByClassName("editor")
        for (var i = 0; i < editorPanes.length; ++i)
        {
            editorPanes[i].style.opacity = 0.0;
        }

        this.canvas.style.width = "100%"
        this.canvas.style.height = "100%"
        this.canvas.style.top = 0

        this.editorShowing = false

        this.engine.rendering.allocateRenderTargets()
        
        this.canvas.addEventListener("click", this.lockMouseOnClick);
        this.canvas.click()
    }

    showEditor()
    {
        var editorPanes = document.getElementsByClassName("editor")
        for (var i = 0; i < editorPanes.length; ++i)
        {
            editorPanes[i].style.opacity = 1.0;
        }

        this.canvas.style.width = "70%"
        this.canvas.style.height = "75%"

        this.editorShowing = true

        this.engine.rendering.allocateRenderTargets()

        this.canvas.removeEventListener("click", this.lockMouseOnClick);
        document.exitPointerLock()
    }

    hideStats()
    {
        document.getElementById("ui").style.opacity = 0.0

        this.statsShowing = false
    }

    showStats()
    {
        document.getElementById("ui").style.opacity = 1.0

        this.statsShowing = true
    }

    hideConsole ()
    {
        document.getElementById("bottombar").style.height = "0%"
        this.canvas.style.height = "100%"
        this.consoleShowing = false

        this.engine.rendering.allocateRenderTargets()
    }

    showConsole ()
    {
        document.getElementById("bottombar").style.height = "25%"
        this.canvas.style.height = "75%"
        this.consoleShowing = true

        this.engine.rendering.allocateRenderTargets()
    }
}
