#!/usr/bin/env node

import * as fs from "fs";
import * as semver from "semver";
import { execSync } from "child_process";
import { Command } from "commander";

const program = new Command()
  .option("-f, --file [type]", "Add path to package.json", "package.json")
  .option("-v, --verbose [type]", "Add verbose logging", false)
  .parse(process.argv);

const { file: packageJsonFile, verbose } = program.opts();

const logger = (message: string) => {
  if (verbose) console.log(message);
};

init();

function init() {
  if (packageJsonFile === true) {
    console.error("Path to package.json not found");
    return;
  }

  try {
    processCommits(packageJsonFile);
  } catch (error: any) {
    console.error(`Error processing package.json changes: ${error.message}`);
  }
}

function processCommits(packageJsonFile: string): void {
  if (!fs.existsSync(packageJsonFile)) {
    console.error(`Error: Package.json file not found at ${packageJsonFile}`);
    return;
  }

  const commitHashes = execSync(
    `git rev-list --reverse HEAD -- ${packageJsonFile}`
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
        `git show ${commitHash}:${packageJsonFile}`
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
    const packageJsonContent = fs.readFileSync(packageJsonFile, "utf8");
    const packageJson = JSON.parse(packageJsonContent);

    if (packageJson.version === version) return;

    packageJson.version = version;

    fs.writeFileSync(
      packageJsonFile,
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
        logger(`Found invalid version change type: ${versionChange}\n`);
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
    logger(`New dependencies added: ${addedDependencies}`);
    return "major";
  }

  const foundChanges: string[] = [];

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
        foundChanges.push(semverChange);
        logger(`Found updated dependency: ${dependency}`);
      }
    }
  }

  if (foundChanges.length) {
    const priorityOrder = ["major", "minor", "patch"];

    return (
      priorityOrder.find((version) => foundChanges.includes(version)) || null
    );
  }

  return null;
}

function cleanVersion(version: string): string {
  return version.replace(/^[^0-9]+/, "");
}
