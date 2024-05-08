import * as AFRAME from 'aframe';

type CursorEvent = AFRAME.DetailEvent<{cursorEl: AFRAME.Entity, intersection: THREE.Intersection}>
type PointerIdHolder = { __pointerId: number }
let allocated_pointer_ids = 1;

export const RootInteractionComponent = AFRAME.registerComponent('uikit-root-interaction', {
    schema: {},
    __fields: {} as {
        activeCursors: Array<{
            cursorEl: AFRAME.Entity,
            intersectedEl: AFRAME.Entity,
        }>
    },
    init: function() {
        this.activeCursors = [];

        function processEvent(e: CursorEvent, eventType: string) {
            const targetEl = e.target as AFRAME.Entity;
            const uiElement = targetEl.object3D;
            const cursorEl = e.detail.cursorEl;
            const pointerIdHolder = (cursorEl.components.cursor as unknown as PointerIdHolder)
            if(!pointerIdHolder.__pointerId) {
                pointerIdHolder.__pointerId = ++allocated_pointer_ids;
            }

            uiElement.dispatchEvent({ type: eventType, uv: e.detail?.intersection?.uv, target: uiElement, nativeEvent: { pointerId: pointerIdHolder.__pointerId } })
        }

        const storeCurse = (e: CursorEvent) => {
            const cursorEl = e.detail.cursorEl;
            const intersectedEl = e.target;

            const record = this.activeCursors.find(r => r.cursorEl === cursorEl);
            if(record) {
                // FIXME: When this happens, the intersectedEl likely missed an event, potentially leaving it in a broken state...
                record.intersectedEl = intersectedEl;
            } else {
                this.activeCursors.push({ cursorEl, intersectedEl })
            }
        }

        const clearCursor = (e: CursorEvent) => {
            const cursorEl = e.detail.cursorEl;
            const index = this.activeCursors.findIndex(r => r.cursorEl === cursorEl);

            if(index !== -1) {
                if(index !== this.activeCursors.length - 1) {
                    this.activeCursors[index] = this.activeCursors[this.activeCursors.length - 1];
                }
                this.activeCursors.length--;
            }
        }

        this.el.addEventListener('mouseenter', e => {
            processEvent(e as CursorEvent, 'pointerOver');
        });
        this.el.addEventListener('mouseleave', e => {
            processEvent(e as CursorEvent, 'pointerOut');

            // Clear any stored state
            clearCursor(e as CursorEvent);
        });

        this.el.addEventListener('mousedown', e => {
            processEvent(e as CursorEvent, 'pointerDown');

            // Store cursor and intersected el for mouse move events
            // NOTE: This is only needed for Input when selecting, so it's activated in mousedown instead of mouseenter
            storeCurse(e as CursorEvent);
        });
        this.el.addEventListener('mouseup', e => {
            processEvent(e as CursorEvent, 'pointerUp');

            // Clear any stored state
            clearCursor(e as CursorEvent);
        });
    },
    tick: function() {
        for(let i = 0; i < this.activeCursors.length; i++) {
            const record = this.activeCursors[i];

            const raycaster = record.cursorEl.components['raycaster']!;
            // FIXME: Update aframe-types
            const intersection = (raycaster as any).getIntersection(record.intersectedEl);

            const pointerIdHolder = (record.cursorEl.components.cursor as unknown as PointerIdHolder)
            const uiElement = record.intersectedEl.object3D;
            uiElement.dispatchEvent({ type: 'pointerMove', uv: intersection.uv, target: uiElement, nativeEvent: { pointerId: pointerIdHolder.__pointerId } })
        }
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