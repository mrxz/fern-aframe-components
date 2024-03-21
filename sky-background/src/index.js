AFRAME.registerShader('sky-background', {
    schema: {
        topColor: { type: 'color', is: 'uniform', default: '#0077ff' },
        bottomColor: { type: 'color', is: 'uniform', default: '#ffffff' },
        offset: { type: 'float', is: 'uniform', default: 120.0 },
        exponent: { type: 'float', is: 'uniform', default: 0.9 },
        src: {type: 'map'},
    },
    vertexShader: /* glsl */`
varying vec2 vUv;

void main() {
    vUv = uv*2.0;
    gl_Position = vec4(position.xy, 1.0, 1.0);
}
`,
    fragmentShader: /* glsl */`
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;
uniform sampler2D map;

uniform mat4 cameraWorldMatrix;
uniform mat4 invProjectionMatrix;

varying vec2 vUv;

#include <common>
#include <dithering_pars_fragment>

void main() {
    vec2 ndc = 2.0 * vUv - vec2(1.0);
    // Convert ndc to ray origin
    vec4 rayOrigin4 = cameraWorldMatrix * invProjectionMatrix * vec4( ndc, - 1.0, 1.0 );
    vec3 rayOrigin = rayOrigin4.xyz / rayOrigin4.w;
    // Compute ray direction
    vec3 rayDirection = normalize( mat3(cameraWorldMatrix) * ( invProjectionMatrix * vec4( ndc, 0.0, 1.0 ) ).xyz );

    #ifdef USE_MAP
        gl_FragColor = vec4(texture(map, equirectUv(rayDirection)).rgb, 1.0);
    #else
        float h = normalize((rayOrigin + rayDirection * 500.0) + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0 ), exponent), 0.0)), 1.0);
    #endif

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <dithering_fragment>
}`,
    init: function(data) {
        // Handle compatibility with older Three.js versions (A-Frame <1.5.0)
        if(+AFRAME.THREE.REVISION < 158) {
            this.fragmentShader = this.fragmentShader.replace(/colorspace_fragment/, 'encodings_fragment');
        }

        this.__proto__.__proto__.init.call(this, data);
        this.material.uniforms.map = { value: null };
        this.el.addEventListener('materialtextureloaded', e => {
            // Mipmaps on equirectangular images causes a seam
            e.detail.texture.generateMipmaps = false;
            // Unlike built-in materials, having 'material.map' doesn't result in Three.js
            // setting the uniform as well, so do it manually.
            this.material.uniforms.map.value = e.detail.texture;
        });
    },
    update: function(data) {
        this.updateVariables(data, 'uniform');
        AFRAME.utils.material.updateMap(this, data);
    }
});

AFRAME.registerComponent('sky-background', {
    init: function() {
        const mesh = this.el.getObject3D('mesh');
        mesh.frustumCulled = false;
        mesh.material.uniforms.cameraWorldMatrix = { value: new THREE.Matrix4() };
		mesh.material.uniforms.invProjectionMatrix = { value: new THREE.Matrix4() };
		mesh.onBeforeRender = (renderer, scene, camera, geometry, material, group) => {
			material.uniforms.cameraWorldMatrix.value.copy(camera.matrixWorld);
			material.uniforms.cameraWorldMatrix.needsUpdate = true;
			material.uniforms.invProjectionMatrix.value.copy(camera.projectionMatrix).invert();
			material.uniforms.invProjectionMatrix.needsUpdate = true;
		}
    }
});

AFRAME.registerPrimitive('a-sky-background', {
    defaultComponents: {
        geometry: {
            primitive: 'triangle',
            vertexA: { x: -1, y: -1, z: 0 },
            vertexB: { x: 3, y: -1, z: 0 },
            vertexC: { x: -1, y: 3, z: 0 },
        },
        material: {
            shader: 'sky-background',

        },
        'sky-background': {},
    },
    mappings: {
        'top-color': 'material.topColor',
        'bottom-color': 'material.bottomColor',
        'offset': 'material.offset',
        'exponent': 'material.exponent',
        'src': 'material.src'
    }
});
