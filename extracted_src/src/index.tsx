import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CONSTANTS } from './data.js';
import { ASSETS } from './assetManifest.js';
import './index.css'

// Define interfaces for the messages
interface CaptureResponseMessage {
  type: 'captureResponse';
  imageData: string;
}

interface CaptureErrorMessage {
  type: 'captureError';
  error: string;
}

interface ConsoleErrorMessage {
  type: 'consoleError';
  message: string;
}

const configuredOrigins = (import.meta.env.VITE_ALLOWED_MESSAGE_ORIGINS || '')
  .split(',')
  .map((origin: string) => origin.trim())
  .filter(Boolean);

const allowedMessageOrigins = new Set<string>([
  window.location.origin,
  ...configuredOrigins,
]);

const isAllowedMessageOrigin = (origin: string) => allowedMessageOrigins.has(origin);

const getParentTargetOrigin = () => {
  if (document.referrer) {
    try {
      const parentOrigin = new URL(document.referrer).origin;
      if (isAllowedMessageOrigin(parentOrigin)) {
        return parentOrigin;
      }
    } catch {
      return window.location.origin;
    }
  }

  return window.location.origin;
};

// --- Helper function to send errors to the parent window ---
const sendErrorToParent = (errorMessage: string) => {
  if (window.parent) {
    console.log("Posting error to parent:", errorMessage); // For debugging the handler itself
    window.parent.postMessage({
      type: 'consoleError', // We can reuse the same message type
      message: errorMessage
    } as ConsoleErrorMessage, getParentTargetOrigin());
  }
};

// Function to extract timestamp from query string
const getTimestampFromQuery = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('t');
};

// Function to append timestamp to asset paths
const addTimestampToAssetPaths = (timestamp: string) => {
  const processAssetCategory = (category: any) => {
    for (const assetName in category) {
      if (category.hasOwnProperty(assetName)) {
        const asset = category[assetName];
        if (asset && typeof asset === 'object' && asset.path) {
          // Check if path already has query parameters
          const separator = asset.path.includes('?') ? '&' : '?';
          asset.path = `${asset.path}${separator}t=${timestamp}`;
        }
      }
    }
  };

  // Process all categories in ASSETS
  for (const categoryName in ASSETS) {
    if (ASSETS.hasOwnProperty(categoryName)) {
      processAssetCategory(ASSETS[categoryName]);
    }
  }
};

window.addEventListener('error', (event: ErrorEvent) => {
  // Extract message, line number, column number, and filename from the ErrorEvent
  const message = event.message;
  const lineno = event.lineno;
  const colno = event.colno;
  const url = event.filename;
  const errorObject = event.error; // The actual Error object, might contain stack

  // Format the error message to include line and column number
  let formattedMessage = message;
  if (lineno !== undefined && colno !== undefined) {
    formattedMessage += ` (at line ${lineno}, column ${colno}`;
    if (url) {
      // Add filename if available
      formattedMessage += ` in ${url}`;
    }
    formattedMessage += `)`;
  }

  // Append the stack trace if available from the error object
  if (errorObject && errorObject.stack) {
      formattedMessage += `\nStack: ${errorObject.stack}`;
  }

  // Send the formatted error message to the parent window
  sendErrorToParent(formattedMessage);
});

const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Call the original console.error so the error is still visible in the iframe's console
  originalConsoleError.apply(console, args);

  // Format the error message from arguments
  const message = args.map(arg => {
    if (arg instanceof Error) {
      // If an Error object is explicitly logged, include its stack
      return arg.stack || arg.message;
    }
    try {
      return JSON.stringify(arg);
    } catch (e) {
      return String(arg);
    }
  }).join(' ');

  // Send the formatted error message to the parent window using our helper
  sendErrorToParent(`console.error: ${message}`); // Prefix to distinguish from uncaught errors
};

// Function to deep merge objects, modifying the target object in place
const deepMergeInPlace = (target: any, source: any) => {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        // If the property doesn't exist in target, create it
        if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
          target[key] = {};
        }
        // Recursively merge nested objects
        deepMergeInPlace(target[key], source[key]);
      } else {
        // For primitive values and arrays, directly assign
        target[key] = source[key];
      }
    }
  }
};

