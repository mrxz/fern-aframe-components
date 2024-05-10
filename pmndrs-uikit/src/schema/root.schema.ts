import { ContainerProperties, RootProperties } from "@pmndrs/uikit";
import { HasProperties } from "./utils";
import { BOOLEAN, NUMBER, oneOf } from "./property-types";

export const ROOT_SCHEMA = {
    anchorX: oneOf(["left", "center", "right"]),
    anchorY: oneOf(["top", "center", "bottom"]),
    sizeX: NUMBER,
    sizeY: NUMBER,
    renderOrder: NUMBER,
    depthTest: BOOLEAN,
} as const satisfies HasProperties<RootProperties, ContainerProperties>;