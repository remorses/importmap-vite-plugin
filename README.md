# importmap-vite-plugin

A Vite plugin that generates an import map JSON virtual module you can use in your app. This allows you to share dependencies without duplication - your existing app modules (like React) won't be duplicated when using external libraries.

## Installation

```bash
npm install importmap-vite-plugin
# or
pnpm add importmap-vite-plugin
# or
yarn add importmap-vite-plugin
```

## Usage

Add the plugin to your `vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { importMapPlugin } from 'importmap-vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    importMapPlugin({
      imports: {
        // Map to local modules (these will be bundled)
        'react': './src/import-map/react',
        'react-dom': './src/import-map/react-dom',
        'react/jsx-runtime': './src/import-map/react/jsx-runtime',
        
        // Map to external URLs (these remain external)
        'framer-motion': 'https://esm.sh/framer-motion?external=react',
        '@motionone/dom': 'https://esm.sh/@motionone/dom?external=react',
        'framer': 'https://esm.sh/unframer@latest/esm/framer.js?external=react',
      }
    })
  ],
})
```

### Setting up Local Module Re-exports

When using CommonJS modules (like React from node_modules), you need to create re-export files to ensure named imports work correctly. CommonJS modules only have a default export, so modules using named imports like `import { useState } from 'react'` would fail without this wrapper.

Create these files in your `src/import-map/` directory:

**src/import-map/react.js**
```js
import React from 'react'

// Re-export all React exports to support both named and default imports
export const {
    isValidElement,
    createElement,
    Fragment,
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback,
    useContext,
    Children,
    cloneElement,
    createContext,
    forwardRef,
    lazy,
    memo,
    Profiler,
    PureComponent,
    Suspense,
    Component,
    startTransition,
    useDebugValue,
    useDeferredValue,
    useId,
    useImperativeHandle,
    useInsertionEffect,
    useLayoutEffect,
    useReducer,
    useSyncExternalStore,
    useTransition,
    createRef,
    cache,
    useOptimistic,
    StrictMode,
    captureOwnerStack,
    useActionState,
    use,
} = React

export default React

// Export the URL for the import map
export const url = import.meta.url
```

**src/import-map/react-dom.js**
```js
import ReactDOM from 'react-dom'

export const {
    createPortal,
    flushSync,
    hydrate,
    render,
    unmountComponentAtNode,
    unstable_batchedUpdates,
    unstable_renderSubtreeIntoContainer,
    version,
} = ReactDOM

export default ReactDOM
export const url = import.meta.url
```

**src/import-map/react/jsx-runtime.js**
```js
export { jsx, jsxs, Fragment } from 'react/jsx-runtime'
```

## Using the Import Map

The plugin creates a virtual module that you can import in your application:

```js
import importMap from 'virtual:importmap'

// Use the import map in your application
console.log(importMap)
// {
//   imports: {
//     'react': 'http://localhost:5173/src/import-map/react',
//     'react-dom': 'http://localhost:5173/src/import-map/react-dom',
//     'framer-motion': 'https://esm.sh/framer-motion?external=react',
//     ...
//   }
// }
```

### Complete Example - Mounting the Import Map

Here's a complete example of how to mount the import map in your app's entry point:

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './app'
import importMap from 'virtual:importmap'

function setupImportMap() {
    const mapScript = document.createElement('script')
    mapScript.type = 'importmap'
    mapScript.textContent = JSON.stringify(importMap, null, 2)
    console.log(mapScript.textContent)
    document.head.append(mapScript)
}
setupImportMap()

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
```

### TypeScript Support

To make the `virtual:importmap` module type-safe, add this declaration file to your project:

**src/vite-env.d.ts**
```ts
/// <reference types="vite/client" />

declare module 'virtual:importmap' {
  const importMap: {
    imports: Record<string, string>
  }
  export default importMap
}
```

## Features

- **No Duplication**: Uses your app's existing modules instead of bundling duplicates
- **Dev & Build Support**: Works in both development and production builds
- **Local & External**: Supports both local file paths and external URLs
- **Type Safe**: Includes TypeScript definitions

## How It Works

The plugin:
1. Creates a virtual module `virtual:importmap` that you can import
2. In development, uses Vite's `?url` imports for local modules
3. In production builds, emits chunks for local modules and provides their URLs
4. External URLs are passed through as-is

## License

ISC