import { Input } from '@pmndrs/uikit';
import * as AFRAME from 'aframe';
import { FLEX_SCHEMA } from '../schema/flex.schema';
import { deferInitialization, handleDefaultPropertiesUpdate, swapObject3D, uiRaycast } from '../common';
import { INPUT_SCHEMA } from '../schema/input.schema';
import { CONTAINER_SCHEMA } from '../schema/container.schema';
import { TEXT_SCHEMA } from '../schema/text.schema';
import { registerConditionalComponents } from './conditionals';

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

const {
    hover: InputHoverComponent,
    active: InputActiveComponent
} = registerConditionalComponents(PROPERTIES_SCHEMA, 'uikit-input');

declare module "aframe" {
    export interface Components {
        "uikit-input": InstanceType<typeof InputComponent>,
        "uikit-input-hover": InstanceType<typeof InputHoverComponent>,
        "uikit-input-active": InstanceType<typeof InputActiveComponent>
    }
}