# semver-auto

Automates precise version updates in `package.json` based on dependency changes.

## Installation

```
npm install semver-auto --save-dev
```

## Quickstart

Add the following script to your `package.json`:

```
  "scripts": {
    "update-version": "semver-auto"
  }
```

Afterward, run the following command from your project folder:

```
npm run update-version
```

## Summary

In summary, this script is a solution for private Node.js projects addressing challenges related to versioning, dependency management, and project consistency. By automating version updates based on dependency changes, it not only simplifies the development process but also ensures that version numbers accurately reflect the evolution of the project.

This script is a targeted response to a challenge encountered in private projects, specifically the absence of semantic versioning (semver) in package versioning. Its integration not only eradicates the common occurrence of the default `0.0.0` version during serve, build and deployment processes but also acts as a proactive signal for development teams. By alerting developers to updated packages, it encourages them to synchronize their dependencies, fostering a more informed and synchronized development environment.

Change-Driven Versioning: The script intelligently determines the appropriate version change (major, minor, or patch) based on the nature of the changes in the dependencies. This makes versioning more reflective of the impact of updates on the project.

Semver Auto is a Node.js project written in TypeScript and built and minified using esbuild for optimized performance.

<sup>\* A private project typically sets the "private" attribute in its package.json to true, [see reference](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#private).</sup>

## Options

### File Location

By default, the script assumes the `package.json` file is located in the project root folder. To specify a different location, utilize the -f or --file flag, indicating the path to your package.json. For Example:

```
npm run update-version --file <my-path/package.json>
```

This allows flexibility in specifying the exact location of your package.json file.

### Verbose Logging

Enhance your script's logging capabilities with detailed insights by enabling verbose mode using the -v or --verbose flag. For example:

```
npm run update-version --verbose
```

This enables comprehensive logging for a more in-depth understanding of script execution.

## Upcoming Features

- Open Source: The script will be released as open source, fostering collaboration and transparency.
- Testing: Unit Testing integration for enhanced script reliability.

## Disclaimer

This project is may not suitable If you plan to publish your package, [see reference](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#version). The most important things in your package.json are the name and version fields as they will be required.
