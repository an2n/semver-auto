#!/usr/bin/env node

import * as fs from "fs";
import * as semver from "semver";
import { execSync } from "child_process";
import { Command } from "commander";
import { ProgressBar } from "@opentf/cli-pbar";

const {
  exit: exitProcess,
  file: packageJsonPath,
  log: loggingEnabled,
  progress: progreesBarEnabled,
  head: startFromHead,
} = new Command()
  .option("-e, --exit", "Exit when version is outdated", false)
  .option("-f, --file [type]", "Add path to package.json", "./package.json")
  .option("-l --log", "Enable verbose logging", false)
  .option("-p --progress", "Enable progress bar", false)
  .option("-h --head", "Start from the branch latest commit.", false)
  .parse(process.argv)
  .opts();

const progreesBar = progreesBarEnabled
  ? new ProgressBar({
      size: "SMALL",
      color: "rgb(3, 223, 127)",
    })
  : null;

let messages: string[] = [];
const semverHierachy = ["major", "minor", "patch"] as const;
type SemverTypes = (typeof semverHierachy)[number];

const cleanSemver = (version: string) => version.replace(/^[^0-9]+/, "");

function addMessages(message: string) {
  if (loggingEnabled) {
    messages.push(message);
  }
}

function emptyMessages() {
  if (loggingEnabled) {
    messages = [];
  }
}

const getLogMessages = () => {
  return messages.length ? messages.join("\n") : undefined;
};

const getProgressMessages = () => {
  return messages.length ? `\n${messages.join("\n")}` : undefined;
};

initialize();

function initialize() {
  if (packageJsonPath === true) {
    console.error("Error: Unable to locate the path to package.json");
    return;
  }

  if (!fs.existsSync(packageJsonPath)) {
    console.error(`Error: Package.json file not found at ${packageJsonPath}`);
    return;
  }

  try {
    processCommits();
  } catch (error: any) {
    console.error(`Error processing package.json changes: ${error.message}`);
  }
}

function processCommits() {
  let version = packageJsonVersion();

  if (!version) {
    console.error("Error: Could not determined package.json version");
    return;
  }

  let commitIterator = 1;
  let semverUpdated = false;
  let dependencies: Record<string, string> = {};
  let devDependencies: Record<string, string> = {};
  let optionalDependencies: Record<string, string> = {};

  const commitHashes = execSync(
    startFromHead
      ? `git log -n 1 --format="%H" -- ${packageJsonPath}`
      : `git rev-list --reverse HEAD -- ${packageJsonPath}`
  )
    .toString()
    .split("\n")
    .filter(String);

  if (loggingEnabled) {
    console.log(`Total commits to analyze: ${commitHashes.length}`);
  }
  progreesBar?.start({ total: commitHashes.length });

  for (const commitHash of commitHashes) {
    const diff = execSync(
      `git show --format= --name-only ${commitHash}`
    ).toString();

    if (diff.includes("package.json")) {
      const packageJsonDiff = execSync(
        `git show ${commitHash}:${packageJsonPath}`
      ).toString();

      let parsedDiff = null;

      try {
        parsedDiff = JSON.parse(packageJsonDiff);
      } catch (error) {
        addMessages(`Error parsing package.json: ${error}`);
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

        addMessages(`Determining the highest semver from ${changeTypes}`);

        const semverChange = semverHierachy.find((version) =>
          [semverChanges].includes(version)
        );

        version = updatePackageVersion(version, semverChange) ?? version;
        semverUpdated = true;
      }
    }
    if (progreesBarEnabled) {
      progreesBar?.update({
        value: commitIterator++,
        suffix: getProgressMessages(),
      });
      emptyMessages();
      continue;
    }

    const messages = getLogMessages();
    if (messages) {
      console.log(messages);
      emptyMessages();
    }
  }

  progreesBar?.stop();

  if (semverUpdated) {
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");
    const packageJson = JSON.parse(packageJsonContent);

    if (packageJson.version === version) return;

    if (exitProcess) {
      console.warn(
        `Please update your package.json to version ${version} by running 'semver-auto'`
      );

      process.exit(1);
    }
    packageJson.version = version;

    fs.writeFileSync(
      packageJsonPath,
      `${JSON.stringify(packageJson, null, 2)}\n`
    );
    console.log(`+ Updated package.json version to ${version}`);
  }
}

function updatePackageVersion(
  currentVersion: string,
  semverChange?: SemverTypes
): string | undefined {
  try {
    if (!semverChange) return;

    const [major, minor, patch] = currentVersion.split(".").map(Number);

    switch (semverChange) {
      case "major":
        currentVersion = `${major + 1}.0.0`;
        addMessages(`Increase major version: ${currentVersion}\n`);
        break;
      case "minor":
        currentVersion = `${major}.${minor + 1}.0`;
        addMessages(`Increase minor version: ${currentVersion}\n`);
        break;
      case "patch":
        currentVersion = `${major}.${minor}.${patch + 1}`;
        addMessages(`Increase patch version: ${currentVersion}\n`);
        break;
      default:
        addMessages(
          `Encountered an unprocessable version type: ${semverChange}\n`
        );
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
): SemverTypes | null {
  const addedDependencies = Object.keys(newDependencies).filter(
    (dependency) => !currentDependencies.hasOwnProperty(dependency)
  );

  if (addedDependencies.length) {
    const message =
      addedDependencies.length === 1
        ? `Added new dependency: ${addedDependencies}`
        : `Added new dependencies: ${addedDependencies}`;

    addMessages(message);
    return "major";
  }

  const semverChanges: string[] = [];

  for (const dependency in newDependencies) {
    const current = cleanSemver(currentDependencies[dependency]);
    const compared = cleanSemver(newDependencies[dependency]);

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
        addMessages(`Detected semver change at: ${dependency}`);
        semverChanges.push(semverChange);
      }
    }
  }

  if (semverChanges.length) {
    addMessages("Finding the highest semver from detected change");
    return (
      semverHierachy.find((version) => semverChanges.includes(version)) || null
    );
  }
  return null;
}

function packageJsonVersion(): string | undefined {
  if (startFromHead) {
    const latestCommitHash = execSync("git log -n 1 --pretty=format:%H", {
      encoding: "utf-8",
    });

    const gitShowOutput = execSync(
      `git show ${latestCommitHash}:${packageJsonPath}`,
      { encoding: "utf-8" }
    );

    try {
      const packageJson = JSON.parse(gitShowOutput);
      return packageJson.version;
    } catch (error) {
      console.error(`Error parsing current package.json: ${error}`);
      return;
    }
  }
  return "1.0.0";
}
