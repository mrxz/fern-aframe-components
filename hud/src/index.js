AFRAME.registerPrimitive('a-hud', {
    defaultComponents: {
        hud: { },
    },
    mappings: {
        radius: 'hud.radius',
        'horizontal-fov': 'hud.horizontalFov',
        'vertical-fov': 'hud.verticalFov',
        'scale-factor': 'hud.scaleFactor',
	}
});

AFRAME.registerPrimitive('a-hud-element', {
    defaultComponents: {
		'hud-element': { },
	},
	mappings: {
        align: 'hud-element.align',
        anchor: 'hud-element.anchor',
        'content-size': 'hud-element.contentSize',
        'hud-size': 'hud-element.hudSize',
	}
});

AFRAME.registerComponent('hud', {
    schema: {
        radius: { type: 'number', default: 1 },
        horizontalFov: { type: 'number', default: 80 },
        verticalFov: { type: 'number', default: 60 },
        scaleFactor: { type: 'number', default: 1.0 },
    },
    init: function() {
        this.flat = true;
        this.el.sceneEl.addEventListener('rendererresize', () => {
            // Relayout is only needed on resize if the layout is flat (= screen space)
            if(this.flat) {
                this.relayout()
            }
        });
        this.el.sceneEl.addEventListener('enter-vr', () => {
            this.flat = false;
            this.relayout();
        });
        this.el.sceneEl.addEventListener('exit-vr', () => {
            this.flat = true;
            this.relayout();
        });
    },
    relayout: function() {
        for(const child of this.el.children) {
            if(child.components['hud-element']) {
                child.components['hud-element'].layout(this)
            }
        };
    },
    convertCoordinates: function(coordinates, outV3) {
        if(this.flat) {
            const camera = this.el.sceneEl.camera;
            const yScale = Math.tan(THREE.MathUtils.DEG2RAD * 0.5 * camera.fov) / camera.zoom;
            const xScale = yScale * camera.aspect;

            outV3.set(coordinates.x * xScale, coordinates.y * yScale, -1);
        } else {
            // Compute spherical coordinates
            const theta = - this.data.horizontalFov/2.0 * coordinates.x;
            const phi = -90 + this.data.verticalFov/2.0 * coordinates.y;

            outV3.set(
                Math.sin(THREE.MathUtils.DEG2RAD*phi) * Math.sin(THREE.MathUtils.DEG2RAD*theta),
                Math.cos(THREE.MathUtils.DEG2RAD*phi),
                Math.sin(THREE.MathUtils.DEG2RAD*phi) * Math.cos(THREE.MathUtils.DEG2RAD*theta));
            outV3.multiplyScalar(this.data.radius);
        }
    },
    convertWidth: function(width) {
        return this.flat ? width * this.data.scaleFactor : width;
    },
    convertHeight: function(height) {
        // Height is given in "width percentage", so needs to be adjusted based on aspect ratio.
        const adjustedHeight = height * this.aspectRatio();
        return this.flat ? adjustedHeight * this.data.scaleFactor : adjustedHeight;
    },
    aspectRatio: function() {
        if(this.flat) {
            return this.el.sceneEl.camera.aspect;
        }
        return this.data.horizontalFov / this.data.verticalFov;
    },
    scale: function() {
        if(this.flat) {
            const camera = this.el.sceneEl.camera;
            const yScale = Math.tan(THREE.MathUtils.DEG2RAD * 0.5 * camera.fov) / camera.zoom;
            return 2.0 * yScale * camera.aspect * this.data.scaleFactor;
        }
        return this.data.horizontalFov/360 * this.data.radius*Math.PI*2.0;
    },
    orientate: (function() {
        const tempMat4 = new THREE.Matrix4();
        const up = new THREE.Vector3(0, 1, 0);
        const origin = new THREE.Vector3(0, 0, 0);
        return function(position, outQuaternion) {
            if(this.flat) {
                outQuaternion.identity();
                return;
            }

            tempMat4.lookAt(origin, position, up);
            outQuaternion.setFromRotationMatrix(tempMat4);
        };
    })()
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
        this.coordinates = new THREE.Vector2();
    },
    update: function() {
        const hud = this.el.parentElement.components['hud'];
        if(hud) {
            this.layout(hud);
        }
    },
    layout: function(hud) {
        const aspect = this.data.contentSize.y / this.data.contentSize.x;

        const coordinates = this.coordinates.copy(COORDINATES[this.data.align]);
        const anchor = COORDINATES[this.data.anchor];
        coordinates.x -= anchor.x * hud.convertWidth(this.data.hudSize);
        coordinates.y -= anchor.y * hud.convertHeight(this.data.hudSize * aspect);
        hud.convertCoordinates(coordinates, this.el.object3D.position);

        const scale = hud.scale() * this.data.hudSize / this.data.contentSize.x;
        this.el.object3D.scale.set(scale, scale, scale);

        hud.orientate(this.el.object3D.position, this.el.object3D.quaternion);
    }
});