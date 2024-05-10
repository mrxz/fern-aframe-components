import { ContainerProperties, ImageProperties } from "@pmndrs/uikit";
import { BOOLEAN, TEXTURE, oneOf } from "./property-types";
import { HasProperties } from "./utils";

export const IMAGE_SCHEMA = {
    src: TEXTURE,
    objectFit: oneOf(["fill", "cover"]),
    keepAspectRatio: BOOLEAN,
} as const satisfies HasProperties<ImageProperties, ContainerProperties>;
