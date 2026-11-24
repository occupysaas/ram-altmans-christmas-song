import {bundle} from '@remotion/bundler';
await bundle({entryPoint: 'src/index.ts', outDir: process.cwd() + '/out/bundle', enableCaching: false});
