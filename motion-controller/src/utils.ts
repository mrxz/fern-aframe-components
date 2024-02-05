import * as THREE from "three";

export function phongMaterialFromStandardMaterial(sourceMaterial: THREE.MeshStandardMaterial) {
    return new THREE.MeshPhongMaterial({
        color: sourceMaterial.color.clone(),
        map: sourceMaterial.map,
        side: sourceMaterial.side,
    });
}

export function occluderMaterialFromStandardMaterial(sourceMaterial: THREE.MeshStandardMaterial) {
    return new THREE.MeshBasicMaterial({
        colorWrite: false,
        side: sourceMaterial.side,
    });
}

interface MaterialOnBeforeRender {
    onBeforeRender: (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, geometry: THREE.BufferGeometry, object: THREE.Object3D, group: any) => void;
}
export function hologramMaterialFromStandardMaterial(sourceMaterial: THREE.MeshStandardMaterial) {
    const hologramMaterial = new THREE.ShaderMaterial({
        side: sourceMaterial.side,
        opacity: 0.4,
        transparent: true,
        vertexShader: /* glsl */`
            #include <common>
            #include <normal_pars_vertex>
            #include <skinning_pars_vertex>

            uniform float outline;

            varying vec3 vObjectPosition;
            varying vec3 vWorldPosition;

            void main() {
                #include <beginnormal_vertex>
                #include <skinbase_vertex>
	            #include <skinnormal_vertex>
                #include <defaultnormal_vertex>
                #include <normal_vertex>

                #include <begin_vertex>
                if(outline > 0.0) {
                    transformed += normal*0.001;
                }
                #include <skinning_vertex>
                #include <project_vertex>

                vObjectPosition = position;

                vWorldPosition = mvPosition.xyz;
            }
        `,
        // Note: this shader is hard-coded and optimized for the generic-hand asset
        fragmentShader: /* glsl */`
            #include <common>
            #include <dithering_pars_fragment>
            #include <normal_pars_fragment>

            uniform float outline;

            varying vec3 vObjectPosition;
            varying vec3 vWorldPosition;

            void main() {

                if(outline > 0.0) {
                    float alpha = 0.5 * min((-vObjectPosition.y + 0.09)/0.15, 1.0);
                    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
                } else {
                    vec3 toCamera = normalize(cameraPosition - vWorldPosition);
                    float factor = pow(1.0 - dot(toCamera, vNormal), 10.0);

                    float alpha = 0.5 * min((-vObjectPosition.y + 0.06)/0.15, 1.0);
                    vec3 color = mix(vec3(0.0), vec3(0.8, 0.8, 1.0), factor);

                    gl_FragColor = vec4(color, alpha);
                }

                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }
        `,
        uniforms: {
            outline: { value: 1.0 }
        }
    });

    // Note: onBeforeRender on material lacks types (internal for Three.js), but is slightly more convenient
    //       in our case, so use it anyway.
    (hologramMaterial as unknown as MaterialOnBeforeRender).onBeforeRender = (renderer, scene, camera, geometry, object, group) => {
        // Block depth
        hologramMaterial.colorWrite = false;
        renderer.renderBufferDirect(camera, scene, geometry, hologramMaterial, object, group);
        hologramMaterial.colorWrite = true;
        // Outline
        hologramMaterial.side = THREE.BackSide;
        hologramMaterial.uniforms.outline.value = 1.0;
        (hologramMaterial.uniforms.outline as any).needsUpdate = true;
        hologramMaterial.needsUpdate = true;
        renderer.renderBufferDirect(camera, scene, geometry, hologramMaterial, object, group);
        // Restore for normal render
        hologramMaterial.side = THREE.FrontSide;
        hologramMaterial.uniforms.outline.value = 0.0;
        (hologramMaterial.uniforms.outline as any).needsUpdate = true;
        hologramMaterial.needsUpdate = true;

    }

    return hologramMaterial;
}