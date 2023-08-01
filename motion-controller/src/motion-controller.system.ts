import * as AFRAME from 'aframe';
import { SceneEvent } from 'aframe';
import { strict } from 'aframe-typescript';
import { fetchProfile, MotionController } from '@webxr-input-profiles/motion-controllers';

const DEFAULT_INPUT_PROFILE_ASSETS_URI = 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets/dist/profiles';

interface InputSourceRecord {
    xrInputSource: XRInputSource,
    motionController?: MotionController,
};

export const MotionControllerSystem = AFRAME.registerSystem('motion-controller', strict<{
    /* Currently active XR session */
    xrSession: XRSession|null;
    /* List of active input sources */
    inputSources: Array<InputSourceRecord>

    /* Dedicated slots for left/right hand for convenience */
    left: InputSourceRecord|null,
    right: InputSourceRecord|null,
}>().system({
    schema: {
        profilesUri: { type: 'string', default: DEFAULT_INPUT_PROFILE_ASSETS_URI}
    },
    init: function() {
        this.inputSources = [];
        this.left = null;
        this.right = null;

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
                const record: InputSourceRecord = { xrInputSource };
                this.inputSources.push(record);
                // FIXME: Detect and report when there are multiple input sources with the same handedness
                if(xrInputSource.handedness === 'left') {
                    this.left = record;
                } else if(xrInputSource.handedness === 'right') {
                    this.right = record;
                }
                const { profile, assetPath } = await fetchProfile(xrInputSource, this.data.profilesUri);
                record.motionController = new MotionController(xrInputSource, profile, assetPath!);

                // Notify anyone interested in this change
                this.sceneEl.emit('motion-controller-change' as keyof AFRAME.EntityEvents);
            });

            // Notify anyone interested in this change
            this.sceneEl.emit('motion-controller-change' as keyof AFRAME.EntityEvents);
        }

        this.el.sceneEl.addEventListener('enter-vr', _ => {
            this.xrSession = (<any>this.el.sceneEl).xrSession as XRSession;
            if(this.xrSession) {
                this.xrSession.addEventListener('inputsourceschange', onInputSourcesChange);
            }
        });
        this.el.sceneEl.addEventListener('exit-vr', _ => {
            if(this.xrSession) {
                this.xrSession.removeEventListener('inputsourceschange', onInputSourcesChange);
                this.xrSession = null;
            }
        });
    },
    tick: function() {
        // Update all motion controllers. This ensures that any code
        // polling the state gets up to date information, even when not visualized
        // FIXME: System tick happens after component ticks, meaning update is always 1 frame late :-/
        this.inputSources.forEach(inputSourceRecord => inputSourceRecord.motionController?.updateFromGamepad());
    },
}));

declare module "aframe" {
    export interface Systems {
        "motion-controller": InstanceType<typeof MotionControllerSystem>
    }
    export interface SceneEvents {
        "motion-controller-change": SceneEvent<{}>
    }
}
