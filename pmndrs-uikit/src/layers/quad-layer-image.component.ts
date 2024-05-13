import * as AFRAME from 'aframe';
import * as THREE from 'three';
import { HOLE_PUNCH_MATERIAL } from './hole-punch-material';

export const QuadLayerImageComponent = AFRAME.registerComponent('quad-layer-image', {
    schema: {
        width: { type: 'number', default: 1.0 },
        height: { type: 'number', default: 1.0 },

        src: { type: 'map' },

        quality: { type: 'string', default: 'default', oneOf: ['default', 'text-optimized', 'graphics-optimized'] },
    },
    __fields: {} as {
        layersSystem: AFRAME.Systems['layers'],
        quadLayer: XRQuadLayer|null,

        // Non-layers fallback
        fallbackMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>,

        // Hole-punching
        planeMesh: THREE.Mesh,
    },
    init: function() {
        this.layersSystem = this.el.sceneEl.systems['layers'];
        this.layersSystem.registerLayerElement(this.el, 'quad-layer-image');

        this.quadLayer = null;

        // Generate plain quad for image
        this.fallbackMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial());
        this.el.setObject3D('mesh', this.fallbackMesh);

        // FIXME: Mesh is slightly smaller to avoid flickering on the edges
        //        Handle this in material once rounded corners support is added.
        this.planeMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.99, 0.99), HOLE_PUNCH_MATERIAL);
    },
    update: function(oldData) {
        // Adjust size of fallback mesh
        this.fallbackMesh.scale.set(this.data.width, this.data.height, 1);
        if(this.quadLayer) {
            this.quadLayer.width = this.data.width;
            this.quadLayer.height = this.data.height;
        }

        if (this.data.src !== oldData.src) {
            const material = this.fallbackMesh.material;

            //@ts-ignore A5 compatibility
            if (this.data.src instanceof THREE.Texture) {
                if (material.map !== this.data.src && material.map) {
                    material.map.dispose();
                }
                material.map = this.data.src;
            } else if (this.data.src) {
                const loadingSrc = this.data.src;
                this.el.sceneEl.systems.material.loadTexture(this.data.src, {} as any, (texture: THREE.Texture) => {
                    // Make sure the source hasn't changed while loading
                    if (this.data.src !== loadingSrc) {
                        return;
                    }

                    if (material.map) {
                        material.map.dispose();
                    }

                    material.map = texture;
                    material.map.colorSpace = THREE.SRGBColorSpace;
                    material.needsUpdate = true;

                    if (this.quadLayer) {
                        this.quadLayer = this.createLayer(this.el.sceneEl.renderer.xr.getBinding());
                        this.layersSystem.replaceLayer(this.el, this.quadLayer!);
                    }
                });
            }
        }
    },
    createLayer: function(xrWebGlBinding: XRWebGLBinding) {
        const texture = this.fallbackMesh.material.map;
        if (!texture) {
            return null;
        }

        return xrWebGlBinding.createQuadLayer({
            space: this.el.sceneEl.renderer.xr.getReferenceSpace()!,
            viewPixelWidth: texture?.image.width,
            viewPixelHeight: texture?.image.height,
            width: this.data.width / 2.0,
            height: this.data.height / 2.0,
            //@ts-ignore Current @types/webxr version doesn't include this
            quality: this.data.quality,
            layout: "mono",
        });
    },
    activate: function(layer: XRCompositionLayer|null) {
        this.quadLayer = layer as XRQuadLayer;

        // Setup hole-pun
        this.planeMesh.scale.set(this.data.width, this.data.height, 1.0);
        this.el.sceneEl.object3D.add(this.planeMesh);
        // Hide entity content (rendered into quad layer)
        this.el.object3D.visible = false;
    },
    deactivate: function() {
        this.quadLayer = null;

        // Remove hole-punch
        this.planeMesh.removeFromParent();
        // Reshow entity content
        this.el.object3D.visible = true;
    },
    tick: function() {
        if(!this.quadLayer) { return; }

        // Update and match position and orientation of punch-out mesh and quadLayer.
        this.el.object3D.getWorldPosition(this.planeMesh.position);
        this.el.object3D.getWorldQuaternion(this.planeMesh.quaternion);
        this.quadLayer.transform = new XRRigidTransform(
            this.planeMesh.position,
            this.planeMesh.quaternion);

        // Render
        if(this.quadLayer.needsRedraw) {
            const renderer = this.el.sceneEl.renderer;
            const gl = renderer.getContext() as WebGL2RenderingContext;
            const glBinding = renderer.xr.getBinding();
            const glSubImage = glBinding.getSubImage(this.quadLayer!, this.el.sceneEl.frame!);

            gl.bindTexture(gl.TEXTURE_2D, glSubImage.colorTexture);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
			gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);

            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, glSubImage.textureWidth, glSubImage.textureHeight, gl.RGBA, gl.UNSIGNED_BYTE, this.fallbackMesh.material.map!.image);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
    },
    remove: function() {
        this.layersSystem.unregisterLayerElement(this.el);
    }
});

declare module "aframe" {
    export interface Components {
        "quad-layer-image": InstanceType<typeof QuadLayerImageComponent>,
    }
}