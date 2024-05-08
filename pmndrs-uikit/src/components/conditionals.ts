import * as AFRAME from 'aframe';

type ConditionalComponents<S extends AFRAME.Schema> = {
    hover: AFRAME.ComponentConstructor<AFRAME.ComponentInstance<S, false, false, any, undefined>>,
    active: AFRAME.ComponentConstructor<AFRAME.ComponentInstance<S, false, false, any, undefined>>,
    // Optional
    focus?: AFRAME.ComponentConstructor<AFRAME.ComponentInstance<S, false, false, any, undefined>>,
}

export function registerConditionalComponents<S extends object>(schema: S, name: string, includeFocus: boolean = false): ConditionalComponents<S> {
    // Generate conditional properties components
    const ConditionalPropertiesComponent = {
        schema: schema,
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

    return ({
        hover: AFRAME.registerComponent(`${name}-hover`, ConditionalPropertiesComponent),
        active: AFRAME.registerComponent(`${name}-active`, ConditionalPropertiesComponent),
        focus: includeFocus ? AFRAME.registerComponent(`${name}-focus`, ConditionalPropertiesComponent) : undefined,
    });
}