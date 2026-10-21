import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { useAgentController, resetAgentDeployment } from '/src/features/scene/ai/useAgentController.ts';
import { OccupancyManager } from '/src/features/scene/ai/occupancyManager.ts';
import { useSceneStore } from '/src/features/scene/store/useSceneStore.ts';
import { getAnimationDef } from '/src/features/scene/animations/animationResolver.ts';
import { getExitTransition } from '/src/features/scene/animations/animationTransitions.ts';
import { retargetClip } from '/src/features/scene/retargeting/retargetClip.ts';
import { fitPostureTransition } from '/src/features/scene/animations/postureTransition.ts';
import { extractCharacterParts } from '/src/features/scene/characterParts.ts';
import { getSmartObject } from '/src/features/scene/ai/smartObjectRegistry.ts';
import { setAgentProfile, removeAgentProfile, navigationDebug, furnitureObstacles, registerObstacle, unregisterObstacle } from '/src/features/scene/ai/navigation/obstacles.ts';
import { releaseAgentDoors, getAgentDoorProtection, protectDoor } from '/src/features/scene/ai/navigation/doorRequests.ts';
import { getZoneDestination } from '/src/features/scene/ai/navigation/destinations.ts';
import { check, trace } from './apartment.mjs';
import { cameraState } from '/src/features/scene/cameraState.ts';
import { resolveNavigation } from '/src/features/scene/ai/navigation/navigationScope.ts';
import { getKitchenTrashParking, KITCHEN_TRASH_POSITION } from '/src/features/scene/ai/diyChairClearance.ts';
import { currentFurnitureTransforms, movingFurniture } from '/src/features/scene/furniturePositions.ts';

