import { Image } from '@pmndrs/uikit';
import * as AFRAME from 'aframe';
import { FLEX_SCHEMA } from '../schema/flex.schema';
import { deferInitialization, handleDefaultPropertiesUpdate, swapObject3D, uiRaycast } from '../common';
import { IMAGE_SCHEMA } from '../schema/image.schema';

const PROPERTIES_SCHEMA = {
    ...IMAGE_SCHEMA,
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
            hover: this.el.getAttribute('uikit-text-hover'),
            active: this.el.getAttribute('uikit-text-active')
        });
    },
    remove: function() {
        // TODO: Remove event listener
        this.image.parent?.removeFromParent();
    }
});

// Generate conditional properties components
const ConditionalPropertiesComponent = {
    schema: PROPERTIES_SCHEMA,
    update: function() {
        // FIXME: It seems that undefined keys in object can throw off the logic
        //        As a workaround filter them out by mutating data directly
        for(const key in this.data) {
            const data = this.data as any;
            if(data[key] === undefined) {
                delete data[key];
            }
        }
        this.el.emit('uikit-properties-update');
    },
    remove: function() {
        this.el.emit('uikit-properties-update');
    }
} as const satisfies AFRAME.ComponentDefinition;

const ImageHoverComponent = AFRAME.registerComponent('uikit-image-hover', ConditionalPropertiesComponent);
const ImageActiveComponent = AFRAME.registerComponent('uikit-image-active', ConditionalPropertiesComponent);

declare module "aframe" {
    export interface Components {
        "uikit-image": InstanceType<typeof ImageComponent>,
        "uikit-image-hover": InstanceType<typeof ImageHoverComponent>,
        "uikit-image-active": InstanceType<typeof ImageActiveComponent>
    }
}