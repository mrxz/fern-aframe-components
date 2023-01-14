const VERTEX_SHADER = `
out vec3 vNormal;

void main() {
    vec4 transformedPosition = modelViewMatrix * vec4( position, 1.0 );
    vNormal = normalMatrix * normal;
    gl_Position = projectionMatrix * transformedPosition;
}`;

const FRAGMENT_SHADER = `
uniform vec3 coreColor;
uniform float coreOpacity;
uniform vec3 rimColor;
uniform float rimOpacity;

in vec3 vNormal;

void main() {
    float factor = 1.0 - max(0.0, dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
    vec3 color = mix(coreColor, rimColor, factor);
    gl_FragColor = vec4(color, (factor * rimOpacity) + ((1.0 - factor) * coreOpacity));
}`;

AFRAME.registerSystem('highlight', {
    callbacks: [],
    afterCallbacks: [],
    init: function() {
        // Create a sentinel entity
        this.sentinel = new THREE.Mesh();
        this.sentinel.frustumCulled = false;
        this.sentinel.material.transparent = true;
        // FIXME: What if the application already uses render order for a different purpose?
        this.sentinel.renderOrder = 1000;
        this.el.object3D.add(this.sentinel)

        this.sentinel.onAfterRender = (renderer, scene, camera) => {
            this.callbacks.forEach(cb => cb(renderer, scene, camera));
            this.afterCallbacks.forEach(cb => cb(renderer, scene, camera))
        }
    },
    registerCallback: function(callback) {
        this.callbacks.push(callback);
    },
    unregisterCallback: function(callback) {
        const index = this.callbacks.indexOf(callback);
        if(index !== -1) {
            this.callbacks.splice(index, 1);
        }
    },
    registerAfterCallback: function(callback) {
        this.afterCallbacks.push(callback);
    },
    unregisterAfterCallback: function(callback) {
        const index = this.afterCallbacks.indexOf(callback);
        if(index !== -1) {
            this.afterCallbacks.splice(index, 1);
        }
    }
});

const HIGHLIGHT_ON_BEFORE_RENDER_HOOK = "_HIGHLIGHT_ON_BEFORE_RENDER_HOOK_";
AFRAME.registerComponent('highlight', {
    schema: {
        'coreColor': { type: "color", default: "#000000" },
        'coreOpacity': { type: "number", default: 0.0, min: 0.0, max: 1.0 },
        'rimColor': { type: "color", default: "#FF0000" },
        'rimOpacity': { type: "number", default: 1.0, min: 0.0, max: 1.0 },
        'mode': { type: "string", default: "occlusion" }, // occlusion, visible
    },
    modes: {
        "occlusion": { depthFunc: THREE.GreaterDepth, secondRender: true },
        "visible": { depthFunc: THREE.EqualDepth, secondRender: false },
    },
    init: function() {
        this.renderCalls = [];

        this.outlineMaterial = new THREE.ShaderMaterial({
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER,
            transparent: true,
            depthTest: true,
            depthFunc: this.modes[this.data.mode].depthFunc,
            depthWrite: false,
            uniforms: {
                coreColor: { value: new THREE.Color(this.data.coreColor) },
                coreOpacity: { value: this.data.coreOpacity },
                rimColor: { value: new THREE.Color(this.data.rimColor) },
                rimOpacity: { value: this.data.rimOpacity },
            }
        });

        const setupRenderHooks = (object3D) => {
            object3D.traverse(c => {
                if(c.isMesh) {
                    if(c.onBeforeRender !== THREE.Object3D.prototype.onBeforeRender && !c.onBeforeRender[HIGHLIGHT_ON_BEFORE_RENDER_HOOK]) {
                        console.warn("Object already has an onBeforeRender hook! Highlight effect will likely not work for this entity!");
                        return;
                    }

                    const captureRenderCallHook = (renderer, scene, camera, geometry, material, group) => {
                        this.renderCalls.push({
                            renderer, scene, camera, geometry, material, group, object: c
                        });
                    };
                    captureRenderCallHook[HIGHLIGHT_ON_BEFORE_RENDER_HOOK] = true;

                    c.onBeforeRender = captureRenderCallHook;
                }
            });
        }
        // Add hooks to existing meshes.
        setupRenderHooks(this.el.object3D);
        this.el.addEventListener('object3dset', e => {
            setupRenderHooks(e.detail.object);
        });

        this.callback = (renderer, scene, camera) => {
            this.renderCalls.forEach(renderCall => {
                const { renderer, scene, camera, geometry, material, group, object } = renderCall;
                renderer.renderBufferDirect(camera, scene, geometry, this.outlineMaterial, object, group);

                if(this.modes[this.data.mode].secondRender) {
                    renderer.renderBufferDirect(camera, scene, geometry, material, object, group);
                }
            });
            this.renderCalls.splice(0, this.renderCalls.length);
        }
        this.system.registerCallback(this.callback);
    },
    update: function() {
        this.outlineMaterial.uniforms.coreColor.value.set(this.data.coreColor);
        this.outlineMaterial.uniforms.coreOpacity.value = this.data.coreOpacity;
        this.outlineMaterial.uniforms.rimColor.value.set(this.data.rimColor);
        this.outlineMaterial.uniforms.rimOpacity.value = this.data.rimOpacity;
    },
    remove: function() {
        this.system.unregisterCallback(this.callback);
    }
});

AFRAME.registerComponent('above-highlight', {
    init: function() {
        this.renderCalls = [];

        const setupRenderHooks = (object3D) => {
            object3D.traverse(c => {
                if(c.isMesh) {
                    if(c.onBeforeRender !== THREE.Object3D.prototype.onBeforeRender && !c.onBeforeRender[HIGHLIGHT_ON_BEFORE_RENDER_HOOK]) {
                        console.warn("Object already has an onBeforeRender hook! Highlight effect will likely not work for this entity!");
                        return;
                    }

                    const captureRenderCallHook = (renderer, scene, camera, geometry, material, group) => {
                        this.renderCalls.push({
                            renderer, scene, camera, geometry, material, group, object: c
                        });
                    };
                    captureRenderCallHook[HIGHLIGHT_ON_BEFORE_RENDER_HOOK] = true;

                    c.onBeforeRender = captureRenderCallHook;
                }
            });
        }
        // Add hooks to existing meshes.
        setupRenderHooks(this.el.object3D);
        this.el.addEventListener('object3dset', e => {
            setupRenderHooks(e.detail.object);
        });

        this.callback = (renderer, scene, camera) => {
            this.renderCalls.forEach(renderCall => {
                const { renderer, scene, camera, geometry, material, group, object } = renderCall;
                renderer.renderBufferDirect(camera, scene, geometry, material, object, group);
            });
            this.renderCalls.splice(0, this.renderCalls.length);
        }
        this.el.sceneEl.systems.highlight.registerAfterCallback(this.callback);
    },
    remove: function() {
        this.el.sceneEl.systems.highlight.unregisterAfterCallback(this.callback);
    }
});