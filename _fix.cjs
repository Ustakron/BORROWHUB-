const fs = require('fs');

// ---------- 1) LineFriendGate.tsx: fix the two lines that contain stray Latin chars ----------
let gate = fs.readFileSync('src/components/LineFriendGate.tsx', 'utf8');
let gl = gate.split(/\r?\n/);
for (let i = 0; i < gl.length; i++) {
  if (gl[i].includes('@756bxjku')) {
    gl[i] = '                    : \Open LINE and tap \"Add friend\" - checking automatically every 3 seconds\}';
  }
  if (gl[i].includes(String.fromCharCode(0x11E))) {
    gl[i] = '            After adding the friend in LINE, this screen unlocks automatically (checks every 3 seconds).';
  }
}
gate = gl.join('\n');
fs.writeFileSync('src/components/LineFriendGate.tsx', gate);

// ---------- 2) RegisterModal.tsx: only friend (or error=degraded) can submit ----------
let rm = fs.readFileSync('src/components/RegisterModal.tsx', 'utf8');
const before1 = rm;
rm = rm.replace("disabled={friendStatus === 'not-friend'}", "disabled={friendStatus !== 'friend' && friendStatus !== 'error'}");
rm = rm.replace("if (friendStatus === 'not-friend') return;", "if (friendStatus !== 'friend' && friendStatus !== 'error') return;");
if (rm === before1) console.log('WARN: RegisterModal replacements did not apply');
fs.writeFileSync('src/components/RegisterModal.tsx', rm);

// ---------- 3) App.tsx: wire the gate ----------
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  "import { RegisterModal } from './components/RegisterModal';",
  "import { RegisterModal } from './components/RegisterModal';\nimport { LineFriendGate } from './components/LineFriendGate';"
);

app = app.replace(
  'const [activePushToast, setActivePushToast] = useState<LineNotification | null>(null);',
  'const [activePushToast, setActivePushToast] = useState<LineNotification | null>(null);\n  const [showFriendGate, setShowFriendGate] = useState(false);\n  const [friendGateUserId, setFriendGateUserId] = useState<string | null>(null);'
);

const GATE_FN = [
'  // Force the user to add the LINE OA as a friend (when verifiable) before using',
'  // the app. Opens the blocking modal if the friendship check says "not a friend".',
'  const gateOnFriendship = async (userId: string) => {',
'    try {',
'      const res = await fetch(/api/line/friendship?userId=);',
'      const data = await res.json().catch(() => null);',
"      if (!res.ok || !data || typeof data.isFriend !== 'boolean') return; // degraded: allow (no token etc.)",
'      if (data.isFriend === false) {',
'        setFriendGateUserId(userId);',
'        setShowFriendGate(true);',
'      }',
'    } catch {',
'      // best-effort only; never break the login flow',
'    }',
'  };',
'']
.join('\n');

const fnRe = /  const checkFriendshipAndWarn = async[\s\S]*?\n  \};\n/;
if (fnRe.test(app)) {
  app = app.replace(fnRe, GATE_FN);
} else {
  console.log('WARN: checkFriendshipAndWarn block not found');
}

app = app.replace("checkFriendshipAndWarn(updatedUser.lineUserId);", "gateOnFriendship(updatedUser.lineUserId);");

app = app.replace(
  "setCurrentTab('home');\n\n    const welcomeNotif",
  "setCurrentTab('home');\n\n    gateOnFriendship(newUser.lineUserId);\n\n    const welcomeNotif"
);

const gateRender = [
'      {/* LINE OA friend gate: blocks until the user adds the OA as friend */}',
'      <LineFriendGate',
'        isOpen={showFriendGate}',
'        userId={friendGateUserId}',
'        oaName={LINE_CHANNEL_CONFIG.oaName}',
'        oaAddFriendUrl={LINE_CHANNEL_CONFIG.oaAddFriendUrl}',
'        onFriendConfirmed={() => setShowFriendGate(false)}',
'        onDegraded={() => setShowFriendGate(false)}',
'      />',
'']
.join('\n');

if (!app.includes('<LineFriendGate')) {
  app = app.replace('{/* Floating LINE Push Toast */}', gateRender + '{/* Floating LINE Push Toast */}');
} else {
  console.log('WARN: LineFriendGate already rendered');
}

fs.writeFileSync('src/App.tsx', app);
console.log('DONE');
