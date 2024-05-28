// https://github.com/mozilla/Spoke/commit/9701d647020e09d584885bd457eb225e9995c12f
import { default as XAtlas } from 'xatlas';
import { BufferGeometry, Float32BufferAttribute, Uint32BufferAttribute, Mesh } from 'three';

const AddMeshSuccess = 0;

export class UVUnwrapper {

    _module: ReturnType<typeof XAtlas>;

	constructor() {

		this._module = null as any;

	}

	async load() {

		const wasmurl = new URL( 'libs/xatlas-web/dist/xatlas-web.wasm', import.meta.url );
		this._module = XAtlas( {

			locateFile( path: string ) {

				if ( path.endsWith( '.wasm' ) ) {

					return wasmurl.toString();

				}

				return path;

			}

		} );
		return this._module.ready;

	}

	generate( geometry: BufferGeometry, mesh: Mesh ) {

		const xatlas = this._module;
		const originalVertexCount = geometry.attributes.position.count;
		const originalIndexCount = geometry.index!.count;

		xatlas.createAtlas();

		const meshInfo = xatlas.createMesh( originalVertexCount, originalIndexCount, true, true );
		xatlas.HEAPU16.set( geometry.index!.array, meshInfo.indexOffset / Uint16Array.BYTES_PER_ELEMENT );
		xatlas.HEAPF32.set( geometry.attributes.position.array, meshInfo.positionOffset / Float32Array.BYTES_PER_ELEMENT );
		xatlas.HEAPF32.set( geometry.attributes.normal.array, meshInfo.normalOffset / Float32Array.BYTES_PER_ELEMENT );
		xatlas.HEAPF32.set( geometry.attributes.uv.array, meshInfo.uvOffset / Float32Array.BYTES_PER_ELEMENT );

		const statusCode = xatlas.addMesh();
        console.log(xatlas, statusCode);
		if ( statusCode !== AddMeshSuccess ) { // FIXME

			throw new Error( `UVUnwrapper: Error adding mesh. Status code ${ statusCode }` );

		}

		xatlas.generateAtlas();

		const meshData = xatlas.getMeshData( meshInfo.meshId );
		const oldPositionArray = geometry.attributes.position.array;
		const oldNormalArray = geometry.attributes.normal.array;
		const oldUvArray = geometry.attributes.uv.array;

		const newPositionArray = new Float32Array( meshData.newVertexCount * 3 );
		const newNormalArray = new Float32Array( meshData.newVertexCount * 3 );
		const newUvArray = new Float32Array( meshData.newVertexCount * 2 );
		const newUv2Array = new Float32Array( xatlas.HEAPF32.buffer, meshData.uvOffset, meshData.newVertexCount * 2 );
		const newIndexArray = new Uint32Array( xatlas.HEAPU32.buffer, meshData.indexOffset, meshData.newIndexCount );
		const originalIndexArray = new Uint32Array(
			xatlas.HEAPU32.buffer,
			meshData.originalIndexOffset,
			meshData.newVertexCount
		);

		for ( let i = 0; i < meshData.newVertexCount; i ++ ) {

			const originalIndex = originalIndexArray[ i ];
			newPositionArray[ i * 3 ] = oldPositionArray[ originalIndex * 3 ];
			newPositionArray[ i * 3 + 1 ] = oldPositionArray[ originalIndex * 3 + 1 ];
			newPositionArray[ i * 3 + 2 ] = oldPositionArray[ originalIndex * 3 + 2 ];
			newNormalArray[ i * 3 ] = oldNormalArray[ originalIndex * 3 ];
			newNormalArray[ i * 3 + 1 ] = oldNormalArray[ originalIndex * 3 + 1 ];
			newNormalArray[ i * 3 + 2 ] = oldNormalArray[ originalIndex * 3 + 2 ];
			newUvArray[ i * 2 ] = oldUvArray[ originalIndex * 2 ];
			newUvArray[ i * 2 + 1 ] = oldUvArray[ originalIndex * 2 + 1 ];

		}

		const newGeometry = new BufferGeometry();
		newGeometry.setAttribute( 'position', new Float32BufferAttribute( newPositionArray, 3 ) );
		newGeometry.setAttribute( 'normal', new Float32BufferAttribute( newNormalArray, 3 ) );
		newGeometry.setAttribute( 'uv', new Float32BufferAttribute( newUvArray, 2 ) );
		newGeometry.setAttribute( 'uv2', new Float32BufferAttribute( newUv2Array, 2 ) );
		newGeometry.setIndex( new Uint32BufferAttribute( newIndexArray, 1 ) );

        // FIXME:
		mesh.geometry = newGeometry;

		xatlas.destroyAtlas();

	}

}