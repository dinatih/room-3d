import { nativeLife, useLaraLifeStore } from '/src/features/scene/ai/laraLifeStore.ts';
import { cameraState } from '/src/features/scene/cameraState.ts';
import { resolveAnimationId } from '/src/features/scene/animations/animationResolver.ts';
import { OccupancyManager } from '/src/features/scene/ai/occupancyManager.ts';

function observeLife(fixture) {
    const started = performance.now(), observations = [];
    const check = (condition, message) => { if (!condition) throw Error(message); };
    const waitFor = async (condition, message) => {
        while (!condition()) {
            check(performance.now() - started < fixture.timeoutMs, `${message}: ${JSON.stringify({ life: useLaraLifeStore.getState(), position: cameraState.positions.native })}`);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        observations.push({ message, at: performance.now() - started, needs: { ...nativeLife.needs }, position: { ...cameraState.positions.native } });
    };
    const openPanel = async () => {
        const button = document.querySelector('button[aria-controls="lara-life-panel"]');
        check(button, 'Character controls button missing');
        button.click();
        await waitFor(() => document.querySelector('[aria-label="Vie de Lara Native"]'), 'Panneau de vie visible');
    };
    return { observations, check, waitFor, openPanel };
}

export async function life(fixture) {
    const { observations, check, waitFor, openPanel } = observeLife(fixture);
    const animation = key => cameraState.positions.native?.anim === resolveAnimationId(key);
    const decisions = () => window.__testTrace.filter(entry => entry.appLog?.action === 'life_decision' && entry.appLog?.actors?.includes('native'));
    const xbotStart = { ...cameraState.positions.xbot };

    await openPanel();
    await waitFor(() => animation('standing-using-touchscreen-tablet'), 'Lara travaille au bureau');
    const beforeWork = nativeLife.needs.work;
    await new Promise(resolve => setTimeout(resolve, 2000));
    check(nativeLife.needs.work < beforeWork, 'Working must relieve boredom');
    await waitFor(() => animation('sitting-idle'), 'Lara se repose après le bureau');
    const beforeRest = nativeLife.needs.rest;
    await new Promise(resolve => setTimeout(resolve, 2000));
    check(nativeLife.needs.rest < beforeRest, 'Fatigue must decrease while seated');
    const panel = document.querySelector('[aria-label="Vie de Lara Native"]');
    check(panel.querySelectorAll('progress').length === 6, 'Six needs must be visible');
    const values = [...panel.querySelectorAll('progress')].map(element => element.value);
    Object.values(nativeLife.needs).forEach((value, index) => check(Math.abs(value - values[index]) < 2, 'Needs panel must track the simulation'));
    await waitFor(() => animation('looking') && decisions().some(entry => entry.appLog.object?.id === 'garden-fresh-air'), 'Lara se relève, marche puis observe le jardin');
    check(cameraState.positions.xbot.x !== xbotStart.x || cameraState.positions.xbot.z !== xbotStart.z, 'Xbot must keep its existing autonomous route');

    // Interrupt an autonomous queue through the actual manual-control path.
    cameraState.recordUserControl();
    await waitFor(() => useLaraLifeStore.getState().activity === 'Commande utilisateur', 'Le contrôle manuel interrompt l’activité autonome');
    const duringManual = { ...nativeLife.needs };
    await new Promise(resolve => setTimeout(resolve, 1000));
    check(JSON.stringify(nativeLife.needs) === JSON.stringify(duringManual), 'Manual control must preserve needs');
    cameraState.lastUserControlTime = 0;
    await waitFor(() => useLaraLifeStore.getState().activity !== 'Commande utilisateur', 'L’autonomie reprend après le contrôle manuel');
    const resumed = { ...nativeLife.needs };
    check(Math.abs(resumed.rest - duringManual.rest) < 2, 'Resuming must not reset needs');
    return { observations, decisions: decisions(), manualNeedsPreserved: true, panelValues: values, resumed };
}

export async function meal(fixture) {
    const { observations, check, waitFor, openPanel } = observeLife(fixture);
    await openPanel();
    const speedButton = document.querySelector('[aria-label="Vitesse de la vie de Lara"]');
    check(useLaraLifeStore.getState().speed === 1, 'The simulation must start at normal speed');
    const normalHunger = nativeLife.needs.meal;
    await new Promise(resolve => setTimeout(resolve, 2000));
    const normalGrowth = nativeLife.needs.meal - normalHunger;
    speedButton.click();
    await waitFor(() => useLaraLifeStore.getState().speed === 3 && speedButton.textContent.includes('×3'), 'Vitesse ×3');
    speedButton.click();
    await waitFor(() => useLaraLifeStore.getState().speed === 10 && speedButton.textContent.includes('×10'), 'Vitesse ×10');
    const fastHunger = nativeLife.needs.meal;
    await new Promise(resolve => setTimeout(resolve, 2000));
    const fastGrowth = nativeLife.needs.meal - fastHunger;
    check(normalGrowth > 0 && fastGrowth > normalGrowth * 4, `Accelerated needs must advance faster: normal=${normalGrowth}, fast=${fastGrowth}`);
    cameraState.recordUserControl();
    await waitFor(() => useLaraLifeStore.getState().activity === 'Commande utilisateur', 'Prise de contrôle initiale');
    nativeLife.needs = { rest: 5, work: 5, walk: 5, meal: 90, hygiene: 0, toilet: 0 };
    cameraState.lastUserControlTime = 0;
    await waitFor(() => cameraState.positions.native?.anim === resolveAnimationId('cooking-stir-pan'), 'Lara rejoint les plaques et prépare le repas');
    const beforePreparation = nativeLife.needs.meal;
    await new Promise(resolve => setTimeout(resolve, 200));
    check(nativeLife.needs.meal >= beforePreparation, 'Preparing must not relieve hunger');
    await waitFor(() => cameraState.positions.native?.anim === resolveAnimationId('fab-daily-life-eat-with-fork'), 'Lara rejoint une assise pour manger');
    const beforeEating = nativeLife.needs.meal;
    await waitFor(() => nativeLife.needs.meal < beforeEating - 2, 'Manger satisfait réellement la faim');
    await waitFor(() => document.querySelector('[aria-label="Faim"]'), 'La jauge de faim est visible');
    check(document.querySelector('[aria-label="Vie de Lara Native"]').textContent.includes('Manger'), 'The panel must show the current meal phase');
    speedButton.click();
    await waitFor(() => useLaraLifeStore.getState().speed === 1 && speedButton.textContent.includes('×1'), 'Retour à la vitesse normale');
    cameraState.recordUserControl();
    await waitFor(() => useLaraLifeStore.getState().activity === 'Commande utilisateur', 'Interruption manuelle du repas');
    const interrupted = nativeLife.needs.meal;
    await new Promise(resolve => setTimeout(resolve, 1000));
    check(nativeLife.needs.meal === interrupted, 'An interrupted meal must stop relieving hunger');
    cameraState.lastUserControlTime = 0;
    return { observations, interruptedHunger: interrupted, normalGrowth, fastGrowth };
}

export async function sleep(fixture) {
    const { observations, check, waitFor, openPanel } = observeLife(fixture);
    await openPanel();
    useLaraLifeStore.setState({ speed: 10 });
    const startNight = async () => {
        cameraState.recordUserControl();
        await waitFor(() => useLaraLifeStore.getState().activity === 'Commande utilisateur', 'Prise de contrôle avant la nuit');
        nativeLife.needs = { rest: 90, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 0 };
        cameraState.lastUserControlTime = 0;
        await waitFor(() => cameraState.positions.native?.anim === resolveAnimationId('laying-sleeping'), 'Lara rejoint le lit et se couche');
        check(cameraState.positions.native.y === 45, 'Sleeping must take place on the mattress');
        const beforeSleeping = nativeLife.needs.rest;
        await waitFor(() => nativeLife.needs.rest < beforeSleeping - 2, 'Lara récupère pendant son sommeil');
    };
    const ownsBed = () => OccupancyManager.getReservations().some(reservation => reservation.characterId === 'native' && reservation.slot.startsWith('bed-'));
    let wokeUp = false;
    const unsubscribe = useLaraLifeStore.subscribe(state => { if (state.activity.includes('Se réveiller')) wokeUp = true; });
    try {
        await startNight();
        check(document.querySelector('[aria-label="Vie de Lara Native"]').textContent.includes('Dormir'), 'The panel must identify sleep');
        await waitFor(() => nativeLife.lastActivity === 'sleep', 'Lara se réveille et descend du lit');
        check(wokeUp, 'The wake-up phase must be observable');
        check(nativeLife.needs.rest < 10, 'A complete night must restore Lara');
        check(cameraState.positions.native.y === 0, 'Lara must return to ground level after waking');
        check(!ownsBed(), 'The bed must be released after waking');
        await startNight();
        cameraState.recordUserControl();
        await waitFor(() => useLaraLifeStore.getState().activity === 'Commande utilisateur', 'Le contrôle manuel interrompt le sommeil');
        const fatigue = nativeLife.needs.rest;
        await new Promise(resolve => setTimeout(resolve, 500));
        check(nativeLife.needs.rest === fatigue, 'Sleep recovery must stop after interruption');
        check(!ownsBed(), 'An interrupted sleep must release the bed');
        cameraState.lastUserControlTime = 0;
        await waitFor(() => cameraState.positions.native?.anim === resolveAnimationId('laying-sleeping')
            && cameraState.positions.native.y === 45 && nativeLife.needs.rest < fatigue - 2, 'Lara reprend son sommeil après le contrôle manuel');
        return { observations, wokeUp, interruptedFatigue: fatigue };
    } finally { unsubscribe(); }
}

export async function hygiene(fixture) {
    const { observations, check, waitFor, openPanel } = observeLife(fixture);
    await openPanel();
    useLaraLifeStore.setState({ speed: 10 });
    cameraState.recordUserControl();
    await waitFor(() => useLaraLifeStore.getState().activity === 'Commande utilisateur', 'Contrôle avant les toilettes');
    nativeLife.needs = { rest: 0, work: 0, walk: 0, meal: 0, hygiene: 10, toilet: 90 };
    cameraState.lastUserControlTime = 0;
    await waitFor(() => nativeLife.handsDirty && nativeLife.needs.toilet < 85, 'Les toilettes soulagent le besoin');
    cameraState.recordUserControl();
    await waitFor(() => useLaraLifeStore.getState().activity === 'Commande utilisateur', 'Interruption des toilettes');
    check(nativeLife.handsDirty, 'An interruption must preserve dirty hands');
    nativeLife.needs.meal = 100;
    cameraState.lastUserControlTime = 0;
    await waitFor(() => cameraState.positions.native?.anim === resolveAnimationId('fab-daily-life-wash-hands'), 'Lavage des mains prioritaire sur le repas');
    await waitFor(() => !nativeLife.handsDirty, 'Mains propres après le lavage complet');
    cameraState.recordUserControl();
    await waitFor(() => useLaraLifeStore.getState().activity === 'Commande utilisateur', 'Contrôle avant un cycle complet');
    nativeLife.needs = { rest: 0, work: 0, walk: 0, meal: 0, hygiene: 0, toilet: 90 };
    const traceStart = window.__testTrace.length;
    cameraState.lastUserControlTime = 0;
    await waitFor(() => nativeLife.lastActivity === 'toilet', 'Cycle toilettes, chasse puis lavage terminé');
    check(!nativeLife.handsDirty, 'A complete toilet cycle must leave clean hands');
    const phases = window.__testTrace.slice(traceStart).filter(entry => entry.actor === 'native' && entry.executedInstruction?.lifePhase)
        .map(entry => entry.executedInstruction.lifePhase);
    check(phases.indexOf('use-toilet') < phases.indexOf('flush') && phases.indexOf('flush') < phases.indexOf('wash-hands'), 'Toilet, flush and handwashing must execute in order');
    cameraState.recordUserControl();
    await waitFor(() => useLaraLifeStore.getState().activity === 'Commande utilisateur', 'Contrôle avant la douche');
    nativeLife.needs = { rest: 0, work: 0, walk: 0, meal: 0, hygiene: 90, toilet: 0 };
    cameraState.lastUserControlTime = 0;
    await waitFor(() => cameraState.positions.native?.anim === resolveAnimationId('taking-shower'), 'Lara rejoint la douche');
    const beforeShower = nativeLife.needs.hygiene;
    await waitFor(() => nativeLife.needs.hygiene < beforeShower - 2, 'La douche satisfait la propreté');
    await waitFor(() => nativeLife.lastActivity === 'shower', 'Lara termine sa douche et sort');
    check(cameraState.positions.native.y === 0, 'Lara must leave the shower at ground level');
    check(nativeLife.needs.hygiene < 10, 'A full shower must restore cleanliness');
    return { observations };
}

export async function routine(fixture) {
    const { observations, check, waitFor, openPanel } = observeLife(fixture);
    const { duoSessionManager } = await import('/src/features/scene/ai/duoSessionManager.ts');
    const { useSceneStore } = await import('/src/features/scene/store/useSceneStore.ts');
    await openPanel();
    useLaraLifeStore.setState({ speed: 10 });
    const startEvening = async (lastActivity, blocked = []) => {
        cameraState.recordUserControl();
        await waitFor(() => useLaraLifeStore.getState().activity === 'Commande utilisateur', 'Prise de contrôle avant le loisir');
        const clock = nativeLife.elapsedSeconds;
        await new Promise(resolve => setTimeout(resolve, 200));
        check(nativeLife.elapsedSeconds === clock, 'Manual control must pause the simulated clock');
        nativeLife.elapsedSeconds = 13 * 60; // 21:00, with all physiological needs fulfilled.
        nativeLife.needs = { rest: 0, work: 60, walk: 0, meal: 0, hygiene: 0, toilet: 0 };
        nativeLife.lastActivity = lastActivity;
        for (const [id, slot] of blocked) reserve(id, slot);
        cameraState.lastUserControlTime = 0;
    };
    const reserved = [];
    const reserve = (id, slot) => {
        check(OccupancyManager.claimSlot(id, slot, 'test-routine'), `Cannot reserve ${id}:${slot}`);
        reserved.push([id, slot]);
    };
    try {
        reserve('garden-conversation', 'chat');
        reserve('tv-view', 'watch');
        await startEvening('work');
        await waitFor(() => useLaraLifeStore.getState().activity === 'Lire sur sa tablette'
            && cameraState.positions.native?.anim === resolveAnimationId('standing-using-touchscreen-tablet'), 'Lara lit sur sa tablette');
        const boredom = nativeLife.needs.work;
        await waitFor(() => nativeLife.needs.work < boredom - 2, 'La lecture réduit son ennui');
        OccupancyManager.releaseSlot('tv-view', 'watch', 'test-routine');
        await startEvening('read', [['desk-bollsidan-2', 'work-standing']]);
        await waitFor(() => useLaraLifeStore.getState().activity === 'Regarder la télé'
            && cameraState.positions.native?.anim === resolveAnimationId('looking'), 'Lara rejoint la télé');
        check(useSceneStore.getState().furniture.tvOn, 'Watching must turn on the actual TV');
        const beforeTv = nativeLife.needs.work;
        await waitFor(() => nativeLife.needs.work < beforeTv - 2, 'La télé réduit son ennui');
        OccupancyManager.releaseSlot('garden-conversation', 'chat', 'test-routine');
        await startEvening('watch-tv');
        reserve('tv-view', 'watch');
        await waitFor(() => duoSessionManager.isPlaying('native'), 'Lara retrouve un vrai partenaire pour discuter');
        const session = duoSessionManager.getSessionFor('native');
        check(session.playlist[0].id === 'conversation', 'The session must be a conversation');
        check(session.participantA.isReady && session.participantB.isReady, 'Both people must have arrived');
        const beforeSocial = nativeLife.needs.work;
        await waitFor(() => nativeLife.needs.work < beforeSocial - 2, 'La discussion réduit son ennui');
        await waitFor(() => nativeLife.lastActivity === 'social', 'La discussion se termine et Lara reprend sa routine');
        check(!duoSessionManager.getSessionFor('native'), 'The conversation must release both participants');
        return { observations };
    } finally {
        for (const [id, slot] of reserved) OccupancyManager.releaseSlot(id, slot, 'test-routine');
    }
}
