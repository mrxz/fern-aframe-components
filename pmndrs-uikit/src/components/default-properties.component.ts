import * as AFRAME from 'aframe';
import { FLEX_SCHEMA } from '../schema/flex.schema';
import { CONTAINER_SCHEMA } from '../schema/container.schema';
import { TEXT_SCHEMA } from '../schema/text.schema';

export const DefaultPropertiesComponent = AFRAME.registerComponent('uikit-default-properties', {
    schema: {
        ...CONTAINER_SCHEMA,
        ...FLEX_SCHEMA,
        ...TEXT_SCHEMA
    },
    init: function() {

    },
    update: function() {
        // NOTE: Default properties apply to children, not the node itself
        for(let i = 0; i < this.el.children.length; i++) {
            const child = this.el.children[i] as AFRAME.Entity;
            if(child.emit) {
                // FIXME: Inherit from up the chain.
                child.emit('uikit-default-properties-update', {properties: {...this.data}}, false);
            }
        }
    },
    remove: function() {
        // TODO: Notify children of removal of default properties.
    }
});

declare module "aframe" {
    export interface Components {
        "uikit-default-properties": InstanceType<typeof DefaultPropertiesComponent>,
    }
}