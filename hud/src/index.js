AFRAME.registerComponent('hud', {
    schema: {
    },
    init: function() {
        this.el.object3D.position.set(0, 0, -1);
    },
    update: function() {
    },
    convertCoordinates: function(coordinates, outV3) {
        const camera = this.el.sceneEl.camera;
        const yScale = Math.tan(THREE.MathUtils.DEG2RAD * 0.5 * camera.fov) / camera.zoom;
        const xScale = yScale * camera.aspect;

        outV3.set(coordinates.x * xScale, coordinates.y * yScale, 0);
    },
    aspectRatio: function() {
        return this.el.sceneEl.camera.aspect;
    },
    scale: function() {
        const camera = this.el.sceneEl.camera;
        const yScale = Math.tan(THREE.MathUtils.DEG2RAD * 0.5 * camera.fov) / camera.zoom;
        return 2.0 * yScale * camera.aspect;
    }
});

/* Normalized coordinates lookup for anchor/align points */
const COORDINATES = {
    'top-left': new THREE.Vector2(-1.0, 1.0),
    'top': new THREE.Vector2(0.0, 1.0),
    'top-right': new THREE.Vector2(1.0, 1.0),
    'right': new THREE.Vector2(1.0, 0.0),
    'bottom-right': new THREE.Vector2(1.0, -1.0),
    'bottom': new THREE.Vector2(0.0, -1.0),
    'bottom-left': new THREE.Vector2(-1.0, -1.0),
    'left': new THREE.Vector2(-1.0, 0.0),
    'center': new THREE.Vector2(0.0, 0.0),
};

AFRAME.registerComponent('hud-element', {
    schema: {
        align: { type: 'string', default: 'center' },
        anchor: { type: 'string', default: 'center' },
        contentSize: { type: 'vec2', default: new THREE.Vector2(1.0, 1.0) },
        hudSize: { type: 'number', default: 1.0 },
    },
    init: function() {
        this.el.sceneEl.addEventListener('rendererresize', () => this.layout());
        this.coordinates = new THREE.Vector2();
    },
    update: function() {
        this.layout();
    },
    play: function() {
        // Use play handler as this is the first event after the element is added
        // to its parent element, which should contain the hud component.
        this.hud = this.el.parentElement.components['hud'];
        if(!this.hud) {
            console.error('Hud element must be a direct child of a hud');
        }
        this.layout();
    },
    layout: function() {
        if(!this.hud) {
            return;
        }
        const aspect = this.data.contentSize.y / this.data.contentSize.x;

        const coordinates = this.coordinates.copy(COORDINATES[this.data.align]);
        const anchor = COORDINATES[this.data.anchor];
        coordinates.x -= anchor.x * this.data.hudSize;
        coordinates.y -= anchor.y * this.data.hudSize * aspect * this.hud.aspectRatio();
        this.hud.convertCoordinates(coordinates, this.el.object3D.position);

        const scale = this.hud.scale() * this.data.hudSize / this.data.contentSize.x;
        this.el.object3D.scale.set(scale, scale, scale);

        const matrix = new THREE.Matrix4();
        //matrix.lookAt(new THREE.Vector3(0, 0, 1), this.el.object3D.position, new THREE.Vector3( 0, 1, 0 ));
        this.el.object3D.quaternion.setFromRotationMatrix( matrix );
    }
})