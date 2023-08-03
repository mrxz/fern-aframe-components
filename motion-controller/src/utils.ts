import * as THREE from "three";

export function phongMaterialFromStandardMaterial(sourceMaterial: THREE.MeshStandardMaterial) {
    return new THREE.MeshPhongMaterial({
        color: sourceMaterial.color.clone(),
        map: sourceMaterial.map,
    });
}