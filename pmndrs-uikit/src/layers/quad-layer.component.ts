import * as AFRAME from 'aframe';
import * as THREE from 'three';

const HOLE_PUNCH_MATERIAL = new THREE.MeshBasicMaterial({
    color: new THREE.Color('black'),
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.ZeroFactor,
    blendDst: THREE.ZeroFactor,
    blendEquationAlpha: THREE.AddEquation,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.ZeroFactor,
    opacity: 0,
});

const tempV3 = new THREE.Vector3();

export const QuadLayerComponent = AFRAME.registerComponent('quad-layer', {
    schema: {
        width: { type: 'number', default: 1.0 },
        height: { type: 'number', default: 1.0 },

        resolutionWidth: { type: 'number', default: 1024 },
        resolutionHeight: { type: 'number', default: 1024 },

        quality: { type: 'string', default: 'default', oneOf: ['default', 'text-optimized', 'graphics-optimized'] },
        dynamic: { type: 'boolean', default: false },
    },
    __fields: {} as {
        layersSystem: AFRAME.Systems['layers'],
        quadLayer: XRQuadLayer|null,
        framebuffer: WebGLFramebuffer|null,
        renderTarget: THREE.WebGLRenderTarget|null,

        // Hole-punching
        planeMesh: THREE.Mesh,
        camera: THREE.OrthographicCamera,
    },
    init: function() {
        this.layersSystem = this.el.sceneEl.systems['layers'];
        this.layersSystem.registerLayerElement(this.el);

        this.quadLayer = null;

        // FIXME: Mesh is slightly smaller to avoid flickering on the edges
        //        Handle this in material once rounded corners support is added.
        this.planeMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.99, 0.99), HOLE_PUNCH_MATERIAL);
        this.camera = new THREE.OrthographicCamera();
    },
    update: function() {
        // Update camera bounds
        this.camera.left = -this.data.width/2.0;
        this.camera.right = this.data.width/2.0;
        this.camera.top = this.data.height/2.0;
        this.camera.bottom = -this.data.height/2.0;
        this.camera.near = 0.01;
        this.camera.far = 1000;
        this.camera.updateProjectionMatrix();
    },
    activate: function(layer: XRQuadLayer) {
        this.quadLayer = layer;

        // Setup hole-pun
        this.planeMesh.scale.set(this.data.width, this.data.height, 1.0);
        this.el.sceneEl.object3D.add(this.planeMesh);
        // Hide entity content (rendered into quad layer)
        this.el.object3D.visible = false;
    },
    deactivate: function() {
        this.quadLayer = null;

        this.renderTarget?.dispose();
        this.renderTarget = null;
        this.framebuffer = null;

        // Remove hole-punch
        this.planeMesh.removeFromParent();
        // Reshow entity content
        this.el.object3D.visible = true;
    },
    setupRenderTarget: function() {
        const renderer = this.el.sceneEl.renderer;
        const gl = renderer.getContext() as WebGL2RenderingContext;
        const glBinding = renderer.xr.getBinding();
        const glSubImage = glBinding.getSubImage(this.quadLayer!, this.el.sceneEl.frame!);

        const currentRenderTarget = renderer.getRenderTarget();

        this.renderTarget = new THREE.WebGLRenderTarget(this.data.resolutionWidth, this.data.resolutionHeight, {
            //@ts-ignore DepthTexture constructor does take a 10th argument
            depthTexture: new THREE.DepthTexture(this.data.resolutionWidth, this.data.resolutionHeight, THREE.UnsignedIntType, undefined, undefined, undefined, undefined, undefined, undefined, THREE.DepthFormat),
            colorSpace: THREE.SRGBColorSpace
        });
        (this.renderTarget as any).isXRRenderTarget = true;

        this.framebuffer = gl.createFramebuffer();
        (renderer as any).setRenderTargetFramebuffer(this.renderTarget, this.framebuffer);
        renderer.setRenderTarget(this.renderTarget);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, glSubImage.colorTexture, 0);
        (renderer as any).setRenderTargetTextures(this.renderTarget, glSubImage.colorTexture, undefined);

        renderer.setRenderTarget(currentRenderTarget);
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
        if(this.quadLayer.needsRedraw || this.data.dynamic) {
            const renderer = this.el.sceneEl.renderer;

            if(!this.renderTarget) {
                this.setupRenderTarget();
            } else {
                const glBinding = renderer.xr.getBinding();
                const glSubImage = glBinding.getSubImage(this.quadLayer!, this.el.sceneEl.frame!);
                (renderer as any).setRenderTargetTextures(this.renderTarget, glSubImage.colorTexture, undefined);
            }

            // Update camera
            this.el.object3D.getWorldPosition(this.camera.position);
            this.el.object3D.getWorldDirection(tempV3);
            this.camera.position.add(tempV3);
            this.camera.setRotationFromQuaternion(this.el.object3D.getWorldQuaternion(new THREE.Quaternion()));

            const currentRenderTarget = renderer.getRenderTarget();
            renderer.xr.enabled = false;
            renderer.setRenderTarget(this.renderTarget);
            renderer.clear(true, true, true);

            this.planeMesh.visible = false;
            this.el.object3D.visible = true;
            // FIXME: Introduce option to render entire scene?
            renderer.render(this.el.object3D, this.camera);
            this.el.object3D.visible = false;
            this.planeMesh.visible = true;

            renderer.xr.enabled = true;
            renderer.setRenderTarget(currentRenderTarget);
        }
    },
    remove: function() {
        this.layersSystem.unregisterLayerElement(this.el);
    }
});

declare module "aframe" {
    export interface Components {
        "quad-layer": InstanceType<typeof QuadLayerComponent>,
    }
}