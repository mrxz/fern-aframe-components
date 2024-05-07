import { Container, Root } from '@pmndrs/uikit';
import * as AFRAME from 'aframe';
import * as THREE from 'three';

export function deferRootInitialized(el: AFRAME.Entity, action: () => void) {
    let rootEl = el;
    while(rootEl && !rootEl.hasAttribute('uikit-root') && rootEl.tagName !== 'UI-ROOT') {
        rootEl = rootEl.parentEl;
    }
    if(!rootEl) {
        console.error('uikit components can only be added to uikit parents!');
        return;
    }
    // Make sure root has already initialized
    if(!rootEl.components['uikit-root']?.initialized) {
        rootEl.addEventListener('componentinitialized', e => {
            if(e.detail.name === 'uikit-root') {
                action();
            }
        });
    } else {
        action();
    }
}

export function swapObject3D(el: AFRAME.Entity, newObject3D: THREE.Object3D) {
    // HACK: Replace Object3D instance on entity
    const oldObject3D = el.object3D;
    el.object3D = newObject3D;
    // Note: make a copy of the children array, as it's going to be mutated
    for(const child of [...oldObject3D.children]) {
        el.object3D.add(child);
    }

    oldObject3D.parent?.add(el.object3D);
    oldObject3D.removeFromParent();

    oldObject3D.updateMatrix();
    oldObject3D.matrix.decompose(newObject3D.position, newObject3D.quaternion, newObject3D.scale);
    newObject3D.updateMatrix();

    newObject3D.el = el;
    newObject3D.traverse(c => c.el = el);
}

export function uiRaycast(this: Container|Root, raycaster: THREE.Raycaster, intersects: Array<THREE.Intersection>) {
    const childrenContainer = (this as any).childrenContainer as THREE.Object3D;
    childrenContainer?.children.forEach(child => child.raycast(raycaster, intersects));
}
