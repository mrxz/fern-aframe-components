import { Container } from '@pmndrs/uikit';
import * as AFRAME from 'aframe';
import { FLEX_SCHEMA } from './flex-schema';
import { deferRootInitialized, swapObject3D } from './common';

const ContainerComponent = AFRAME.registerComponent('uikit-container', {
    schema: {
        ...FLEX_SCHEMA
    },
    __fields: {} as {
        container: Container
    },
    init: function() {
        this.container = new Container({
            flexGrow: 1,
            width: 100,
            height: 100,
            backgroundOpacity: 0.5,
            hover: { backgroundOpacity: 1 },
            backgroundColor: "red"
        });

        // Find the respective Root
        deferRootInitialized(this.el, () => {
            swapObject3D(this.el, this.container);
        });
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