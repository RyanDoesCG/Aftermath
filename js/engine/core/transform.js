class Transform 
{
    constructor (scaling, position, rotation)
    {
        this.scale    = scaling
        this.position = position
        this.rotation = rotation

        this.parent   = null
        this.children = [] // breaks serialization

        this.dirty = true
        this.rotationDirty = true
        this.m = identity()
    }

    getParentPosition ()
    {
        if (this.parent)
        {
            return this.parent.position
        }
        else
        {
            return this.position
        }
    }

    getWorldPosition ()
    { 
        if (this.parent != null)
        {
            const pos = vec4(this.position[0], this.position[1], this.position[2], 1.0)
            const res = multiplyvm(pos, this.parent.matrix())
            return vec3(res[0], res[1], res[2])
        }

        return this.position
    }

    getWorldRotation ()
    {
        if (this.parent)
        {
            return addv(this.rotation, this.parent.getWorldRotation())
        }

        return this.rotation  
    }

    getWorldScale ()
    {
        if (this.parent)
        {
            return multiplyv(this.scale, this.parent.getWorldScale())
        }

        return this.scale  
    }

    update ()
    {
        //console.log("updated transform");

        //null.x
        if (this.dirty)
        {
            this.m = identity()

            // Scale
            this.m = multiplym(scale(this.scale[0], this.scale[1], this.scale[2]), this.m)

            var p = this.parent
            while (p)
            {
                this.m = multiplym(scale(p.scale[0], p.scale[1], p.scale[2]), this.m)
                p = p.parent
            }

            // Rotate
            if (this.rotationDirty)
            {
                this.m = multiplym(rotate(this.rotation[0], this.rotation[1], this.rotation[2]), this.m)

                var p = this.parent
                while (p) 
                {
                    this.m = multiplym(rotate(p.rotation[0], p.rotation[1], p.rotation[2]), this.m)
                    p = p.parent
                }
            }
    
            // Translate
            this.m = multiplym(translate(this.position[0], this.position[1], this.position[2]), this.m)

            var p = this.parent
            while (p)       
            {
                this.m = multiplym(translate(p.position[0], p.position[1], p.position[2]), this.m)
                p = p.parent
            }

            for (var i = 0; i < this.children.length; ++i)
            {
                this.children[i].rotationDirty = this.rotationDirty
                this.children[i].dirty = true
                this.children[i].update()
            }
            
            this.rotationDirty = false
            this.dirty = false
        }
    }

    matrix ()
    {
        return this.m
    }

    inverse ()
    {
        var inv = identity()
        inv = multiplym(translate(-this.position[0], -this.position[1], -this.position[2]), inv)
        inv = multiplym(rotateRev(-this.rotation[0], -this.rotation[1], -this.rotation[2]), inv)
        inv = multiplym(scale(-this.scale[0], -this.scale[1], -this.scale[2]), inv)
        return inv
    }

    toString()
    {
        return "<p>Position</p>" + "<textarea class=\"vectorComponent\">" + this.position[0].toFixed(2) + "</textarea><textarea class=\"vectorComponent\">" + this.position[1].toFixed(2) + "</textarea><textarea class=\"vectorComponent\">" + this.position[2].toFixed(2) + "</textarea></br>" +
               "<p>Rotation</p>" + "<textarea class=\"vectorComponent\">" + this.rotation[0].toFixed(2) + "</textarea><textarea class=\"vectorComponent\">" + this.rotation[1].toFixed(2) + "</textarea><textarea class=\"vectorComponent\">" + this.rotation[2].toFixed(2) + "</textarea></br>" +
               "<p>Scale</p>" + "<textarea class=\"vectorComponent\">" + this.scale[0].toFixed(2) + "</textarea><textarea class=\"vectorComponent\">" + this.scale[1].toFixed(2) + "</textarea><textarea class=\"vectorComponent\">" + this.scale[2].toFixed(2) + "</textarea></br>"
    }
}

function Scale       (x, y, z) { return [x, y, z] }
function Translation (x, y, z) { return [x, y, z] }
function Rotation    (x, y, z) { return [x*3.14195, y*3.14195, z*3.14195] } // 1 == 180deg