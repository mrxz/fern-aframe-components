import * as AFRAME from 'aframe';

export const MotionControllerSpaceComponent = AFRAME.registerComponent('motion-controller-space', {
    schema: {
        hand: { type: 'string', oneOf: ['left', 'right'], default: 'left' },
        space: { type: 'string', oneOf: ['gripSpace', 'targetRaySpace'], default: 'targetRaySpace' },
    },
    after: ['system:motion-controller'],
    __fields: {} as {
        readonly motionControllerSystem: AFRAME.Systems['motion-controller'],
        readonly inputSource: XRInputSource|undefined,
    },
    init: function() {
        this.motionControllerSystem = this.el.sceneEl.systems['motion-controller'];
        this.el.sceneEl.addEventListener('motion-controller-change', _event => {
            const inputSourceRecord = this.motionControllerSystem[this.data.hand];
            this.inputSource = inputSourceRecord?.xrInputSource;
        });
    },
    tick: function() {
        const xrFrame = this.el.sceneEl.frame;
        const xrReferenceSpace = this.el.sceneEl.renderer.xr.getReferenceSpace?.();
        if(!this.inputSource || !xrFrame || !xrReferenceSpace) {
            return;
        }

        const xrSpace = this.inputSource[this.data.space];
        if(!xrSpace) {
            return;
        }

        // FIXME: Consider getting the pose in the system and caching for subsequent retrievals
        const xrPose = xrFrame.getPose(xrSpace, xrReferenceSpace);
        if(xrPose) {
            this.el.object3D.matrix.fromArray(xrPose.transform.matrix);
            this.el.object3D.matrix.decompose(this.el.object3D.position, this.el.object3D.quaternion, this.el.object3D.scale);
        }
    }
});

declare module "aframe" {
    export interface Components {
        "motion-controller-space": InstanceType<typeof MotionControllerSpaceComponent>
    }
}