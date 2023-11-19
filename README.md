# semver-auto

Calculate the new package.json version based on dependency changes.

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

This script addresses a common challenge in private projects related to package versioning, specifically the absence of Semantic Versioning (also called SemVer). It is designed as a targeted response to enhance the versioning process and overcome issues such as the default version that often arises during development.

## Overview

This script is a solution for private Node.js projects\* addressing challenges related to versioning, dependency management, and project consistency. By automating version updates based on dependency changes, it not only simplifies the development process but also ensures that version numbers accurately reflect the evolution of the project.

Change-Driven Versioning: The script intelligently determines the appropriate version change (major, minor, or patch) based on the nature of the changes in the dependencies. This makes versioning more reflective of the impact of updates on the project.

- MAJOR version: Elevated for breaking changes in dependencies.
- MINOR version: Raised when introducing new features or functionalities in dependencies.
- PATCH version: Bumped for bug fixes in dependencies.

<sup>\* A private Node.js project can set the "private" attribute in its package.json to true, [see reference](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#private).</sup>

## Options

### File Location

By default, the script assumes the package.json file is located in the project root folder. To specify a different location, utilize the -f or --file flag, indicating the path to your package.json. For example by modifying:

```
npx semver-auto --file <my-path/package.json>
```

### Verbose Logging

Enhance your script's logging capabilities with detailed insights by enabling verbose mode using the -v or --verbose flag. For example:

```
npx semver-auto --verbose
```

### Signal Version Update

Upon detecting a version update, the program will exit with a non-zero code, signaling the need for execution before proceeding with CI/CD steps. Activate this by using the -e or --exit flag. For example:

```
npx semver-auto --exit
```

## Upcoming Features

- Include the -h and --help flags.
- Incorporate optionalDependencies into the list of dependencies.
- Unit Testing integration for enhanced script reliability.
- Release as open source, fostering collaboration and transparency.

## Disclaimer

This project may not be suitable If you plan to publish your package, [see reference](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#version). The most important things in your package.json are the name and version fields as they will be required.

## Contributing

Not available at the moment, but contributions will be welcome! If you encounter issues or have suggestions for improvement, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
