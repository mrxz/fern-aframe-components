import { ContainerProperties, ImageProperties } from "@pmndrs/uikit";
import { BOOLEAN, TEXTURE, oneOf } from "./property-types";

export const IMAGE_SCHEMA = {
    src: TEXTURE,
    objectFit: oneOf(["fill", "cover"]),
    keepAspectRatio: BOOLEAN,
} as const satisfies Partial<Record<Exclude<keyof ImageProperties, keyof ContainerProperties>, any>>;
