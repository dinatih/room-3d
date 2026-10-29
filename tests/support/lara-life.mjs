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
        const button = [...document.querySelectorAll('button')].find(button => button.title === 'Configuration utilisateur & Personnages');
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
    check(panel.querySelectorAll('progress').length === 4, 'Four needs must be visible');
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
    nativeLife.needs = { rest: 5, work: 5, walk: 5, meal: 90 };
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
        nativeLife.needs = { rest: 90, work: 0, walk: 0, meal: 0 };
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
