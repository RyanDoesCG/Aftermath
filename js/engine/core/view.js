class View
{
    constructor(position, rotation, width = 0, height = 0, aspect = 0, near = 0, far = 0, fov = 0, jitter = 0)
    {
        this.position    = position
        this.rotation    = rotation
        this.near        = near
        this.far         = far
        this.fov         = fov
        this.projection  = perspective(fov, near, far, width, height, aspect, jitter)
        this.projectionNoJitter  = perspective(fov, near, far, width, height, aspect, false)
        this.worldToView = identity()
        this.worldToView = multiplym(translate (-position[0], -position[1], -position[2]), this.worldToView)
        this.worldToView = multiplym(rotate    (-rotation[0], -rotation[1], -rotation[2]), this.worldToView) 
        this.viewToWorld = identity()
        this.viewToWorld = multiplym(translate( position[0],  position[1],  position[2]), this.viewToWorld)
        this.viewToWorld = multiplym(rotateRev( rotation[0],  rotation[1],  rotation[2]), this.viewToWorld)
        this.forward     = normalize(multiplyvm(vec4(0.0, 0.0, -1.0, 0.0), this.viewToWorld))
        this.right       = normalize(multiplyvm(vec4(1.0, 0.0,  0.0, 0.0), this.viewToWorld))
        this.up          = normalize(multiplyvm(vec4(0.0, 1.0,  0.0, 0.0), this.viewToWorld))
    }
}