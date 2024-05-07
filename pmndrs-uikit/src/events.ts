import 'aframe';

declare module "aframe" {
    export interface EntityEvents {
        "uikit-initialized": CustomEvent<{}>,
        "uikit-properties-update": CustomEvent<{}>,
    }
}