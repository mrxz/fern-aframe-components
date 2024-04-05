/**
 * System for keeping track of any portal (incl. mirrors).
 * Keeps track of the (active) portals and render them at the
 * end of normal rendering.
 */
AFRAME.registerSystem('portal', {
	schema: {},
	portals: [],
	init: function() {
		// Prevent auto clearing for each render
		const renderer = this.sceneEl.renderer;
		renderer.autoClear = false;
		renderer.info.autoReset = false;

		// No-op onAfterRender
		const nopAfterRender = function() {};

		// Create a sentinel
		const sentinel = new THREE.Mesh();
		sentinel.frustumCulled = false;
		sentinel.material.transparent = true;
		sentinel.renderOrder = Number.MAX_VALUE;
		this.sentinel = sentinel;
		this.sceneEl.object3D.add(this.sentinel);

		sentinel.onAfterRender = (renderer, scene, camera) => {
			// In case of XR, only call the render hooks for the last camera (e.g. right eye)
			if(renderer.xr.isPresenting) {
				const cameras = renderer.xr.getCamera().cameras;
				if(camera != cameras[cameras.length - 1]) {
					return;
				}
			}
			sentinel.visible = false;
			this.portals.forEach(portal => portal.setInactive());

			// Supress A-Frame's scene.onAfterRender callback during portal/mirror rendering
			const oldOnAfterRender = scene.onAfterRender;
			scene.onAfterRender = nopAfterRender;

			// Let portals and mirrors render themselves
			this.portals.forEach(portal => portal.render(renderer, scene, camera));

			this.portals.forEach(portal => portal.setActive());
			sentinel.visible = true;
			scene.onAfterRender = oldOnAfterRender;
		}
	},
	tick: function() {
		// Note: by default A-frame doesn't sort objects for rendering
		// so manually ensure the sentinel is at the tail end
		const sceneObject = this.sceneEl.object3D;
		if(sceneObject.children[sceneObject.children.length - 1] !== this.sentinel) {
			sceneObject.add(this.sentinel);
		}

		this.sceneEl.renderer.info.reset();
	},
	registerPortal: function(portal) {
		this.portals.push(portal);
		portal.setPortalId(this.portals.length);
	},
	unregisterPortal: function(portal) {
		const index = this.portals.indexOf(portal);
		if(index !== -1) {
			this.portals.splice(index, 1);
			this.portals.forEach((portal, index) => portal.setPortalId(index + 1));
		}
	}
});

/**
 * Base logic for portals
 */
