#!/usr/bin/env node

import * as fs from "fs";
import * as semver from "semver";
import { execSync } from "child_process";

// Run the script
init();

function init() {
  const packageJsonPath: string = process.argv[2] || "package.json";

  try {
    processCommits(packageJsonPath);
  } catch (error: any) {
    console.error(`Error processing package.json changes: ${error.message}`);
  }
}

function processCommits(packageJsonPath: string): void {
  if (!fs.existsSync(packageJsonPath)) {
    console.error(`Error: Package.json file not found at ${packageJsonPath}`);
    return;
  }

  const commitHashes = execSync(
    `git rev-list --reverse HEAD -- ${packageJsonPath}`
  )
    .toString()
    .split("\n");

  let version = "1.0.0";
  let dependencies: Record<string, string> = {};
  let devDependencies: Record<string, string> = {};
  let updated = false; // Track if an update has been made

  for (const commitHash of commitHashes) {
    const diff = execSync(
      `git show --format= --name-only ${commitHash}`
    ).toString();

    if (diff.includes("package.json")) {
      const packageJsonDiff = execSync(
        `git show ${commitHash}:${packageJsonPath}`
      ).toString();
      const parsedDiff = JSON.parse(packageJsonDiff);

      const newDependencies = parsedDiff.dependencies || {};
      const newDevDependencies = parsedDiff.devDependencies || {};

      // Check if there are changes in dependencies or devDependencies
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
          ) || version;

        updated = true; // Set to true if an update has been made
      }
    }
  }

  // Write to file only if an update has been made
  if (updated) {
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");
    const packageJson = JSON.parse(packageJsonContent);

    if (packageJson.version === version) {
      return;
    }

    // Update the version
    packageJson.version = version;

    // Write the updated package.json back to the file
    fs.writeFileSync(
      packageJsonPath,
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

    // Update the version based on the version change
    switch (versionChange) {
      case "major":
        currentVersion = `${major + 1}.0.0`;
        break;
      case "minor":
        currentVersion = `${major}.${minor + 1}.0`;
        break;
      case "patch":
        currentVersion = `${major}.${minor}.${patch + 1}`;
        break;
      default:
        console.error(`Found invalid version change type: ${versionChange}`);
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
  // Check if any new dependencies were added
  const addedDependencies = Object.keys(newDependencies).filter(
    (dependency) => !currentDependencies.hasOwnProperty(dependency)
  );
  if (addedDependencies.length) {
    return "major"; // At least one new dependency was added or has a different version
  }

  // Compare the current and new dependencies
  for (const dep in newDependencies) {
    const current = cleanVersion(currentDependencies[dep]);
    const compared = cleanVersion(newDependencies[dep]);

    const currentVersionCleaned = semver.clean(current);
    const newVersionCleaned = semver.clean(compared);

    const isValid =
      currentVersionCleaned &&
      newVersionCleaned &&
      semver.valid(currentVersionCleaned) &&
      semver.valid(newVersionCleaned);

    if (isValid) {
      // Check if the existing dependency has a semantic versioning change
      const semverChange = semver.diff(
        currentVersionCleaned,
        newVersionCleaned
      );
      if (semverChange) {
        return semverChange;
      }
    }
  }

  return null; // No version change
}

function cleanVersion(version: string): string {
  // Remove leading non-numeric characters (e.g., ^, ~, >, <)
  return version.replace(/^[^0-9]+/, "");
}
