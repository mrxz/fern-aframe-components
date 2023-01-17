AFRAME.registerSystem('mirror', {
	schema: {},
	mirrors: [],
	init: function() {
		// Prevent auto clearing for each render
		this.sceneEl.renderer.autoClear = false;

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
			this.mirrors.forEach(mirror => mirror.setInactive());

			// Let mirrors render themselves
			this.mirrors.forEach(mirror => mirror.render(renderer, scene, camera));

			this.mirrors.forEach(mirror => mirror.setActive());
			sentinel.visible = true;
		}
	},
	tick: function() {
		// Note: by default A-frame doesn't sort objects for rendering
		// so manually ensure the sentinel is at the tail end
		const sceneObject = this.sceneEl.object3D;
		if(sceneObject.children[sceneObject.children.length - 1] !== this.sentinel) {
			sceneObject.add(this.sentinel);
		}
	},
	registerMirror: function(mirror) {
		this.mirrors.push(mirror);
		mirror.setMirrorId(this.mirrors.length);
	},
	unregisterMirror: function(mirror) {
		const index = this.mirrors.indexOf(mirror);
		if(index !== -1) {
			this.mirrors.splice(index, 1);
			this.mirrors.forEach((mirror, index) => mirror.setMirrorId(index + 1));
		}
	}
});

