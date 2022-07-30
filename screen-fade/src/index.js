const VERTEX_SHADER =
    'void main() {' +
        'vec3 newPosition = position * 2.0;' +
        'gl_Position = vec4(newPosition, 1.0);' +
    '}';
const FRAGMENT_SHADER =
    'uniform vec3 color;' +
    'uniform float intensity;' +
    'void main() {' +
        'gl_FragColor = vec4(color, intensity);' +
    '}';

AFRAME.registerComponent('screen-fade', {
    schema: {
        'color': { type: "color", default: "#000000" },
        'intensity': { type: "number", default: 0.0, max: 1.0, min: 0.0 }
    },
    init: function() {
        const geometry = new THREE.PlaneBufferGeometry(1, 1);
        this.material = new THREE.ShaderMaterial({
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER,
            transparent: true,
            depthTest: false,
            uniforms: {
                color: { value: new THREE.Color(this.data.color) },
                intensity: { value: this.data.intensity }
            }
        });
        this.fullscreenQuad = new THREE.Mesh(geometry, this.material)

        this.el.setObject3D('fullscreenQuad', this.fullscreenQuad);
    },
    update: function() {
        this.material.uniforms.color.value.set(this.data.color);
        this.material.uniforms.intensity.value = this.data.intensity;
    }
});
