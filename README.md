# semver-auto

Automates precise version updates in `package.json` based on dependency changes.

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

This script addresses a common challenge in private projects\* related to package versioning, specifically the absence of semantic versioning (SemVer). It is designed as a targeted response to enhance the versioning process and overcome issues such as the default version that often arises during Continuous Integration/Continuous Deployment (CI/CD) workflows.

<sup>\* A private project typically sets the "private" attribute in its package.json to true, [see reference](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#private).</sup>

## Overview

This script is a solution for private Node.js projects addressing challenges related to versioning, dependency management, and project consistency. By automating version updates based on dependency changes, it not only simplifies the development process but also ensures that version numbers accurately reflect the evolution of the project.

Change-Driven Versioning: The script intelligently determines the appropriate version change (major, minor, or patch) based on the nature of the changes in the dependencies. This makes versioning more reflective of the impact of updates on the project.

## Key Features

- SemVer Integration: The script ensures the incorporation of semantic versioning into the package versioning system.
- Prevents Default Versions: Eliminates the occurrence of the default 0.0.0 version during CI/CD, providing more accurate versioning.
- Proactive Signal: Serves as a proactive signal for development teams, alerting them to updated packages.
- Encourages Dependency Synchronization: By notifying developers of updated packages, it encourages them to synchronize their dependencies, fostering a more informed and synchronized development environment.

## Options

### File Location

By default, the script assumes the package.json file is located in the project root folder. To specify a different location, utilize the -f or --file flag, indicating the path to your package.json. For example by modifying:

```
npx semver-auto --file <my-path/package.json>
```

This allows flexibility in specifying the exact location of your package.json file.

### Verbose Logging

Enhance your script's logging capabilities with detailed insights by enabling verbose mode using the -v or --verbose flag. For example:

```
npx semver-auto --verbose
```

This enables comprehensive logging for a more in-depth understanding of script execution.

## Upcoming Features

- Terminate on Update: If an update is detected, the program will exit and return a non-zero exit code. This signals that the script needs to be executed before proceeding with additional CI/CD steps, ensuring that the latest changes are incorporated.
- Testing: Unit Testing integration for enhanced script reliability.
- Open Source: The script will be released as open source, fostering collaboration and transparency.

## Disclaimer

This project may not be suitable If you plan to publish your package, [see reference](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#version). The most important things in your package.json are the name and version fields as they will be required.

## Contributing

Not available at the moment, but contributions are welcome! If you encounter issues or have suggestions for improvement, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
