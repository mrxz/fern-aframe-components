import * as AFRAME from "aframe";

const LayersSystem = AFRAME.registerSystem('layers', {
    schema: {
        /** Whether or not to use layers, must be set at initialization */
        enabled: { default: true }
    },
    __fields: {} as {
        /** Flag indicating if layers are currently active (= in WebXR session & layers system enabled & layers feature available) */
        active: boolean;
        /** List of registered elements that should act as layers */
        layers: Array<{
            el: AFRAME.Entity,
            layer?: XRQuadLayer
        }>
    },
    init: function() {
        this.active = false;
        this.layers = [];

        // Ensure layers feature is requested.
        if(this.data.enabled) {
            const webxrData = this.sceneEl.getAttribute('webxr');
            const requiredFeaturesArray = webxrData.requiredFeatures;
            if (requiredFeaturesArray.indexOf('layers') === -1) {
                requiredFeaturesArray.push('layers');
                this.sceneEl.setAttribute('webxr', webxrData);
            }
        }

        this.sceneEl.addEventListener('enter-vr', () => this.onEnterVR());
        this.sceneEl.addEventListener('exit-vr', () => this.onExitVR());
    },
    registerLayerElement: function(el: AFRAME.Entity) {
        const index = this.layers.findIndex(record => record.el === el);
        if(index !== -1) {
            console.warn('Element already registered as layer element!');
            return;
        }

        this.layers.push({el});
    },
    unregisterLayerElement: function(el: AFRAME.Entity) {
        const index = this.layers.findIndex(record => record.el === el);
        if(index !== -1) {
            const record = this.layers[index];
            record.layer?.destroy()
            this.layers.splice(index, 1);
        }
    },
    onEnterVR: function() {
        if(!this.data.enabled) { return; }

        if(this.sceneEl.xrSession && this.sceneEl.xrSession.enabledFeatures?.includes('layers')) {
            this.active = true;

            const xrWebGlBinding = this.sceneEl.renderer.xr.getBinding();
            for(let i = 0; i < this.layers.length; i++) {
                const record = this.layers[i];

                const layerPlaneComponent = record.el.components["quad-layer"]!;
                const layerProperties = layerPlaneComponent.data;
                record.layer = xrWebGlBinding.createQuadLayer({
                    space: this.sceneEl.renderer.xr.getReferenceSpace()!,
                    viewPixelWidth: layerProperties.resolutionWidth,
                    viewPixelHeight: layerProperties.resolutionHeight,
                    width: layerProperties.width / 2.0,
                    height: layerProperties.height / 2.0,
                    //@ts-ignore Current @types/webxr version doesn't include this
                    quality: layerProperties.quality,
                    layout: "mono",
                });
                layerPlaneComponent.activate(record.layer);
            }

            // Update layers array
            const xrSession = this.sceneEl.xrSession!;
            xrSession.updateRenderState({
                layers: [
                    ...this.layers.map(r => r.layer!),
                    this.sceneEl.renderer.xr.getBaseLayer()!,
                ]
            })
        }
    },
    onExitVR: function() {
        if(!this.active) {
            return;
        }

        // Clean-up any layers
        for(let i = 0; i < this.layers.length; i++) {
            const record = this.layers[i];

            record.el.components['quad-layer']!.deactivate();
            record.layer?.destroy();
            record.layer = undefined;
        }
        this.active = false;
    }
});

declare module "aframe" {
    export interface Systems {
        "layers": InstanceType<typeof LayersSystem>
    }
}