declare module 'three-gpu-pathtracer/src/utils/UVUnwrapper.js' {
    class UVUnwrapper {

        _module: any;

        load(): Promise<void>;

    }
}

declare module 'three-gpu-pathtracer/src/materials/surface/AmbientOcclusionMaterial.js' {
    class AmbientOcclusionMaterial {
        constructor(parameters?: any);
    }
}