class CollisionComponent extends Component
{
    constructor ()
    {
        super ()
    }
}

class SphereCollisionComponent extends CollisionComponent
{
    constructor (radius)
    {
        super()
        this.type = "SphereCollisionComponent"
        this.radius = radius
    }
}

class BoxCollisionComponent extends CollisionComponent
{
    constructor (x, y, z)
    {
        super()
        this.type = "BoxCollisionComponent"
        this.extents = [x, y, z]
    }
}

class PlaneCollisionComponent extends CollisionComponent
{
    constructor (n, p = vec3(0.0, 0.0, 0.0))
    {
        super()
        this.type = "PlaneCollisionComponent"
        this.normal = n
        this.transform.position = p
    }
}

class CylinderCollisionComponent extends CollisionComponent
{
    constructor(height, radius)
    {
        super()
        this.type = "CylinderCollisionComponent"
        this.height = height
        this.radius = radius
    }
}

function collisionTestSphereSphere(a, b)
{
    let mindist = a.radius + b.radius
    let dist = len(subv(a.transform.getWorldPosition(), b.transform.getWorldPosition()))
    return (dist < mindist)
}

function collisionTestBoxSphere(a, b)
{
    const APosition = a.transform.getWorldPosition()
    const AScale = a.transform.getWorldScale()

    const BPosition = b.transform.getWorldPosition()    

    const RightPlaneNormalWS    = normalize(multiplyvm(vec4(1.0, 0.0, 0.0,  0.0), a.transform.matrix()))
    const TopPlaneNormalWS      = cross(cross(RightPlaneNormalWS, vec4(0.0, 1.0, 0.0, 0.0)), RightPlaneNormalWS)
    const FrontPlaneNormalWS    = (cross(RightPlaneNormalWS, TopPlaneNormalWS))

    const LeftPlaneNormalWS     = multiplys(RightPlaneNormalWS, -1.0)
    const BottomPlaneNormalWS   = multiplys(TopPlaneNormalWS,   -1.0)
    const BackPlaneNormalWS     = multiplys(FrontPlaneNormalWS, -1.0)

    const RightPlaneNormal      = vec3(RightPlaneNormalWS  [0], RightPlaneNormalWS  [1], RightPlaneNormalWS  [2])
    const LeftPlaneNormal       = vec3(LeftPlaneNormalWS   [0], LeftPlaneNormalWS   [1], LeftPlaneNormalWS   [2])
    const TopPlaneNormal        = vec3(TopPlaneNormalWS    [0], TopPlaneNormalWS    [1], TopPlaneNormalWS    [2])
    const BottomPlaneNormal     = vec3(BottomPlaneNormalWS [0], BottomPlaneNormalWS [1], BottomPlaneNormalWS [2])
    const FrontPlaneNormal      = vec3(FrontPlaneNormalWS  [0], FrontPlaneNormalWS  [1], FrontPlaneNormalWS  [2])
    const BackPlaneNormal       = vec3(BackPlaneNormalWS   [0], BackPlaneNormalWS   [1], BackPlaneNormalWS   [2])

    const RightPlanePosition  = addv(APosition, multiplys(RightPlaneNormal,   a.extents[0] * AScale[0]))
    const LeftPlanePosition   = addv(APosition, multiplys(LeftPlaneNormal,    a.extents[0] * AScale[0]))
    const TopPlanePosition    = addv(APosition, multiplys(TopPlaneNormal,     a.extents[1] * AScale[1]))
    const BottomPlanePosition = addv(APosition, multiplys(BottomPlaneNormal,  a.extents[1] * AScale[1]))
    const FrontPlanePosition  = addv(APosition, multiplys(FrontPlaneNormal,   a.extents[2] * AScale[2]))
    const BackPlanePosition   = addv(APosition, multiplys(BackPlaneNormal,    a.extents[2] * AScale[2]))

    const RightPlaneDist        = dot(subv(BPosition, RightPlanePosition),  RightPlaneNormal)
    const LeftPlaneDist         = dot(subv(BPosition, LeftPlanePosition),   LeftPlaneNormal)
    const TopPlaneDist          = dot(subv(BPosition, TopPlanePosition),    TopPlaneNormal)
    const BottomPlaneDist       = dot(subv(BPosition, BottomPlanePosition), BottomPlaneNormal)
    const FrontPlaneDist        = dot(subv(BPosition, FrontPlanePosition),  FrontPlaneNormal)
    const BackPlaneDist         = dot(subv(BPosition, BackPlanePosition),   BackPlaneNormal)

    const collision = 
        RightPlaneDist  <= b.radius && LeftPlaneDist   <= b.radius &&
        TopPlaneDist    <= b.radius && BottomPlaneDist <= b.radius && 
        FrontPlaneDist  <= b.radius && BackPlaneDist   <= b.radius

    if (!collision)
    {
        return { hit: false, normal: vec3(0.0, 0.0, 0.0) }
    }
    else
    {
        let normal = null

        // bit buggy
        let biggest = Math.max( RightPlaneDist, LeftPlaneDist, TopPlaneDist, BottomPlaneDist, FrontPlaneDist, BackPlaneDist )
        if (biggest == TopPlaneDist)
        {
            normal = TopPlaneNormal
        }
        else
        if (biggest == BottomPlaneDist)
        {
            normal = BottomPlaneNormal
        }
        else
        if (biggest == RightPlaneDist)
        {
            normal = RightPlaneNormal
        }
        else
        if (biggest == LeftPlaneDist)
        {
            normal = LeftPlaneNormal
        }
        else
        if (biggest == BackPlaneDist)
        {
            normal = BackPlaneNormal
        }
        else
        if (biggest == FrontPlaneDist)
        {
            normal = FrontPlaneNormal
        }

        return { hit: true, normal: normal }
    }
}

