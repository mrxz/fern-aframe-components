import { THREE } from 'aframe';

// Include these in the bundle as A-Frame doesn't include them by default
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
(<any>THREE).FullScreenQuad = FullScreenQuad;
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
(<any>THREE).RGBELoader = RGBELoader;

import * as Xatlas from 'xatlas';
(<any>window).Xatlas = Xatlas;

import './gpu-pathtracer.system';
