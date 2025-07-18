class Geometry 
{
    constructor (gl, mesh)
    {
        this.mesh = mesh
        this.gl = gl

        this.VertexArrayObject = this.gl.createVertexArray()
        this.gl.bindVertexArray(this.VertexArrayObject)

        this.PositionBuffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.PositionBuffer)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.mesh.positions, this.gl.STATIC_DRAW)
        this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 0, 0)
        this.gl.enableVertexAttribArray(0);

        this.NormalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.NormalBuffer)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.mesh.normals, this.gl.STATIC_DRAW)
        this.gl.vertexAttribPointer(1, 3, this.gl.FLOAT, false, 0, 0)
        this.gl.enableVertexAttribArray(1);
        
        this.UVBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.UVBuffer)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.mesh.uvs, this.gl.STATIC_DRAW)
        this.gl.vertexAttribPointer(2, 2, this.gl.FLOAT, false, 0, 0)
        this.gl.enableVertexAttribArray(2);
    }

    draw (instances = 1)
    {
        this.gl.bindVertexArray(this.VertexArrayObject);
        this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, this.mesh.positions.length / 3, instances);   
    }
}


function objToMesh (t)
{
    const lines = t.split('\n')
    var uniquePositions = []
    var uniqueNormals = []
    var uniqueUvs = []
    var positions = []
    var normals = []
    var uvs = []
    for (var i = 0; i < lines.length; ++i)
    {
        const chunks = lines[i].split(' ')
        if (chunks[0] == 'v' ) uniquePositions.push([parseFloat(chunks[1]), parseFloat(chunks[2]), parseFloat(chunks[3])])
        else
        if (chunks[0] == 'vt') uniqueUvs.push([parseFloat(chunks[1]), parseFloat(chunks[2])])
        else
        if (chunks[0] == 'vn') uniqueNormals.push([parseFloat(chunks[1]), parseFloat(chunks[2]), parseFloat(chunks[3])])
        else
        if (chunks[0] == 'f')
        {
            const A = chunks[1].split('/')
            const B = chunks[2].split('/')
            const C = chunks[3].split('/')

            // quads
            if (chunks.length == 5)
            {
                const D = chunks[4].split('/')

                positions.push(...uniquePositions[parseInt(A[0]) - 1])
                normals.push(...uniqueNormals[parseInt(A[2]) - 1])
                if (uniqueUvs.length > 0) uvs.push(...uniqueUvs[parseInt(A[1]) - 1])
    
                positions.push(...uniquePositions[parseInt(B[0]) - 1])
                normals.push(...uniqueNormals[parseInt(B[2]) - 1])
                if (uniqueUvs.length > 0) uvs.push(...uniqueUvs[parseInt(B[1]) - 1])
    
                positions.push(...uniquePositions[parseInt(C[0]) - 1])
                normals.push(...uniqueNormals[parseInt(C[2]) - 1])
                if (uniqueUvs.length > 0) uvs.push(...uniqueUvs[parseInt(C[1]) - 1])
    
                positions.push(...uniquePositions[parseInt(C[0]) - 1])
                normals.push(...uniqueNormals[parseInt(C[2]) - 1])
                if (uniqueUvs.length > 0) uvs.push(...uniqueUvs[parseInt(C[1]) - 1])
    
                positions.push(...uniquePositions[parseInt(D[0]) - 1])
                normals.push(...uniqueNormals[parseInt(D[2]) - 1])
                if (uniqueUvs.length > 0) uvs.push(...uniqueUvs[parseInt(D[1]) - 1])
    
                positions.push(...uniquePositions[parseInt(A[0]) - 1])
                normals.push(...uniqueNormals[parseInt(A[2]) - 1])
                if (uniqueUvs.length > 0) uvs.push(...uniqueUvs[parseInt(A[1]) - 1])   
            }

            // tris
            if (chunks.length == 4)
            {
                positions.push(...uniquePositions[parseInt(A[0]) - 1])
                normals.push(...uniqueNormals[parseInt(A[2]) - 1])
                if (uniqueUvs.length > 0) uvs.push(...uniqueUvs[parseInt(A[1]) - 1])
    
                positions.push(...uniquePositions[parseInt(B[0]) - 1])
                normals.push(...uniqueNormals[parseInt(B[2]) - 1])
                if (uniqueUvs.length > 0) uvs.push(...uniqueUvs[parseInt(B[1]) - 1])
    
                positions.push(...uniquePositions[parseInt(C[0]) - 1])
                normals.push(...uniqueNormals[parseInt(C[2]) - 1])
                if (uniqueUvs.length > 0) uvs.push(...uniqueUvs[parseInt(C[1]) - 1])
            }
        }
    }

    // center and floor the mesh
    var centroid = [ 0.0, 0.0, 0.0 ]
    var lowestY = 100000.0
    /*
    for (var i = 0; i < positions.length; i += 3)
    {
        centroid[0] += positions[i + 0];
        centroid[1] += positions[i + 1];
        centroid[2] += positions[i + 2];

        if (positions[i + 1] < lowestY)
        {
            centroid[1] = positions[i + 1]
            lowestY = positions[i + 1]
        }
    }

    centroid[0] /= positions.length / 3.0;
    centroid[1] /= positions.length / 3.0;
    centroid[2] /= positions.length / 3.0;

    for (var i = 0; i < positions.length; i += 3)
    {
        positions[i + 0] -= centroid[0];
        positions[i + 1] -= lowestY;
        positions[i + 2] -= centroid[2];
    }
    */

    // compute extents
    var extents = [0,0,0]
    for (var i = 0; i < positions.length; i += 3)
    {
        extents[0] = Math.max(Math.abs(positions[i + 0]), extents[0])
        extents[1] = Math.max(Math.abs(positions[i + 1]), extents[1])
        extents[2] = Math.max(Math.abs(positions[i + 2]), extents[2])
    }

    return new Mesh( new Float32Array(positions), new Float32Array(normals), new Float32Array(uvs), extents)
}