AFRAME.registerComponent('mirror', {
	schema: {
		layers: { type: 'array', default: [0] }
	},
	init: function() {
		// Setup the material of the portal (write to stencil, adhere to depth)
		this.mirrorMaterial = this.el.getObject3D('mesh').material;
		const material = this.mirrorMaterial;
		material.transparent = true;
		material.colorWrite = false;
		material.depthWrite = true;
		material.stencilWrite = true;
		material.depthFunc = THREE.LessEqualDepth;
		material.stencilFunc = THREE.AlwaysStencilFunc;
		material.stencilZPass = THREE.ReplaceStencilOp;
		material.stencilZFail = THREE.KeepStencilOp;

		// Register mirror (which gives it its id)
		this.system.registerMirror(this);
		material.stencilRef = this.mirrorId;

		// Layers for visibility
		this.layers = new THREE.Layers();
		this.layers.disableAll();

		// Setup clipping plane
		this.tempCameras = [new THREE.PerspectiveCamera(), new THREE.PerspectiveCamera()];
		this.clippingPlane = new THREE.Plane();

		// Logic for adjusting projection matrix to clip the mirror plane
		const _tempV4 = new THREE.Vector4();
		const _tempPlane = new THREE.Plane();
		const _q = new THREE.Vector4();
		this.adjustProjectionMatrix = function(sceneCamera) {
			_tempPlane.copy(this.clippingPlane).applyMatrix4(sceneCamera.matrixWorldInverse);
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
			projectionMatrix.elements[10] = clipPlane.z + 1.0 - 0.00;
			projectionMatrix.elements[14] = clipPlane.w;
		};

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
		this._reflectionMatrix = new THREE.Matrix4();
	},
	setMirrorId: function(id) {
		this.mirrorId = id;
		this.mirrorMaterial.stencilRef = id;
	},
	setInactive: function() {
		this.mirrorMaterial.stencilWrite = false;
	},
	setActive: function() {
		this.mirrorMaterial.stencilWrite = true;
	},
	update: function() {
		this.layers.disableAll();
		this.data.layers.map(x => this.layers.enable(+x));
	},
	render: function(renderer, scene, camera) {
		// Temporarily move the camera
		const sceneCamera = renderer.xr.isPresenting ? renderer.xr.getCamera() : this.tempCameras[0];

		// Mirror plane definition
		const mirrorPos = this.el.object3D.getWorldPosition(this._mirrorPos);
		const n = this._normal.set(0, 0, 1);
		n.applyQuaternion(this.el.object3D.getWorldQuaternion(this._mirrorQuat));
		const d = -mirrorPos.dot(n);
		this.clippingPlane.set(n, d);

		// Make sure the mirror can be seen
		let visible;
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

		// Construct reflection matrix for the mirror plane
		const reflectionMatrix = this._reflectionMatrix.set(
		  1 -2*n.x*n.x,  -2*n.x*n.y,  -2*n.x*n.z, -2*n.x*d,
			-2*n.x*n.y, 1-2*n.y*n.y,  -2*n.y*n.z, -2*n.y*d,
			-2*n.x*n.z,  -2*n.y*n.z, 1-2*n.z*n.z, -2*n.z*d,
		     0,           0,           0,          1
		);

		// Update camera(s) for rendering the 'mirror' world
		if(renderer.xr.isPresenting) {
			// Use temp-cameras to store camera matrices
			const cameras = sceneCamera.cameras;
			for(let i = 0; i < cameras.length; i++) {
				this.tempCameras[i].matrixWorld.copy(cameras[i].matrixWorld);
				this.tempCameras[i].matrixWorldInverse.copy(cameras[i].matrixWorldInverse);
				this.tempCameras[i].projectionMatrix.copy(cameras[i].projectionMatrix);
				this.tempCameras[i].layers.mask = cameras[i].layers.mask;

				cameras[i].matrixWorld.premultiply(reflectionMatrix);
				cameras[i].matrixWorldInverse.copy(cameras[i].matrixWorld).invert();
				cameras[i].layers.mask = this.layers.mask;
			}

			// Set projection matrix for frustum culling
			this.setProjectionFromUnion(sceneCamera, cameras[0], cameras[1]);

			// Apply clipping plane in projection matrix
			this.adjustProjectionMatrix(cameras[0]);
			this.adjustProjectionMatrix(cameras[1]);
		} else {
			sceneCamera.near = camera.near;
			sceneCamera.far = camera.far;
			sceneCamera.projectionMatrix.copy(camera.projectionMatrix);

			sceneCamera.matrix.copy(camera.matrixWorld).premultiply(reflectionMatrix);
			sceneCamera.matrix.decompose(
				sceneCamera.position,
				sceneCamera.quaternion,
				sceneCamera.scale);
			sceneCamera.matrixWorld.copy(sceneCamera.matrix);
			sceneCamera.matrixWorldInverse.copy(sceneCamera.matrix).invert();
			this.adjustProjectionMatrix(sceneCamera);
		}

		// Hide mirror
		const mesh = this.el.getObject3D('mesh');
		mesh.visible = false;

		// Render 'mirror' world
		renderer.xr.cameraAutoUpdate = false;
		renderer.info.autoReset = false;
		this.patchWebGLState(renderer.state);
		renderer.state.buffers.stencil.setTest(true);
		renderer.state.buffers.stencil.setFunc(THREE.EqualStencilFunc, this.mirrorId, 0xFF);
		renderer.state.buffers.stencil.setOp(THREE.KeepStencilOp, THREE.KeepStencilOp, THREE.KeepStencilOp);
		renderer.state.buffers.stencil.setLocked(true);

		renderer.clearDepth();
		const oldLayersMask = sceneCamera.layers.mask;
		sceneCamera.layers.mask = this.layers.mask;
		renderer.render(scene, sceneCamera);
		sceneCamera.layers.mask = oldLayersMask;

		renderer.state.buffers.stencil.setLocked(false);
		this.unpatchWebGLState(renderer.state);
		renderer.info.autoReset = true;
		renderer.xr.cameraAutoUpdate = true;

		// Restore mirror
		mesh.visible = true;

		// Restore cameras (in case of XR)
		// Note: this is only really needed if you have multiple mirrors in a scene
		if(renderer.xr.isPresenting) {
			const cameras = sceneCamera.cameras;
			for(let i = 0; i < cameras.length; i++) {
				cameras[i].matrixWorld.copy(this.tempCameras[i].matrixWorld);
				cameras[i].matrixWorldInverse.copy(this.tempCameras[i].matrixWorldInverse);
				cameras[i].projectionMatrix.copy(this.tempCameras[i].projectionMatrix);
				cameras[i].layers.mask = this.tempCameras[i].layers.mask;
			}
		}
	},
	// Note: this method is straight from THREE.js WebXRManager.js
	// See: https://github.com/mrdoob/three.js/blob/8fd3b2acbd08952deee1e40c18b00907c5cd4c4d/src/renderers/webxr/WebXRManager.js#L429
	// Its replicated here since we do need its behaviour, but can't use the rest
	// of the XR camera auto updating logic.
	// Falls under The MIT License:
	// Copyright © 2010-2023 three.js authors
	setProjectionFromUnion: function(camera, cameraL, cameraR) {
		this._cameraLPos.setFromMatrixPosition(cameraL.matrixWorld);
		this._cameraRPos.setFromMatrixPosition(cameraR.matrixWorld);

		const ipd = this._cameraLPos.distanceTo(this._cameraRPos);

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
});

AFRAME.registerPrimitive('a-mirror', {
	defaultComponents: {
		geometry: { primitive: 'plane' },
		mirror: {}
	},
	mappings: {
		layers: 'mirror.layers',
	}
});