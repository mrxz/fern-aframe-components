import { STRING, NUMBER, COLOR, oneOf } from "./property-types";

export const TEXT_SCHEMA = {
    color: COLOR,
    opacity: NUMBER,
    horizontalAlign: oneOf(["left", "center", "right"]),
    verticalAlign: oneOf(["top", "center", "bottom"]),
    letterSpacing: NUMBER,
    lineHeight: NUMBER,
    fontSize: NUMBER,
    wordBreak: oneOf(["keep-all", "break-all", "break-word"]),
    fontFamily: STRING,
    // FIXME: Should be NUMBER or oneOf
    fontWeight: oneOf(["bold", "thin", "extra-light", "light", "normal", "medium", "semi-bold", "extra-bold", "black", "extra-black"]),
} as const;
