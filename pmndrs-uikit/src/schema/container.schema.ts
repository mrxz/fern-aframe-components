import { ContainerProperties } from "@pmndrs/uikit";
import { BOOLEAN, NUMBER, COLOR, STRING } from "./property-types";

export const CONTAINER_SCHEMA = {
    zIndexOffset: NUMBER,
    receiveShadow: BOOLEAN,
    castShadow: BOOLEAN,
    backgroundColor: COLOR,
    backgroundOpacity: NUMBER,
    //panelMaterialClass	Material class TODO
    borderOpacity: NUMBER,
    borderColor: COLOR,
    borderRadius: NUMBER,
    borderLeftRadius: NUMBER,
    borderRightRadius: NUMBER,
    borderTopRadius: NUMBER,
    borderBottomRadius: NUMBER,
    borderTopLeftRadius: NUMBER,
    borderTopRightRadius: NUMBER,
    borderBottomRightRadius: NUMBER,
    borderBottomLeftRadius: NUMBER,
    borderBend: NUMBER,
    borderWidth: NUMBER,
    borderLeftWidth: NUMBER,
    borderRightWidth: NUMBER,
    borderTopWidth: NUMBER,
    borderBottomWidth: NUMBER,
    //scrollbarPanelMaterialClass	Material class TODO
    scrollbarWidth: NUMBER,
    scrollbarBorderRadius: NUMBER,
    scrollbarBorderLeftRadius: NUMBER,
    scrollbarBorderRightRadius: NUMBER,
    scrollbarBorderTopRadius: NUMBER,
    scrollbarBorderBottomRadius: NUMBER,
    scrollbarBorderTopLeftRadius: NUMBER,
    scrollbarBorderTopRightRadius: NUMBER,
    scrollbarBorderBottomRightRadius: NUMBER,
    scrollbarBorderBottomLeftRadius: NUMBER,
} as const satisfies Partial<Record<keyof ContainerProperties, any>>;