function collisionTestCylinderSphere(a, b)
{
    const APosition = a.transform.getWorldPosition()
    const AScale = a.transform.getWorldScale()

    const BPosition = b.transform.getWorldPosition()    

    const RightPlaneNormalWS    = normalize(multiplyvm(vec4(1.0, 0.0, 0.0,  0.0), a.transform.matrix()))
    const TopPlaneNormalWS      = cross(cross(RightPlaneNormalWS, vec4(0.0, 1.0, 0.0, 0.0)), RightPlaneNormalWS)
    const FrontPlaneNormalWS    = cross(RightPlaneNormalWS, TopPlaneNormalWS)

    const LeftPlaneNormalWS     = multiplys(RightPlaneNormalWS, -1.0)
    const BottomPlaneNormalWS   = multiplys(TopPlaneNormalWS,   -1.0)
    const BackPlaneNormalWS     = multiplys(FrontPlaneNormalWS, -1.0)

    const RightPlaneNormal      = vec3(RightPlaneNormalWS  [0], RightPlaneNormalWS  [1], RightPlaneNormalWS  [2])
    const LeftPlaneNormal       = vec3(LeftPlaneNormalWS   [0], LeftPlaneNormalWS   [1], LeftPlaneNormalWS   [2])
    const TopPlaneNormal        = vec3(TopPlaneNormalWS    [0], TopPlaneNormalWS    [1], TopPlaneNormalWS    [2])
    const BottomPlaneNormal     = vec3(BottomPlaneNormalWS [0], BottomPlaneNormalWS [1], BottomPlaneNormalWS [2])
    const FrontPlaneNormal      = vec3(FrontPlaneNormalWS  [0], FrontPlaneNormalWS  [1], FrontPlaneNormalWS  [2])
    const BackPlaneNormal       = vec3(BackPlaneNormalWS   [0], BackPlaneNormalWS   [1], BackPlaneNormalWS   [2])

    const RightPlanePosition  = addv(APosition, multiplys(RightPlaneNormal,   a.radius * AScale[0]))
    const LeftPlanePosition   = addv(APosition, multiplys(LeftPlaneNormal,    a.radius * AScale[0]))
    const TopPlanePosition    = addv(APosition, multiplys(TopPlaneNormal,     a.height * AScale[1]))
    const BottomPlanePosition = addv(APosition, multiplys(BottomPlaneNormal,  a.height * AScale[1]))
    const FrontPlanePosition  = addv(APosition, multiplys(FrontPlaneNormal,   a.radius * AScale[2]))
    const BackPlanePosition   = addv(APosition, multiplys(BackPlaneNormal,    a.radius * AScale[2]))

    const RightPlaneDist        = dot(subv(BPosition, RightPlanePosition),  RightPlaneNormal)
    const LeftPlaneDist         = dot(subv(BPosition, LeftPlanePosition),   LeftPlaneNormal)
    const TopPlaneDist          = dot(subv(BPosition, TopPlanePosition),    TopPlaneNormal)
    const BottomPlaneDist       = dot(subv(BPosition, BottomPlanePosition), BottomPlaneNormal)
    const FrontPlaneDist        = dot(subv(BPosition, FrontPlanePosition),  FrontPlaneNormal)
    const BackPlaneDist         = dot(subv(BPosition, BackPlanePosition),   BackPlaneNormal)

    const TubeDist =  len(subv(vec2(APosition[0], APosition[2]),  vec2(BPosition[0], BPosition[2])))

    const BoxCollision = 
        TopPlaneDist <= b.radius && BottomPlaneDist <= b.radius &&
        LeftPlaneDist <= b.radius && RightPlaneDist <= b.radius &&
        FrontPlaneDist <= b.radius && BackPlaneDist <= b.radius

    const TubeCollision = TubeDist <= (a.radius + b.radius)

    if (BoxCollision && TubeCollision)
    {
        let normal = null

        let biggest = Math.max( RightPlaneDist, LeftPlaneDist, TopPlaneDist, BottomPlaneDist, FrontPlaneDist, BackPlaneDist )
        if (biggest == TopPlaneDist)
        {
            normal = TopPlaneNormal
        }
        else
        if (biggest == BottomPlaneDist)
        {
            normal = BottomPlaneNormal
        }
        else
        {
            const between2D = normalize(subv(vec2(BPosition[0], BPosition[2]), vec2(APosition[0], APosition[2])))
            normal = vec3(between2D[0], 0.0, between2D[1])
        }

        return { hit: true, normal: normal }
    }
    else
    {
        return { hit: false, normal: vec3(0.0, 0.0, 0.0) }
    }
}

