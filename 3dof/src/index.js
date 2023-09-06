AFRAME.registerComponent('3dof', {
    schema: {
        position: { type: 'vec3' },
        stereo: { default: true }
    },
    init: function() {
        const renderer = this.el.sceneEl.renderer;
        renderer.xr.cameraAutoUpdate = false;
    },
    tick: (function() {
        const targetPosition = new THREE.Vector3();
        const eyeCenterPosition = new THREE.Vector3();
        const eyePosition = new THREE.Vector3();

        return function() {
            const renderer = this.el.sceneEl.renderer;
            if(!renderer.xr.isPresenting) {
                return;
            }
            targetPosition.copy(this.data.position);

            const xrCamera = renderer.xr.getCamera();
            // Update camera to let THREE compute the center position between the eyes
            renderer.xr.updateCamera(xrCamera);
            eyeCenterPosition.setFromMatrixPosition(xrCamera.matrixWorld);

            // Place xrCamera at the designated position
            xrCamera.matrix.setPosition(targetPosition);
            xrCamera.matrixWorld.copy(xrCamera.matrix);
            xrCamera.matrixWorldInverse.copy(xrCamera.matrixWorld).invert();

            // Update camera object (e.g. a-camera) to match new position
            // This ensures child object inherit the proper parent transform
            const cameraObject = this.el.sceneEl.camera.el.object3D;
            cameraObject.matrix.copy(xrCamera.matrix);
            cameraObject.matrix.decompose(cameraObject.position, cameraObject.quaternion, cameraObject.scale);

            // Update individual eye cameras
            if(this.data.stereo) {
                for(const camera of xrCamera.cameras) {
                    eyePosition.setFromMatrixPosition(camera.matrix).sub(eyeCenterPosition).add(targetPosition);
                    camera.matrix.setPosition(eyePosition);
                    camera.matrixWorld.copy(camera.matrix);
                    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
                }
            } else {
                for(const camera of xrCamera.cameras) {
                    camera.matrix.setPosition(targetPosition);
                    camera.matrixWorld.copy(camera.matrix);
                    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
                }
            }
        }
    })(),
});