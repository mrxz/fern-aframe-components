import { Container, ContainerProperties } from '@pmndrs/uikit';
import * as AFRAME from 'aframe';
import { FLEX_SCHEMA } from '../schema/flex.schema';
import { deferInitialization, handleDefaultPropertiesUpdate, swapObject3D, uiRaycast } from '../common';
import { CONTAINER_SCHEMA, HasProperties } from '../schema/';
import { registerConditionalComponents } from './conditionals';

const PROPERTIES_SCHEMA = {
    ...CONTAINER_SCHEMA,
    ...FLEX_SCHEMA,
} as const satisfies HasProperties<ContainerProperties>;

export const ContainerComponent = AFRAME.registerComponent('uikit-container', {
    schema: PROPERTIES_SCHEMA,
    __fields: {} as {
        container: Container
    },
    init: function() {
        this.container = new Container();
        this.el.addEventListener('uikit-properties-update', () => this.updateUIProperties())
        this.el.addEventListener('uikit-default-properties-update', (e) => handleDefaultPropertiesUpdate(this.el, this.container, e));

        // Find the respective Root
        deferInitialization(this.el, () => {
            swapObject3D(this.el, this.container);
        });
        this.container.raycast = uiRaycast.bind(this.container);
    },
    update: function() {
        this.updateUIProperties();
    },
    updateUIProperties: function() {
        this.container.setProperties({
            ...this.data,
            hover: this.el.getAttribute('uikit-container-hover'),
            active: this.el.getAttribute('uikit-container-active')
        });
    },
    remove: function() {
        // TODO: Remove event listener
        this.container.parent?.removeFromParent();
    }
});

export const {
    hover: ContainerHoverComponent,
    active: ContainerActiveComponent
} = registerConditionalComponents(PROPERTIES_SCHEMA, 'uikit-container');

declare module "aframe" {
    export interface Components {
        "uikit-container": InstanceType<typeof ContainerComponent>,
        "uikit-container-hover": InstanceType<typeof ContainerHoverComponent>,
        "uikit-container-active": InstanceType<typeof ContainerActiveComponent>
    }
}