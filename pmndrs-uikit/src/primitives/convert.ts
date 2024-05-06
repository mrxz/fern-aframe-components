import * as AFRAME from "aframe";
import type { KebabCase } from "type-fest";

// FIXME: Update aframe-types to have proper ComponentDescription type
type ComponentDescription = {
    name: string,
    schema: {[key: string]: AFRAME.SinglePropertySchema<any>}
}

type StripPrefix<T extends string, Suffix = T extends `uikit-${infer Name}` ? Name : T> = Suffix;

export function convertComponentToPrimitive<
    Name extends keyof AFRAME.Components,
    T extends AFRAME.ComponentConstructor<any>,
    C extends AFRAME.ComponentInstance<any, any, any, any, any> = T extends AFRAME.ComponentConstructor<infer Instance> ? Instance : never>(componentName: Name, component: T)
        : AFRAME.PrimitiveConstructor<{[key in StripPrefix<Name>]: {}}, {[key in Extract<keyof C["schema"], string> as KebabCase<key>]: `${Name}.${key}`}>
{
    // Lookup component
    const componentDescription = AFRAME.components[componentName] as unknown as ComponentDescription;
    const name = `ui-${componentDescription.name.split('-')[1]}`;
    const mappings: {[key: string]: string} = {};
    for(const propName in componentDescription.schema) {
        mappings[toKebabCase(propName)] = `${componentDescription.name}.${propName}`;
    }
    return AFRAME.registerPrimitive(name, {
        defaultComponents: {
            [componentDescription.name]: {}
        },
        mappings
    } as any);
}

function toKebabCase(x: string): string {
    return x.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}