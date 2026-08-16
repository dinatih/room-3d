const fs = require('fs');

let walkerCode = fs.readFileSync('src/features/scene/Walker.tsx', 'utf-8');
walkerCode = walkerCode.replace(/import \{ useRef, useLayoutEffect, Suspense, useEffect, useMemo, useState \} from 'react';/, "import { Suspense, useEffect, useMemo } from 'react';");
walkerCode = walkerCode.replace(/import \{ useFrame, useThree \} from '@react-three\/fiber';\n/, "");
walkerCode = walkerCode.replace(/import \{ useGLTFClone \} from '@features\/scene\/useGLTFClone';\n/, "");
walkerCode = walkerCode.replace(/import \{ Famnig27470460 \} from '.\/items\/Famnig27470460';\n/, "");
walkerCode = walkerCode.replace(/import \{ Wig \} from '.\/items\/Wig';\n/, "");
walkerCode = walkerCode.replace(/import \{ RiggedWig \} from '.\/items\/RiggedWig';\n/, "");
walkerCode = walkerCode.replace(/import \* as THREE from 'three';\n/, "");
walkerCode = walkerCode.replace(/import \{ GLTFLoader \} from 'three\/examples\/jsm\/loaders\/GLTFLoader.js';\n/, "");
walkerCode = walkerCode.replace(/import \{ cameraState \} from '@features\/scene\/cameraState';\n/, "");
walkerCode = walkerCode.replace(/import \{ LAYER_WALKER_DETAIL, LAYER_WALKER \} from '@config';\n/, "");
walkerCode = walkerCode.replace(/import \{ applyLaraVariantStyles, type LaraVariant \} from '.\/LaraVariants';\n/, "");
walkerCode = walkerCode.replace(/import \{ buildHairChain, resolveTargetBoneName, retargetClip, getDepth, _retargetCache \} from '.\/retargeting';\n/, "import { _retargetCache } from './retargeting';\n");
walkerCode = walkerCode.replace(/import \{\n(?:  [A-Z0-9_]+,\n)+  [A-Z0-9_]+\n\} from '.\/ai\/ZoneNodes';\n/, "");
walkerCode = walkerCode.replace(/import \{ useAgentController \} from '.\/ai\/useAgentController';\n/, "");
walkerCode = walkerCode.replace(/import \{ appLog \} from '@features\/ui\/AppConsole';\n/, "");
walkerCode = walkerCode.replace(/const EMPTY_SCENARIO: AgentInstruction\[\] = \[\];\n/, "");
walkerCode = walkerCode.replace(/const globalGLTFCache: Record<string, Promise<any>> = \{\};\n/, "");
fs.writeFileSync('src/features/scene/Walker.tsx', walkerCode);

let singleCharCode = fs.readFileSync('src/features/scene/SingleCharacter.tsx', 'utf-8');
singleCharCode = singleCharCode.replace(/import \{ useRef, useLayoutEffect, Suspense, useEffect, useMemo, useState \} from 'react';/, "import { useRef, useLayoutEffect, useEffect, useMemo, useState } from 'react';");
singleCharCode = singleCharCode.replace(/import \{ useGLTF \} from '@react-three\/drei';\n/, "");
fs.writeFileSync('src/features/scene/SingleCharacter.tsx', singleCharCode);

console.log('Imports fixed');