//    
//          * A                     * A
//         / \                     / \
//        /   \        =>       F * - * D
//       /     \                 / \ / \
//    C * ------ * B          C * - * - * B
//                                   E
//   
function tesselate (mesh)
{
    var TesselatedBoxPositions = []
    var TesselatedBoxNormals = []
    var TesselatedBoxUVs = []
 
    // for each triangles positions
    for (var i = 0; i < mesh.positions.length; i += 9)
    {
        const pA = [mesh.positions[i + 0], mesh.positions[i + 1], mesh.positions[i + 2]]
        const pB = [mesh.positions[i + 3], mesh.positions[i + 4], mesh.positions[i + 5]]
        const pC = [mesh.positions[i + 6], mesh.positions[i + 7], mesh.positions[i + 8]]
        const pD = lerpv(pA, pB, 0.5)
        const pE = lerpv(pB, pC, 0.5)
        const pF = lerpv(pC, pA, 0.5)
        TesselatedBoxPositions.push(
            ...pA, ...pD, ...pF, 
            ...pD, ...pB, ...pE, 
            ...pE, ...pC, ...pF, 
            ...pF, ...pD, ...pE);
    }

    // for each triangles normals
    for (var i = 0; i < mesh.normals.length; i += 9)
    {
        const nA = [mesh.normals[i + 0], mesh.normals[i + 1], mesh.normals[i + 2]]
        const nB = [mesh.normals[i + 3], mesh.normals[i + 4], mesh.normals[i + 5]]
        const nC = [mesh.normals[i + 6], mesh.normals[i + 7], mesh.normals[i + 8]]
        const nD = lerpv(nA, nB, 0.5)
        const nE = lerpv(nB, nC, 0.5)
        const nF = lerpv(nC, nA, 0.5)
        TesselatedBoxNormals.push(
            ...nA, ...nD, ...nF, 
            ...nD, ...nB, ...nE, 
            ...nE, ...nC, ...nF, 
            ...nF, ...nD, ...nE);
    }
    
    // for each triangles uvs
    for (var i = 0; i < mesh.uvs.length; i += 6)
    {
        const tA = [ mesh.uvs[i + 0], mesh.uvs[i + 1] ]
        const tB = [ mesh.uvs[i + 2], mesh.uvs[i + 3] ]
        const tC = [ mesh.uvs[i + 4], mesh.uvs[i + 5] ]
        const tD = lerpv(tA, tB, 0.5)
        const tE = lerpv(tB, tC, 0.5)
        const tF = lerpv(tC, tA, 0.5)
        TesselatedBoxUVs.push(
            ...tA, ...tD, ...tF, 
            ...tD, ...tB, ...tE, 
            ...tE, ...tC, ...tF, 
            ...tF, ...tD, ...tE);
    }

    return new Mesh(
        new Float32Array(TesselatedBoxPositions), 
        new Float32Array(TesselatedBoxNormals), 
        new Float32Array(TesselatedBoxUVs))
}

function twoside (mesh)
{
    var BackfacePositions = []
    var BackfaceNormals = []
    var BackfaceUVs = []
 
    // for each triangles positions
    for (var i = 0; i < mesh.positions.length; i += 9)
    {   
        const pA = [mesh.positions[i + 0], mesh.positions[i + 1], mesh.positions[i + 2]]
        const pB = [mesh.positions[i + 3], mesh.positions[i + 4], mesh.positions[i + 5]]
        const pC = [mesh.positions[i + 6], mesh.positions[i + 7], mesh.positions[i + 8]]
        BackfacePositions.push(...pA, ...pB, ...pC);
        BackfacePositions.push(...pA, ...pC, ...pB);
    }

    for (var i = 0; i < mesh.normals.length; i += 9)
    {   
        const pA = [mesh.normals[i + 0], mesh.normals[i + 1], mesh.normals[i + 2]]
        const pB = [mesh.normals[i + 3], mesh.normals[i + 4], mesh.normals[i + 5]]
        const pC = [mesh.normals[i + 6], mesh.normals[i + 7], mesh.normals[i + 8]]
        BackfaceNormals.push(...pA, ...pB, ...pC);
        BackfaceNormals.push(...pA, ...pC, ...pB);
    }

    for (var i = 0; i < mesh.uvs.length; i += 6)
    {   
        const pA = [mesh.uvs[i + 0], mesh.uvs[i + 1]]
        const pB = [mesh.uvs[i + 2], mesh.uvs[i + 3]]
        const pC = [mesh.uvs[i + 4], mesh.uvs[i + 5]]
        BackfaceUVs.push(...pA, ...pB, ...pC);
        BackfaceUVs.push(...pA, ...pC, ...pB);
    }

    return new Mesh(
        new Float32Array(BackfacePositions),
        new Float32Array(BackfaceNormals),
        new Float32Array(BackfaceUVs))
}

let QuadMesh = new Mesh(
        new Float32Array([
            -1.0, -1.0, 0.0,  1.0, -1.0, 0.0, 1.0, 1.0, 0.0, 
            -1.0,  1.0, 0.0, -1.0, -1.0, 0.0, 1.0, 1.0, 0.0
        ]),
        new Float32Array([
            0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,  
            0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0
        ]),
        new Float32Array([
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 
            0.0, 1.0, 0.0, 0.0, 1.0, 1.0
        ]))

// BOX GEOMETRY
let BoxMesh = new Mesh(
    new Float32Array([
        -1.0, -1.0, -1.0,  1.0,  1.0, -1.0,  1.0, -1.0, -1.0,  
        -1.0,  1.0, -1.0,  1.0,  1.0, -1.0, -1.0, -1.0, -1.0,  
         1.0, -1.0, -1.0,  1.0,  1.0, -1.0,  1.0,  1.0,  1.0,    
         1.0, -1.0,  1.0,  1.0, -1.0, -1.0,  1.0,  1.0,  1.0, 
        -1.0,  1.0, -1.0, -1.0, -1.0, -1.0, -1.0,  1.0,  1.0,   
        -1.0, -1.0, -1.0, -1.0, -1.0,  1.0, -1.0,  1.0,  1.0, 
        -1.0, -1.0,  1.0,  1.0, -1.0,  1.0,  1.0,  1.0,  1.0,  
        -1.0,  1.0,  1.0, -1.0, -1.0,  1.0,  1.0,  1.0,  1.0,     
        -1.0,  1.0, -1.0,  1.0,  1.0,  1.0,  1.0,  1.0, -1.0,     
        -1.0,  1.0,  1.0,  1.0,  1.0,  1.0, -1.0,  1.0, -1.0,     
        -1.0, -1.0, -1.0,  1.0, -1.0, -1.0,  1.0, -1.0,  1.0,       
        -1.0, -1.0,  1.0, -1.0, -1.0, -1.0,  1.0, -1.0,  1.0
    ]),
    new Float32Array([ 
         0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0, 
         0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0, 
         1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0, 
         1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, 
         0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0, 
         0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0, 
         0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0, 
         0.0,  1.0,  0.0,  0.0,  1.0,  0.0,  0.0,  1.0,  0.0, 
         0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0, 
         0.0, -1.0,  0.0,  0.0, -1.0,  0.0,  0.0, -1.0,  0.0 
    ]),
    new Float32Array([ 
        0.0, 0.0, 1.0, 1.0, 1.0, 0.0,  
        0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 
        0.0, 1.0, 0.0, 0.0, 1.0, 1.0,  
        1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 
        0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 
        0.0, 1.0, 0.0, 0.0, 1.0, 1.0,  
        0.0, 0.0, 1.0, 1.0, 1.0, 0.0, 
        0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0,  
        0.0, 1.0, 0.0, 0.0, 1.0, 1.0 
    ]))

