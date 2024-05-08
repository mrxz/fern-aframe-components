import * as AFRAME from 'aframe';

const POINTER_ID = 1;

export const RootInteractionComponent = AFRAME.registerComponent('uikit-root-interaction', {
    schema: {},
    __fields: {} as {
        cursorEl: AFRAME.Entity|undefined,
        intersectedEl: AFRAME.Entity|undefined,
    },
    init: function() {
        this.el.addEventListener('mouseenter', e => {
            const targetEl = e.target as AFRAME.Entity;
            const uiElement = targetEl.object3D;
            uiElement.dispatchEvent({ type: 'pointerOver', target: uiElement, nativeEvent: { pointerId: POINTER_ID } })
        });
        this.el.addEventListener('mouseleave', e => {
            const targetEl = e.target as AFRAME.Entity;
            const uiElement = targetEl.object3D;
            uiElement.dispatchEvent({ type: 'pointerOut', target: uiElement, nativeEvent: { pointerId: POINTER_ID } })

            // Clear any stored state
            this.cursorEl = this.intersectedEl = undefined;
        });

        this.el.addEventListener('mousedown', e => {
            const targetEl = e.target as AFRAME.Entity;
            const eventDetails = (e as AFRAME.DetailEvent<{cursorEl: AFRAME.Entity, intersection: THREE.Intersection}>).detail;
            const uiElement = targetEl.object3D;
            uiElement.dispatchEvent({ type: 'pointerDown', uv: eventDetails.intersection.uv, target: uiElement, nativeEvent: { pointerId: POINTER_ID } })

            // Store cursor and intersected el for mouse move events
            // NOTE: This is only needed for Input when selecting, so it's activated in mousedown instead of mouseenter
            this.cursorEl = eventDetails.cursorEl;
            this.intersectedEl = targetEl;
        });
        this.el.addEventListener('mouseup', e => {
            const targetEl = e.target as AFRAME.Entity;
            const uiElement = targetEl.object3D;
            uiElement.dispatchEvent({ type: 'pointerUp', target: uiElement, nativeEvent: { pointerId: POINTER_ID } })

            // Clear any stored state
            this.cursorEl = this.intersectedEl = undefined;
        })
    },
    tick: function() {
        if(!this.cursorEl || !this.intersectedEl) { return; }

        const raycaster = this.cursorEl.components['raycaster']!;
        // FIXME: Update aframe-types
        const intersection = (raycaster as any).getIntersection(this.intersectedEl);

        const uiElement = this.intersectedEl.object3D;
        uiElement.dispatchEvent({ type: 'pointerMove', uv: intersection.uv, target: uiElement, nativeEvent: { pointerId: POINTER_ID } })
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