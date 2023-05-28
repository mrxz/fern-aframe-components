AFRAME.registerSystem('3dof', {
    schema: {
        position: { type: 'vec3' }
    },
    init: function() {
        const renderer = this.el.sceneEl.renderer;
        renderer.xr.cameraAutoUpdate = false;
    },
    tick: function() {
        const renderer = this.sceneEl.renderer;
        if(renderer.xr.isPresenting) {
            this.sceneEl.camera.position.set(0, 0, 0);
            //renderer.xr.updateCamera(this.sceneEl.camera);

            const cameras = renderer.xr.getCamera().cameras;
            for(const camera of cameras) {
                camera.matrixWorld.copy(camera.matrix);
                camera.matrixWorld.setPosition(0, 0, 0);
                camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
            }
        }
    }
});