// SPHERE GEOMETRY
let SphereMesh = function ()
{
    let mesh = new Mesh(
        new Float32Array(BoxMesh.positions),
        new Float32Array(BoxMesh.normals),
        new Float32Array(BoxMesh.uvs))

    mesh = tesselate(mesh)
    mesh = tesselate(mesh)
    mesh = tesselate(mesh)
    mesh = tesselate(mesh)

    for (var i = 0; i < mesh.positions.length; i += 3)
    {
        const position = normalize([mesh.positions[i + 0], mesh.positions[i + 1], mesh.positions[i + 2]])
        const normal = position
        mesh.positions[i + 0] = position[0]
        mesh.positions[i + 1] = position[1]
        mesh.positions[i + 2] = position[2]
        mesh.normals[i + 0] = normal[0]
        mesh.normals[i + 1] = normal[1]
        mesh.normals[i + 2] = normal[2]
    }

    return mesh;
}()

let TesselatedPlaneMesh = function ()
{
    let mesh = new Mesh(
        new Float32Array(QuadMesh.positions),
        new Float32Array(QuadMesh.normals),
        new Float32Array(QuadMesh.uvs))

    mesh = tesselate(mesh)
    mesh = tesselate(mesh)
    mesh = tesselate(mesh)
    mesh = tesselate(mesh)
    mesh = twoside(mesh)
    
    return mesh
}()

let LandscapeMesh = function ()
{
    let mesh = new Mesh(
        new Float32Array(QuadMesh.positions),
        new Float32Array(QuadMesh.normals),
        new Float32Array(QuadMesh.uvs))

    mesh = tesselate(mesh)
    mesh = tesselate(mesh)
    mesh = tesselate(mesh)
    mesh = tesselate(mesh)

    return mesh
}()

// SKY SPHERE GEOMETRY
let SkySphereMesh = function ()
{
    let mesh = new Mesh(
    new Float32Array(BoxMesh.positions),
    new Float32Array(BoxMesh.normals),
    new Float32Array(BoxMesh.uvs))

    mesh = tesselate(mesh)
    mesh = tesselate(mesh)
    mesh = tesselate(mesh)
    mesh = tesselate(mesh)

    for (var i = 0; i < mesh.positions.length; i += 3)
    {
        const position = normalize([mesh.positions[i + 0], mesh.positions[i + 1], mesh.positions[i + 2]])
        const normal = position
        mesh.positions[i + 0] = position[0]
        mesh.positions[i + 1] = position[1]
        mesh.positions[i + 2] = position[2]
        mesh.normals[i + 0] = -normal[0]
        mesh.normals[i + 1] = -normal[1]
        mesh.normals[i + 2] = -normal[2]
    }

    // for each triangles positions
    for (var i = 0; i < mesh.positions.length; i += 9)
    {
        const aX = mesh.positions[i + 0]
        const aY = mesh.positions[i + 1]
        const aZ = mesh.positions[i + 2]

        const bX = mesh.positions[i + 3]
        const bY = mesh.positions[i + 4]
        const bZ = mesh.positions[i + 5]

        const cX = mesh.positions[i + 6]
        const cY = mesh.positions[i + 7]
        const cZ = mesh.positions[i + 8]

        mesh.positions[i + 3] = cX
        mesh.positions[i + 4] = cY
        mesh.positions[i + 5] = cZ

        mesh.positions[i + 6] = bX
        mesh.positions[i + 7] = bY
        mesh.positions[i + 8] = bZ
    }

    for (var i = 0; i < mesh.normals.length; i += 9)
    {
        const aX = mesh.normals[i + 0]
        const aY = mesh.normals[i + 1]
        const aZ = mesh.positions[i + 2]

        const bX = mesh.normals[i + 3]
        const bY = mesh.normals[i + 4]
        const bZ = mesh.normals[i + 5]

        const cX = mesh.normals[i + 6]
        const cY = mesh.normals[i + 7]
        const cZ = mesh.normals[i + 8]

        mesh.normals[i + 3] = cX
        mesh.normals[i + 4] = cY
        mesh.normals[i + 5] = cZ

        mesh.normals[i + 6] = bX
        mesh.normals[i + 7] = bY
        mesh.normals[i + 8] = bZ
    }

    for (var i = 0; i < mesh.uvs.length; i += 6)
    {
        const aX = mesh.uvs[i + 0]
        const aY = mesh.uvs[i + 1]

        const bX = mesh.uvs[i + 2]
        const bY = mesh.uvs[i + 3]

        const cX = mesh.uvs[i + 4]
        const cY = mesh.uvs[i + 5]

        mesh.uvs[i + 2] = cX
        mesh.uvs[i + 3] = cY

        mesh.uvs[i + 4] = bX
        mesh.uvs[i + 5] = bY
    }

    return mesh;
}()