export async function kitchenAccess(fixture) {
    const id = 'suite-kitchen-access', events = [];
    let actor, previous, completedApproach = false, usedObject = false, prepared = false;
    const instruction = () => window.__testTrace.filter(entry => entry.actor === id && 'executedInstruction' in entry).at(-1)?.executedInstruction;
    const onClearance = () => {
        const parking = getKitchenTrashParking();
        events.push({ parking: Boolean(parking), completedApproach, instruction: instruction(), position: { ...cameraState.positions[id] } });
        if (parking) prepared = true;
    };
    setAgentProfile(id, fixture.profile);
    document.addEventListener('kitchen-trash-clearance', onClearance);
    try {
        const start = await resolveNavigation(() => getZoneDestination('living', id));
        actor = await mountKallaxActor(id, fixture, start);
        const deadline = performance.now() + fixture.timeoutMs;
        while (!prepared || getKitchenTrashParking()) {
            check(performance.now() < deadline, `Kitchen activity did not complete: ${JSON.stringify({ previous, events })}`);
            const state = await actor.tick();
            cameraState.positions[id] = { x: state.x, y: state.y, z: state.z, yaw: state.rotY };
            if (previous?.status === 'MOVING' && state.status === 'IDLE') completedApproach = true;
            if (state.status === 'INTERACTING' && instruction()?.type === 'USE_OBJECT') usedObject = true;
            previous = state;
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        const moves = events.filter(event => event.parking);
        check(moves.length === 1 && moves[0].completedApproach && moves[0].instruction?.type === 'PREPARE_OBJECT',
            `Furniture moved before completing its approach: ${JSON.stringify(events)}`);
        check(usedObject, 'The actor must use the storage after the furniture finishes moving');
        while (movingFurniture.has('trash-bin-position') || currentFurnitureTransforms['trash-bin-position']?.x !== KITCHEN_TRASH_POSITION.x
            || currentFurnitureTransforms['trash-bin-position']?.z !== KITCHEN_TRASH_POSITION.z) {
            check(performance.now() < deadline, 'The trash bin did not return');
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        const current = currentFurnitureTransforms['trash-bin-position'];
        check(current?.x === KITCHEN_TRASH_POSITION.x && current.z === KITCHEN_TRASH_POSITION.z, 'Trash bin not restored to its original position');
        return { startedAfterApproach: true, usedObject, restored: true, events };
    } finally {
        document.removeEventListener('kitchen-trash-clearance', onClearance);
        actor?.close();
        OccupancyManager.releaseAllForCharacter(id);
        releaseAgentDoors(id); removeAgentProfile(id); delete cameraState.positions[id];
    }
}
export async function exercise(fixture) {
    const id = 'suite-controller';
    const { objectId, slotId, exit } = fixture.interaction;
    const start = getZoneDestination(fixture.startZone);
    const instructions = [
        { type: 'WAIT', duration: fixture.interaction.initialWaitSeconds, animation: 'idle', targetPos: [start.x, 0, start.z] },
        { type: 'USE_OBJECT', smartObjectId: objectId, slotId, animation: 'sitting-idle', duration: fixture.interaction.useSeconds, repeatCount: 1 },
        { type: 'MOVE_TO', targetPos: [exit.x, 0, exit.z] },
    ];
    trace({ actor: id, instructions, synchronization: 'React effect, GLB load, mixer finished' });
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    let controller, sequence = instructions, mounted;
    let realPosition = { x: start.x, y: 0, z: start.z, rotY: 0 };
    const ready = new Promise(resolve => { mounted = resolve; });
    function Harness() {
        controller = useAgentController(id, sequence, false, () => realPosition);
        useEffect(() => { mounted(); }, []);
        return null;
    }
    const draco = new DRACOLoader();
    draco.setDecoderPath('/draco/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    let model, mixer;
    setAgentProfile(id, fixture.profile);
    useSceneStore.setState(s => ({ layers: { ...s.layers, exitTransitions: true } }));
    try {
        flushSync(() => root.render(React.createElement(Harness)));
        await ready;
        model = (await loader.loadAsync('/characters/lara/lara_native.glb')).scene;
        model.scale.setScalar(100);
        model.updateMatrixWorld(true);
        window.__THREE_SCENE__.add(model);
        const hips = extractCharacterParts(model).bones.hips;
        check(hips, 'Loaded Lara has no hips');
        mixer = new THREE.AnimationMixer(model);
        const clips = new Map();
        async function clip(key) {
            if (!clips.has(key)) {
                const def = getAnimationDef(key);
                check(def, `Missing animation ${key}`);
                const gltf = await loader.loadAsync('/' + def.path);
                gltf.animations[0].name = def.id;
                clips.set(key, retargetClip(gltf.animations[0], model, gltf.scene, def.rootMotionSpace));
            }
            return clips.get(key);
        }
        const idle = await clip('idle');
        const states = [], animations = [], began = performance.now();
        let action, previousAnimation, previousStatus, didInterrupt = false, completedRise = false, delayedPlaybackChecked = false;
        while (controller.getStatus() !== 'FINISHED') {
            check(performance.now() - began < fixture.timeoutMs, `Controller timeout (${controller.getStatus()}, ${JSON.stringify(controller.update(0))})`);
            const state = controller.update(fixture.dt), status = controller.getStatus();
            realPosition = { x: state.x, y: state.y, z: state.z, rotY: state.rotY };
            check(status !== 'BLOCKED', `Unexpected controller block: ${JSON.stringify(navigationDebug.get(id))}`);
            if (status !== previousStatus) {
                states.push(status);
                trace({ actor: id, status, state: { ...state } });
                previousStatus = status;
            }
            if (status === 'TRANSITIONING' && !delayedPlaybackChecked) {
                // Elapsed controller time cannot pretend a not-yet-loaded clip has finished.
                for (let i = 0; i < fixture.interaction.delayedPlaybackFrames; i++)
                    controller.update(fixture.dt);
                check(controller.getStatus() === 'TRANSITIONING', 'Rise finished before animation playback');
                delayedPlaybackChecked = true;
            }
            if (state.animation !== previousAnimation) {
                let next = await clip(state.animation);
                if (status === 'TRANSITIONING')
                    next = fitPostureTransition(next, hips, idle);
                action?.stop();
                action = mixer.clipAction(next).reset().play();
                action.setLoop(status === 'TRANSITIONING' ? THREE.LoopOnce : THREE.LoopRepeat, status === 'TRANSITIONING' ? 1 : Infinity);
                action.clampWhenFinished = true;
                previousAnimation = state.animation;
                animations.push(state.animation);
            }
            if (!state.animationPaused)
                mixer.update(fixture.dt);
            model.position.set(state.x, state.y, state.z);
            model.rotation.y = state.rotY;
            model.updateMatrixWorld(true);
            if (action) {
                const progress = action.time / action.getClip().duration;
                const finished = action.loop === THREE.LoopOnce && !action.isRunning() && progress >= 1;
                controller.reportAnimationPlayback(state.animation, progress, finished);
                if (status === 'TRANSITIONING' && finished)
                    completedRise = true;
            }
            if (fixture.activity === 'interruption' && status === 'INTERACTING' && state.animation === 'sitting-idle' && !didInterrupt) {
                // Exercise the event path which really claims reservations, then interrupt it.
                document.dispatchEvent(new CustomEvent('agent-force-smartobject', { detail: { targetId: id, objectId, slotId, animation: 'sitting-idle' } }));
                check(OccupancyManager.getOccupant(objectId, slotId) === id, 'Direct order did not claim its slot');
                protectDoor('living', id, { x: state.x, y: state.y, z: state.z, ...fixture.profile });
                sequence = [{ type: 'MOVE_TO', targetPos: [exit.x, 0, exit.z] }];
                flushSync(() => root.render(React.createElement(Harness)));
                check(controller.update(0).x === realPosition.x && controller.update(0).z === realPosition.z, 'Interruption teleported its actor');
                check(OccupancyManager.getOccupant(objectId, slotId) === null, 'Interruption retained its slot');
                check(!getAgentDoorProtection('living', id), 'Interruption retained a door protection');
                didInterrupt = true;
            }
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        const final = { ...controller.update(0) };
        check(states.includes('MOVING') && states.includes('INTERACTING') && states.includes('TRANSITIONING'), `Incomplete lifecycle: ${states}`);
        check(completedRise && delayedPlaybackChecked, 'Missing real completed rise');
        check(Math.hypot(final.x - exit.x, final.z - exit.z) <= 1e-6 && final.y === 0, 'Did not completely leave its interaction');
        check(getSmartObject(objectId) && getExitTransition('sitting-idle'), 'Missing production object/exit');
        if (fixture.activity === 'interruption')
            check(didInterrupt, 'Interruption not executed');
        return { states, animations, final, completedRise, delayedPlaybackChecked, didInterrupt, model: 'characters/lara/lara_native.glb' };
    }
    finally {
        flushSync(() => root.unmount());
        host.remove();
        check(OccupancyManager.getOccupant(objectId, slotId) !== id, 'Unmount leaked a reservation');
        check(!getAgentDoorProtection('living', id), 'Unmount leaked a protected door');
        mixer?.stopAllAction();
        if (model)
            mixer?.uncacheRoot(model);
        draco.dispose();
        model?.removeFromParent();
        model?.traverse(o => { o.geometry?.dispose(); if (o.material)
            for (const mat of Array.isArray(o.material) ? o.material : [o.material])
                mat.dispose(); });
        releaseAgentDoors(id);
        removeAgentProfile(id);
        navigationDebug.delete(id);
        resetAgentDeployment(id);
    }
}
// Mount a real controller and mixer for a concurrent Kallax actor in navigation cases.
// The caller advances the same dt as the walkers and closes this resource in finally.
export async function mountKallaxActor(id, fixture, start) {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host), draco = new DRACOLoader();
    draco.setDecoderPath('/draco/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    const scenario = [{ type: 'WAIT', targetPos: [start.x, 0, start.z], duration: fixture.timeoutMs / 1000, animation: 'idle' }];
    let controller, model, mixer, action, previousAnimation;
    function Harness() { controller = useAgentController(id, scenario, false, () => ({ ...start, y: 0, rotY: 0 })); return null; }
    const close = () => {
        flushSync(() => root.unmount());
        host.remove();
        mixer?.stopAllAction();
        if (model)
            mixer?.uncacheRoot(model);
        draco.dispose();
        model?.removeFromParent();
        model?.traverse(o => { o.geometry?.dispose(); if (o.material)
            for (const mat of Array.isArray(o.material) ? o.material : [o.material])
                mat.dispose(); });
        resetAgentDeployment(id);
    };
    try {
        flushSync(() => root.render(React.createElement(Harness)));
        model = (await loader.loadAsync('/characters/lara/lara_native.glb')).scene;
        model.scale.setScalar(100);
        model.updateMatrixWorld(true);
        window.__THREE_SCENE__.add(model);
        mixer = new THREE.AnimationMixer(model);
        const clips = new Map();
        const tick = async () => {
            const state = controller.update(fixture.dt);
            check(controller.getStatus() !== 'BLOCKED', `Kallax actor blocked: ${JSON.stringify(navigationDebug.get(id))}`);
            if (previousAnimation !== state.animation) {
                if (!clips.has(state.animation)) {
                    const def = getAnimationDef(state.animation);
                    check(def, `Unknown Kallax clip ${state.animation}`);
                    const gltf = await loader.loadAsync('/' + def.path);
                    gltf.animations[0].name = def.id;
                    clips.set(state.animation, retargetClip(gltf.animations[0], model, gltf.scene, def.rootMotionSpace));
                }
                action?.stop();
                action = mixer.clipAction(clips.get(state.animation)).reset().play();
                // Non-looping animation completion is reported from the actual mixer.
                action.setLoop(THREE.LoopOnce, 1);
                action.clampWhenFinished = true;
                previousAnimation = state.animation;
            }
            if (!state.animationPaused)
                mixer.update(fixture.dt);
            model.position.set(state.x, state.y, state.z);
            model.rotation.y = state.rotY;
            model.updateMatrixWorld(true);
            const progress = action.time / action.getClip().duration;
            controller.reportAnimationPlayback(state.animation, progress, !action.isRunning() && progress >= 1);
            return { ...state, status: controller.getStatus() };
        };
        document.dispatchEvent(new CustomEvent('agent-force-smartobject', { detail: { targetId: id, objectId: fixture.objectId } }));
        return { tick, close, model: 'characters/lara/lara_native.glb' };
    }
    catch (error) {
        close();
        throw error;
    }
}
export async function failedAction(fixture) {
    const id = 'suite-failed-action', slotId = 'seat-1', start = getZoneDestination(fixture.startZone);
    setAgentProfile(id, fixture.profile);
    const owned = [...furnitureObstacles.values()].filter(o => o.owner === fixture.objectId);
    check(owned.length, 'No registered sofa geometry');
    const points = owned.flatMap(o => o.polygon), radius = fixture.profile.radius;
    const minX = Math.min(...points.map(p => p.x)) - radius, maxX = Math.max(...points.map(p => p.x)) + radius;
    const minZ = Math.min(...points.map(p => p.z)) - radius, maxZ = Math.max(...points.map(p => p.z)) + radius;
    const { rectangle } = await import('/src/features/scene/ai/navigation/geometry.ts');
    const polygons = [rectangle(minX, (minZ + maxZ) / 2, radius, maxZ - minZ + 2 * radius), rectangle(maxX, (minZ + maxZ) / 2, radius, maxZ - minZ + 2 * radius), rectangle((minX + maxX) / 2, minZ, maxX - minX + 2 * radius, radius), rectangle((minX + maxX) / 2, maxZ, maxX - minX + 2 * radius, radius)];
    let actor;
    try {
        for (const [i, polygon] of polygons.entries())
            registerObstacle({ id: `suite-seal-${i}`, polygon, yMin: 0, yMax: fixture.profile.height });
        actor = await mountKallaxActor(id, fixture, start);
        check(OccupancyManager.getOccupant(fixture.objectId, slotId) === id, 'Failed action did not initially claim its slot');
        protectDoor('living', id, { x: start.x, z: start.z, y: 0, ...fixture.profile });
        trace({ actor: id, expected: 'navigation-error-and-release', objectId: fixture.objectId, seal: polygons });
        const deadline = performance.now() + fixture.timeoutMs;
        while (OccupancyManager.getOccupant(fixture.objectId, slotId) === id) {
            check(performance.now() < deadline, 'Failed action retained its reservation');
            await actor.tick();
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        check(!getAgentDoorProtection('living', id), 'Failed action retained its door protection');
        return { slotReleased: true, doorReleased: true, model: actor.model };
    }
    finally {
        actor?.close();
        for (const i of polygons.keys())
            unregisterObstacle(`suite-seal-${i}`);
        OccupancyManager.releaseAllForCharacter(id);
        releaseAgentDoors(id);
        removeAgentProfile(id);
        navigationDebug.delete(id);
    }
}
