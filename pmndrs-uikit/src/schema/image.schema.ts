import { BOOLEAN, TEXTURE, oneOf } from "./property-types";

export const IMAGE_SCHEMA = {
    src: TEXTURE,
    fit: oneOf(["fill", "cover"]),
    keepAspectRatio: BOOLEAN
} as const;