// CYLINDER GEOMETRY
let CylinderMesh = function ()
{
    var cylinderGeometryPositions = []
    var cylinderGeometryNormals = []
    var cylinderGeometryUVs = []

    var circlePoints = []
    var N = 64
    var step = 360.0 / N
    for (var i = 0; i <= 360.0; i += step)
    {
        var x = Math.cos(i * Math.PI/180)
        var y = 0.0
        var z = Math.sin(i * Math.PI/180)
        circlePoints.push([ x, y, z ])
    }
    // Top Face
    for (var i = 1; i < circlePoints.length; i++)
    {
        var A = [...circlePoints[i]]
        A[1] = 4.0;
        var B = [...circlePoints[i - 1]]
        B[1] = 4.0;

        cylinderGeometryPositions.push(
            ...A,
            ...B,
            0.0, 4.0, 0.0)
        cylinderGeometryNormals.push(
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0)
        cylinderGeometryUVs.push(
            (A[0] + 1.0) * 0.5, (A[2] + 1.0) * 0.5,
            (B[0] + 1.0) * 0.5, (B[2] + 1.0) * 0.5,
            0.5, 0.5,)
    }
    // Bottom Face
    for (var i = 1; i < circlePoints.length; i++)
    {
        var A = [...circlePoints[i]]
        A[1] = 0.0;
        var B = [...circlePoints[i - 1]]
        B[1] = 0.0;

        cylinderGeometryPositions.push(
            ...B,
            ...A,
            0.0, 0.0, 0.0)
        cylinderGeometryNormals.push(
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0)
        cylinderGeometryUVs.push(
            (B[0] + 1.0) * 0.5, (B[2] + 1.0) * 0.5,
            (A[0] + 1.0) * 0.5, (A[2] + 1.0) * 0.5,
            0.5, 0.5,)
    }
    // Walls
    for (var i = 1; i < circlePoints.length; i++)
    {
        var topA = [...circlePoints[i]]
        topA[1] = 4.0;
        var topB = [...circlePoints[i - 1]]
        topB[1] = 4.0;

        var bottomA = [...circlePoints[i]]
        bottomA[1] = 0.0;
        var bottomB = [...circlePoints[i - 1]]
        bottomB[1] = 0.0;

        cylinderGeometryPositions.push(
            ...topB,
            ...topA, 
            ...bottomB,
            ...bottomA,
            ...bottomB,
            ...topA)

        cylinderGeometryNormals.push(
            ...circlePoints[i],
            ...circlePoints[i],
            ...circlePoints[i - 1],

            ...circlePoints[i - 1],
            ...circlePoints[i - 1],
            ...circlePoints[i])
            
        cylinderGeometryUVs.push(
            ((Math.acos(topB[0]   ) * (180.0/Math.PI)) / 360.0) * 3.0    , topB[1]    / 2.0,
            ((Math.acos(topA[0]   ) * (180.0/Math.PI)) / 360.0) * 3.0    , topA[1]    / 2.0,
            ((Math.acos(bottomB[0]) * (180.0/Math.PI)) / 360.0) * 3.0    , bottomB[1] / 2.0,
            ((Math.acos(bottomA[0]) * (180.0/Math.PI)) / 360.0) * 3.0    , bottomA[1] / 2.0,
            ((Math.acos(bottomB[0]) * (180.0/Math.PI)) / 360.0) * 3.0    , bottomB[1] / 2.0,
            ((Math.acos(topA[0]   ) * (180.0/Math.PI)) / 360.0) * 3.0    , topA[1]    / 2.0,)
    }

    return new Mesh(
        new Float32Array(cylinderGeometryPositions),
        new Float32Array(cylinderGeometryNormals),
        new Float32Array(cylinderGeometryUVs)
    )
}()

