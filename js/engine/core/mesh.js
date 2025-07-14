class Mesh
{
    constructor(positions, normals, uvs, extents = [0,0,0])
    {
        this.positions = positions
        this.normals = normals
        this.uvs = uvs

        this.extents = extents
    }
}