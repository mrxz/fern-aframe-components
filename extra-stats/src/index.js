import { threeAllocStats } from './rStats.three-alloc';

AFRAME.registerComponent('extra-stats', {
    schema: {
        three: { type: "boolean", default: true },
        aframe: { type: "boolean", default: true },
        threeAlloc: { type: "boolean", default: true },
    },
    init: function() {
        const scene = this.el;
        if(scene.hasAttribute('stats')) {
            console.warn("Both 'stats' and 'extra-stats' are added, only one should be used at a time!");
        }

        const plugins = [
            this.data.three ? window.threeStats(scene.renderer) : null,
            this.data.aframe ? window.aframeStats(scene) : null,
            this.data.threeAlloc ? threeAllocStats() : null,
        ].filter(x => x !== null);
        this.stats = new window.rStats({
            css: [], // Rely on A-Frame stylesheet
            values: {
                fps: { caption: 'fps', below: 30 },
            },
            groups: [
                { caption: 'Framerate', values: ['fps', 'raf'] }
            ],
            plugins: plugins
        });
        this.statsEl = document.querySelector('.rs-base');

        scene.addEventListener('enter-vr', () => this.statsEl.classList.add('a-hidden'));
        scene.addEventListener('exit-vr', () => this.statsEl.classList.remove('a-hidden'));
    },
    tick: function () {
        if(!this.stats) {
            return;
        }

        this.stats('rAF').tick();
        this.stats('FPS').frame();
        this.stats().update();
    },
});
