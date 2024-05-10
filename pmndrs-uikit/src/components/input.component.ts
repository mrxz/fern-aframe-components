import { Input, InputProperties } from '@pmndrs/uikit';
import * as AFRAME from 'aframe';
import { deferInitialization, handleDefaultPropertiesUpdate, swapObject3D, uiRaycast } from '../common';
import { registerConditionalComponents } from './conditionals';
import { INPUT_SCHEMA, TEXT_SCHEMA, CONTAINER_SCHEMA, FLEX_SCHEMA, HasProperties } from '../schema';

const PROPERTIES_SCHEMA = {
    ...INPUT_SCHEMA,
    ...TEXT_SCHEMA,
    ...CONTAINER_SCHEMA,
    ...FLEX_SCHEMA
} as const satisfies HasProperties<InputProperties>;

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
            hover: this.el.getAttribute('uikit-input-hover'),
            active: this.el.getAttribute('uikit-input-active'),
            focus: this.el.getAttribute('uikit-input-focus'),
        });
    },
    remove: function() {
        // TODO: Remove event listener
        this.input.parent?.removeFromParent();
    }
});

const {
    hover: InputHoverComponent,
    active: InputActiveComponent,
    focus: InputFocusComponent,
} = registerConditionalComponents(PROPERTIES_SCHEMA, 'uikit-input', true);

declare module "aframe" {
    export interface Components {
        "uikit-input": InstanceType<typeof InputComponent>,
        "uikit-input-hover": InstanceType<typeof InputHoverComponent>,
        "uikit-input-active": InstanceType<typeof InputActiveComponent>,
        "uikit-input-focus": InstanceType<Exclude<typeof InputFocusComponent, undefined>>
    }
}