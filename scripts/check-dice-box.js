import fs from 'fs';
const code = fs.readFileSync('node_modules/@3d-dice/dice-box/dist/dice-box.es.js', 'utf8');

// Use regex to look for how it parses user input
const matches = code.match(/([a-zA-Z_$]+)\.value\s*=/g);
console.log("Assignments to .value:", matches);

const ats = code.match(/@/g);
console.log("At symbols:", ats ? ats.length : 0);

// Look for 'modifiers'
const modifiers = code.match(/modifiers/g);
console.log("Modifiers:", modifiers ? modifiers.length : 0);
