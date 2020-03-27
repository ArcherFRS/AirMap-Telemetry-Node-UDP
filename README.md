# AirMap Telemetry Node UDP

This is a sample application that sends sample telemetry data to AirMap.

## Getting Started

Copy the `./src/airmap-example.config.json` file and rename it to `./src/airmap.config.json`. Replace the sample values with actual values for your AirMap account.

Execute `npm install` in the command line at the project root (install Node if you have not already).

## Folder Structure

`./src` contains the project source files.

`./dist` contains the output of the transpiled TypeScript (only appears when `tsc` is executed in the command line at the project root, or `npm run start-local` which executes `tsc` as part of it's execution)

`./vscode` contains the launch file used when debugging with Visual Studio Code

## To Run

Execute `npm run start-local` in the command line at the root of the project.

## To Test

Execute `npm run test-local` in the command line at the root of the project.

## License

COPYRIGHT ARCHER FIRST RESPONSE SYSTEMS, LLC