const baseComponent = {
	schema: {
		layers: { type: 'array', default: [0] }
	},
	init: function() {
		const mesh = this.el.getObject3D('mesh');

		// Setup the material of the portal (write to stencil, adhere to depth)
		this.surfaceMaterial = mesh.material;
		const material = this.surfaceMaterial;
		material.transparent = true;
		material.colorWrite = false;
		material.depthWrite = true;
		material.stencilWrite = true;
		material.depthFunc = THREE.LessEqualDepth;
		material.stencilFunc = THREE.AlwaysStencilFunc;
		material.stencilZPass = THREE.ReplaceStencilOp;
		material.stencilZFail = THREE.KeepStencilOp;

		// Register mirror (which gives it its id)
		this.el.sceneEl.systems['portal'].registerPortal(this);
		material.stencilRef = this.portalId;

		// Use onBeforeRender to determine if the mirror is inside the frustum
		this.insideFrustum = false;
		mesh.onBeforeRender = () => {
			this.insideFrustum = true;
		};

		// Layers for visibility
		this.layers = new THREE.Layers();
		this.layers.disableAll();

		// Temporary camera objects to hold the state before reflecting
		this.tempCamera = new THREE.PerspectiveCamera();
		this.tempCameras = [new THREE.PerspectiveCamera(), new THREE.PerspectiveCamera()];

		// Setup clipping plane
		this.clippingPlane = new THREE.Plane();

		// Utility for copying camera properties
		this.copyCamera = function(source, target) {
			target.matrixWorld.copy(source.matrixWorld);
			target.matrixWorldInverse.copy(source.matrixWorldInverse);
			target.projectionMatrix.copy(source.projectionMatrix);
			target.layers.mask = source.layers.mask;
		}

		// Monkey patch setMaterial on WebGLState
		const oldWebGLStateSetMaterialFn = this.el.sceneEl.renderer.state.setMaterial;
		const webGLStateSetMaterialFn = function(material, frontFaceCW) {
			oldWebGLStateSetMaterialFn(material, !frontFaceCW);
		};
		this.unpatchWebGLState = function(state) {
			state.setMaterial = oldWebGLStateSetMaterialFn;
		}
		this.patchWebGLState = function(state) {
			state.setMaterial = webGLStateSetMaterialFn;
		}

		// Temp variables
		this._mirrorPos = new THREE.Vector3();
		this._mirrorQuat = new THREE.Quaternion();
		this._cameraPos = new THREE.Vector3();
		this._cameraLPos = new THREE.Vector3();
		this._cameraRPos = new THREE.Vector3();
		this._normal = new THREE.Vector3();
		this._adjustMatrix = new THREE.Matrix4();
	},
	setPortalId: function(id) {
		this.portalId = id;
		this.surfaceMaterial.stencilRef = id;
	},
	setInactive: function() {
		this.surfaceMaterial.stencilWrite = false;
	},
	setActive: function() {
		this.surfaceMaterial.stencilWrite = true;
	},
	update: function() {
		this.layers.disableAll();
		this.data.layers.map(x => this.layers.enable(+x));
	},
	preRender: function() {},
	postRender: function() {},
	render: function(renderer, scene, camera) {
		// Only render if the portal surface is inside the frustum
		if(!this.insideFrustum) {
			return;
		}
		this.insideFrustum = false;

		// Temporarily move the camera
		const sceneCamera = renderer.xr.isPresenting ? renderer.xr.getCamera() : this.tempCamera;

		// Make sure the portal surface can be seen
		let visible;
		const mirrorPos = this.el.object3D.getWorldPosition(this._mirrorPos);
		const n = this._normal.set(0, 0, 1);
		n.applyQuaternion(this.el.object3D.getWorldQuaternion(this._mirrorQuat));
		if(renderer.xr.isPresenting) {
			const cameras = sceneCamera.cameras;
			this._cameraLPos.setFromMatrixPosition(cameras[0].matrixWorld);
			this._cameraRPos.setFromMatrixPosition(cameras[1].matrixWorld);
			visible =
				this._cameraLPos.subVectors(mirrorPos, this._cameraLPos).dot(n) <= 0.0 ||
				this._cameraRPos.subVectors(mirrorPos, this._cameraRPos).dot(n) <= 0.0;

		} else {
			const view = camera.getWorldPosition(this._cameraPos).subVectors(mirrorPos, this._cameraPos);
			visible = view.dot(n) <= 0.0;
		}
		if(!visible) {
			return;
		}

		// The portal surface is visible, so compute the clipping plane
		this.createClippingPlane(this.clippingPlane);

		// Callback to allow adjustments before rendering the portal contents
		if(this.onBeforeRender) {
			this.onBeforeRender(renderer, scene, camera, this);
		}

		// Construct a matrix for rendering the other side of the portal
		const adjustMatrix = this.createAdjustMatrix(this._adjustMatrix);

		// Update camera(s) for rendering the portal contents
		if(renderer.xr.isPresenting) {
			// Use temp-cameras to store camera matrices
			const cameras = sceneCamera.cameras;
			this.copyCamera(sceneCamera, this.tempCamera);
			for(let i = 0; i < cameras.length; i++) {
				this.copyCamera(cameras[i], this.tempCameras[i]);

				cameras[i].matrixWorld.premultiply(adjustMatrix);
				cameras[i].matrixWorldInverse.copy(cameras[i].matrixWorld).invert();
				cameras[i].layers.mask = this.layers.mask;
			}

			// Set projection matrix for frustum culling
			setProjectionFromUnion(sceneCamera, cameras[0], cameras[1]);

			// Apply clipping plane in projection matrix
			adjustProjectionMatrix(cameras[0], this.clippingPlane);
			adjustProjectionMatrix(cameras[1], this.clippingPlane);
		} else {
			sceneCamera.near = camera.near;
			sceneCamera.far = camera.far;
			sceneCamera.projectionMatrix.copy(camera.projectionMatrix);

			sceneCamera.matrix.copy(camera.matrixWorld).premultiply(adjustMatrix);
			sceneCamera.matrix.decompose(
				sceneCamera.position,
				sceneCamera.quaternion,
				sceneCamera.scale);
			sceneCamera.matrixWorld.copy(sceneCamera.matrix);
			sceneCamera.matrixWorldInverse.copy(sceneCamera.matrix).invert();
			adjustProjectionMatrix(sceneCamera, this.clippingPlane);
		}

		// Hide portal surface
		const mesh = this.el.getObject3D('mesh');
		mesh.visible = false;

		// Render portal contents
		renderer.xr.cameraAutoUpdate = false;
		this.preRender(renderer);
		renderer.state.buffers.stencil.setTest(true);
		renderer.state.buffers.stencil.setFunc(THREE.EqualStencilFunc, this.portalId, 0xFF);
		renderer.state.buffers.stencil.setOp(THREE.KeepStencilOp, THREE.KeepStencilOp, THREE.KeepStencilOp);
		renderer.state.buffers.stencil.setLocked(true);

		renderer.clearDepth();
		const oldLayersMask = sceneCamera.layers.mask;
		sceneCamera.layers.mask = this.layers.mask;
		const oldMatrixWorldAutoUpdate = scene.matrixWorldAutoUpdate;
		scene.matrixWorldAutoUpdate = false;
		renderer.render(scene, this.tempCamera);
		scene.matrixWorldAutoUpdate = oldMatrixWorldAutoUpdate;
		sceneCamera.layers.mask = oldLayersMask;

		renderer.state.buffers.stencil.setLocked(false);
		this.postRender(renderer);
		renderer.xr.cameraAutoUpdate = true;

		// Restore portal surface
		mesh.visible = true;

		// Restore cameras (in case of XR)
		if(renderer.xr.isPresenting) {
			const cameras = sceneCamera.cameras;
			this.copyCamera(this.tempCamera, sceneCamera);
			for(let i = 0; i < cameras.length; i++) {
				this.copyCamera(this.tempCameras[i], cameras[i]);
			}
		}

		// Callback to allow adjustments after rendering the portal contents
		if(this.onAfterRender) {
			this.onAfterRender(renderer, scene, camera, this);
		}
	},
	remove: function() {
		this.el.sceneEl.systems['portal'].unregisterPortal(this);
	}
};

