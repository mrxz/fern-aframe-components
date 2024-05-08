import "aframe";
import { convertComponentToPrimitive } from "./convert";

const RootPrimitive = convertComponentToPrimitive('uikit-root');
const ContainerPrimitive = convertComponentToPrimitive('uikit-container');
const TextPrimitive = convertComponentToPrimitive('uikit-text');
const ImagePrimitive = convertComponentToPrimitive('uikit-image');

declare module "aframe" {
    export interface Primitives {
        'ui-root': typeof RootPrimitive,
        'ui-container': typeof ContainerPrimitive,
        'ui-text': typeof TextPrimitive,
        'ui-image': typeof ImagePrimitive,
    }
}