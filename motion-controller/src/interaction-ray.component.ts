import * as AFRAME from 'aframe';
import * as THREE from 'three';

const RAY_GEOMETRY = new THREE.BoxGeometry(0.002, 0.002, 1.0);
RAY_GEOMETRY.translate(0, 0, -0.5);
const RAY_MATERIAL = new THREE.ShaderMaterial({
    vertexShader: /*glsl*/`
        varying float vHeight;
        void main() {
            vHeight = position.z;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
    `,
    fragmentShader: /*glsl*/`
        varying float vHeight;
        uniform vec3 color;

        void main() {
            gl_FragColor = vec4(color, 1.0 + vHeight);
        }
    `,
    uniforms: {
        color: { value: new THREE.Color() }
    },
    transparent: true,
})

/**
 * Component for visualizing an interaction ray emitting from a pointing device and/or hand.
 * The ray is intended to be
 */
export const InteractionRayComponent = AFRAME.registerComponent('interaction-ray', {
    schema: {
        color: { type: 'color', default: 'white' },
        /** Whether or not to hide the interaction ray when not currently targetting anything */
        hideOnMiss: { default: true },
        /** Selector to use to check if a target element constitutes a hit. */
        hitSelector: { type: 'string', default: '' },
        /** Selector to use to check if a target element constitutes an interactable. */
        interactableSelector: { type: 'string', default: '' },
        /** Whether or not to use haptics to signal hovering over an interactable. */
        hapticsOnInteractable: { default: true }
    },
    __fields: {} as {
        readonly ray: THREE.Mesh<THREE.BoxGeometry, THREE.ShaderMaterial>
        readonly marker: THREE.Mesh<THREE.SphereGeometry, THREE.Material>

        /** The entity that is currently being targetted */
        currentEl: AFRAME.Entity|null;
    },
    init: function() {
        this.ray = new THREE.Mesh(RAY_GEOMETRY, RAY_MATERIAL.clone());
        this.el.setObject3D('ray', this.ray);

        this.marker = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 'white' }));
        this.el.setObject3D('marker', this.marker);

        // Initialize without any hit (and invisible)
        this.currentEl = null;
        if(this.data.hideOnMiss) {
            this.el.object3D.visible = false;
        }

        // Handle misses
        const onMiss = () => {
            this.currentEl = null;
            this.marker.visible = false; // Always hide the marker
            if(this.data.hideOnMiss) {
                this.el.object3D.visible = false;
            }
        };
        // Handle hits
        const onHit = (el: AFRAME.Entity) => {
            this.currentEl = el;
            this.el.object3D.visible = true;
            this.marker.visible = true;

            // Check if entity is interactable
            if(!this.data.interactableSelector || el.matches(this.data.interactableSelector)) {
                // TODO: Update color

                // Check if haptics are needed
                if(this.data.hapticsOnInteractable) {
                    // TODO: Haptics
                }
            }
        };

        // FIXME: Update aframe-types to include cursor events
        this.el.addEventListener('mouseenter', e => {
            const detail = (e as CustomEvent<{intersectedEl: AFRAME.Entity}>).detail;
            if(this.data.hitSelector && !detail.intersectedEl.matches(this.data.hitSelector)) {
                onMiss();
                return;
            }

            onHit(detail.intersectedEl);
        });
        this.el.addEventListener('mouseleave', e => {
            onMiss();
        });
    },
    update: function() {
        // TODO: Handle updates
        this.ray.material.uniforms.color.value.set(this.data.color);
    },
    tick: function() {
        if(!this.currentEl) { return; }

        // Get latest intersection to update marker
        const raycaster = this.el.components['raycaster']!;
        // FIXME: Update aframe-types
        const intersection: THREE.Intersection = (raycaster as any).getIntersection(this.currentEl);

        this.marker.position.copy(intersection.point);
        this.marker.parent!.worldToLocal(this.marker.position);
    },
    remove: function() {
        this.el.removeObject3D('ray');
        this.el.removeObject3D('marker');
        // TODO: Remove event listeners
    },
});

declare module "aframe" {
    export interface Components {
        "interaction-ray": InstanceType<typeof InteractionRayComponent>
    }
}