function collisionTestBoxBox(a, b)
{
    const colliding = a.transform.getWorldPosition()[0] <  b.transform.getWorldPosition()[0]       + (b.extents [0]*2.0)  &&
                      a.transform.getWorldPosition()[0] + (a.extents [0]*2.0)  >  b.transform.getWorldPosition()[0]       &&
                      a.transform.getWorldPosition()[1] <  b.transform.getWorldPosition()[1]       + (b.extents [1]*2.0)  &&
                      a.transform.getWorldPosition()[1] + (a.extents [1]*2.0)  >  b.transform.getWorldPosition()[1]       &&
                      a.transform.getWorldPosition()[2] <  b.transform.getWorldPosition()[2]       + (b.extents [2]*2.0)  &&
                      a.transform.getWorldPosition()[2] + (a.extents [2]*2.0)  >  b.transform.getWorldPosition()[2];

    var between = subv(a.transform.getWorldPosition(), b.transform.getWorldPosition())
    var s = dividev(vec3(1.0, 1.0, 1.0), a.extents)
    between = multiplyv(between, s)
    between = normalize(between)
    var normal = dominantAxis(between)

    return { hit: colliding, normal: normal }
}

function collisionTestPlaneSphere(a, b)
{
  //  log ("testing plane: " + a.normal)

    const p = a.transform.getWorldPosition()
    const q = b.transform.getWorldPosition()
    const n = a.normal
    const dist = dot(subv(q, p), n)

    return { hit: dist <= b.radius, normal: n }
}

function test(a, b)
{
    if (a instanceof SphereCollisionComponent && b instanceof BoxCollisionComponent)
    {
        const collis = collisionTestBoxSphere(b, a)
        return {
            hit: collis.hit,
            normal: collis.normal
        }
    }

    if (a instanceof BoxCollisionComponent && b instanceof SphereCollisionComponent)
    {
        const collis = collisionTestBoxSphere(a, b)
        return {
            hit: collis.hit,
            normal: collis.normal
        }
    }

    if (a instanceof SphereCollisionComponent && b instanceof CylinderCollisionComponent)
    {
        const collis = collisionTestCylinderSphere(b, a)
        return {
            hit: collis.hit,
            normal: collis.normal
        }
    }

    if (a instanceof CylinderCollisionComponent && b instanceof SphereCollisionComponent)
    {
        const collis = collisionTestCylinderSphere(a, b)
        return {
            hit: collis.hit,
            normal: collis.normal
        }
    }

    if (a instanceof SphereCollisionComponent && b instanceof SphereCollisionComponent)
    {
        return { 
            hit: collisionTestSphereSphere(a, b),
            normal: normalize(subv(a.transform.getWorldPosition(), b.transform.getWorldPosition()))}
    }

    if (a instanceof BoxCollisionComponent && b instanceof BoxCollisionComponent)
    {
        const collis = collisionTestBoxBox(a, b)
        return {
            hit: collis.hit,
            normal: collis.normal
        }
    }

    if (a instanceof SphereCollisionComponent && b instanceof PlaneCollisionComponent)
    {
        const collis = collisionTestPlaneSphere(b, a)
        return {
            hit: collis.hit,
            normal: collis.normal
        }
    }

    if (a instanceof PlaneCollisionComponent && b instanceof SphereCollisionComponent)
    {
        const collis = collisionTestPlaneSphere(a, b)
        return {
            hit: collis.hit,
            normal: collis.normal
        }
    }

    return { hit: false, normal: vec3(0.0, 0.0, 0.0) }
}