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
            if(this.data.stereo) {
                // Update camera to let THREE compute the center position between the eyes
                renderer.xr.updateCamera(this.el.sceneEl.camera);
                eyeCenterPosition.setFromMatrixPosition(xrCamera.matrixWorld);

                for(const camera of xrCamera.cameras) {
                    camera.matrixWorld.copy(camera.matrix);
                    eyePosition.setFromMatrixPosition(camera.matrix).sub(eyeCenterPosition).add(targetPosition);
                    camera.matrixWorld.setPosition(eyePosition);
                    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
                }
            } else {
                for(const camera of xrCamera.cameras) {
                    camera.matrixWorld.copy(camera.matrix);
                    camera.matrixWorld.setPosition(targetPosition);
                    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
                }
            }
        }
    })(),
});