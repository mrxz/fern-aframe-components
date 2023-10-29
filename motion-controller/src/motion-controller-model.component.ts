import * as AFRAME from 'aframe';
import * as THREE from 'three';
import { strict } from 'aframe-typescript';
import { MotionController, VisualResponse } from '@webxr-input-profiles/motion-controllers';
import { occluderMaterialFromStandardMaterial, phongMaterialFromStandardMaterial } from './utils';
import { HAND_JOINT_NAMES } from './hand-joint-names';
import { InputSourceRecord } from './motion-controller.system';

/* The below code is based on Three.js: https://github.com/mrdoob/three.js/blob/dev/examples/jsm/webxr/XRControllerModelFactory.js
 * MIT LICENSE
 * Copyright © 2010-2023 three.js authors
 */

type EnhancedVisualResponse = VisualResponse & {
    valueNode?: THREE.Object3D,
    minNode?: THREE.Object3D,
    maxNode?: THREE.Object3D
};

export const MotionControllerModelComponent = AFRAME.registerComponent('motion-controller-model', strict<{
    motionControllerSystem: AFRAME.Systems['motion-controller'],
    inputSourceRecord: InputSourceRecord|null,
    motionController: MotionController|null,
    componentMeshes: Map<string, Array<{mesh: THREE.Mesh, originalColor: THREE.Color}>>,
    // Only relevant for hand tracking models
    handJoints: Array<THREE.Object3D|undefined>
}>().component({
    schema: {
        hand: { type: 'string', oneOf: ['left', 'right'], default: 'left' },
        overrideMaterial: { type: 'string', oneOf: ['none', 'phong', 'occluder'], default: 'phong'},
        buttonTouchColor: { type: 'color', default: '#8AB' },
        buttonPressColor: { type: 'color', default: '#2DF' }
    },
    init: function() {
        this.motionControllerSystem = this.el.sceneEl.systems['motion-controller'];
        this.componentMeshes = new Map();
        this.handJoints = new Array(25);
        const gltfLoader = new AFRAME.THREE.GLTFLoader();
        this.el.sceneEl.addEventListener('motion-controller-change', _event => {
            const inputSourceRecord = this.motionControllerSystem[this.data.hand];
            this.inputSourceRecord = inputSourceRecord;
            if(inputSourceRecord && inputSourceRecord.motionController) {
                gltfLoader.load(inputSourceRecord.motionController.assetUrl, (gltf) => {
                    // Make sure the motionController is still the one the model was loaded for
                    if(this.motionController !== inputSourceRecord.motionController) {
                        return;
                    }
                    this.el.setObject3D('mesh', gltf.scene);

                    // Traverse the mesh to change materials and extract references to hand joints
                    gltf.scene.traverse(child => {
                        if(!(child as any).isMesh) {
                            return;
                        }

                        // Extract bones from skinned mesh (as these are likely hand joints)
                        // FIXME: Perhaps explicitly check that hand joints are expected in case a controller mesh is skinned?
                        if(child.type === 'SkinnedMesh') {
                            const skinnedMesh = child as THREE.SkinnedMesh;
                            const bones = skinnedMesh.skeleton.bones;
                            for(const bone of bones) {
                                const index = HAND_JOINT_NAMES.indexOf(bone.name);
                                if(index !== -1) {
                                    this.handJoints[index] = bone;
                                }
                            }

                            // Exclude them from frustum culling
                            skinnedMesh.frustumCulled = false;
                        }

                        // The default materials might be physical based ones requiring an environment map
                        // for proper rendering. Since this isn't always desirable, convert to phong material instead.
                        const mesh = child as THREE.Mesh;
                        switch(this.data.overrideMaterial) {
                            case 'phong':
                                mesh.material = phongMaterialFromStandardMaterial(mesh.material as THREE.MeshStandardMaterial);
                                break;
                            case 'occluder':
                                mesh.material = occluderMaterialFromStandardMaterial(mesh.material as THREE.MeshStandardMaterial);
                                break;
                        }
                    });

                    this.componentMeshes.clear();
                    Object.values(this.motionController.components).forEach((component) => {
                        // Can't traverse the rootNodes of the components, as these are hardly ever correct.
                        // See: https://github.com/immersive-web/webxr-input-profiles/issues/249
                        const componentMeshes: Array<{mesh: THREE.Mesh, originalColor: THREE.Color}> = [];
                        this.componentMeshes.set(component.id, componentMeshes);

                        // Enhance the visual responses with references to the actual Three.js objects from the loaded glTF
                        Object.values(component.visualResponses).forEach((visualResponse) => {
                            const valueNode = gltf.scene.getObjectByName(visualResponse.valueNodeName);
                            const minNode = visualResponse.minNodeName ? gltf.scene.getObjectByName(visualResponse.minNodeName) : undefined;
                            const maxNode = visualResponse.maxNodeName ? gltf.scene.getObjectByName(visualResponse.maxNodeName) : undefined;

                            if(!valueNode) {
                                console.error('Missing value node in model for visualResponse: ', visualResponse.componentProperty);
                                return;
                            }

                            // Extract meshes from valueNodes
                            valueNode.traverse(c => {
                                if(c.type === 'Mesh') {
                                    const mesh = c as THREE.Mesh;
                                    const originalColor = (mesh.material as THREE.MeshPhongMaterial).color.clone();
                                    componentMeshes.push({mesh, originalColor});
                                }
                            });

                            // Enhance VisualResponse with references to the actual nodes
                            (visualResponse as EnhancedVisualResponse).valueNode = valueNode;
                            if(visualResponse.valueNodeProperty === 'transform') {
                                if(!minNode || !maxNode) {
                                    console.error('Missing value node in model for visualResponse: ', visualResponse.componentProperty);
                                    (visualResponse as EnhancedVisualResponse).valueNode = undefined;
                                    return;
                                }
                                (visualResponse as EnhancedVisualResponse).minNode = minNode;
                                (visualResponse as EnhancedVisualResponse).maxNode = maxNode;
                            }
                        });
                    });
                });
                this.motionController = inputSourceRecord.motionController;
            } else {
                // TODO: Remove mesh
                if(this.el.getObject3D('mesh')) {
                    this.el.removeObject3D('mesh');
                }
                for(let i = 0; i < 25; i++) {
                    this.handJoints[i] = undefined;
                }
                this.motionController = null;
            }
        });
    },
    remove: function() {
        // TODO: Clean-up any event handlers
        // TODO: Remove controller mesh from scene
        // TODO: Remove enhanced properties from motion controller instances(?)
    },
    tick: function() {
        if(!this.motionController || !this.el.getObject3D('mesh')) { // FIXME: Improve check for mesh
            return;
        }

        // Hand joints
        if(this.inputSourceRecord?.jointState) {
            for(let i = 0; i < 25; i++) {
                const joint = this.handJoints[i]!;
                joint.matrix.fromArray(this.inputSourceRecord!.jointState!.poses, i * 16);
                joint.matrix.decompose(joint.position, joint.quaternion, joint.scale);
            }
        }

        // Components and visual responses
        for(const componentId in this.motionController.components) {
            const component = this.motionController.components[componentId];

			// Update node data based on the visual responses' current states
			Object.values(component.visualResponses).forEach((visualResponse) => {
				const { valueNode, minNode, maxNode, value, valueNodeProperty } = visualResponse as EnhancedVisualResponse;

				// Skip if the visual response node is not found. No error is needed,
				// because it will have been reported at load time.
				if(!valueNode) return;

				// Calculate the new properties based on the weight supplied
				if(valueNodeProperty === 'visibility') {
					valueNode.visible = value as boolean;
				} else if(valueNodeProperty === 'transform') {
					valueNode.quaternion.slerpQuaternions(
						minNode!.quaternion,
						maxNode!.quaternion,
						value as number
					);
					valueNode.position.lerpVectors(
						minNode!.position,
						maxNode!.position,
						value as number
					);
				}
			});

            // Update color based on state
            // FIXME: Parse colors once instead of using the string representations
            let color: string|null = null;
            if(component.values.state === 'touched') {
                color = this.data.buttonTouchColor;
            } else if(component.values.state === 'pressed') {
                color = this.data.buttonPressColor;
            }
            this.componentMeshes.get(componentId)?.forEach(mesh => {
                // FIXME: This depends on the color of the controller model whether this is visible or not
                //        Find a better way to colorize it, while maintaining texture
                (mesh.mesh.material as THREE.MeshPhongMaterial).color.set(color || mesh.originalColor);
            });
		}
    }
}));

declare module "aframe" {
    export interface Components {
        "motion-controller-model": InstanceType<typeof MotionControllerModelComponent>
    }
}