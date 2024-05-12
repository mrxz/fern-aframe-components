import type * as THREE from "three";

type UikitProp<Name extends string, T> = { type: Name, default: undefined, parse: (input: any) => T|undefined};

export type UikitBooleanSchema = UikitProp<'boolean', boolean>;
export type UikitColorSchema = UikitProp<'color', string|THREE.Color>;
export type UikitStringSchema = UikitProp<'string', string>;
export type UikitTextureSchema = UikitProp<'map', string|THREE.Texture>;
export type UikitNumberSchema = UikitProp<'number', number>;
export type UikitNumberOrPercentageSchema = UikitProp<'string', number|`${number}%`>;
export type UikitNumberOrPercentageOrAutoSchema = UikitProp<'string', number|`${number}%`|'auto'>;
export type UikitOneOfSchema<Options extends string[]> = UikitProp<'string', Options[number]> & {oneOf: Options};


export const BOOLEAN: UikitBooleanSchema = {
    type: 'boolean',
    default: undefined,
    parse: function(input: any) {
        if(typeof input === 'boolean') {
            return input;
        }
        if(typeof input !== 'string') {
            return undefined;
        }
        return input === 'true';
    }
};

export const COLOR: UikitColorSchema = {
    type: 'color',
    default: undefined,
    parse: function(input: any): string | THREE.Color | undefined {
        if(typeof input === 'string' || input?.isColor) {
            return input;
        }
        return undefined;
    }
};

export const STRING: UikitStringSchema = {
    type: 'string',
    default: undefined,
    parse: function(input: any) {
        if(typeof input !== 'string') {
            return undefined;
        }
        return input;
    }
};

const urlRegex = /url\((.+)\)/;
export const TEXTURE: UikitTextureSchema = {
    type: 'map',
    default: undefined,
    parse: function(input: any) {
        if(typeof input === 'object' && input) {
            if(input.isTexture) {
                return input as THREE.Texture;
            }
            if(input.tagName === 'IMG') {
                // TODO: Load corresponding texture, for now pass src
                return (input as HTMLImageElement).src;
            }
        }
        if(typeof input !== 'string') {
            return undefined;
        }
        // Is either the url or wrapped in url()
        const parsedUrl = input.match(urlRegex);
        if(parsedUrl) { return parsedUrl[1]; }
        return input;
    }
};

export const NUMBER: UikitNumberSchema = {
    type: 'number',
    default: undefined,
    parse: function(input: any) {
        if(typeof input === 'number') {
            return input;
        }
        if(typeof input !== 'string') {
            return undefined;
        }
        const parsedFloat = Number.parseFloat(input);
        return Number.isFinite(parsedFloat) ? parsedFloat : undefined;
    }
};

export const NUMBER_OR_PERCENTAGE: UikitNumberOrPercentageSchema = {
    type: 'string',
    default: undefined,
    parse: function(input: any) {
        // Nothing to parse for numbers
        if(typeof input === 'number') {
            return input;
        }
        // String inputs are either number, percentage (i.e. '{number}%') or 'auto'
        if(typeof input === 'string') {
            const isPercentage = input.endsWith('%');
            const parsedFloat = Number.parseFloat(isPercentage ? input.substring(0, input.length - 2) : input);
            if(Number.isFinite(parsedFloat)) {
                return isPercentage ? input as `${number}%` : parsedFloat;
            }
        }
        return undefined;
    }
};

export const NUMBER_OR_PERCENTAGE_OR_AUTO: UikitNumberOrPercentageOrAutoSchema = {
    type: 'string',
    default: undefined,
    parse: function(input: any) {
        // Nothing to parse for numbers or 'auto' literal
        if(typeof input === 'number' || input === 'auto') {
            return input as number|'auto';
        }
        // String inputs are either number, percentage (i.e. '{number}%') or 'auto'
        if(typeof input === 'string') {
            const isPercentage = input.endsWith('%');
            const parsedFloat = Number.parseFloat(isPercentage ? input.substring(0, input.length - 2) : input);
            if(Number.isFinite(parsedFloat)) {
                return isPercentage ? input as `${number}%` : parsedFloat;
            }
        }
        return undefined;
    }
} as const;

export function oneOf<const T extends string[]>(options: T): UikitOneOfSchema<T> {
    return {
        type: 'string',
        default: undefined,
        parse: function(input: any) {
            if(options.includes(input)) {
                return input as T[number];
            }
            return undefined;
        },
        oneOf: options
    }
}