import { Root, reversePainterSortStable } from '@pmndrs/uikit';
import * as AFRAME from 'aframe';
import { FLEX_SCHEMA } from '../schema/flex.schema';
import { swapObject3D } from '../common';
import { ROOT_SCHEMA } from '../schema/root.schema';

const RootComponent = AFRAME.registerComponent('uikit-root', {
    schema: {
        ...ROOT_SCHEMA,
        ...FLEX_SCHEMA
    },
    __fields: {} as {
        root: Root
    },
    init: function() {
        const sceneEl = this.el.sceneEl;
        this.root = new Root(sceneEl.camera, sceneEl.renderer, undefined, {
            ...this.data,
        });
        swapObject3D(this.el, this.root);

        // FIXME: Move into setup and/or system?
        sceneEl.renderer.localClippingEnabled = true
        sceneEl.renderer.setTransparentSort(reversePainterSortStable);
    },
    tick: function(_t, dt) {
        this.root.update(dt/1000.0);
    }
});

declare module "aframe" {
    export interface Components {
        "uikit-root": InstanceType<typeof RootComponent>
    }
}