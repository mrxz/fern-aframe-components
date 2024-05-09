import "aframe";
import { convertComponentToPrimitive } from "./convert";
import { RootComponent } from "../components/root.component";
import { ContainerComponent } from "../components/container.component";
import { TextComponent } from "../components/text.component";
import { ImageComponent } from "../components/image.component";
import { InputComponent } from "../components/input.component";

const RootPrimitive = convertComponentToPrimitive('uikit-root', RootComponent, ['uikit-root-interaction']);
const ContainerPrimitive = convertComponentToPrimitive('uikit-container', ContainerComponent);
const TextPrimitive = convertComponentToPrimitive('uikit-text', TextComponent);
const ImagePrimitive = convertComponentToPrimitive('uikit-image', ImageComponent);
const InputPrimitive = convertComponentToPrimitive('uikit-input', InputComponent);

declare module "aframe" {
    export interface Primitives {
        'ui-root': typeof RootPrimitive,
        'ui-container': typeof ContainerPrimitive,
        'ui-text': typeof TextPrimitive,
        'ui-image': typeof ImagePrimitive,
        'ui-input': typeof InputPrimitive,
    }
}