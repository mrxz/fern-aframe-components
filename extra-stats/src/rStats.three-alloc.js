export function threeAllocStats() {
    let _rS = null;

    const _values = {
        v2: {
            caption: 'Vector2'
        },
        v3: {
            caption: 'Vector3'
        },
        v4: {
            caption: 'Vector4'
        },
        quat: {
            caption: 'Quaternion'
        },
        mat3: {
            caption: 'Matrix3'
        },
        mat4: {
            caption: 'Matrix4'
        },
        color: {
            caption: 'Color'
        },
    }

    const keys = ['v2', 'v3', 'v4', 'quat', 'mat3', 'mat4', 'color'];
    const _groups = [{
        caption: 'Three.js allocs',
        values: keys
    }];

    const counters = {};
    const resetCounters = () => keys.forEach(key => counters[key] = 0);
    resetCounters();
    const increment = (key) => counters[key]++;

    function _update() {
        keys.forEach(key => _rS(key).set(counters[key]));
        resetCounters();
    }

    function _start() { }

    function _end() { }

    class InstrumentedVector2 extends THREE.Vector2 {
        constructor() {
            super(...arguments);
            increment('v2');
        }
    }
    class InstrumentedVector3 extends THREE.Vector3 {
        constructor() {
            super(...arguments);
            increment('v3');
        }
    }
    class InstrumentedVector4 extends THREE.Vector4 {
        constructor() {
            super(...arguments);
            increment('v4');
        }
    }
    class InstrumentedQuaternion extends THREE.Quaternion {
        constructor() {
            super(...arguments);
            increment('quat');
        }
    }
    class InstrumentedMatrix3 extends THREE.Matrix3 {
        constructor() {
            super(...arguments);
            increment('mat3');
        }
    }
    class InstrumentedMatrix4 extends THREE.Matrix4 {
        constructor() {
            super(...arguments);
            increment('mat4');
        }
    }
    class InstrumentedColor extends THREE.Color {
        constructor() {
            super(...arguments);
            increment('color');
        }
    }
    function _attach(r) {
        _rS = r;
        THREE.Vector2 = InstrumentedVector2;
        THREE.Vector3 = InstrumentedVector3;
        THREE.Vector4 = InstrumentedVector4;
        THREE.Quaternion = InstrumentedQuaternion;
        THREE.Matrix3 = InstrumentedMatrix3;
        THREE.Matrix4 = InstrumentedMatrix4;
        THREE.Color = InstrumentedColor;
    }

    return {
        update: _update,
        start: _start,
        end: _end,
        attach: _attach,
        values: _values,
        groups: _groups,
        fractions: []
    };
}