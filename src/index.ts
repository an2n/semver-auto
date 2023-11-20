#!/usr/bin/env node

import * as fs from "fs";
import * as semver from "semver";
import { execSync } from "child_process";
import { Command } from "commander";
import { ProgressBar } from "@opentf/cli-pbar";

const Program = new Command()
  .option("-e, --exit", "Add exit code when version is outdated", false)
  .option("-f, --file [type]", "Add path to package.json", "./package.json")
  .option("-l, --log", "Add verbose logging", false)
  .option("-p --progress", "Add progress bar", false)
  .parse(process.argv);

const {
  exit: ExitProcess,
  file: PackageJsonPath,
  log: LoggingEnabled,
  progress: ProgreesBarEnabled,
} = Program.opts();

const ProgreesBar = ProgreesBarEnabled
  ? new ProgressBar({
      size: "SMALL",
      color: "rgb(3, 223, 127)",
    })
  : null;

const VersionHierachy = ["major", "minor", "patch"];

let Logs: string[] = [];

const AddLog = (message: string) => {
  if (LoggingEnabled) {
    Logs.push(message);
  }
};

const GetLog = () => {
  if (LoggingEnabled) {
    return Logs.length ? `\n${Logs.join("\n")}` : undefined;
  }
  return undefined;
};

function EmptyLog() {
  if (LoggingEnabled) {
    Logs = [];
  }
}

initialize();

function initialize() {
  if (PackageJsonPath === true) {
    console.error("Error: Unable to locate the path to package.json");
    return;
  }

  try {
    processCommits(PackageJsonPath);
  } catch (error: any) {
    console.error(`Error processing package.json changes: ${error.message}`);
  }
}

function processCommits(PackageJsonPath: string): void {
  if (!fs.existsSync(PackageJsonPath)) {
    console.error(`Error: Package.json file not found at ${PackageJsonPath}`);
    return;
  }

  const commitHashes = execSync(
    `git rev-list --reverse HEAD -- ${PackageJsonPath}`
  )
    .toString()
    .split("\n");

  if (LoggingEnabled) {
    console.log(`Total commits to analyze: ${commitHashes.length}`);
  }

  ProgreesBar?.start({ total: commitHashes.length });

  let version = "1.0.0";
  let semverUpdated = false;
  let dependencies: Record<string, string> = {};
  let devDependencies: Record<string, string> = {};
  let optionalDependencies: Record<string, string> = {};

  let iterator = 1;
  for (const commitHash of commitHashes) {
    const diff = execSync(
      `git show --format= --name-only ${commitHash}`
    ).toString();

    if (diff.includes("package.json")) {
      const packageJsonDiff = execSync(
        `git show ${commitHash}:${PackageJsonPath}`
      ).toString();

      let parsedDiff = null;

      try {
        parsedDiff = JSON.parse(packageJsonDiff);
      } catch (error) {
        AddLog(`Error parsing package.json: ${error}`);
        continue;
      }

      const newDependencies = parsedDiff.dependencies || {};
      const newDevDependencies = parsedDiff.devDependencies || {};
      const newOptionalDependencies = parsedDiff.optionalDependencies || {};

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

      const optionalDependencyChange = determineVersionChange(
        optionalDependencies,
        newOptionalDependencies
      );
      if (optionalDependencyChange) {
        optionalDependencies = newOptionalDependencies;
      }

      const semverChanges =
        dependencyChange || devDependencyChange || optionalDependencyChange;

      if (semverChanges) {
        const changeTypes = [
          dependencyChange && "dependencies",
          devDependencyChange && "devDependencies",
          optionalDependencyChange && "optionalDependencies",
        ]
          .filter(Boolean)
          .join(", ");

        AddLog(`Selecting the highest semver from ${changeTypes}`);

        const semverChange =
          VersionHierachy.find((version) =>
            [semverChanges].includes(version)
          ) || null;

        version = updatePackageVersion(version, semverChange) ?? version;
        semverUpdated = true;
      }
    }

    ProgreesBar?.update({ value: iterator++, suffix: GetLog() });
    EmptyLog();
  }

  ProgreesBar?.stop();

  if (semverUpdated) {
    const packageJsonContent = fs.readFileSync(PackageJsonPath, "utf8");
    const packageJson = JSON.parse(packageJsonContent);

    if (packageJson.version === version) return;

    if (ExitProcess) {
      console.error(
        `Error: Your project is outdated. Please update your package.json to version ${version} by running 'semver-auto'`
      );

      process.exit(1);
    }
    packageJson.version = version;

    fs.writeFileSync(
      PackageJsonPath,
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
    const [major, minor, patch] = currentVersion.split(".").map(Number);

    switch (versionChange) {
      case "major":
        currentVersion = `${major + 1}.0.0`;
        AddLog(`Increase major version: ${currentVersion}\n`);
        break;
      case "minor":
        currentVersion = `${major}.${minor + 1}.0`;
        AddLog(`Increase minor version: ${currentVersion}\n`);
        break;
      case "patch":
        currentVersion = `${major}.${minor}.${patch + 1}`;
        AddLog(`Increase patch version: ${currentVersion}\n`);
        break;
      default:
        AddLog(`Encountered an unprocessable version type: ${versionChange}\n`);
        return;
    }
    return currentVersion;
  } catch (error: any) {
    console.error(`Error updating package.json version: ${error?.message}`);
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
    const message =
      addedDependencies.length === 1
        ? `Added new dependency: ${addedDependencies}`
        : `Added new dependencies: ${addedDependencies}`;

    AddLog(message);
    return "major";
  }

  const semverChanges: string[] = [];

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
        AddLog(`Detected semver change at: ${dependency}`);
        semverChanges.push(semverChange);
      }
    }
  }

  if (semverChanges.length) {
    AddLog("Selecting the highest semver from detected change");

    return (
      VersionHierachy.find((version) => semverChanges.includes(version)) || null
    );
  }

  return null;
}

function cleanVersion(version: string): string {
  return version.replace(/^[^0-9]+/, "");
}
