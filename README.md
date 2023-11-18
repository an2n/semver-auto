# semver-auto

Semver Auto automates precise version updates in `package.json` based on dependency changes.

```
npm run semver-auto
```

Semver Auto is a Node.js project written in TypeScript and built and minified using esbuild for optimized performance.

In summary, this script is a solution for private Node.js projects, addressing challenges related to versioning, dependency management, and project consistency. By automating version updates based on dependency changes, it not only simplifies the development process but also ensures that version numbers accurately reflect the evolution of the project.

Change-Driven Versioning: The script intelligently determines the appropriate version change (major, minor, or patch) based on the nature of the changes in the dependencies. This makes versioning more reflective of the impact of updates on the project.

This project is NOT suitable If you plan to publish your package, the most important things in your package.json are the name and version fields as they will be required [npmjs - package-json](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#version).
