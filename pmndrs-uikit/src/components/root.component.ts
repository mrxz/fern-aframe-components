import { Root, RootProperties } from '@pmndrs/uikit';
import * as AFRAME from 'aframe';
import { handleDefaultPropertiesUpdate, swapObject3D, uiRaycast } from '../common';
import { ROOT_SCHEMA, FLEX_SCHEMA, HasProperties } from '../schema';

export const RootComponent = AFRAME.registerComponent('uikit-root', {
    schema: {
        ...ROOT_SCHEMA,
        ...FLEX_SCHEMA,
        pixelSize: { type: 'number', default: 0.01 } as const,
    } satisfies HasProperties<RootProperties|{pixelSize: number}>,
    __fields: {} as {
        root: Root,
    },
    init: function() {
        const sceneEl = this.el.sceneEl;
        // NOTE: Provide getter for camera, to handle camera switching and user-provided cameras.
        this.root = new Root(() => sceneEl.camera, sceneEl.renderer, {
            ...this.data,
        }, undefined);
        swapObject3D(this.el, this.root);
        // Add intersection plane for interactions
        this.el.object3DMap['ui'] = this.root;
        this.root.raycast = uiRaycast.bind(this.root);
        (this.root as any).childrenContainer.raycast = uiRaycast.bind((this.root as any).childrenContainer);

        this.el.addEventListener('uikit-default-properties-update', (e) => handleDefaultPropertiesUpdate(this.el, this.root, e));

        // FIXME: Move into setup and/or system?
        //sceneEl.renderer.localClippingEnabled = true
        //sceneEl.renderer.setTransparentSort(reversePainterSortStable);

        // Emit initialized event to initialize entire sub-tree
        this.el.emit('uikit-initialized', {}, false);
    },
    tick: function(_t, dt) {
        this.root.update(dt/1000.0);
    },
    remove: function() {
        // TODO
    }
});

declare module "aframe" {
    export interface Components {
        "uikit-root": InstanceType<typeof RootComponent>
    }
}