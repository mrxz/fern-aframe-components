import * as AFRAME from 'aframe';

export const RootInteractionComponent = AFRAME.registerComponent('uikit-root-interaction', {
    schema: {
    },
    __fields: {} as {
    },
    init: function() {
        this.el.addEventListener('mouseenter', e => {
            const targetEl = e.target as AFRAME.Entity;
            const uiElement = targetEl.object3D;
            uiElement.dispatchEvent({ type: 'pointerOver', target: uiElement, nativeEvent: { pointerId: 1 } })
        });
        this.el.addEventListener('mouseleave', e => {
            const targetEl = e.target as AFRAME.Entity;
            const uiElement = targetEl.object3D;
            uiElement.dispatchEvent({ type: 'pointerOut', target: uiElement, nativeEvent: { pointerId: 1 } })
        });

        this.el.addEventListener('mousedown', e => {
            const targetEl = e.target as AFRAME.Entity;
            const uiElement = targetEl.object3D;
            uiElement.dispatchEvent({ type: 'pointerDown', target: uiElement, nativeEvent: { pointerId: 1 } })
        });
        this.el.addEventListener('mouseup', e => {
            const targetEl = e.target as AFRAME.Entity;
            const uiElement = targetEl.object3D;
            uiElement.dispatchEvent({ type: 'pointerUp', target: uiElement, nativeEvent: { pointerId: 1 } })
        })
    },
    remove: function() {
        // TODO
    }
});

declare module "aframe" {
    export interface Components {
        "uikit-root-interaction": InstanceType<typeof RootInteractionComponent>
    }
}