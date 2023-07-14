import * as AFRAME from 'aframe';
import { strict } from 'aframe-typescript';
import * as THREE from 'three';
import 'effekseer';
import * as zip from '@zip.js/zip.js';

const createUnzip = async function(buffer: Uint8Array) {
    const cachedFiles: {[key: string]: Uint8Array} = {};
    const reader = new zip.ZipReader(new zip.Uint8ArrayReader(buffer));
    const entries = await reader.getEntries({});
    await Promise.allSettled(entries.map(async e => {
        const writer = new zip.Uint8ArrayWriter();
        cachedFiles[e.filename] = await e.getData!(writer);
    }));

    return function(_buffer: Uint8Array) {
        return {
            decompress(file: string) {
                return cachedFiles[file];
            }
        }
    };
}

/**
 * System for managing the Effekseer context and handling rendering of the effects
 */
export const EffekseerSystem = AFRAME.registerSystem('effekseer', strict<{
    getContext: Promise<effekseer.EffekseerContext>,
    context: effekseer.EffekseerContext,
    effects: Map<string, effekseer.EffekseerEffect>,

    fileLoader: THREE.FileLoader,
    sentinel: THREE.Mesh,
}>().system({
    schema: {
        /** URL to the effekseer.wasm file */
        wasmPath: { type: "string" },
        /** Frame-rate at which the effects are played back */
        frameRate: { type: "number", default: 60.0 }
    },

    init: function() {
        this.effects = new Map();
        this.fileLoader = new THREE.FileLoader().setResponseType('arraybuffer');

        const renderer = this.el.sceneEl.renderer;
        this.getContext = new Promise((resolve, reject) => {
            effekseer.initRuntime(this.data.wasmPath, () => {
                this.context = effekseer.createContext();
                this.context.init(renderer.getContext(), {
                    instanceMaxCount: 2000,
                    squareMaxCount: 8000,
                });
                this.context.setRestorationOfStatesFlag(false);
                resolve(this.context);
            }, () => {
                reject('Failed to load effekseer wasm')
            });
        })

        // Create a sentinel
		const sentinel = new THREE.Mesh();
		sentinel.frustumCulled = false;
		(sentinel.material as THREE.MeshBasicMaterial).transparent = true;
		sentinel.renderOrder = Number.MAX_VALUE;
		this.sentinel = sentinel;
		this.el.sceneEl.object3D.add(this.sentinel);

		sentinel.onAfterRender = (renderer, _scene, camera) => {
            if(!this.context) {
                return;
            }
            const renderTarget = renderer.getRenderTarget();

            this.context.setProjectionMatrix(Float32Array.from(camera.projectionMatrix.elements));
            this.context.setCameraMatrix(Float32Array.from(camera.matrixWorldInverse.elements));
            this.context.draw();

            renderer.resetState();
            renderer.setRenderTarget(renderTarget);
        }
    },

    getOrLoadEffect(src: string): Promise<effekseer.EffekseerEffect> {
        if(this.effects.has(src)) {
            return Promise.resolve(this.effects.get(src)!);
        }

        return this.fileLoader.loadAsync(src).then(buffer => new Promise((resolve, reject) => {
            this.getContext.then(_ => {
                const basePath = src.substring(0, src.lastIndexOf('/') + 1);
                let effect: effekseer.EffekseerEffect;
                const onload = () => {
                    // The onload callback doesn't provide the effect as an argument,
                    // so use a timeout to ensure the return of loadEffect has taken place.
                    setTimeout(() => resolve(effect!), 0)
                };
                if(src.endsWith(".efkpkg")) {
                    // Note: While the library 'handles' unzipping it does so synchronously
                    //       Since zip.js is async, handle the unzipping upfront.
                    createUnzip(new Uint8Array(buffer as ArrayBuffer)).then(Unzip => {
                        effect = this.context.loadEffectPackage(buffer, Unzip, 1.0,
                            onload,
                            reject);
                        this.effects.set(src, effect);
                    })
                } else {
                    // FIXME: typings are incorrect (states that it must be string, but can be ArrayBuffer)
                    //        see: https://github.com/effekseer/EffekseerForWebGL/pull/107
                    effect = this.context.loadEffect(buffer as string, 1.0,
                        onload,
                        reject,
                        (path) => {
                            // Paths are relative to src
                            return basePath + path;
                        });
                    this.effects.set(src, effect);
                }
            });
        }));
    },

    playEffect(effect: effekseer.EffekseerEffect): effekseer.EffekseerHandle {
        // Note: entire transform matrix is set briefly after, so simply pass origin here
        return this.context.play(effect, 0, 0, 0);
    },

    tick: function(_t, dt) {
        if(!this.context) {
            return;
        }
        this.context.update(dt/1000.0 * this.data.frameRate);
    }
}));

declare module "aframe" {
    export interface Systems {
        "effekseer": InstanceType<typeof EffekseerSystem>,
    }
}
