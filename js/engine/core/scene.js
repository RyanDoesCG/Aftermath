//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* 

class Entity
{
    constructor()
    {
        this.id        = -1   // assigned when joining a scene
        this.name      = -1   // index into scene.components.names arrays      -----------
        this.render    = -1   // index into scene.components.renders arrays    --------- |
        this.physics   = -1   // index into scene.components.physics arrays    ------- | |
        this.collision = -1   // index into scene.components.collisions arrays ----- | | |
        this.transform = -1   // index into scene.components.transforms arrays --- | | | |
    }                         //                                                 | | | | |
}                             //                                                 | | | | |
                              //                                                 | | | | |
class Components              //                                                 | | | | |
{                             //                                                 | | | | |
    constructor()             //                                                 | | | | |
    {                         //  These would still need to be                   | | | | |
                              //  constructed somehow                            | | | | |
        this.names      = []  // <-----------------------------------------------|-|-|-|--
        this.renders    = []  // <-----------------------------------------------|-|-|--
        this.physics    = []  // <-----------------------------------------------|-|--
        this.collisions = []  // <-----------------------------------------------|--
        this.transforms = []  // <------------------------------------------------
    }

    update (d) { }sa
}

class Scene
{
    constructor()
    {
        this.entities   = []
        this.components = new Components()
    }

    update (engine) { }
}

class Component
{
    update (engine) { }
}
 */

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class SceneObject
{
    constructor (params)
    {
        this.name   = params.name
        this.id     = -1

        this.transform = params.transform

        this.components = []
        this.addComponent(params.render)
        this.addComponent(params.physics)
        this.addComponent(params.collision)

        this.physicsComponent = params.physics
        this.collisionComponent = params.collision

        this.hovered = false

        this.editor = params.editor
        this.visible = true

        this.ticks = true
    }

    addComponent (component) 
    {
        if (component)
        {
            this.components.push(component)
            component.transform.parent = this.transform
            this.transform.children.push(component.transform)
            component.id = this.id

            if (component instanceof PhysicsComponent)
            {
                this.physicsComponent = component
            }

            if (component instanceof CollisionComponent)
            {
                this.collisionComponent = component
            }
        }
    }

    getRenderComponents ()
    {
        var results = []
        for (var i = 0; i < this.components.length; ++i)
        {
            if (this.components[i] instanceof RenderComponent)
            {
                results.push(this.components[i])
            }
        }
        return results;
    }

    getPhysicsComponent ()
    {
        return this.physicsComponent
        /*
        for (var i = 0; i < this.components.length; ++i)
            if (this.components[i] instanceof PhysicsComponent)
                return this.components[i]
        return null
        */
    }

    removePhysicsComponent()
    {
        for (var i = 0; i < this.components.length; ++i)
            if (this.components[i] instanceof PhysicsComponent)
                this.components.splice(i, 1)
    }

    getCollisionComponent ()
    {
        return this.collisionComponent
        /*
        for (var i = 0; i < this.components.length; ++i)
            if (this.components[i] instanceof CollisionComponent)
                return this.components[i]
        return null
        */
    }

    removeCollisionComponent()
    {
        for (var i = 0; i < this.components.length; ++i)
            if (this.components[i] instanceof CollisionComponent)
                this.components.splice(i, 1)
    }

    onHoverStart () { }
    onHoverStop  () { }
    onClickStart () { }
    onClickStop  () { }
    onDrag       () { }
    update       () { }
}

class Scene 
{
    constructor (engine)
    {
        this.objects = []
        this.engine = engine

        this.frametime = new RunningAverage()

        this.nextID = 0

        this.types = new Map()
        this.types.set("Sky",                (engine, transform) => { return new Sky(engine, transform) })
        this.types.set("Grass",              (engine, transform) => { return new Grass(engine, transform) })
        this.types.set("Cube",               (engine, transform) => { return new Cube(engine, transform) })
        this.types.set("DirectionalLight",   (engine, transform) => { return new DirectionalLight(engine, transform) })
        
        this.add(new EditorCamera({
            name : "EditorCamera",
            transform : new Transform(Scale(1.0, 1.0, 1.0), Translation(9.0, 5.0, 6.0), Rotation(-0.08, 0.35, 0.0)) }))

    }

    save ()
    {
        const link = document.createElement("a");
        const content = []

        this.traverse((object) => 
            {
                if (!object.editor)
                {
                    content.push([object.constructor.name, 
                        {
                            "position":object.transform.position,
                            "rotation":object.transform.rotation,
                            "scale":object.transform.scale
                        }
                        ])
                }
            })

        const string = JSON.stringify(content)
        const file = new Blob([string], { type: 'text/plain' });
        link.href = URL.createObjectURL(file);
        link.download = "level.json";
        link.click();
        URL.revokeObjectURL(link.href);
        
        writeValueToCookie("scene", string)
    }

    load ()
    {
        const file = readValueFromCookie("scene")

        log (file)
        const content = (JSON.parse(file))

        for (var i = 0; i < content.length; ++i)
        {
            log ("creating: "+ JSON.stringify(content[i][1]))
            this.create(
                content[i][0], 
                new Transform(
                    content[i][1]["scale"],
                    content[i][1]["position"],
                    content[i][1]["rotation"]
                ))
        }
    }

