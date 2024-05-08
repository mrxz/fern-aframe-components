import { AllOptionalProperties } from '@pmndrs/uikit';
import 'aframe';

declare module "aframe" {
    export interface EntityEvents {
        "uikit-initialized": CustomEvent<{}>,
        "uikit-default-properties-update": CustomEvent<{properties: AllOptionalProperties}>,
        "uikit-properties-update": CustomEvent<{}>,
    }
}