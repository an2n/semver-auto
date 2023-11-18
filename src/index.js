"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var semver = require("semver");
var child_process_1 = require("child_process");
// Run the script
init();
function init() {
    var packageJsonPath = process.argv[2] || "package.json";
    try {
        processCommits(packageJsonPath);
    }
    catch (error) {
        console.error("Error processing package.json changes: ".concat(error.message));
    }
}
function processCommits(packageJsonPath) {
    if (!fs.existsSync(packageJsonPath)) {
        console.error("Error: Package.json file not found at ".concat(packageJsonPath));
        return;
    }
    var commitHashes = (0, child_process_1.execSync)("git rev-list --reverse HEAD -- ".concat(packageJsonPath))
        .toString()
        .split("\n");
    var version = "1.0.0";
    var dependencies = {};
    var devDependencies = {};
    var updated = false; // Track if an update has been made
    for (var _i = 0, commitHashes_1 = commitHashes; _i < commitHashes_1.length; _i++) {
        var commitHash = commitHashes_1[_i];
        var diff = (0, child_process_1.execSync)("git show --format= --name-only ".concat(commitHash)).toString();
        if (diff.includes("package.json")) {
            var packageJsonDiff = (0, child_process_1.execSync)("git show ".concat(commitHash, ":").concat(packageJsonPath)).toString();
            var parsedDiff = JSON.parse(packageJsonDiff);
            var newDependencies = parsedDiff.dependencies || {};
            var newDevDependencies = parsedDiff.devDependencies || {};
            // Check if there are changes in dependencies or devDependencies
            var dependencyChange = determineVersionChange(dependencies, newDependencies);
            if (dependencyChange) {
                dependencies = newDependencies;
            }
            var devDependencyChange = determineVersionChange(devDependencies, newDevDependencies);
            if (devDependencyChange) {
                devDependencies = newDevDependencies;
            }
            if (dependencyChange || devDependencyChange) {
                version =
                    updatePackageVersion(version, dependencyChange || devDependencyChange) || version;
                updated = true; // Set to true if an update has been made
            }
        }
    }
    // Write to file only if an update has been made
    if (updated) {
        var packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");
        var packageJson = JSON.parse(packageJsonContent);
        // Update the version
        packageJson.version = version;
        // Write the updated package.json back to the file
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log("Updated package.json version to ".concat(version));
    }
}
function updatePackageVersion(currentVersion, versionChange) {
    try {
        var _a = currentVersion.split(".").map(Number), major = _a[0], minor = _a[1], patch = _a[2];
        // Update the version based on the version change
        switch (versionChange) {
            case "major":
                currentVersion = "".concat(major + 1, ".0.0");
                break;
            case "minor":
                currentVersion = "".concat(major, ".").concat(minor + 1, ".0");
                break;
            case "patch":
                currentVersion = "".concat(major, ".").concat(minor, ".").concat(patch + 1);
                break;
            default:
                console.error("Invalid version change type.");
                return;
        }
        return currentVersion;
    }
    catch (error) {
        console.error("Error updating package.json version: ".concat(error.message));
    }
}
function determineVersionChange(currentDependencies, newDependencies) {
    // Check if any new dependencies were added
    var addedDependencies = Object.keys(newDependencies).filter(function (dependency) { return !currentDependencies.hasOwnProperty(dependency); });
    console.log("addedDependencies:", addedDependencies);
    if (addedDependencies.length) {
        return "major"; // At least one new dependency was added or has a different version
    }
    // Compare the current and new dependencies
    for (var dep in newDependencies) {
        var currentVersionCleaned = cleanVersion(currentDependencies[dep]);
        var newVersionCleaned = cleanVersion(newDependencies[dep]);
        // Check if the existing dependency has a semantic versioning change
        var semverChange = semver.diff(currentVersionCleaned, newVersionCleaned);
        if (semverChange) {
            // There is a change in an existing dependency
            return semverChange;
        }
    }
    return null; // No version change
}
function cleanVersion(version) {
    // Remove leading non-numeric characters (e.g., ^, ~, >, <)
    return version.replace(/^[^0-9]+/, "");
}
