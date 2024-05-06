import { SinglePropertySchema, TypeFor } from "aframe";

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

export const FLEX_SCHEMA = {
    margin: NUMBER_OR_PERCENTAGE_OR_AUTO,
    marginX: NUMBER_OR_PERCENTAGE_OR_AUTO,
    marginY: NUMBER_OR_PERCENTAGE_OR_AUTO,
    marginTop: NUMBER_OR_PERCENTAGE_OR_AUTO,
    marginLeft: NUMBER_OR_PERCENTAGE_OR_AUTO,
    marginRight: NUMBER_OR_PERCENTAGE_OR_AUTO,
    marginBottom: NUMBER_OR_PERCENTAGE_OR_AUTO,
    transformTranslateX: NUMBER,
    transformTranslateY: NUMBER,
    transformTranslateZ: NUMBER,
    transformScaleX: NUMBER,
    transformScaleY: NUMBER,
    transformScaleZ: NUMBER,
    transformRotateX: NUMBER,
    transformRotateY: NUMBER,
    transformRotateZ: NUMBER,
    positionType: oneOf(["absolute", "relative", "static"]),
    inset: NUMBER_OR_PERCENTAGE,
    positionTop: NUMBER_OR_PERCENTAGE,
    positionLeft: NUMBER_OR_PERCENTAGE,
    positionRight: NUMBER_OR_PERCENTAGE,
    positionBottom: NUMBER_OR_PERCENTAGE,
    alignContent: oneOf(["space-around", "space-between", "baseline", "stretch", "flex-end", "center", "flex-start", "auto"]),
    alignItems: oneOf(["space-around", "space-between", "baseline", "stretch", "flex-end", "center", "flex-start", "auto"]),
    alignSelf: oneOf(["space-around", "space-between", "baseline", "stretch", "flex-end", "center", "flex-start", "auto"]),
    flexDirection: oneOf(["row-reverse", "row", "column-reverse", "column"]),
    flexWrap: oneOf(["wrap-reverse", "wrap", "no-wrap"]),
    justifyContent: oneOf(["space-around", "space-between", "flex-end", "center", "flex-start", "space-evenly"]),
    flexBasis: NUMBER_OR_PERCENTAGE,
    flexGrow: NUMBER,
    flexShrink: NUMBER,
    width: NUMBER_OR_PERCENTAGE_OR_AUTO,
    height: NUMBER_OR_PERCENTAGE_OR_AUTO,
    minWidth: NUMBER_OR_PERCENTAGE,
    minHeight: NUMBER_OR_PERCENTAGE,
    maxWidth: NUMBER_OR_PERCENTAGE,
    maxHeight: NUMBER_OR_PERCENTAGE,
    aspectRatio: NUMBER,
    border: NUMBER,
    borderX: NUMBER,
    borderY: NUMBER,
    borderTop: NUMBER,
    borderLeft: NUMBER,
    borderRight: NUMBER,
    borderBottom: NUMBER,
    overflow: oneOf(["visible", "scroll", "hidden"]),
    padding: NUMBER_OR_PERCENTAGE,
    paddingX: NUMBER_OR_PERCENTAGE,
    paddingY: NUMBER_OR_PERCENTAGE,
    paddingTop: NUMBER_OR_PERCENTAGE,
    paddingLeft: NUMBER_OR_PERCENTAGE,
    paddingRight: NUMBER_OR_PERCENTAGE,
    paddingBottom: NUMBER_OR_PERCENTAGE,
    gap: NUMBER,
    gapRow: NUMBER,
    gapColumn: NUMBER,
} as const;