// ARCH GEOMETRY
let ArchMesh = function ()
{
    var archGeometryPositions
    var archGeometryNormals
    var archGeometryUVs = []

    archGeometryPositions = [
        ///////////////////////////////////////
        // OUTER ARCH
        ///////////////////////////////////////
        // LEFT
        -10.0,  18.0, -2.0,  // bottom right
        -10.0, -2.0, -2.0,   // bottom left
        -10.0,  18.0,  2.0,  // top right

        -10.0, -2.0, -2.0,   // bottom left
        -10.0, -2.0,  2.0,   // top left
        -10.0,  18.0,  2.0,  // top right
        // RIGHT
        10.0, -2.0, -2.0,   // bottom left
        10.0,  18.0, -2.0,  // bottom right
        10.0,  18.0,  2.0,  // top right

        10.0, -2.0,  2.0,   // top left
        10.0, -2.0, -2.0,   // bottom left
        10.0,  18.0,  2.0,  // top right
        // TOP
        10.0,  18.0, -2.0,  // back right
        -10.0,  18.0, -2.0,  // back left
         10.0,  18.0,  2.0,  // front right

         -10.0,  18.0, -2.0,  // back left
        -10.0,  18.0,  2.0,  // front left
         10.0,  18.0,  2.0,  // front right

        ///////////////////////////////////////
        // INNER ARCH FRONT
        ///////////////////////////////////////
        // front Left Side
        10.0, -2.0,  -2.0,    // bottom right
        6.0,  -2.0,  -2.0,    // bottom left
        10.0,  10.0, -2.0,    // top right
        6.0,  -2.0,  -2.0,    // bottom left
        6.0,   10.0, -2.0,    // top left
        10.0,  10.0, -2.0,    // top right
        // TOP BIT
        6.0, 10.0, -2.0,
        10.0,   18.0,   -2.0,
        10.0,  10.0, -2.0,
        // front RIGHT Side
        -6.0,  -2.0,   -2.0,  // bottom right
        -10.0, -2.0,   -2.0,  // bottom left
        -6.0,   10.0,  -2.0,  // top right
        -10.0, -2.0,   -2.0,  // bottom left
        -10.0,  10.0,  -2.0,  // top left
        -6.0,   10.0,  -2.0,  // top right
        // TOP BIT
        -6.0,  10.0, -2.0,
        -10.0, 10.0, -2.0,
        -10,   18.0,   -2.0,

        ///////////////////////////////////////
        // INNER ARCH BACK
        ///////////////////////////////////////
        // front Right Side
        -10.0, -2.0,   2.0,  // bottom right
        -6.0,  -2.0,   2.0,  // bottom left
        -10.0,  10.0,  2.0,  // top right
        -6.0,  -2.0,   2.0,  // bottom left
        -6.0,   10.0,  2.0,  // top left
        -10.0,  10.0,  2.0,  // top right
        // TOP BIT
        -10.0,  10.0,  2.0,
        -6.0, 10.0,    2.0,
        -10.0,   18.0,   2.0,

        // front Right Side
        6.0,  -2.0,   2.0,  // bottom right
        10.0, -2.0,   2.0,  // bottom left
        6.0,   10.0,  2.0,  // top right
        10.0, -2.0,   2.0,  // bottom left
        10.0,  10.0,  2.0,  // top left
        6.0,   10.0,  2.0, // top right
        // TOP BIT
        6.0,  10.0,  2.0,
        10.0, 10.0,    2.0,
        10.0,   18.0,   2.0,

        //////////////////////////////////
        // INNER INNER ARCG
        //////////////////////////////////
        // LEFT
        6.0,  10.0, -2.0,  // bottom right
        6.0, -2.0, -2.0,   // bottom left
        6.0,  10.0,  2.0,  // top right
        6.0, -2.0, -2.0,   // bottom left
        6.0, -2.0,  2.0,   // top left
        6.0,  10.0,  2.0,  // top right
        // RIGHT
        -6.0, -2.0, -2.0,   // bottom left
        -6.0,  10.0, -2.0,  // bottom right
        -6.0,  10.0,  2.0,  // top right
        -6.0, -2.0,  2.0,   // top left
        -6.0, -2.0, -2.0,   // bottom left
        -6.0,  10.0,  2.0,  // top right             
    ]

    archGeometryNormals = [ 
        ///////////////////////////////////////
        // OUTER ARCH
        ///////////////////////////////////////
        // LEFT
        -1.0, 0.0, 0.0, 
        -1.0, 0.0, 0.0, 
        -1.0, 0.0, 0.0, 
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,  
        -1.0, 0.0, 0.0,
        // RIGHT
        1.0, 0.0, 0.0, 
        1.0, 0.0, 0.0, 
        1.0, 0.0, 0.0, 
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,  
        1.0, 0.0, 0.0,
        // TOP
        0.0, 1.0, 0.0, 
        0.0, 1.0, 0.0, 
        0.0, 1.0, 0.0, 
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,  
        0.0, 1.0, 0.0,

        ///////////////////////////////////////
        // INNER ARCH LEFT
        ///////////////////////////////////////
        // front Left Side
        0.0, 0.0, -1.0, 
        0.0, 0.0, -1.0, 
        0.0, 0.0, -1.0, 
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,  
        0.0, 0.0, -1.0,
        // top bit
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,  
        0.0, 0.0, -1.0,
        // top Side
        0.0, 0.0, -1.0, 
        0.0, 0.0, -1.0, 
        0.0, 0.0, -1.0, 
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,  
        0.0, 0.0, -1.0,
        // top bit
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,  
        0.0, 0.0, -1.0,
        ///////////////////////////////////////
        // INNER ARCH RIGHT
        ///////////////////////////////////////
        // top Side
        0.0, 0.0, 1.0, 
        0.0, 0.0, 1.0, 
        0.0, 0.0, 1.0, 
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,  
        0.0, 0.0, 1.0,
        // Top bit 
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,  
        0.0, 0.0, 1.0,
        // top Side
        0.0, 0.0, 1.0, 
        0.0, 0.0, 1.0, 
        0.0, 0.0, 1.0, 
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,  
        0.0, 0.0, 1.0,
        // Top bit 
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,  
        0.0, 0.0, 1.0,
        //////////////////////////////////////
        // INNER ARCH RIGHT
        ///////////////////////////////////////
        -1.0, 0.0, 0.0, 
        -1.0, 0.0, 0.0, 
        -1.0, 0.0, 0.0, 
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,  
        -1.0, 0.0, 0.0,

        1.0, 0.0, 0.0, 
        1.0, 0.0, 0.0, 
        1.0, 0.0, 0.0, 
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,  
        1.0, 0.0, 0.0,
    ]

    let Points = []
    let ArcPoints = []

    for (var i = 0; i <= 100; i++)
    {
        Points.push(-1.0 + (i/100) * 2.0)
    }

    for (var i = 0; i < Points.length; ++i)
    {
        var x = Points[i] * 6.0
        var y = 10.0 + Math.sqrt(1.0 - Points[i] * Points[i]) * 6.0
        ArcPoints.push([x, y, 0.0])
    }

    for (var i = 0; i < ArcPoints.length - 1; ++i)
    {
        let A = [ ArcPoints[i + 0][0], ArcPoints[i + 0][1], 2.0 ]
        let An = normalize(subv([ 0.0, 10.0, 2.0 ], A))
        let B = [ ArcPoints[i + 0][0], ArcPoints[i + 0][1],-2.0 ]
        let Bn = normalize(subv([ 0.0, 10.0, -2.0 ], B))
        let C = [ ArcPoints[i + 1][0], ArcPoints[i + 1][1], 2.0 ]
        let Cn = normalize(subv([ 0.0, 10.0, 2.0 ], C))
        let D = [ ArcPoints[i + 1][0], ArcPoints[i + 1][1],-2.0 ]
        let Dn = normalize(subv([ 0.0, 10.0, -2.0 ], D))

        archGeometryPositions.push(...A);
        archGeometryNormals.push(...An);

        archGeometryPositions.push(...B);
        archGeometryNormals.push(...Bn);

        archGeometryPositions.push(...C);
        archGeometryNormals.push(...Cn);

        archGeometryPositions.push(...B);
        archGeometryNormals.push(...Bn);

        archGeometryPositions.push(...D);
        archGeometryNormals.push(...Dn);

        archGeometryPositions.push(...C);
        archGeometryNormals.push(...Cn);

    }

    // FRONT ARCH
    for (var i = 0; i < ArcPoints.length / 2 + 1; ++i)
    {
        archGeometryPositions.push(ArcPoints[i+0][0], ArcPoints[i+0][1], -2.0)
        archGeometryPositions.push(-10.0,   18.0,   -2.0)
        archGeometryPositions.push(ArcPoints[i+1][0], ArcPoints[i+1][1], -2.0)

        archGeometryNormals.push(0.0, 0.0, -1.0)
        archGeometryNormals.push(0.0, 0.0, -1.0)
        archGeometryNormals.push(0.0, 0.0, -1.0)
    }

    for (var i = ArcPoints.length - 1; i > ArcPoints.length / 2; --i)
    {
        archGeometryPositions.push(10.0,   18.0,   -2.0)
        archGeometryPositions.push(ArcPoints[i][0], ArcPoints[i][1], -2.0)
        archGeometryPositions.push(ArcPoints[i-1][0], ArcPoints[i-1][1], -2.0)

        archGeometryNormals.push(0.0, 0.0, -1.0)
        archGeometryNormals.push(0.0, 0.0, -1.0)
        archGeometryNormals.push(0.0, 0.0, -1.0)

    }

    archGeometryPositions.push(10.0, 18.0,   -2.0)
    archGeometryPositions.push(
        ArcPoints[Math.floor(ArcPoints.length / 2)][0],
        ArcPoints[Math.floor(ArcPoints.length / 2)][1], 
        -2.0)
    archGeometryPositions.push(-10.0, 18.0, -2.0)

    archGeometryNormals.push(0.0, 0.0, -1.0)
    archGeometryNormals.push(0.0, 0.0, -1.0)
    archGeometryNormals.push(0.0, 0.0, -1.0)

    // BACK ARCH
    for (var i = 0; i < ArcPoints.length / 2; ++i)
    {
        archGeometryPositions.push(-10.0,   18.0,   2.0)
        archGeometryPositions.push(ArcPoints[i+0][0], ArcPoints[i+0][1], 2.0)
        archGeometryPositions.push(ArcPoints[i+1][0], ArcPoints[i+1][1], 2.0)

        archGeometryNormals.push(0.0, 0.0, 1.0)
        archGeometryNormals.push(0.0, 0.0, 1.0)
        archGeometryNormals.push(0.0, 0.0, 1.0)
    }

    for (var i = ArcPoints.length-1; i > ArcPoints.length / 2; --i)
    {
        archGeometryPositions.push(ArcPoints[i][0], ArcPoints[i][1], 2.0)
        archGeometryPositions.push(10.0,   18.0,   2.0)
        archGeometryPositions.push(ArcPoints[i-1][0], ArcPoints[i-1][1], 2.0)

        archGeometryNormals.push(0.0, 0.0, 1.0)
        archGeometryNormals.push(0.0, 0.0, 1.0)
        archGeometryNormals.push(0.0, 0.0, 1.0)
    }

    archGeometryPositions.push(
        ArcPoints[Math.floor(ArcPoints.length / 2)][0],
        ArcPoints[Math.floor(ArcPoints.length / 2)][1], 
        2.0)
    archGeometryPositions.push(10.0, 18.0,   2.0)
    archGeometryPositions.push(-10.0, 18.0, 2.0)

    archGeometryNormals.push(0.0, 0.0, 1.0)
    archGeometryNormals.push(0.0, 0.0, 1.0)
    archGeometryNormals.push(0.0, 0.0, 1.0)

    const GenerateUV = function (position, normal) 
    {
        var XY = [ position[0], position[1] ]
        var YZ = [ position[1], position[2] ]
        var XZ = [ position[0], position[2] ]

       // if (Math.abs(normal[0]) == 1.0)
       // {
       //     return YZ
       // }
//
       // if (Math.abs(normal[1]) == 1.0)
       // {
       //     return XZ
       // }
       // 
       // if (Math.abs(normal[2]) == 1.0)
       // {
       //     return XY
       // }

        return lerpv(lerpv(XZ, YZ, Math.abs(normal[0])), XY, Math.abs(normal[2]))
    }

    for (var i = 0; i < archGeometryPositions.length; i += 9)
    {
        var A = [ archGeometryPositions[i + 0], archGeometryPositions[i + 1], archGeometryPositions[i + 2] ]
        var B = [ archGeometryPositions[i + 3], archGeometryPositions[i + 4], archGeometryPositions[i + 5] ]
        var C = [ archGeometryPositions[i + 6], archGeometryPositions[i + 7], archGeometryPositions[i + 8] ]

        var AN = [ archGeometryNormals[i + 0], archGeometryNormals[i + 1], archGeometryNormals[i + 2] ]
        var BN = [ archGeometryNormals[i + 3], archGeometryNormals[i + 4], archGeometryNormals[i + 5] ]
        var CN = [ archGeometryNormals[i + 6], archGeometryNormals[i + 7], archGeometryNormals[i + 8] ]

        var Auv = GenerateUV(A, AN)
        var Buv = GenerateUV(B, BN)
        var Cuv = GenerateUV(C, CN)

        archGeometryUVs.push(Auv[0] / 2.0, Auv[1] / 2.0)
        archGeometryUVs.push(Buv[0] / 2.0, Buv[1] / 2.0)
        archGeometryUVs.push(Cuv[0] / 2.0, Cuv[1] / 2.0)
    }

    return new Mesh(
        new Float32Array(archGeometryPositions),
        new Float32Array(archGeometryNormals),
        new Float32Array(archGeometryUVs)
    )
}()