AFRAME.registerComponent('mirror', {
	...baseComponent,
	createClippingPlane: function(plane) {
		const mirrorPos = this.el.object3D.getWorldPosition(this._mirrorPos);
		const n = this._normal.set(0, 0, 1);
		n.applyQuaternion(this.el.object3D.getWorldQuaternion(this._mirrorQuat));
		const d = -mirrorPos.dot(n);
		return plane.set(n, d);
	},
	createAdjustMatrix: function(matrix) {
		const n = this.clippingPlane.normal;
		const d = this.clippingPlane.constant;
		return matrix.set(
			1 -2*n.x*n.x,  -2*n.x*n.y,  -2*n.x*n.z, -2*n.x*d,
			  -2*n.x*n.y, 1-2*n.y*n.y,  -2*n.y*n.z, -2*n.y*d,
			  -2*n.x*n.z,  -2*n.y*n.z, 1-2*n.z*n.z, -2*n.z*d,
			   0,           0,           0,          1
		  );
	},
	preRender: function(renderer) {
		this.patchWebGLState(renderer.state);
	},
	postRender: function(renderer) {
		this.unpatchWebGLState(renderer.state);
	}
});

AFRAME.registerComponent('portal', {
	...baseComponent,
	schema: {
		...baseComponent.schema,
		destination: { type: 'selector' }
	},
	createClippingPlane: function(plane) {
		// Clipping plane depends on the destination
		const destinationPos = this.data.destination.object3D.getWorldPosition(this._mirrorPos);
		const n = this._normal.set(0, 0, 1);
		n.applyQuaternion(this.data.destination.object3D.getWorldQuaternion(this._mirrorQuat));
		const d = -destinationPos.dot(n);
		return plane.set(n, d);
	},
	rotate180Matrix: new THREE.Matrix4().makeRotationY(Math.PI),
	createAdjustMatrix: function(matrix) {
		matrix.copy(this.el.object3D.matrixWorld);
		return matrix.invert()
			.premultiply(this.rotate180Matrix)
			.premultiply(this.data.destination.object3D.matrixWorld);
	}
});

/* Primitives */
AFRAME.registerPrimitive('a-mirror', {
	defaultComponents: {
		geometry: { primitive: 'plane' },
		mirror: {}
	},
	mappings: {
		layers: 'mirror.layers',
	}
});

AFRAME.registerPrimitive('a-portal', {
	defaultComponents: {
		geometry: { primitive: 'plane' },
		portal: {}
	},
	mappings: {
		layers: 'portal.layers',
		destination: 'portal.destination',
	}
});

