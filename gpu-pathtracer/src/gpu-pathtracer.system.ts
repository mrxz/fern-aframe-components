import * as AFRAME from 'aframe';
import * as THREE from 'three';
import type { WebGLRenderer } from 'three';
import { WebGLPathTracer } from 'three-gpu-pathtracer';
import { AmbientOcclusionMaterial } from 'three-gpu-pathtracer/src/materials/surface/AmbientOcclusionMaterial.js';
import { UVUnwrapper } from './uvunwrapper';

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

        baking: boolean;
    },

    init: function() {
        this.pathTracer = new WebGLPathTracer(this.sceneEl.renderer);
        this.uvUnwrapper = new UVUnwrapper();
        this.uvUnwrapperReady = Promise.withResolvers();
        this.materials = [];
        this.meshesToGo = [];
        this.aoRenderTarget = new THREE.WebGLRenderTarget(1024, 1024);
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

        // Prepare material to render baked
        /*
        const material: THREE.ShaderMaterial = this.pathTracer._pathTracer._fsQuad.material.clone(); // FIXME:
        material.onBeforeCompile = () => {
            console.log(material.vertexShader, material.fragmentShader);
        }
        material.needsUpdate = true;
        */
        //this.pathTracer._pathTracer.material = new AmbientOcclusionMaterial();

        // Prepare AO material
        const material = new AmbientOcclusionMaterial({
            bvh: this.pathTracer._pathTracer.material.bvh,
        }) as THREE.ShaderMaterial; // FIXME:
        material.aoMap = new THREE.Texture(), // Dummy texture to activate second uv-channel
        material.aoMap.channel = 2;
        material.side = THREE.DoubleSide;
        console.log(material.aoMap);
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
        })
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
            renderer.setRenderTarget(this.aoRenderTarget);
            this.originalRenderFunction.call(this.sceneEl.renderer, this.meshesToGo[0].mesh, this.sceneEl.camera);
            const entry = this.meshesToGo.shift()!;
            entry.mesh.material = entry.originalMaterial;
            entry.mesh.material.aoMap = this.aoRenderTarget.texture;
            entry.mesh.material.aoMap.channel = 2;
            entry.mesh.material.needsUpdate = true;
            this.aoRenderTarget = new THREE.WebGLRenderTarget(1024, 1024);
            renderer.setRenderTarget(null);
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