    spawn (string)
    {
        this.clearNonEditorObjects ()

        const content = (JSON.parse(string))

        for (var i = 0; i < content.length; ++i)
        {
            log ("creating: "+ JSON.stringify(content[i][1]))
            this.create(
                content[i][0], 
                new Transform(
                    content[i][1]["scale"],
                    content[i][1]["position"],
                    content[i][1]["rotation"]
                ))
        }
    }

    create (type, transform)
    {
        const object = this.types.get(type)(this.engine, transform)
        this.add(object)
        return object
    }

    add (object)
    {
        object.id = this.nextID
        for (var i = 0; i < object.components.length; ++i)
        {
            object.components[i].id = object.id
        }
        
        this.objects.push(object)
        this.nextID++

        if (this.engine.editor)
            this.engine.editor.updateAllPanels = true
    }

    remove(id)
    {
        for (var i = 0; i < this.objects.length; ++i)
        {
            if (this.objects[i].id == id)
            {
                this.objects.splice(i, 1)
            }
        }
    }

    find (name)
    {
        for (var i = 0; i < this.objects.length; ++i)
            if (this.objects[i].name == name)
                return this.objects[i]

        return null;
    }

    get (id)
    {
        for (var i = 0; i < this.objects.length; ++i)
            if (this.objects[i].id == id)
                return this.objects[i]

        return null;
    }

    traverse (func)
    {
        for (var i = 0; i < this.objects.length; ++i)
        {
            func(this.objects[i])
        }
    }

    pairs (func)
    {
        for (var i = 0; i < this.objects.length; ++i)
        {
            for (var j = i + 1; j < this.objects.length; ++j)
            {
                func(this.objects[i], this.objects[j])
            }
        }
    }

    update ()
    {
        let start = Date.now()

        this.traverse((object) => 
        {
            if (object.ticks)
                object.update(this.engine)
        })

        this.frametime.add(Date.now() - start)
    }

    clearNonEditorObjects ()
    {
        const editorObjects = []
        for (var i = 0; i < this.objects.length; ++i)
        {
            if (this.objects[i].editor)
            {
                editorObjects.push(this.objects[i])
            }
        }

        this.objects = editorObjects
    }

    getEditorCamera () 
    {
        for (var i = 0; i < this.objects.length; ++i)
        {
            if (this.objects[i] instanceof EditorCamera)
            {
                return this.objects[i]
            }
        }
    }

    getGameCamera ()
    {
        for (var i = 0; i < this.objects.length; ++i)
        {
            if (this.objects[i] instanceof Camera && !this.objects[i].editor)
            {
                return this.objects[i]
            }
        } 

        return this.getEditorCamera()
    }

    getDirectionalLight ()
    {        
        for (var i = 0; i < this.objects.length; ++i)
            for (var j = 0; j < this.objects[i].components.length; ++j)
                if (this.objects[i].components[j] instanceof DirectionalLightComponent)
                    return this.objects[i].components[j]
    }

    getPointLights (viewpos)
    {
        var results = []
        for (var i = 0; i < this.objects.length; ++i)
            for (var j = 0; j < this.objects[i].components.length; ++j)
                if (this.objects[i].components[j] instanceof PointLightComponent)
                    results.push(this.objects[i].components[j])

        results.sort((a, b) => 
        { 
            const distanceFromCameraA = len(subv(viewpos, a.transform.getWorldPosition()))
            const distanceFromCameraB = len(subv(viewpos, b.transform.getWorldPosition())) 
            return distanceFromCameraA > distanceFromCameraB;
        })

        return results
    }

    getSpotLights (viewpos)
    {
        var results = []
        for (var i = 0; i < this.objects.length; ++i)
            for (var j = 0; j < this.objects[i].components.length; ++j)
                if (this.objects[i].components[j] instanceof SpotLightComponent)
                    results.push(this.objects[i].components[j])

        results.sort((a, b) => 
        { 
            const distanceFromCameraA = len(subv(viewpos, a.transform.getWorldPosition()))
            const distanceFromCameraB = len(subv(viewpos, b.transform.getWorldPosition())) 
            return distanceFromCameraA > distanceFromCameraB;
        })

        return results
    }

    getPostProcessObject ()
    {
        for (var i = 0; i < this.objects.length; ++i)
        if (this.objects[i] instanceof PostProcessObject)
            return this.objects[i]
    }

    batchMeshes (objectCondition, componentCondition)
    {
        const batches = new Map()
        this.traverse((object) => 
        {
            if (objectCondition(object))
            {
                const components = object.getRenderComponents()
                for (var i = 0; i < components.length; ++i)
                {
                    if (componentCondition(components[i]))
                    {
                        const material = components[i].material
                        const geometry = components[i].geometry
    
                        if (batches.has(geometry + material))
                        {
                            if (batches.get(geometry + material).length >= 128)
                            {
                                // batch full, check for overflow batch
                                if (batches.has(geometry + material + "overflow"))
                                {
                                    if (batches.get(geometry + material + "overflow").length >= 128)
                                    {
                                        log ("batch exhausted");
                                    }

                                    batches.get(geometry + material + "overflow").push(components[i])
                                }
                                else
                                {
                                    batches.set(geometry + material + "overflow", [ components[i] ])
                                }
                            }
                            else
                            {
                                batches.get(geometry + material).push(components[i])
                            }
                        }
                        else
                        {
                            batches.set(geometry + material, [ components[i] ])
                        }
                    }
                }
            }
        })

        return batches
    }
}