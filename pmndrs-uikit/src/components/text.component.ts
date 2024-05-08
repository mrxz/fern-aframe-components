import { Text } from '@pmndrs/uikit';
import * as AFRAME from 'aframe';
import { FLEX_SCHEMA } from '../schema/flex.schema';
import { TEXT_SCHEMA } from '../schema/text.schema';
import { deferInitialization, handleDefaultPropertiesUpdate, swapObject3D, uiRaycast } from '../common';
import { CONTAINER_SCHEMA } from '../schema/container.schema';

const PROPERTIES_SCHEMA = {
    ...TEXT_SCHEMA,
    ...CONTAINER_SCHEMA,
    ...FLEX_SCHEMA
} as const;

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
        });
    },
    updateContent: function() {
        this.text.setText(this.el.innerText);
    },
    remove: function() {
        // TODO: Remove event listener
        this.text.parent?.removeFromParent();
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

const TextHoverComponent = AFRAME.registerComponent('uikit-text-hover', ConditionalPropertiesComponent);
const TextActiveComponent = AFRAME.registerComponent('uikit-text-active', ConditionalPropertiesComponent);

declare module "aframe" {
    export interface Components {
        "uikit-text": InstanceType<typeof TextComponent>,
        "uikit-text-hover": InstanceType<typeof TextHoverComponent>,
        "uikit-text-active": InstanceType<typeof TextActiveComponent>
    }
}