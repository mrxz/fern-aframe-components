import { Image } from '@pmndrs/uikit';
import * as AFRAME from 'aframe';
import { FLEX_SCHEMA } from '../schema/flex.schema';
import { deferInitialization, handleDefaultPropertiesUpdate, swapObject3D, uiRaycast } from '../common';
import { IMAGE_SCHEMA } from '../schema/image.schema';
import { CONTAINER_SCHEMA } from '../schema/container.schema';
import { registerConditionalComponents } from './conditionals';

const PROPERTIES_SCHEMA = {
    ...IMAGE_SCHEMA,
    ...CONTAINER_SCHEMA,
    ...FLEX_SCHEMA
} as const;

export const ImageComponent = AFRAME.registerComponent('uikit-image', {
    schema: PROPERTIES_SCHEMA,
    __fields: {} as {
        image: Image
    },
    init: function() {
        this.image = new Image();
        this.el.addEventListener('uikit-properties-update', () => this.updateUIProperties());
        this.el.addEventListener('uikit-default-properties-update', (e) => handleDefaultPropertiesUpdate(this.el, this.image, e));

        // Find the respective Root
        deferInitialization(this.el, () => {
            swapObject3D(this.el, this.image);
        });
        this.image.raycast = uiRaycast.bind(this.image);
    },
    update: function() {
        this.updateUIProperties();
    },
    updateUIProperties: function() {
        this.image.setProperties({
            ...this.data,
            hover: this.el.getAttribute('uikit-image-hover'),
            active: this.el.getAttribute('uikit-image-active')
        });
    },
    remove: function() {
        // TODO: Remove event listener
        this.image.parent?.removeFromParent();
    }
});

const {
    hover: ImageHoverComponent,
    active: ImageActiveComponent
} = registerConditionalComponents(PROPERTIES_SCHEMA, 'uikit-image');

declare module "aframe" {
    export interface Components {
        "uikit-image": InstanceType<typeof ImageComponent>,
        "uikit-image-hover": InstanceType<typeof ImageHoverComponent>,
        "uikit-image-active": InstanceType<typeof ImageActiveComponent>
    }
}