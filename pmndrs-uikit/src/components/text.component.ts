import { Text, TextProperties } from '@pmndrs/uikit';
import * as AFRAME from 'aframe';
import { deferInitialization, handleDefaultPropertiesUpdate, swapObject3D, uiRaycast } from '../common';
import { registerConditionalComponents } from './conditionals';
import { TEXT_SCHEMA, CONTAINER_SCHEMA, FLEX_SCHEMA, HasProperties } from '../schema';

const PROPERTIES_SCHEMA = {
    ...TEXT_SCHEMA,
    ...CONTAINER_SCHEMA,
    ...FLEX_SCHEMA,
} as const satisfies HasProperties<TextProperties>;

export const TextComponent = AFRAME.registerComponent('uikit-text', {
    schema: PROPERTIES_SCHEMA,
    __fields: {} as {
        text: Text
    },
    init: function() {
        this.text = new Text();
        this.el.addEventListener('uikit-properties-update', () => this.updateUIProperties());
        this.el.addEventListener('uikit-default-properties-update', (e) => handleDefaultPropertiesUpdate(this.el, this.text, e));

        // Find the respective Root
        deferInitialization(this.el, () => {
            swapObject3D(this.el, this.text);
        });
        this.text.raycast = uiRaycast.bind(this.text);
    },
    update: function() {
        this.updateUIProperties();
        this.updateContent();
    },
    updateUIProperties: function() {
        this.text.setProperties({
            ...this.data,
            hover: this.el.getAttribute('uikit-text-hover'),
            active: this.el.getAttribute('uikit-text-active')
        } satisfies TextProperties);
    },
    updateContent: function() {
        this.text.setText(this.el.innerText);
    },
    remove: function() {
        // TODO: Remove event listener
        this.text.parent?.removeFromParent();
    }
});

const {
    hover: TextHoverComponent,
    active: TextActiveComponent
} = registerConditionalComponents(PROPERTIES_SCHEMA, 'uikit-text');

declare module "aframe" {
    export interface Components {
        "uikit-text": InstanceType<typeof TextComponent>,
        "uikit-text-hover": InstanceType<typeof TextHoverComponent>,
        "uikit-text-active": InstanceType<typeof TextActiveComponent>
    }
}