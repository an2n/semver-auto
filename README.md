<h1  align="center">semver-auto</h1>
<p align="center">Automate the package.json versioning by assessing changes in dependencies</p>

![Semver auto in progress](https://github-production-user-asset-6210df.s3.amazonaws.com/9165542/284140147-da34dd35-c4dd-467f-94b3-a3dd69067ee7.png)

## Installation And Usage

```
npm install semver-auto --save-dev
npx semver-auto

```

## Overview

This script addresses a common challenge in private\* projects related to package versioning, specifically the absence of Semantic Versioning (also called SemVer). It is designed as a targeted response to enhancing the versioning process and overcome issues such as the default version that often arises during development. By automating version updates based on dependency changes, it not only simplifies the development process but also ensures that version numbers accurately represent the changes in project packages.

Change-Driven Versioning: The script intelligently determines the appropriate version change (major, minor, or patch) based on the nature of the changes in the dependencies. This makes versioning more reflective of the impact of updates on the project. It currently examines dependencies, devDependencies, and optionalDependencies within the package.json.

| Code status                                         | Stage         | Rule                                                               | Example version |
| --------------------------------------------------- | ------------- | ------------------------------------------------------------------ | --------------- |
| First release of package.json                       | New product   | Start with 1.0.0                                                   | 1.0.0           |
| Dependency that are backward compatible bug fix     | Patch release | Increment the third digit                                          | 1.0.1           |
| Dependency that are backward compatible new feature | Minor release | Increment the middle digit and reset last digit to zero            | 1.1.0           |
| Dependency change that break backward compatibility | Major release | Increment the first digit and reset middle and last digits to zero | 2.0.0           |

<sup>\* A private Node.js project can set the "private" attribute in its package.json to true, [see reference](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#private).</sup>

## Options

### File Location

By default, the script assumes the package.json file is located in the folder you are in. To specify a different location, utilize the -f or --file flag, indicating the path to your package.json. For example:

```

npx semver-auto --file <my-path/package.json>

```

### Logging

Enhance logging capabilities with detailed insights by enabling verbose mode using the -l or --log flag. For example:
f

```

npx semver-auto --log

```

### Progress Bar

Enable a progress bar with the -p or --progress flag. For example:

```

npx semver-auto --progress

```

### HEAD Start

In Git, "HEAD" refers to the most recent commit on the currently checked-out branch. If you've previously run semver-auto, reanalyzing all commits to determine the appropriate version may be redundant. In these cases, you can start the analysis from the latest commit on your branch to make execution faster. However, exercise caution when doing so. Enable this feature by including the -h or --head flag. For example:

```

npx semver-auto --head

```

### Exiting

The script can exit with a non-zero code, signaling the need for execution before proceeding with CI/CD steps. Enable by using the -e or --exit flag. For example:

```

npx semver-auto --exit

```

## Upcoming Features

- Include the -h and --help flags.
- Update project architecture.
- Unit Testing integration for script reliability.
- Incorporate flag-based logic into a dedicated file to optimize performance during regular execution.

## Disclaimer

This project may not be suitable If you plan to publish your package, [see reference](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#version). The most important things in your package.json are the name and version fields as they will be required.

## Contributing

Contributions are welcome! If you encounter issues or have suggestions for improvement, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

```

```