/* Utils */
const adjustProjectionMatrix = (function() {
	const _tempV4 = new THREE.Vector4();
	const _tempPlane = new THREE.Plane();
	const _q = new THREE.Vector4();
	return function(sceneCamera, clippingPlane) {
		_tempPlane.copy(clippingPlane).applyMatrix4(sceneCamera.matrixWorldInverse);
		const clipPlane = _tempV4.set(_tempPlane.normal.x, _tempPlane.normal.y, _tempPlane.normal.z, _tempPlane.constant);
		const projectionMatrix = sceneCamera.projectionMatrix;

		_q.x = (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
		_q.y = (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
		_q.z = -1.0;
		_q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];

		// Calculate the scaled plane vector
		clipPlane.multiplyScalar(2.0 / clipPlane.dot(_q));

		projectionMatrix.elements[2] = clipPlane.x;
		projectionMatrix.elements[6] = clipPlane.y;
		projectionMatrix.elements[10] = clipPlane.z + 1.0 + 0.0;
		projectionMatrix.elements[14] = clipPlane.w;
	};
})();

const setProjectionFromUnion = (function() {
	const _cameraLPos = new THREE.Vector3();
	const _cameraRPos = new THREE.Vector3();

	// Note: this method is straight from THREE.js WebXRManager.js
	// See: https://github.com/mrdoob/three.js/blob/8fd3b2acbd08952deee1e40c18b00907c5cd4c4d/src/renderers/webxr/WebXRManager.js#L429
	// Its replicated here since we do need its behaviour, but can't use the rest
	// of the XR camera auto updating logic.
	// Falls under The MIT License:
	// Copyright © 2010-2023 three.js authors
	return function(camera, cameraL, cameraR) {
		_cameraLPos.setFromMatrixPosition(cameraL.matrixWorld);
		_cameraRPos.setFromMatrixPosition(cameraR.matrixWorld);

		const ipd = _cameraLPos.distanceTo(_cameraRPos);

		const projL = cameraL.projectionMatrix.elements;
		const projR = cameraR.projectionMatrix.elements;

		// VR systems will have identical far and near planes, and
		// most likely identical top and bottom frustum extents.
		// Use the left camera for these values.
		const near = projL[ 14 ] / ( projL[ 10 ] - 1 );
		const far = projL[ 14 ] / ( projL[ 10 ] + 1 );
		const topFov = ( projL[ 9 ] + 1 ) / projL[ 5 ];
		const bottomFov = ( projL[ 9 ] - 1 ) / projL[ 5 ];

		const leftFov = ( projL[ 8 ] - 1 ) / projL[ 0 ];
		const rightFov = ( projR[ 8 ] + 1 ) / projR[ 0 ];
		const left = near * leftFov;
		const right = near * rightFov;

		// Calculate the new camera's position offset from the
		// left camera. xOffset should be roughly half `ipd`.
		const zOffset = ipd / ( - leftFov + rightFov );
		const xOffset = zOffset * - leftFov;

		// TODO: Better way to apply this offset?
		cameraL.matrixWorld.decompose( camera.position, camera.quaternion, camera.scale );
		camera.translateX( xOffset );
		camera.translateZ( zOffset );
		camera.matrixWorld.compose( camera.position, camera.quaternion, camera.scale );
		camera.matrixWorldInverse.copy( camera.matrixWorld ).invert();

		// Find the union of the frustum values of the cameras and scale
		// the values so that the near plane's position does not change in world space,
		// although must now be relative to the new union camera.
		const near2 = near + zOffset;
		const far2 = far + zOffset;
		const left2 = left - xOffset;
		const right2 = right + ( ipd - xOffset );
		const top2 = topFov * far / far2 * near2;
		const bottom2 = bottomFov * far / far2 * near2;

		camera.projectionMatrix.makePerspective( left2, right2, top2, bottom2, near2, far2 );
	}
})();

// Stencil buffer isn't enabled by default since Three.js r163
if(parseInt(AFRAME.THREE.REVISION) >= 163) {
	document.addEventListener('render-target-loaded', e => {
		let rendererAttrString = e.target.getAttribute('renderer') ?? '';
		if(!/stencil\s*:\s*true/g.test(rendererAttrString)) {
			console.warn('[aframe-mirror] Mirror component requires a stencil buffer, enabling it. Add `renderer="stencil: true"` to your <a-scene> to get rid of this warning.')
			rendererAttrString += ';stencil:true';
		}
		e.target.setAttribute('renderer', rendererAttrString);
	})
}