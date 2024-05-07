import { Container, Root, Text } from '@pmndrs/uikit';
import * as AFRAME from 'aframe';
import * as THREE from 'three';

function getUikitComponent(el: AFRAME.Entity) {
    // FIXME: Cleaner iteration or bookkeeping, as at most one is expected on entity
    for(const component of ['uikit-root', 'uikit-container']) {
        if(component in el.components || el.hasAttribute(component)) {
            return component;
        }
    }
    return undefined;
}

function isUikitElement(el: AFRAME.Entity) {
    return el.tagName.startsWith('UI-') || getUikitComponent(el) !== undefined;
}

export function deferInitialization(el: AFRAME.Entity, action: () => void) {
    const parentEl = el.parentEl;
    if(!isUikitElement(parentEl)) {
        console.error('uikit components can only be added to uikit parents!');
    }

    // Make sure the parent is initialized
    if(!((parentEl.object3D as any).childrenContainer)) {
        parentEl.addEventListener('uikit-initialized', function handler() {
            action();
            // Propagate initialization
            el.emit('uikit-initialized', {}, false);

            parentEl.removeEventListener('uikit-initialized', handler);
        });
    } else {
        action();
        // Propagate initialization
        el.emit('uikit-initialized', {}, false);
    }
}

export function swapObject3D(el: AFRAME.Entity, newObject3D: THREE.Object3D) {
    // HACK: Replace Object3D instance on entity
    const oldObject3D = el.object3D;
    el.object3D = newObject3D;
    if(oldObject3D.children.length) {
        el.object3D.add(...oldObject3D.children);
    }

    if(oldObject3D.parent) {
        const childrenArray = oldObject3D.parent.children;
        const index = childrenArray.indexOf(oldObject3D);
        oldObject3D.parent.add(el.object3D);
        oldObject3D.removeFromParent();

        // Ensure the index is right
        if(index !== childrenArray.length - 1) {
            const temp = childrenArray[index];
            childrenArray[index] = childrenArray[childrenArray.length - 1]
            childrenArray[childrenArray.length - 1] = temp;
        }
    }

    oldObject3D.updateMatrix();
    oldObject3D.matrix.decompose(newObject3D.position, newObject3D.quaternion, newObject3D.scale);
    newObject3D.updateMatrix();

    newObject3D.el = el;
    newObject3D.traverse(c => c.el = el);
}

export function uiRaycast(this: Container|Root|Text, raycaster: THREE.Raycaster, intersects: Array<THREE.Intersection>) {
    const childrenContainer = (this as any).childrenContainer as THREE.Object3D;
    childrenContainer?.children.forEach(child => child.raycast(raycaster, intersects));
}

export function handleDefaultPropertiesUpdate(el: AFRAME.Entity, uikit: Container|Root|Text, e: AFRAME.EntityEvents['uikit-default-properties-update']) {
    // Apply received properties to uikit instance
    uikit.setDefaultProperties(e.detail.properties);

    // Check if there are default-properties on this entity
    const additionalDefaultProperties = el.getAttribute('uikit-default-properties');
    const mergedDefaultProperties = additionalDefaultProperties ? {...e.detail.properties, ...additionalDefaultProperties} : {...e.detail.properties};

    // Propagate
    for(let i = 0; i < el.children.length; i++) {
        const child = el.children[i] as AFRAME.Entity;
        if(child.emit) {
            // FIXME: Avoid the many copies, instead store/cache intermediate result in `uikit-default-properties` component
            child.emit('uikit-default-properties-update', {properties: {...mergedDefaultProperties}}, false);
        }
    }
}