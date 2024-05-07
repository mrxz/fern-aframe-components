import '@preact/signals';
import { ContainerProperties } from "@pmndrs/uikit";
import { h } from "preact";

export function Container(props: ContainerProperties) {
    console.log('Container', arguments);
    return h('ui-container', props as any);
}

export function DefaultProperties() {
    console.log('DefaultProperties', arguments);
}

export function isDarkMode() {
    return false;
}