let ConeMesh = (function () 
{
 
    var coneGeometryPositions = []
    var coneGeometryNormals = []
    var coneGeometryUVs = []

    var circlePoints = []
    var N = 64
    var step = 360.0 / N
    for (var i = 0; i <= 360.0; i += step)
    {
        var x = Math.cos(i * Math.PI/180)
        var y = 0.0
        var z = Math.sin(i * Math.PI/180)
        circlePoints.push([ x, y, z ])
    }

    var topPoint = [0.0, 2.0, 0.0]

    // Bottom Face
    for (var i = 1; i < circlePoints.length; i++)
    {
        var A = [...circlePoints[i]]
        A[1] = 0.0;
        var B = [...circlePoints[i - 1]]
        B[1] = 0.0;

        coneGeometryPositions.push(
            ...B,
            ...A,
            0.0, 0.0, 0.0)
        coneGeometryNormals.push(
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0)
        coneGeometryUVs.push(
            (B[0] + 1.0) * 0.5, (B[2] + 1.0) * 0.5,
            (A[0] + 1.0) * 0.5, (A[2] + 1.0) * 0.5,
            0.5, 0.5,)
    }
    // Walls
    for (var i = 1; i < circlePoints.length; i++)
    {
        var bottomA = [...circlePoints[i]]
        bottomA[1] = 0.0;
        var bottomB = [...circlePoints[i - 1]]
        bottomB[1] = 0.0;

        coneGeometryPositions.push(
            ...topPoint,
            ...bottomA,
            ...bottomB)

        coneGeometryNormals.push(
            ...circlePoints[i],
            ...circlePoints[i],
            ...circlePoints[i - 1])
            
        coneGeometryUVs.push(
            ((Math.acos(bottomB[0]) * (180.0/Math.PI)) / 360.0) * 3.0    , 1.0,
            ((Math.acos(bottomA[0]) * (180.0/Math.PI)) / 360.0) * 3.0    , 0.0,
            ((Math.acos(bottomB[0]) * (180.0/Math.PI)) / 360.0) * 3.0    , 0.0)
    }

    return new Mesh(
        new Float32Array(coneGeometryPositions),
        new Float32Array(coneGeometryNormals),
        new Float32Array(coneGeometryUVs)
    )
}())

