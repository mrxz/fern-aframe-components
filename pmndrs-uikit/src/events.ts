import 'aframe';

declare module "aframe" {
    export interface EntityEvents {
        "uikit-initialized": CustomEvent<{}>,
        "uikit-default-properties-update": CustomEvent<{}>,
        "uikit-properties-update": CustomEvent<{}>,
    }
}