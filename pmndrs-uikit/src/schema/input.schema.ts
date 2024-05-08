import { InputProperties, TextProperties } from "@pmndrs/uikit";
import { BOOLEAN, STRING, NUMBER } from "./property-types";

export const INPUT_SCHEMA = {
    multiline: BOOLEAN,
    value: STRING,
    defaultValue: STRING,
    // TODO: Event handling
    //onValueChange	(value: string) => void
    tabIndex: NUMBER,
    disabled: BOOLEAN,
} as const satisfies Partial<Record<Exclude<keyof InputProperties, keyof TextProperties>, any>>;
