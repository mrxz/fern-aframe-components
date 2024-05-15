import "aframe";
import { convertComponentToPrimitive } from "./convert";
import { RootComponent } from "../components/root.component";
import { ContainerComponent } from "../components/container.component";
import { TextComponent } from "../components/text.component";
import { ImageComponent } from "../components/image.component";
import { InputComponent } from "../components/input.component";

export const RootPrimitive = convertComponentToPrimitive('uikit-root', RootComponent, ['uikit-interaction']);
export const ContainerPrimitive = convertComponentToPrimitive('uikit-container', ContainerComponent, ['uikit-interaction']);
export const TextPrimitive = convertComponentToPrimitive('uikit-text', TextComponent, ['uikit-interaction']);
export const ImagePrimitive = convertComponentToPrimitive('uikit-image', ImageComponent, ['uikit-interaction']);
export const InputPrimitive = convertComponentToPrimitive('uikit-input', InputComponent, ['uikit-input-interaction']);

declare module "aframe" {
    export interface Primitives {
        'ui-root': typeof RootPrimitive,
        'ui-container': typeof ContainerPrimitive,
        'ui-text': typeof TextPrimitive,
        'ui-image': typeof ImagePrimitive,
        'ui-input': typeof InputPrimitive,
    }
}