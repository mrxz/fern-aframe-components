import * as AFRAME from 'aframe';
import * as THREE from 'three';
import 'effekseer';
import { strict } from 'aframe-typescript';

/**
 * Component for rendering an Effekseer effect.
 */
export const EffekseerComponent = AFRAME.registerComponent('effekseer', strict<{
    effect: effekseer.EffekseerEffect|null,
    handle: effekseer.EffekseerHandle|null,

    tempMatrixArray: Float32Array,
    targetLocation: THREE.Vector3,
}, 'effekseer'>().component({
    schema: {
        /** The .efk or .efkpkg file to use */
        src: { type: 'asset' },

        /** Whether or not to play the effect as soon as it's loaded */
        autoPlay: { type: 'boolean', default: true },
        /** Whether to loop the effect or not */
        loop: { type: 'boolean', default: false },
        /** Whether or not to update the effects scale, position and rotation each tick */
        dynamic: { type: 'boolean', default: false },
    },
    init: function() {
        this.tempMatrixArray = new Float32Array(16);
        this.targetLocation = new THREE.Vector3();
    },
    update: function(oldData) {
        if(oldData.src !== this.data.src) {
            // Ask system for the effect
            this.effect = null;
            if(this.handle) {
                this.handle.stop();
                this.handle = null;
            }
            if(this.data.src) {
                const loadingSrc = this.data.src;
                this.system.getOrLoadEffect(this.data.src).then(effect => {
                    // Make sure the loaded effect is still the intended effect
                    if(this.data.src !== loadingSrc) {
                        return;
                    }
                    this.effect = effect;
                    // Request a handle
                    if(this.data.autoPlay) {
                        // Ensure the objects matrix world is set
                        this.el.object3D.updateMatrixWorld();
                        this.playEffect();
                    }
                }).catch(reason => {
                    console.error(`Failed to load effect ${this.data.src}: ${reason}`);
                    if(this.data.src === loadingSrc) {
                        this.effect = null;
                        this.handle = null;
                    }
                });
            }
        }
    },
    updateTransform: function() {
        this.el.object3D.matrixWorld.toArray(this.tempMatrixArray);
        this.handle!.setMatrix(this.tempMatrixArray);
    },
    /**
     * Starts a new playback of the effect. This doesn't stop any already playing
     * effects associated with this component. Call {@link stopEffect()} for that instead
     */
    playEffect: function() {
        this.handle = this.system.playEffect(this.effect!);
        this.updateTransform();
        this.setTargetLocation(this.targetLocation);
    },
    /**
     * Pauses the playback of the effect
     */
    pauseEffect: function() {
        this.handle?.setPaused(true);
    },
    /**
     * Resumes the effect in case it has been paused
     */
    resumeEffect: function() {
        this.handle?.setPaused(false);
    },
    /**
     * Stops the effect
     */
    stopEffect: function() {
        this.handle?.stop();
        this.handle = null;
    },
    /**
     * Sets the target location for effects that make use of this.
     * This is NOT the location of the effect, but the location the effect _targets_ on.
     * Not all effects make use of this location.
     * @param target The location the effect should target on
     */
    setTargetLocation: function(target: THREE.Vector3) {
        this.targetLocation.copy(target);
        this.handle?.setTargetLocation(target.x, target.y, target.z);
    },
    tick: function() {
        if(!this.handle) {
            return;
        }

        // FIXME: It seems not all effects have a natural end
        //        preventing them from looping at all.
        if(this.data.loop && !this.handle.exists) {
            this.playEffect();
        }

        if(this.data.dynamic) {
            this.updateTransform();
        }
    },
    remove: function() {
        this.handle?.stop();
    }
}));

declare module "aframe" {
    interface Components {
        "effekseer": InstanceType<typeof EffekseerComponent>
    }
}
