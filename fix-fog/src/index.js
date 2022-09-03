THREE.ShaderChunk.fog_pars_vertex = `
#ifdef USE_FOG
	varying vec3 vFogPosition;
#endif`;

THREE.ShaderChunk.fog_vertex = `
#ifdef USE_FOG
	vFogPosition =  worldPosition.xyz;
#endif`;

THREE.ShaderChunk.fog_pars_fragment = `
#ifdef USE_FOG
	uniform vec3 fogColor;
	varying vec3 vFogPosition;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`;

THREE.ShaderChunk.fog_fragment = `
#ifdef USE_FOG
	float fogDepth = distance( cameraPosition, vFogPosition );
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * fogDepth * fogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, fogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`;