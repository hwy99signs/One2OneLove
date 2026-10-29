// The 4.5 MB original I THOUGHT SO! source is embedded as one large HTML.
// This build-only text replacement aligns its served footer with its v1.1.2 header.
// Never touches the embedded questions, board, scoring, or gameplay code.
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const file=join('dist','games-src','i-thought-so.html');
const content=await readFile(file,'utf8');
const original='I THOUGHT SO!&nbsp; BUILD v1.1.0';
const replacement='I THOUGHT SO!&nbsp; BUILD v1.1.2';
const count=content.split(original).length-1;
if(count===1){
  await writeFile(file,content.replace(original,replacement),'utf8');
  console.log('I THOUGHT SO! served footer aligned to BUILD v1.1.2 (text-only)');
}else if(content.includes(replacement)){
  console.log('I THOUGHT SO! footer is already BUILD v1.1.2');
}else{
  throw new Error('I THOUGHT SO! footer text missing; refusing to deploy an unverifiable build');
}
