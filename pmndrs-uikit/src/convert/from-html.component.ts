import * as AFRAME from 'aframe';
import { convertFromHtml } from './convert';

export const FromHtmlComponent = AFRAME.registerComponent('uikit-from-html', {
    schema: {
        template: { type: 'selector' },
    },
    init: function() {
    },
    update: function(oldData) {
        if(this.data.template === oldData.template) {
            return;
        }
        // Recreate html
        this.remove();
        if(this.data.template) {
            this.el.innerHTML = convertFromHtml(this.data.template.innerHTML);
        }
    },
    remove: function() {
        // Clear contents
        this.el.innerHTML = '';
    }
});

declare module "aframe" {
    export interface Components {
        "uikit-from-html": InstanceType<typeof FromHtmlComponent>,
    }
}