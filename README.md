<h1  align="center">semver-auto</h1>
<p align="center">Automate the package.json versioning by assessing changes in dependencies</p>

![Semver auto in progress](https://github-production-user-asset-6210df.s3.amazonaws.com/9165542/284140147-da34dd35-c4dd-467f-94b3-a3dd69067ee7.png)

## Installation

```
npm install semver-auto --save-dev
```

## Quickstart

Instantly available through npx:

```
npx semver-auto
```

Or add the following script to your `package.json`:

```
"scripts": {
  "semver-auto": "semver-auto"
}
```

Afterward, run the following command from your project folder:

```
npm run semver-auto
```

## Motivation

## Overview

This script addresses a common challenge in private\* projects related to package versioning, specifically the absence of Semantic Versioning (also called SemVer). It is designed as a targeted response to enhance the versioning process and overcome issues such as the default version that often arises during development. By automating version updates based on dependency changes, it not only simplifies the development process but also ensures that version numbers accurately reflect the changes of the project.

Change-Driven Versioning: The script intelligently determines the appropriate version change (major, minor, or patch) based on the nature of the changes in the dependencies. This makes versioning more reflective of the impact of updates on the project. It currently examines dependencies, devDependencies, and optionalDependencies within the package.json.

- MAJOR version: Breaking changes found in dependencies.
- MINOR version: New features or functionalities found in dependencies.
- PATCH version: Bug fixes found in dependencies.

<sup>\* A private Node.js project can set the "private" attribute in its package.json to true, [see reference](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#private).</sup>

## Options

### File Location

By default, the script assumes the package.json file is located in the current folder. To specify a different location, utilize the -f or --file flag, indicating the path to your package.json. For example by modifying:

```
npx semver-auto --file <my-path/package.json>
```

### Logging

Enhance logging capabilities with detailed insights by enabling verbose mode using the -l or --log flag. For example:

```
npx semver-auto --log
```

### Progress Bar

Enable a progress bar with the -p or --progress flag. For example:

```
npx semver-auto --progress
```

### Exiting

The script can exit with a non-zero code, signaling the need for execution before proceeding with CI/CD steps. Enable by using the -e or --exit flag. For example:

```
npx semver-auto --exit
```

## Upcoming Features

- Include the -h and --help flags.
- Unit Testing integration for enhanced script reliability.

## Disclaimer

This project may not be suitable If you plan to publish your package, [see reference](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#version). The most important things in your package.json are the name and version fields as they will be required.

## Contributing

Contributions are welcome! If you encounter issues or have suggestions for improvement, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
