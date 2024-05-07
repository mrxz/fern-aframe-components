export const BOOLEAN = {
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
} as const;

export const COLOR = {
    type: 'color',
    default: undefined,
    parse: function(input: any) {
        if(typeof input === 'string') {
            return input;
        }
        return undefined;
    }
} as const;

export const STRING = {
    type: 'string',
    default: undefined,
    parse: function(input: any) {
        if(typeof input !== 'string') {
            return undefined;
        }
        return input;
    }
} as const;

export const NUMBER = {
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
} as const;

export const NUMBER_OR_PERCENTAGE = {
    type: 'string',
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
} as const;

export const NUMBER_OR_PERCENTAGE_OR_AUTO = {
    type: 'string',
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

export function oneOf<const T extends string[]>(options: T): {type: 'string', parse: (input: any) => T[number]|undefined, oneOf: T} {
    return {
        type: 'string',
        parse: function(input: any) {
            if(options.includes(input)) {
                return input as T[number];
            }
            return undefined;
        },
        oneOf: options
    }
}