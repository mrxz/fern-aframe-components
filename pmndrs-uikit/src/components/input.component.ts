import { Input } from '@pmndrs/uikit';
import * as AFRAME from 'aframe';
import { FLEX_SCHEMA } from '../schema/flex.schema';
import { deferInitialization, handleDefaultPropertiesUpdate, swapObject3D, uiRaycast } from '../common';
import { INPUT_SCHEMA } from '../schema/input.schema';
import { CONTAINER_SCHEMA } from '../schema/container.schema';
import { TEXT_SCHEMA } from '../schema/text.schema';

const PROPERTIES_SCHEMA = {
    ...INPUT_SCHEMA,
    ...TEXT_SCHEMA,
    ...CONTAINER_SCHEMA,
    ...FLEX_SCHEMA
} as const;

export const InputComponent = AFRAME.registerComponent('uikit-input', {
    schema: PROPERTIES_SCHEMA,
    __fields: {} as {
        input: Input
    },
    init: function() {
        this.input = new Input();
        this.el.addEventListener('uikit-properties-update', () => this.updateUIProperties());
        this.el.addEventListener('uikit-default-properties-update', (e) => handleDefaultPropertiesUpdate(this.el, this.input, e));

        // Find the respective Root
        deferInitialization(this.el, () => {
            swapObject3D(this.el, this.input);
        });
        this.input.raycast = uiRaycast.bind(this.input);
    },
    update: function() {
        this.updateUIProperties();
    },
    updateUIProperties: function() {
        this.input.setProperties({
            ...this.data,
            hover: this.el.getAttribute('uikit-text-hover'),
            active: this.el.getAttribute('uikit-text-active')
        });
    },
    remove: function() {
        // TODO: Remove event listener
        this.input.parent?.removeFromParent();
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

const InputHoverComponent = AFRAME.registerComponent('uikit-input-hover', ConditionalPropertiesComponent);
const InputActiveComponent = AFRAME.registerComponent('uikit-input-active', ConditionalPropertiesComponent);

declare module "aframe" {
    export interface Components {
        "uikit-input": InstanceType<typeof InputComponent>,
        "uikit-input-hover": InstanceType<typeof InputHoverComponent>,
        "uikit-input-active": InstanceType<typeof InputActiveComponent>
    }
}