// Installs a per-user macOS job. Run only after discovery:status succeeds.
import { mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
if(process.platform!=='darwin') throw new Error('This installer is for macOS launchd.');
const check=spawnSync(process.execPath,[join(root,'scripts/discovery.mjs'),'status'],{encoding:'utf8'});
if(check.status!==0){console.error('Database check failed. No schedule installed.');process.exit(1);}
const label='com.physical-ai-library.discovery';
const path=join(homedir(),'Library','LaunchAgents',`${label}.plist`);
const logs=join(homedir(),'Library','Logs','PhysicalAILibrary');
const escape=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const plist=`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${label}</string>
<key>ProgramArguments</key><array><string>${escape(process.execPath)}</string><string>${escape(join(root,'scripts/discovery.mjs'))}</string><string>run</string></array>
<key>WorkingDirectory</key><string>${escape(root)}</string>
<key>StartInterval</key><integer>14400</integer>
<key>RunAtLoad</key><true/>
<key>StandardOutPath</key><string>${escape(join(logs,'discovery.log'))}</string>
<key>StandardErrorPath</key><string>${escape(join(logs,'discovery-error.log'))}</string>
</dict></plist>\n`;
await mkdir(join(homedir(),'Library','LaunchAgents'),{recursive:true});
await mkdir(logs,{recursive:true});
await writeFile(path,plist,{mode:0o600});
const domain=`gui/${process.getuid()}`;
spawnSync('launchctl',['bootout',`${domain}/${label}`],{stdio:'ignore'});
const loaded=spawnSync('launchctl',['bootstrap',domain,path],{stdio:'inherit'});
if(loaded.status!==0) throw new Error('Could not load launch agent.');
console.log('Discovery scheduled every four hours while logged in; the local library must be running. Its current port is detected automatically.');
console.log(`Disable with: launchctl bootout ${domain}/${label}`);
