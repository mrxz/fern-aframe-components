import * as AFRAME from 'aframe';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { strict } from 'aframe-typescript';
import { MotionController, VisualResponse } from '@webxr-input-profiles/motion-controllers';

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
    motionController: MotionController|null,
    gltfLoader: GLTFLoader
}>().component({
    schema: {
        hand: { type: 'string', oneOf: ['left', 'right'], default: 'left' }
    },
    init: function() {
        this.motionControllerSystem = this.el.sceneEl.systems['motion-controller'];
        this.gltfLoader = new AFRAME.THREE.GLTFLoader();
        this.el.sceneEl.addEventListener('motion-controller-change', _event => {
            const inputSourceRecord = this.motionControllerSystem[this.data.hand];
            if(inputSourceRecord && inputSourceRecord.motionController) {
                this.gltfLoader.load(inputSourceRecord.motionController.assetUrl, (gltf) => {
                    // Make sure the motionController is still the one the model was loaded for
                    if(this.motionController !== inputSourceRecord.motionController) {
                        return;
                    }
                    this.el.setObject3D('mesh', gltf.scene);

                    Object.values(this.motionController.components).forEach((component) => {
                        Object.values(component.visualResponses).forEach((visualResponse) => {
                            const valueNode = gltf.scene.getObjectByName(visualResponse.valueNodeName);
                            const minNode = visualResponse.minNodeName ? gltf.scene.getObjectByName(visualResponse.minNodeName) : undefined;
                            const maxNode = visualResponse.maxNodeName ? gltf.scene.getObjectByName(visualResponse.maxNodeName) : undefined;

                            if(!valueNode) {
                                console.error('Missing value node in model for visualResponse: ', visualResponse.componentProperty);
                                return;
                            }

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
                this.motionController = null;
            }
        });
    },
    remove: function() {
        // TODO: Clean-up pending 
    },
    tick: function() {
        if(!this.motionController || !this.el.getObject3D('mesh')) { // FIXME: Improve check for mesh
            return;
        }

        Object.values(this.motionController.components).forEach((component) => {
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
		});
    }
}));

declare module "aframe" {
    export interface Components {
        "motion-controller-model": InstanceType<typeof MotionControllerModelComponent>
    }
}