let ArrowMesh = (function () {
    var ArrowGeometryPositions = []
    var ArrowGeometryNormals = []
    var ArrowGeometryUVs = []

    var circlePoints = []
    var N = 64
    var step = 360.0 / N
    for (var i = 0; i <= 360.0; i += step)
    {
        var x = Math.cos(i * Math.PI/180) * 0.05
        var y = 0.0
        var z = Math.sin(i * Math.PI/180) * 0.05
        circlePoints.push([ x, y, z ])
    }

    for (var i = 1; i < circlePoints.length; i++)
    {
        var A = [...circlePoints[i]]
        A[1] = 0.0;
        var B = [...circlePoints[i - 1]]
        B[1] = 0.0;

        ArrowGeometryPositions.push(
            ...B,
            ...A,
            0.0, 0.0, 0.0)
        ArrowGeometryNormals.push(
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0)
        ArrowGeometryUVs.push(
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5)
    }

    // Walls
    for (var i = 1; i < circlePoints.length; i++)
    {
        var topA = [...circlePoints[i]]
        topA[1] = 3.0;
        var topB = [...circlePoints[i - 1]]
        topB[1] = 3.0;

        var bottomA = [...circlePoints[i]]
        bottomA[1] = 0.0;
        var bottomB = [...circlePoints[i - 1]]
        bottomB[1] = 0.0;

        ArrowGeometryPositions.push(
            ...topB,
            ...topA, 
            ...bottomB,
            ...bottomA,
            ...bottomB,
            ...topA)

        ArrowGeometryNormals.push(
            ...circlePoints[i],
            ...circlePoints[i],
            ...circlePoints[i - 1],

            ...circlePoints[i - 1],
            ...circlePoints[i - 1],
            ...circlePoints[i])
            
        ArrowGeometryUVs.push(
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5)
    }

    for (var i = 1; i < circlePoints.length; i++)
    {
        var topA = [...circlePoints[i]]
        topA[0] *= 2.5
        topA[1] = 3.0;
        topA[2] *= 2.5
        var topB = [...circlePoints[i - 1]]
        topB[0] *= 2.5
        topB[1] = 3.0;
        topB[2] *= 2.5

        var bottomA = [...circlePoints[i]]
        bottomA[1] = 3.0;
        var bottomB = [...circlePoints[i - 1]]
        bottomB[1] = 3.0;

        ArrowGeometryPositions.push(
            ...topB,
            ...topA, 
            ...bottomB,
            ...bottomA,
            ...bottomB,
            ...topA)

        ArrowGeometryNormals.push(
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,

            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0)
            
        ArrowGeometryUVs.push(
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5)
    }

    var topPoint = [ 0.0, 4.0, 0.0 ]
    for (var i = 1; i < circlePoints.length; i++)
    {
        var bottomA = [...circlePoints[i]]
        bottomA[0] *= 2.5
        bottomA[1] = 3.0;
        bottomA[2] *= 2.5
        var bottomB = [...circlePoints[i - 1]]
        bottomB[0] *= 2.5
        bottomB[1] = 3.0;
        bottomB[2] *= 2.5

        ArrowGeometryPositions.push(
            ...topPoint,
            ...topPoint, 
            ...bottomB,
            ...bottomA,
            ...bottomB,
            ...topPoint)

        ArrowGeometryNormals.push(
            ...circlePoints[i],
            ...circlePoints[i],
            ...circlePoints[i - 1],

            ...circlePoints[i - 1],
            ...circlePoints[i - 1],
            ...circlePoints[i])
            
        ArrowGeometryUVs.push(
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5)
    }


    return new Mesh(
        new Float32Array(ArrowGeometryPositions),
        new Float32Array(ArrowGeometryNormals),
        new Float32Array(ArrowGeometryUVs)
    )
}())

let ScalerMesh = (function () {
    var ScalerGeometryPositions = []
    var ScalerGeometryNormals = []
    var ScalerGeometryUVs = []

    var circlePoints = []
    var N = 64
    var step = 360.0 / N
    for (var i = 0; i <= 360.0; i += step)
    {
        var x = Math.cos(i * Math.PI/180) * 0.05
        var y = 0.0
        var z = Math.sin(i * Math.PI/180) * 0.05
        circlePoints.push([ x, y, z ])
    }

    for (var i = 1; i < circlePoints.length; i++)
    {
        var A = [...circlePoints[i]]
        A[1] = 0.0;
        var B = [...circlePoints[i - 1]]
        B[1] = 0.0;

        ScalerGeometryPositions.push(
            ...B,
            ...A,
            0.0, 0.0, 0.0)
        ScalerGeometryNormals.push(
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0)
        ScalerGeometryUVs.push(
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5)
    }

    // Walls
    for (var i = 1; i < circlePoints.length; i++)
    {
        var topA = [...circlePoints[i]]
        topA[1] = 3.0;
        var topB = [...circlePoints[i - 1]]
        topB[1] = 3.0;

        var bottomA = [...circlePoints[i]]
        bottomA[1] = 0.0;
        var bottomB = [...circlePoints[i - 1]]
        bottomB[1] = 0.0;

        ScalerGeometryPositions.push(
            ...topB,
            ...topA, 
            ...bottomB,
            ...bottomA,
            ...bottomB,
            ...topA)

        ScalerGeometryNormals.push(
            ...circlePoints[i],
            ...circlePoints[i],
            ...circlePoints[i - 1],

            ...circlePoints[i - 1],
            ...circlePoints[i - 1],
            ...circlePoints[i])
            
        ScalerGeometryUVs.push(
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5)
    }

    let boxpos = [...BoxMesh.positions]
    let boxnorm = [...BoxMesh.normals]
    let boxuvs = [...BoxMesh.uvs]

    for (var i = 0; i < boxpos.length; i += 3)
    {
        boxpos[i + 0] *= 0.1
        boxpos[i + 1] *= 0.25
        boxpos[i + 2] *= 0.1

        boxpos[i + 1] += 3
    }

    ScalerGeometryPositions.push(
        ...boxpos)

    ScalerGeometryNormals.push(
        ...boxnorm)
        
    ScalerGeometryUVs.push(
        ...boxuvs)

    /*
    for (var i = 1; i < circlePoints.length; i++)
    {
        var topA = [...circlePoints[i]]
        topA[0] *= 2.5
        topA[1] = 3.0;
        topA[2] *= 2.5
        var topB = [...circlePoints[i - 1]]
        topB[0] *= 2.5
        topB[1] = 3.0;
        topB[2] *= 2.5

        var bottomA = [...circlePoints[i]]
        bottomA[1] = 3.0;
        var bottomB = [...circlePoints[i - 1]]
        bottomB[1] = 3.0;

        ScalerGeometryPositions.push(
            ...topB,
            ...topA, 
            ...bottomB,
            ...bottomA,
            ...bottomB,
            ...topA)

        ScalerGeometryNormals.push(
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,

            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0)
            
        ScalerGeometryUVs.push(
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5)
    }


    var topPoint = [ 0.0, 4.0, 0.0 ]
    for (var i = 1; i < circlePoints.length; i++)
    {
        var bottomA = [...circlePoints[i]]
        bottomA[0] *= 2.5
        bottomA[1] = 3.0;
        bottomA[2] *= 2.5
        var bottomB = [...circlePoints[i - 1]]
        bottomB[0] *= 2.5
        bottomB[1] = 3.0;
        bottomB[2] *= 2.5

        ScalerGeometryPositions.push(
            ...topPoint,
            ...topPoint, 
            ...bottomB,
            ...bottomA,
            ...bottomB,
            ...topPoint)

        ScalerGeometryNormals.push(
            ...circlePoints[i],
            ...circlePoints[i],
            ...circlePoints[i - 1],

            ...circlePoints[i - 1],
            ...circlePoints[i - 1],
            ...circlePoints[i])
            
        ScalerGeometryUVs.push(
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5)
    }
    */

    return new Mesh(
        new Float32Array(ScalerGeometryPositions),
        new Float32Array(ScalerGeometryNormals),
        new Float32Array(ScalerGeometryUVs)
    )
}())

