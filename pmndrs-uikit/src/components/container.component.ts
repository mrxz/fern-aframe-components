import { Container } from '@pmndrs/uikit';
import * as AFRAME from 'aframe';
import { FLEX_SCHEMA } from '../schema/flex.schema';
import { deferRootInitialized, swapObject3D, uiRaycast } from '../common';
import { CONTAINER_SCHEMA } from '../schema/container.schema';

export const ContainerComponent = AFRAME.registerComponent('uikit-container', {
    schema: {
        ...CONTAINER_SCHEMA,
        ...FLEX_SCHEMA
    },
    __fields: {} as {
        container: Container
    },
    init: function() {
        this.container = new Container({
            ...this.data,
            hover: { backgroundOpacity: 1 },
        });

        // Find the respective Root
        deferRootInitialized(this.el, () => {
            swapObject3D(this.el, this.container);
        });
        this.container.raycast = uiRaycast.bind(this.container);
    },
    remove: function() {
        this.container.parent?.removeFromParent();
    }
});

declare module "aframe" {
    export interface Components {
        "uikit-container": InstanceType<typeof ContainerComponent>
    }
}