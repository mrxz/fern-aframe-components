import '@preact/signals';
import { ContainerProperties } from "@pmndrs/uikit";
import { ComponentChildren, h, toChildArray } from "preact";

export function Container(props: ContainerProperties & {children: ComponentChildren}) {
    console.log('Container', arguments);

    let children = toChildArray(props.children);
    if(children.length === 1 && typeof children[0] === 'object' && children[0].type === DefaultProperties) {
       // Only one child that is default properties, so it can safely be merged into this container
       (props as any)['uikit-default-properties'] = children[0].props;
       children = [];
    }
    props.children = children;

    return h('ui-container', props as any);
}

export function DefaultProperties(props: any) {
    console.log('DefaultProperties', arguments);
    throw Error('Standalone DefaultProperties not yet implemented!');
    //return cloneElement(props.children, {...props, })
}

export function isDarkMode() {
    return false;
}