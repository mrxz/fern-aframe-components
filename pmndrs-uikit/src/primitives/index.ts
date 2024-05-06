import "aframe";
import { convertComponentToPrimitive } from "./convert";
import { RootComponent } from "../components/root.component";
import { ContainerComponent } from "../components/container.component";

const RootPrimitive = convertComponentToPrimitive('uikit-root', RootComponent);
const ContainerPrimitive = convertComponentToPrimitive('uikit-container', ContainerComponent);

declare module "aframe" {
    export interface Primitives {
        'ui-root': typeof RootPrimitive,
        'ui-container': typeof ContainerPrimitive,
    }
}