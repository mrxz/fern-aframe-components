import * as AFRAME from 'aframe';
import * as THREE from 'three';
import type { WebGLRenderer } from 'three';
import { WebGLPathTracer } from 'three-gpu-pathtracer';
import { AmbientOcclusionMaterial } from 'three-gpu-pathtracer/src/materials/surface/AmbientOcclusionMaterial.js';
import { UVUnwrapper } from './uvunwrapper';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { DilationMaterial } from './dilation.shader';

const renderStub: WebGLRenderer['render'] = () => {};

const lastCameraPosition = new THREE.Vector3();
const lastCameraQuaternion = new THREE.Quaternion();

const currCameraPosition = new THREE.Vector3();
const currCameraQuaternion = new THREE.Quaternion();

export const GpuPathtracerSystem = AFRAME.registerSystem('gpu-pathtracer', {
    schema: {

    },

    __fields: {} as {
        readonly pathTracer: WebGLPathTracer;
        readonly originalRenderFunction: WebGLRenderer['render'];

        readonly uvUnwrapper: UVUnwrapper;
        readonly uvUnwrapperReady: PromiseWithResolvers<boolean>;

        readonly materials: Array<THREE.ShaderMaterial>;
        readonly meshesToGo: Array<{ mesh: THREE.Mesh, originalMaterial: THREE.Material }>;
        readonly aoRenderTarget: THREE.WebGLRenderTarget;
        readonly aoRenderTarget2: THREE.WebGLRenderTarget;
        readonly totalAoSamples: number;
        readonly fsQuad: FullScreenQuad;
        readonly dilationMaterial: DilationMaterial;

        baking: boolean;
    },

    init: function() {
        this.pathTracer = new WebGLPathTracer(this.sceneEl.renderer);
        this.uvUnwrapper = new UVUnwrapper();
        this.uvUnwrapperReady = Promise.withResolvers();
        this.materials = [];
        this.meshesToGo = [];
        this.aoRenderTarget = new THREE.WebGLRenderTarget(1024, 1024);
        this.aoRenderTarget2 = new THREE.WebGLRenderTarget(1024, 1024);
        this.totalAoSamples = 0;
        this.fsQuad = new FullScreenQuad(new THREE.MeshBasicMaterial({transparent: true}));
        this.dilationMaterial = new DilationMaterial();
        if(this.sceneEl.camera) {
            this.updateScene();
        } else {
            this.sceneEl.addEventListener('cameraready', _ => this.updateScene());
        }
        this.originalRenderFunction = this.sceneEl.renderer.render;
        this.baking = false;

        // In case the scene graph changes (meshes, lights, etc...)
        this.el.addEventListener('object3dset', _ => this.updateScene());
        this.el.addEventListener('object3dremove', _ => this.updateScene());

        // TODO: Disable and re-enable when entering and leaving VR
    },

    updateScene: function() {
        const camera = this.sceneEl.camera;
        this.pathTracer.setScene(this.sceneEl.object3D, camera)

        camera.getWorldPosition(lastCameraPosition);
        camera.getWorldQuaternion(lastCameraQuaternion);
    },

    bake: async function() {
        this.updateScene();
        this.baking = true;

        // FIXME: Don't inspect internals to determine ready state
        if(this.uvUnwrapper._module === null) {
            this.uvUnwrapper.load().then(this.uvUnwrapperReady.resolve, this.uvUnwrapperReady.reject);
        }
        await this.uvUnwrapperReady.promise;

        // Prepare AO material
        const material = new AmbientOcclusionMaterial({
            bvh: this.pathTracer._pathTracer.material.bvh,
        }) as THREE.ShaderMaterial; // FIXME:
        material.defines['USE_UV2'] = true;
        material.side = THREE.DoubleSide;
        material.onBeforeCompile = (shader) => {
            shader.vertexShader = shader.vertexShader
                //.replace('varying vec3 vPos;', 'varying vec3 vPos;\nvarying vec2 vUv2;')
                .replace('gl_Position = projectionMatrix * mvPosition;', 'gl_Position = vec4(uv2*2.0-vec2(1.0), 0.0, 1.0);');

            // The patches on the aoMap are always front-facing, but winding might make them appear backside.
            shader.fragmentShader = shader.fragmentShader
                .replace('vec3 faceNormal =', 'vec3 faceNormal = normalize( vNorm );//')
                .replace('normal *= gl_FrontFacing ? 1.0 : - 1.0;', '');
        }
        material.needsUpdate = true;
        this.materials.push(material);

        // Unwrap geometry
        this.el.sceneEl.object3D.traverse(c => {
            if((c as THREE.Mesh).isMesh) {
                const mesh = c as THREE.Mesh;

                this.uvUnwrapper.generate(mesh.geometry, mesh);
                const originalMaterial = mesh.material as THREE.Material;
                mesh.material = material;
                this.meshesToGo.push({ mesh, originalMaterial });
            }
        });
    },

    tick: function() {
        if (this.baking) {
            if(this.meshesToGo.length === 0) {
                this.sceneEl.renderer.clear();
                this.originalRenderFunction.call(this.sceneEl.renderer, this.sceneEl.object3D, this.sceneEl.camera);
                return;
            }
            // TODO
            this.materials.forEach(m => {
                (m as any).seed ++;
            });
            const renderer = this.sceneEl.renderer;
            renderer.render = this.originalRenderFunction;
            renderer.setRenderTarget(this.aoRenderTarget);
            renderer.render(this.meshesToGo[0].mesh, this.sceneEl.camera);

            // Accumulate AO on aoRenderTarget2
            renderer.setRenderTarget(this.aoRenderTarget2);
            renderer.autoClear = false;
            this.fsQuad.material.map = this.aoRenderTarget.texture;
            this.fsQuad.material.opacity = 1 / this.totalAoSamples;
            this.fsQuad.render(renderer);
            renderer.autoClear = true;

            this.totalAoSamples++; // FIXME: Samples per frame
            if(this.totalAoSamples > 10) { // FIXME: Allow
                // Dilate
                const originalFsQuadMaterial = this.fsQuad.material;
                this.fsQuad.material = this.dilationMaterial;
                this.dilationMaterial.uniforms.map.value = this.aoRenderTarget2.texture
                this.dilationMaterial.uniforms.map.needsUpdate = true;
                renderer.setRenderTarget(this.aoRenderTarget);
                this.fsQuad.render(renderer);
                this.fsQuad.material = originalFsQuadMaterial;

                // Restore mesh material
                const entry = this.meshesToGo.shift()!;
                entry.mesh.material = entry.originalMaterial;
                entry.mesh.material.aoMap = this.aoRenderTarget.texture;
                entry.mesh.material.aoMap.channel = 2;
                entry.mesh.material.needsUpdate = true;

                // Rotate
                this.aoRenderTarget = this.aoRenderTarget2;
                this.aoRenderTarget2 = new THREE.WebGLRenderTarget(1024, 1024);
                this.totalAoSamples = 0;
            }
            renderer.setRenderTarget(null);
            renderer.render = renderStub;
            //this.originalRenderFunction.call(this.sceneEl.renderer, this.sceneEl.object3D, this.sceneEl.camera);
        } else {
            // Restore original render function
            this.sceneEl.renderer.render = this.originalRenderFunction;

            // Check camera state
            const camera = this.el.camera;
            // Check if camera has moved
            camera.getWorldPosition(currCameraPosition);
            camera.getWorldQuaternion(currCameraQuaternion);
            if(currCameraPosition.distanceToSquared(lastCameraPosition) > 0.001 || Math.abs(currCameraQuaternion.dot(lastCameraQuaternion)) < 0.999999)
            {
                this.pathTracer.updateCamera();
                lastCameraPosition.copy(currCameraPosition);
                camera.getWorldQuaternion(lastCameraQuaternion);
            }

            // Let path-tracer update.
            this.pathTracer.renderSample();

            // Stub render function
            this.sceneEl.renderer.render = renderStub;
        }
    }
});

declare module "aframe" {
    interface Systems {
        "gpu-pathtracer": InstanceType<typeof GpuPathtracerSystem>,
    }
}
