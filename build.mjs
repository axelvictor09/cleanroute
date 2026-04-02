import { build } from 'vite';

try {
    await build({
        root: process.cwd(),
    });
    console.log('Build complete');
} catch (e) {
    console.log('BUILD ERROR:');
    console.log(e);
}
