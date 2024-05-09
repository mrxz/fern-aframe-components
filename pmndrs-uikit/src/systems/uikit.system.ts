import * as AFRAME from "aframe";

const UikitSystem = AFRAME.registerSystem('uikit', {
    schema: {
        useSystemKeyboard: { type: 'boolean', default: true }
    },
    shouldUseSystemKeyboard() {
        // @ts-ignore isSystemKeyboardSupported not part of @types/webxr
        return this.data.useSystemKeyboard && this.el.sceneEl.xrSession?.isSystemKeyboardSupported;
    },
});

declare module "aframe" {
    export interface Systems {
        "uikit": InstanceType<typeof UikitSystem>
    }
}