let RotatorMesh = (function (){
    var RotatorGeometryPositions = []
    var RotatorGeometryNormals = []
    var RotatorGeometryUVs = []

    var circlePoints = []
    var N = 64
    var step = 90.0 / N
    for (var i = 0; i <= 90.0; i += step)
    {
        var x = Math.cos(i * Math.PI/180) * 2.0
        var y = 0.0
        var z = Math.sin(i * Math.PI/180) * 2.0
        circlePoints.push([ x, y, z ])
    }

    for (var i = 1; i < circlePoints.length; i++)
    {
        const thickness = 0.925
        var A = [...circlePoints[i]]
        var B = [...circlePoints[i - 1]]
        var C = [B[0] * thickness, B[1] * thickness, B[2] * thickness]
        var D = [A[0] * thickness, A[1] * thickness, A[2] * thickness]

        RotatorGeometryPositions.push(
            ...B,
            ...A,
            ...C)
        RotatorGeometryNormals.push(
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0)
        RotatorGeometryUVs.push(
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5)

        RotatorGeometryPositions.push(
            ...C,
            ...D,
            ...A)
        RotatorGeometryNormals.push(
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0)
        RotatorGeometryUVs.push(
            0.5, 0.5,
            0.5, 0.5,
            0.5, 0.5)
    }

    RotatorGeometryPositions.push(
            0.0, 0.0, 0.0,  
            0.05, 0.0, 0.0, 
            0.05,  0.0, 2.0,

            0.0,  0.0,  2.0,
            0.0, 0.0, 0.0, 
            0.05,  0.0, 2.0,


            0.0, 0.0, 0.0,  
            0.0, 0.0, 0.05, 
            2.0, 0.0,  0.05,

            2.0,  0.0,  0.0,
            0.0, 0.0, 0.0, 
            2.0,  0.0, 0.05
        )

        RotatorGeometryNormals.push(
            0.0, 0.0, 1.0, 
            0.0, 0.0, 1.0, 
            0.0, 0.0, 1.0,  
            0.0, 0.0, 1.0, 
            0.0, 0.0, 1.0, 
            0.0, 0.0, 1.0,

            0.0, 0.0, 1.0, 
            0.0, 0.0, 1.0, 
            0.0, 0.0, 1.0,  
            0.0, 0.0, 1.0, 
            0.0, 0.0, 1.0, 
            0.0, 0.0, 1.0
        )

        RotatorGeometryUVs.push(
            0.0, 0.0, 
            1.0, 0.0, 
            1.0, 1.0, 
            0.0, 1.0, 
            0.0, 0.0, 
            1.0, 1.0,

            0.0, 0.0, 
            1.0, 0.0, 
            1.0, 1.0, 
            0.0, 1.0, 
            0.0, 0.0, 
            1.0, 1.0
        )

    return twoside(new Mesh(
        new Float32Array(RotatorGeometryPositions),
        new Float32Array(RotatorGeometryNormals),
        new Float32Array(RotatorGeometryUVs)
    ))
}())

let GrassMesh = (function () {
    let positions = []
    let normals = []
    let uvs = []

    //    *
    //   / \
    //  /   \
    // * --- *
    for (var i = 0; i < 3481; ++i) // 59^2
    {
        // We want to do this in the shader really
        //let scale = 200.0
        //let x = (-1.0 + Math.random() * 2.0) * scale
        //let z = (-1.0 + Math.random() * 2.0) * scale
        //let y = noise(x * 0.01, z * 0.01, 0.0) * 2.0

        // NOTE: Triangle IDs are packed into the normals
        // and replaced in the material later on
        let blade = new Mesh(
            new Float32Array([
                -0.05, 0.0, 0.0,  
                 0.05, 0.0, 0.0, 
                 0.0, 0.5, 0.0 ]),
            new Float32Array([
                0.0, i, 1.0, 
                0.0, i, 1.0, 
                0.0, i, 1.0 ]),
            new Float32Array([
                0.0, 0.0, 
                1.0, 0.0, 
                0.5, 1.0 ]))
        positions.push(...blade.positions)
        normals.push(...blade.normals)
        uvs.push(...blade.uvs)   
    }

    log ("Grass Mesh generated with " + positions.length / 3 + " triangles")

    //     *
    //    / \
    //   *---*
    //  / \ / \
    // * --*-- *
    return tesselate(new Mesh(
        new Float32Array(positions),
        new Float32Array(normals),
        new Float32Array(uvs))
    )
}())

const EngineMeshes = (function () {
    const map = new Map()
    map.set("Quad", QuadMesh)
    map.set("Box", BoxMesh)
    map.set("Sphere", SphereMesh)
    map.set("TessPlane", TesselatedPlaneMesh)
    map.set("Sky", SkySphereMesh)
    map.set("Cylinder", CylinderMesh)
    map.set("Arch", ArchMesh)
    map.set("Cone", ConeMesh)
    map.set("Grass", GrassMesh)
    map.set("Arrow", ArrowMesh)
    map.set("Scaler", ScalerMesh)
    map.set("Rotator", RotatorMesh)
    return map
}())