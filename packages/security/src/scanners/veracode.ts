import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const veracodeScanner: ScannerPlugin = {
  id: "veracode",
  name: "Veracode",
  jobKey: "veracode",
  jobName: "Veracode Security Scan",
  timeoutMinutes: 20,
  buildSteps(_scanner: CodeScanningTargetConfig) {
    return [
      {
        name: "Veracode Upload And Scan",
        uses: "veracode/veracode-uploadandscan-action@0.2.6",
        with: {
          appname: "${{ github.repository }}",
          createprofile: true,
          filepath: ".",
          vid: "${{ secrets.VERACODE_API_ID }}",
          vkey: "${{ secrets.VERACODE_API_KEY }}"
        }
      }
    ];
  }
};
