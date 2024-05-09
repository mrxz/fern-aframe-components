import { ConversionNode, convertHtml } from "@pmndrs/uikit/internals";
import { toKebabCase } from "../utils";

export function convertFromHtml(html: string) {
    return convertHtml(html, generate) ?? '';
}

const TYPE_TO_PRIMITIVE: {[key: string]: string} = {
    'Fragment': 'ui-root',
    'Container': 'ui-container',
    'Text': 'ui-text',
}

function generate(
    _element: ConversionNode | undefined,
    typeName: string,
    _custom: boolean,
    props: Record<string, unknown>,
    _index: number,
    children?: Array<string> | undefined,
) {
    // Lookup correct tag
    const tag = TYPE_TO_PRIMITIVE[typeName] ?? typeName;

    // Generate properties
    const propsText = Object.entries(props)
        .filter(([name, value]) => typeof value !== 'undefined' && validProperty(name))
        .map(([name, value]) => {
            // Convert name to attribute name (kebab-case)
            const attributeName = toKebabCase(name);

            switch (typeof value) {
                case 'number':
                    return `${attributeName}="${value}"`;
                case 'string':
                    // FIXME: Most likely there is more escaping needed
                    return `${attributeName}="${value.replaceAll('"', '&quot;')}"`;
                case 'boolean':
                    return `${attributeName}="${value ? true : false}"`;
                case 'object':
                    // TODO
                    return `${attributeName}={${JSON.stringify(value)}}`
            }
            throw new Error(`unable to generate property "${name}" with value of type "${typeof value}"`)
        })
        .join(' ')

    if (children === undefined) {
        children = [];
    }

    return /*html*/`<${tag} ${propsText}>${children.join('\n')}</${tag}>`;
}

function validProperty(name: string) {
    // FIXME: Cursor property isn't supported. It clashes with the cursor component.
    return name !== 'cursor';
}