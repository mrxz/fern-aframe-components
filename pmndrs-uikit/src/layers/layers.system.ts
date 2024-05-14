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
            layer: XRCompositionLayer|null,
            type: 'quad-layer'|'quad-layer-image'
        }>
    },
    init: function() {
        this.active = false;
        this.layers = [];

        // Ensure layers feature is requested.
        if(this.data.enabled) {
            const webxrData = this.sceneEl.getAttribute('webxr');
            const optionalFeaturesArray = webxrData.optionalFeatures;
            if (optionalFeaturesArray.indexOf('layers') === -1) {
                optionalFeaturesArray.push('layers');
                this.sceneEl.setAttribute('webxr', webxrData);
            }
        }

        this.sceneEl.addEventListener('enter-vr', () => this.onEnterVR());
        this.sceneEl.addEventListener('exit-vr', () => this.onExitVR());
    },
    registerLayerElement: function(el: AFRAME.Entity, type: 'quad-layer'|'quad-layer-image') {
        const index = this.layers.findIndex(record => record.el === el);
        if(index !== -1) {
            console.warn('Element already registered as layer element!');
            return;
        }

        this.layers.push({el, layer: null, type});
    },
    replaceLayer: function(el: AFRAME.Entity, layer: XRCompositionLayer) {
        if (!this.active) {
            throw new Error('WebXR Layer can not be replaced as layer system is inactive!');
        }

        const record = this.layers.find(record => record.el === el)!;
        if(record.layer) {
            record.layer?.destroy();
        }
        record.layer = layer;

        const xrSession = this.sceneEl.xrSession!;
        xrSession.updateRenderState({
            layers: [
                ...this.layers.map(r => r.layer!).filter(x => x),
                this.sceneEl.renderer.xr.getBaseLayer()!,
            ]
        })
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

                const layerComponent = record.el.components[record.type]!;
                record.layer = layerComponent.createLayer(xrWebGlBinding);
                layerComponent.activate(record.layer);
            }

            // Update layers array
            const xrSession = this.sceneEl.xrSession!;
            xrSession.updateRenderState({
                layers: [
                    ...this.layers.map(r => r.layer!).filter(x => x),
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

            record.el.components[record.type]!.deactivate();
            record.layer?.destroy();
            record.layer = null;
        }
        this.active = false;
    }
});

declare module "aframe" {
    export interface Systems {
        "layers": InstanceType<typeof LayersSystem>
    }
}