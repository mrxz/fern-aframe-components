import "aframe";
import { convertComponentToPrimitive } from "./convert";

const RootPrimitive = convertComponentToPrimitive('uikit-root');
const ContainerPrimitive = convertComponentToPrimitive('uikit-container');

declare module "aframe" {
    export interface Primitives {
        'ui-root': typeof RootPrimitive,
        'ui-container': typeof ContainerPrimitive,
    }
}