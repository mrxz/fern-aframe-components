import * as AFRAME from 'aframe';
import type * as THREE from 'three';

export type CursorEvent = AFRAME.DetailEvent<{cursorEl: AFRAME.Entity, intersection: THREE.Intersection}>
export type PointerIdHolder = { __pointerId: number }
let allocated_pointer_ids = 1;

export function processEvent(e: CursorEvent, el: AFRAME.Entity, eventType: string) {
    const uiElement = el.object3D;
    const cursorEl = e.detail.cursorEl;
    const pointerIdHolder = (cursorEl.components.cursor as unknown as PointerIdHolder)
    if(!pointerIdHolder.__pointerId) {
        pointerIdHolder.__pointerId = ++allocated_pointer_ids;
    }

    // UV coordinates are only applicable to the target the event was emitted on.
    // This isn't a problem as it's only used for move and down on Input elements.
    const uv = e.target === el ? e.detail?.intersection?.uv : undefined;

    uiElement.dispatchEvent({ type: eventType as any, uv, target: uiElement, nativeEvent: { pointerId: pointerIdHolder.__pointerId } })
}

export const InteractionComponent = AFRAME.registerComponent('uikit-interaction', {
    schema: {},
    init: function() {
        this.el.addEventListener('mouseenter', e => processEvent(e as CursorEvent, this.el, 'pointerOver'));
        this.el.addEventListener('mouseleave', e => processEvent(e as CursorEvent, this.el, 'pointerOut'));
        this.el.addEventListener('mousedown', e => processEvent(e as CursorEvent, this.el, 'pointerDown'));
        this.el.addEventListener('mouseup', e => processEvent(e as CursorEvent, this.el, 'pointerUp'));
    },
    remove: function() {
        // TODO
    }
});

declare module "aframe" {
    export interface Components {
        "uikit-interaction": InstanceType<typeof InteractionComponent>
    }
}