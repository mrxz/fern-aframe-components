import * as AFRAME from 'aframe';
import * as THREE from 'three';
import type { WebGLRenderer } from 'three';
import { WebGLPathTracer } from 'three-gpu-pathtracer';

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
    },

    init: function() {
        this.pathTracer = new WebGLPathTracer(this.sceneEl.renderer);
        if(this.sceneEl.camera) {
            this.updateScene();
        } else {
            this.sceneEl.addEventListener('cameraready', _ => this.updateScene());
        }
        this.originalRenderFunction = this.sceneEl.renderer.render;

        // In case the scene graph changes (meshes, lights, etc...)
        this.el.addEventListener('object3dset', _ => this.updateScene());
        this.el.addEventListener('object3dremove', _ => this.updateScene());
    },

    updateScene: function() {
        const camera = this.sceneEl.camera;
        this.pathTracer.setScene(this.sceneEl.object3D, camera)

        camera.getWorldPosition(lastCameraPosition);
        camera.getWorldQuaternion(lastCameraQuaternion);
    },

    tick: function() {
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
});

declare module "aframe" {
    interface Systems {
        "gpu-pathtracer": InstanceType<typeof GpuPathtracerSystem>,
    }
}
