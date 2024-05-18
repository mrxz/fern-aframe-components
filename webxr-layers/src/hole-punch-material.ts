import * as THREE from 'three';

export const HOLE_PUNCH_MATERIAL = new THREE.MeshBasicMaterial({
    color: new THREE.Color('black'),
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.ZeroFactor,
    blendDst: THREE.ZeroFactor,
    blendEquationAlpha: THREE.AddEquation,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.ZeroFactor,
    opacity: 0,
});
