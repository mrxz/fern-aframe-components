import * as AFRAME from 'aframe';
import { SceneEvent } from 'aframe';
import { Component, fetchProfile, MotionController } from '@webxr-input-profiles/motion-controllers';

const DEFAULT_INPUT_PROFILE_ASSETS_URI = 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets/dist/profiles';
const HANDS_PROFILE_ID = 'generic-hand';

export interface InputSourceRecord {
    xrInputSource: XRInputSource,
    motionController?: MotionController,
    componentState: {[key: string]: Component['values'] },
    jointState?: {poses: Float32Array, radii: Float32Array},
};

export const MotionControllerSystem = AFRAME.registerSystem('motion-controller', {
    schema: {
        /** Base URI for fetching profiles and controller models */
        profilesUri: { type: 'string', default: DEFAULT_INPUT_PROFILE_ASSETS_URI },
        /** Enable or disable hand tracking (= pose for hand controllers) */
        enableHandTracking: { type: 'boolean', default: true },
        /** Whether or not input sources representing hands should be reported or not */
        enableHands: { type: 'boolean', default: true },
    },
    __fields: {} as {
        /* Currently active XR session */
        readonly xrSession: XRSession|null;
        /* List of active input sources */
        readonly inputSources: Array<InputSourceRecord>
    
        /* Dedicated slots for left/right hand for convenience */
        left: InputSourceRecord|null,
        right: InputSourceRecord|null,
    },
    init: function() {
        this.inputSources = [];
        this.left = null;
        this.right = null;

        if(this.data.enableHands && this.data.enableHandTracking) {
            const webxrData = this.sceneEl.getAttribute('webxr');
            if (webxrData.optionalFeatures.indexOf('hand-tracking') === -1) {
                webxrData.optionalFeatures.push('hand-tracking');
                this.sceneEl.setAttribute('webxr', webxrData);
            }
        }

        // Handle addition and removal of input sources
        const onInputSourcesChange = (event: XRInputSourceChangeEvent) => {
            event.removed.forEach(xrInputSource => {
                const index = this.inputSources.findIndex(inputSourceRecord => inputSourceRecord.xrInputSource === xrInputSource);
                if(index !== -1) {
                    // TODO: Notify any component that holds it exclusively
                    const [removed] = this.inputSources.splice(index, 1);
                    if(this.left === removed) {
                        this.left = null;
                    }
                    if(this.right === removed) {
                        this.right = null;
                    }
                }
            });
            event.added.forEach(async xrInputSource => {
                // Ensure the xrInputSource is relevant (only allow hands if hands are enabled)
                if(!this.data.enableHands && xrInputSource.profiles.includes(HANDS_PROFILE_ID)) {
                    return;
                }

                const record: InputSourceRecord = { xrInputSource, componentState: {} };
                this.inputSources.push(record);
                // FIXME: Detect and report when there are multiple input sources with the same handedness
                if(xrInputSource.handedness === 'left') {
                    this.left = record;
                } else if(xrInputSource.handedness === 'right') {
                    this.right = record;
                }
                const { profile, assetPath } = await fetchProfile(xrInputSource, this.data.profilesUri);
                record.motionController = new MotionController(xrInputSource, profile, assetPath!);
                for(const componentKey in record.motionController!.components) {
                    const component = record.motionController.components[componentKey];
                    record.componentState[componentKey] = {...component.values};
                }

                // Special treatment for hand-tracking
                if(record.motionController!.id === HANDS_PROFILE_ID) {
                    record.jointState = {
                        poses: new Float32Array(16 * 25),
                        radii: new Float32Array(25),
                    };
                }

                // Notify anyone interested in this change
                this.sceneEl.emit('motion-controller-change' as keyof AFRAME.EntityEvents);
            });

            // Notify anyone interested in this change
            this.sceneEl.emit('motion-controller-change' as keyof AFRAME.EntityEvents);
        }

        // Handle visibility changes, which could indicate
        const onVisiblityChange = (e: XRSessionEvent) => {
            this.sceneEl.emit('motion-controller-visibility-change', { visibilityState: e.session.visibilityState })
        };

        this.el.sceneEl.addEventListener('enter-vr', _ => {
            this.xrSession = this.el.sceneEl.xrSession!;
            if(this.xrSession) {
                this.xrSession.addEventListener('inputsourceschange', onInputSourcesChange);
                this.xrSession.addEventListener('visibilitychange', onVisiblityChange);
            }
        });
        this.el.sceneEl.addEventListener('exit-vr', _ => {
            if(this.xrSession) {
                this.xrSession.removeEventListener('inputsourceschange', onInputSourcesChange);
                this.xrSession.removeEventListener('visibilitychange', onVisiblityChange);
                this.xrSession = null;
                // Remove any input sources, as the session has ended
                this.inputSources.splice(0, this.inputSources.length);
                this.left = null;
                this.right = null;
                this.sceneEl.emit('motion-controller-change' as keyof AFRAME.EntityEvents);
            }
        });
    },
    tick: function() {
        // Update all motion controllers. This ensures that any code
        // polling the state gets up to date information, even when not visualized
        // FIXME: System tick happens after component ticks, meaning update is always 1 frame late :-/
        //        Only an issue with A-Frame, in A5 the components indicate to run _after_ this system.
        this.inputSources.forEach(inputSourceRecord => {
            if(!inputSourceRecord.motionController) {
                return;
            }

            // Let the motion controller library update the state
            inputSourceRecord.motionController.updateFromGamepad()
            if(inputSourceRecord.motionController.id === HANDS_PROFILE_ID) {
                this.updateHandJoints(inputSourceRecord);
            }
            const hand = this.left === inputSourceRecord ? 'left' : this.right === inputSourceRecord ? 'right' : undefined;

            // Compare the state with the last recorded state, and emit events for any changes
            for(const componentKey in inputSourceRecord.motionController.components) {
                const newState = inputSourceRecord.motionController?.components[componentKey]!;
                const oldState = inputSourceRecord.componentState[componentKey];
                const eventDetails: ButtonEventDetails = {
                    inputSource: inputSourceRecord.xrInputSource,
                    motionController: inputSourceRecord.motionController,
                    hand,
                    button: componentKey,
                    buttonState: newState.values,
                };
                // Update state already so event handlers will see the new state when polling
                const oldButtonState = oldState.state;
                oldState.state = newState.values.state;
                const oldXAxis = oldState.xAxis;
                oldState.xAxis = newState.values.xAxis;
                const oldYAxis = oldState.yAxis;
                oldState.yAxis = newState.values.yAxis;

                if(newState.values.state !== oldButtonState) {
                    if(oldButtonState === 'touched') {
                        // No longer touched -> touchend
                        this.el.emit('touchend', eventDetails);
                    } else if(oldButtonState === 'pressed') {
                        // No longer pressed -> buttonup
                        this.el.emit('buttonup', eventDetails);
                    }

                    if(newState.values.state === 'touched') {
                        // Now touched -> touchstart
                        this.el.emit('touchstart', eventDetails);
                    } else if(newState.values.state === 'pressed') {
                        // Now pressed -> buttondown
                        this.el.emit('buttondown', eventDetails);
                    }
                }

                if(newState.type === 'thumbstick' || newState.type === 'touchpad') {
                    if(oldXAxis !== newState.values.xAxis || oldYAxis !== newState.values.yAxis) {
                        // Value along axis changed
                        this.el.emit('axismove', eventDetails);
                    }
                }
            }
        });
    },
    updateHandJoints: function(inputSourceRecord: InputSourceRecord) {
        const xrFrame = this.el.sceneEl.frame;
        if(!xrFrame) {
            return;
        }

        // Make sure the hand is present
        const hand = inputSourceRecord.xrInputSource.hand;
        if(!hand) {
            return;
        }

        // Note: @types/webxr misses quite a few of the hand tracking types
        (xrFrame as any).fillPoses(hand.values(), inputSourceRecord.xrInputSource.gripSpace, inputSourceRecord.jointState!.poses);
        // FIXME: Perhaps only fetch radii once or upon request(?)
        (xrFrame as any).fillJointRadii(hand.values(), inputSourceRecord.jointState!.radii);
    },
    hapticsPulse(left: boolean, right: boolean, duration: number, intensity: number) {
        // TODO: Handle overlapping pulses/effects
        if(left && this.left) {
            const gamepad = this.left.xrInputSource.gamepad as Gamepad & {hapticActuators: Array<any>};
            if(gamepad && gamepad.hapticActuators) {
                gamepad.hapticActuators[0].pulse(intensity, duration)
            }
        }
        if(right && this.right) {
            const gamepad = this.right.xrInputSource.gamepad as Gamepad & {hapticActuators: Array<any>};
            if(gamepad && gamepad.hapticActuators) {
                gamepad.hapticActuators[0].pulse(intensity, duration)
            }
        }
    }
});

export interface ButtonEventDetails {
    inputSource: XRInputSource;
    motionController: MotionController
    hand?: 'left'|'right';
    button: string;
    buttonState: Component['values']
}

declare module "aframe" {
    export interface Systems {
        "motion-controller": InstanceType<typeof MotionControllerSystem>
    }
    export interface SceneEvents {
        "motion-controller-change": SceneEvent<{}>
        "motion-controller-visibility-change": SceneEvent<{ visibilityState: XRVisibilityState }>

        "touchstart": SceneEvent<ButtonEventDetails>
        "touchend": SceneEvent<ButtonEventDetails>
        "buttondown": SceneEvent<ButtonEventDetails>
        "buttonup": SceneEvent<ButtonEventDetails>
        "buttonchange": SceneEvent<ButtonEventDetails>
        "axismove": SceneEvent<ButtonEventDetails>
    }
}
