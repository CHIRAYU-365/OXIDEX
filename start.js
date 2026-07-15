const { spawn } = require('child_process');
const os = require('os');

const isProd = process.env.NODE_ENV === 'production';

console.log(`Starting in ${isProd ? 'Production' : 'Development'} Mode...`);

const command = os.platform() === 'win32' ? 'npm.cmd' : 'npm';
const args = ['run', isProd ? 'start:prod' : 'start:dev'];

const child = spawn(command, args, { stdio: 'inherit' });

child.on('close', (code) => {
  process.exit(code);
});
