Some simple scripts to populate the `dist/` folder with built versions of all the components and their corresponding examples, ready to be deployed to GitHub Pages. See the `.github/workflows/ci.yml` file for the entire process.

Note that using plugins with Yarn is effectively broken unless you fancy the idea of committing every dependency under the sun into Git... So out of necessity this folder also contains the one plugin (`@yarnpkg/plugin-workspace-tools`) this build process depends on.
