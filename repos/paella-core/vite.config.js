import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { readFileSync } from 'node:fs';

const pkgVersion = JSON.parse(
    readFileSync(new URL('./package.json', import.meta.url), 'utf8')
).version;

export default defineConfig({
    root: './src',
    define: {
        __PAELLA_VERSION__: JSON.stringify(pkgVersion)
    },
    build: {
        outDir: '../dist',
        lib: {
            entry: './js/index.ts',
            formats: ['es'],
            fileName: 'paella-core'
        },
        rollupOptions: {
            output: {
                assetFileNames: '[name].[ext]',
                sourcemapExcludeSources: false,
                sourcemapPathTransform: (relativeSourcePath) => {
                    return relativeSourcePath;
                },
                // assetFileNames: assetInfo => {
                //     return path.extname(assetInfo.name) === '.css' ? 'paella-core.css' : assetInfo.name;
                // }
            }
        },
        sourcemap: true,
        minify: false
    },
    plugins: [
        dts({
            entryRoot: 'js',
            outDir: '../dist',
            include: ['js/**/*.ts'],
            exclude: ['**/*.test.ts', '**/*.spec.ts']
        })
    ],
    optimizeDeps: {
        esbuildOptions: {
            sourcemap: true,
            minify: false
        }
    }
});
