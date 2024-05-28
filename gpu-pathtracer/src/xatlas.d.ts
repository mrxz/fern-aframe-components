declare module "xatlas" {

    export default function(options: XAtlasOptions): XAtlasModule;

    export type XAtlasOptions = {
		locateFile?: (path: string) => string;
    }

    export type AddMeshStatus = {
        success: number;
    }

    export type MeshInfo = {
        meshId: number;

        indexOffset: number;
        positionOffset: number;
		normalOffset: number;
		uvOffset: number;
    }

    export type MeshData = {
        indexOffset: number;
        positionOffset: number;
		normalOffset: number;
		uvOffset: number;

        newVertexCount: number;
        newIndexCount: number;
        originalIndexOffset: number;
    }

    export type XAtlasModule = {
        ready: boolean;

        HEAPU16: Uint16Array;
        HEAPF32: Float32Array;
        HEAPU32: Uint32Array;

        createAtlas();
        generateAtlas();
        destroyAtlas();

        createMesh(vertexCount: number, indexCount: number, bool1: boolean, bool2: boolean): MeshInfo; // FIXME
        addMesh(): number;
        getMeshData(meshIndex: number): MeshData;
    }

}