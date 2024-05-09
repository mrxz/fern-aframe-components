import * as AFRAME from "aframe";
import { toKebabCase } from "../utils";
import type { KebabCase } from "type-fest";

// FIXME: Update aframe-types to have proper ComponentDescription type
type ComponentDescription = {
    Component: any,
    name: string,
    schema: {[key: string]: AFRAME.SinglePropertySchema<any>}
}

type StripPrefix<T extends string, Suffix = T extends `uikit-${infer Name}` ? Name : T> = Suffix;

export function convertComponentToPrimitive<
    Name extends keyof AFRAME.Components,
    T extends AFRAME.ComponentConstructor<any>,
    C extends AFRAME.ComponentInstance<any, any, any, any, any> = T extends AFRAME.ComponentConstructor<infer Instance> ? Instance : never,
    ExtraComponents extends keyof AFRAME.Components = never>(componentName: Name, componentConstructor: T, additionalComponents: ExtraComponents[] = [])
        : AFRAME.PrimitiveConstructor<
            {[key in StripPrefix<Name>]: {}} & {[key in ExtraComponents]: {}},
            {[key in Extract<keyof C["schema"], string> as KebabCase<key>]: `${Name}.${key}`} & {hover: `${Name}-hover`, active: `${Name}-active`,}
        >
{
    // Lookup component
    const componentDescription = AFRAME.components[componentName] as unknown as ComponentDescription;
    if(componentDescription.Component !== componentConstructor) {
        throw Error(`Component '${componentName}' does not match registered component!`)
    }
    const name = `ui-${componentDescription.name.split('-')[1]}`;
    const hasFocus = `${componentDescription.name}-focus` in AFRAME.components;

    // Default components
    const defaultComponents: {[key: string]: {}} = {
        [componentDescription.name]: {},
        [componentDescription.name + '-hover']: {},
        [componentDescription.name + '-active']: {},
        ...Object.fromEntries(additionalComponents.map(name => [name, {}]))
    };
    if(hasFocus) {
        defaultComponents[componentDescription.name + '-focus'] = {};
    }

    // Mappings
    const mappings: {[key: string]: string} = {};
    for(const propName in componentDescription.schema) {
        mappings[toKebabCase(propName)] = `${componentDescription.name}.${propName}`;
    }
    // Conditional properties
    mappings['hover'] = `${componentDescription.name}-hover`;
    mappings['active'] = `${componentDescription.name}-active`;
    if(hasFocus) {
        mappings['focus'] = `${componentDescription.name}-focus`
    }

    const primitive = AFRAME.registerPrimitive(name, {
        defaultComponents: defaultComponents,
        mappings
    } as any);

    // FIXME: A-Frame currently doesn't handle setAttribute on primitives directly, instead it awaits change callback
    //        For now provide our own implementation that does what we need
    primitive.prototype.setAttribute = function(attrName: string, arg1: any, arg2: any) {
        // HACK: Perform kebab-case conversion here... ideally done earlier
        var componentName = this.mappings[toKebabCase(attrName)];
        // HACK;
        if (attrName === 'cursor') {
            return;
        }

        if (!attrName || !componentName) {
            this.__proto__.__proto__.setAttribute.call(this, attrName, arg1, arg2);
            return;
        }

        const path = componentName.split('.');
        if(path.length === 1) {
            this.__proto__.__proto__.setAttribute.call(this, path[0], arg1, arg2);
        } else {
            this.__proto__.__proto__.setAttribute.call(this, path[0], path[1], arg1);
        }
    }
    return primitive;
}
