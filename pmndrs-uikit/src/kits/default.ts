import * as AFRAME from 'aframe';
import { Button } from "@react-three/uikit-default/dist/button";
import { ComponentChildren, createElement, render } from 'preact';

const ButtonComponent = AFRAME.registerComponent('uikit-button', {
    init: function() {
        const children: ComponentChildren = [];
        const buttonElement = createElement(Button, {}, children);
        render(buttonElement, this.el.parentEl, this.el); // FIXME: Placed outside current el.
    }
});

declare module "aframe" {
    export interface Components {
        "uikit-button": InstanceType<typeof ButtonComponent>
    }
}
