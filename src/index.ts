#!/usr/bin/env node

import * as fs from "fs";
import * as semver from "semver";
import { execSync } from "child_process";
import { Command } from "commander";

const program = new Command()
  .option("-f, --file [type]", "Add path to package.json", "package.json")
  .option("-v, --verbose [type]", "Add verbose logging", false)
  .option("-e, --exit [type]", "Add exit code when version is outdated", false)
  .parse(process.argv);

const {
  file: PACKAGE_JSON_PATH,
  verbose: IS_VERBOSE,
  exit: EXIT_PROCESS,
} = program.opts();

const logger = (message: string) => {
  if (IS_VERBOSE) console.log(message);
};

initialize();

function initialize() {
  if (PACKAGE_JSON_PATH === true) {
    console.error("Error: Unable to locate the path to package.json");
    return;
  }

  try {
    processCommits(PACKAGE_JSON_PATH);
  } catch (error: any) {
    console.error(`Error processing package.json changes: ${error.message}`);
  }
}

function processCommits(PACKAGE_JSON_PATH: string): void {
  if (!fs.existsSync(PACKAGE_JSON_PATH)) {
    console.error(`Error: Package.json file not found at ${PACKAGE_JSON_PATH}`);
    return;
  }

  const commitHashes = execSync(
    `git rev-list --reverse HEAD -- ${PACKAGE_JSON_PATH}`
  )
    .toString()
    .split("\n");

  logger(`Total commits to analyze: ${commitHashes.length}\n`);

  let updated = false;
  let version = "1.0.0";
  let dependencies: Record<string, string> = {};
  let devDependencies: Record<string, string> = {};

  for (const commitHash of commitHashes) {
    const diff = execSync(
      `git show --format= --name-only ${commitHash}`
    ).toString();

    if (diff.includes("package.json")) {
      const packageJsonDiff = execSync(
        `git show ${commitHash}:${PACKAGE_JSON_PATH}`
      ).toString();

      const parsedDiff = JSON.parse(packageJsonDiff);

      const newDependencies = parsedDiff.dependencies || {};
      const newDevDependencies = parsedDiff.devDependencies || {};

      const dependencyChange = determineVersionChange(
        dependencies,
        newDependencies
      );
      if (dependencyChange) {
        dependencies = newDependencies;
      }

      const devDependencyChange = determineVersionChange(
        devDependencies,
        newDevDependencies
      );

      if (devDependencyChange) {
        devDependencies = newDevDependencies;
      }

      if (dependencyChange || devDependencyChange) {
        version =
          updatePackageVersion(
            version,
            dependencyChange || devDependencyChange
          ) ?? version;
        updated = true;
      }
    }
  }

  if (updated) {
    const packageJsonContent = fs.readFileSync(PACKAGE_JSON_PATH, "utf8");
    const packageJson = JSON.parse(packageJsonContent);

    if (packageJson.version === version) return;

    if (EXIT_PROCESS) {
      console.error(
        `Error: Your project is outdated. Please update your package.json to version ${version} by running 'semver-auto'`
      );

      process.exit(1);
    }
    packageJson.version = version;

    fs.writeFileSync(
      PACKAGE_JSON_PATH,
      JSON.stringify(packageJson, null, 2) + "\n"
    );
    console.log(`+ Updated package.json version to ${version}`);
  }
}

function updatePackageVersion(
  currentVersion: string,
  versionChange: string | null
): string | undefined {
  try {
    if (!versionChange) return;

    const [major, minor, patch] = currentVersion.split(".").map(Number);

    switch (versionChange) {
      case "major":
        currentVersion = `${major + 1}.0.0`;
        logger(`Increase major version: ${currentVersion}\n`);
        break;
      case "minor":
        currentVersion = `${major}.${minor + 1}.0`;
        logger(`Increase minor version: ${currentVersion}\n`);
        break;
      case "patch":
        currentVersion = `${major}.${minor}.${patch + 1}`;
        logger(`Increase patch version: ${currentVersion}\n`);
        break;
      default:
        logger(`Encountered an unprocessable version type: ${versionChange}\n`);
        return;
    }
    return currentVersion;
  } catch (error: any) {
    console.error(`Error updating package.json version: ${error.message}`);
  }
}

function determineVersionChange(
  currentDependencies: Record<string, string>,
  newDependencies: Record<string, string>
): string | null {
  const addedDependencies = Object.keys(newDependencies).filter(
    (dependency) => !currentDependencies.hasOwnProperty(dependency)
  );

  if (addedDependencies.length) {
    logger(`Added new dependencies: ${addedDependencies}`);
    return "major";
  }

  const foundSemVerChanges: string[] = [];

  for (const dependency in newDependencies) {
    const current = cleanVersion(currentDependencies[dependency]);
    const compared = cleanVersion(newDependencies[dependency]);

    const currentVersionCleaned = semver.clean(current);
    const newVersionCleaned = semver.clean(compared);

    const isValid =
      currentVersionCleaned &&
      newVersionCleaned &&
      semver.valid(currentVersionCleaned) &&
      semver.valid(newVersionCleaned);

    if (isValid) {
      const semverChange = semver.diff(
        currentVersionCleaned,
        newVersionCleaned
      );

      if (semverChange) {
        foundSemVerChanges.push(semverChange);
        logger(`Detected dependency change at: ${dependency}`);
      }
    }
  }

  if (foundSemVerChanges.length) {
    const priorityOrder = ["major", "minor", "patch"];
    logger(
      "Selecting the highest semantic version identifier from the detected changes..."
    );

    return (
      priorityOrder.find((version) => foundSemVerChanges.includes(version)) ||
      null
    );
  }

  return null;
}

function cleanVersion(version: string): string {
  return version.replace(/^[^0-9]+/, "");
}