// Function to convert bundle manifest format to JavaScript ASSETS format
const bundleToJsFormat = (bundleManifest: any) => {
  if (!bundleManifest || typeof bundleManifest !== 'object') {
    throw new Error(`Bundle manifest must be a dictionary, got ${typeof bundleManifest}`);
  }

  if (!('bundles' in bundleManifest)) {
    throw new Error("Bundle manifest must contain a 'bundles' key");
  }

  const bundles = bundleManifest.bundles;
  if (!Array.isArray(bundles)) {
    throw new Error(`'bundles' must be a list, got ${typeof bundles}`);
  }

  const assetsData: any = {};

  // Process each bundle in the manifest
  for (const bundle of bundles) {
    if (!bundle || typeof bundle !== 'object') {
      throw new Error(`Bundle entry must be a dictionary, got ${typeof bundle}`);
    }

    if (!('name' in bundle)) {
      throw new Error("Bundle entry is missing required 'name' property");
    }

    const bundleName = bundle.name;
    if (typeof bundleName !== 'string' || !bundleName.trim()) {
      throw new Error(`Bundle name must be a non-empty string, got: ${JSON.stringify(bundleName)}`);
    }

    // Initialize the category in assetsData
    assetsData[bundleName] = {};

    // Process assets if they exist
    if ('assets' in bundle) {
      const assets = bundle.assets;
      if (!Array.isArray(assets)) {
        throw new Error(`Assets in bundle '${bundleName}' must be a list, got ${typeof assets}`);
      }

      for (const asset of assets) {
        if (!asset || typeof asset !== 'object') {
          throw new Error(`Asset in bundle '${bundleName}' must be a dictionary, got ${typeof asset}`);
        }

        if (!('alias' in asset)) {
          throw new Error(`Asset in bundle '${bundleName}' is missing required 'alias' property`);
        }

        if (!('src' in asset)) {
          throw new Error(`Asset in bundle '${bundleName}' is missing required 'src' property`);
        }

        const alias = asset.alias;
        const src = asset.src;

        if (typeof alias !== 'string' || !alias.trim()) {
          throw new Error(`Asset alias in bundle '${bundleName}' must be a non-empty string, got: ${JSON.stringify(alias)}`);
        }

        if (typeof src !== 'string' || !src.trim()) {
          throw new Error(`Asset src in bundle '${bundleName}' must be a non-empty string, got: ${JSON.stringify(src)}`);
        }

        // Create the asset entry with path and any additional data
        const assetEntry: any = { path: src };

        // Add additional data if present
        if ('data' in asset && asset.data && typeof asset.data === 'object') {
          Object.assign(assetEntry, asset.data);
        }

        assetsData[bundleName][alias] = assetEntry;
      }
    }
  }

  // Return in the expected JavaScript format with ASSETS wrapper
  return { ASSETS: assetsData };
};

// Function to load and merge data from data.json and assets/manifest.json
const loadExternalData = async (timestamp: string | null) => {
  // Use the timestamp from query string, or fall back to current timestamp
  const cacheBuster = timestamp ? `?t=${timestamp}` : `?t=${Date.now()}`;

  // Load data.json
  try {
    const response = await fetch(`data.json${cacheBuster}`);

    if (response.ok) {
      const jsonData = await response.json();

      // Merge the JSON data with the existing CONSTANTS object
      if (jsonData.CONSTANTS) {
        deepMergeInPlace(CONSTANTS, jsonData.CONSTANTS);
      }

      // Handle other top-level properties if they exist in the future
      for (const key in jsonData) {
        if (key !== 'CONSTANTS' && jsonData.hasOwnProperty(key)) {
          // For any other exported variables from data.js in the future
          // This would require dynamic handling based on what's exported
          console.log(`Found additional data property: ${key}`);
        }
      }
    }
  } catch (error) {
    // Silently fail if data.json doesn't exist or has invalid JSON
    // This is expected behavior when no custom data is provided
    console.log('No data.json found or invalid JSON, using default data');
  }

  // Load assets/manifest.json
  try {
    const response = await fetch(`assets/manifest.json${cacheBuster}`);

    if (response.ok) {
      const bundleManifest = await response.json();

      // Convert bundle format to JavaScript ASSETS format
      const convertedData = bundleToJsFormat(bundleManifest);

      // Merge the converted manifest data with the existing ASSETS object
      if (convertedData.ASSETS) {
        deepMergeInPlace(ASSETS, convertedData.ASSETS);
      }
    }
  } catch (error) {
    // Silently fail if assets/manifest.json doesn't exist or has invalid JSON
    // This is expected behavior when no custom assets are provided
    console.log('No assets/manifest.json found or invalid JSON, using default assets');
  }
};

// Add event listener for capture requests
window.addEventListener('message', async (event) => {
  if (!isAllowedMessageOrigin(event.origin)) {
    return;
  }

  // Check if the message is a capture request
  if (event.data && event.data.type === 'captureRequest') {
    try {
      const { default: html2canvas } = await import('html2canvas');
      // Capture the entire page instead of just a specific container
      const canvas = await html2canvas(document.documentElement);
      const imageData = canvas.toDataURL('image/png');

      // Send the captured image back to the parent
      window.parent.postMessage({
        type: 'captureResponse',
        imageData: imageData
      } as CaptureResponseMessage, event.origin);
    } catch (error) {
      console.error('Error capturing game:', error);
      // Send error message back to parent
      window.parent.postMessage({
        type: 'captureError',
        error: error instanceof Error ? error.message : String(error)
      } as CaptureErrorMessage, event.origin);
    }
  }
});

document.addEventListener('pointerlockchange', () => {
  // Check if an element has the pointer lock.
  const isLocked = !!document.pointerLockElement;

  // Send a message to the parent window (the main application).
  window.parent.postMessage({
    type: 'pointerLockChange',
    isLocked: isLocked
  }, getParentTargetOrigin());
}, false);

// Initialize the app
const initializeApp = async () => {
  // FIRST: Get timestamp from query string
  const timestamp = getTimestampFromQuery();

  // Load external data (data.json and assets/manifest.json) using the same timestamp
  await loadExternalData(timestamp);

  // Process asset paths with timestamp from query string (after loading external assets)
  if (timestamp) {
    addTimestampToAssetPaths(timestamp);
    console.log(`Applied timestamp ${timestamp} to all asset paths`);
  }

  const rootElement = document.getElementById("root");

  if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
      <App />
    );
  } else {
    // This will now be caught by our console.error override and sent to the parent
    console.error("Root element not found");
  }
};

// Start the app
initializeApp();
