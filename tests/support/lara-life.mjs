import { nativeLife, useLaraLifeStore } from '/src/features/scene/ai/laraLifeStore.ts';
import { cameraState } from '/src/features/scene/cameraState.ts';
import { resolveAnimationId } from '/src/features/scene/animations/animationResolver.ts';

export async function life(fixture) {
    const started = performance.now(), observations = [];
    const check = (condition, message) => { if (!condition) throw Error(message); };
    const waitFor = async (condition, message) => {
        while (!condition()) {
            check(performance.now() - started < fixture.timeoutMs, `${message}: ${JSON.stringify({ life: useLaraLifeStore.getState(), position: cameraState.positions.native })}`);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        observations.push({ message, at: performance.now() - started, needs: { ...nativeLife.needs }, position: { ...cameraState.positions.native } });
    };
    const animation = key => cameraState.positions.native?.anim === resolveAnimationId(key);
    const decisions = () => window.__testTrace.filter(entry => entry.appLog?.action === 'life_decision' && entry.appLog?.actors?.includes('native'));
    const xbotStart = { ...cameraState.positions.xbot };

    // Open the real character controls, including the subscribed needs panel.
    const button = [...document.querySelectorAll('button')].find(button => button.title === 'Configuration utilisateur & Personnages');
    check(button, 'Character controls button missing');
    button.click();
    await waitFor(() => document.querySelector('[aria-label="Vie de Lara Native"]'), 'Panneau de vie visible');
    await waitFor(() => animation('standing-using-touchscreen-tablet'), 'Lara travaille au bureau');
    const beforeWork = nativeLife.needs.work;
    await new Promise(resolve => setTimeout(resolve, 2000));
    check(nativeLife.needs.work < beforeWork, 'Working must relieve boredom');
    await waitFor(() => animation('sitting-idle'), 'Lara se repose après le bureau');
    const beforeRest = nativeLife.needs.rest;
    await new Promise(resolve => setTimeout(resolve, 2000));
    check(nativeLife.needs.rest < beforeRest, 'Fatigue must decrease while seated');
    const panel = document.querySelector('[aria-label="Vie de Lara Native"]');
    check(panel.querySelectorAll('progress').length === 3, 'Three needs must be visible');
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
