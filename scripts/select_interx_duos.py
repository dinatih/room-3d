"""Select first available takes and one group per action/session, without Blender."""
import argparse
from pathlib import Path

from interx_catalog import DEFAULT_SOURCE, ROOT, RECORDING, CONVERSION, actions, atomic_json, entry_for, estimate_model, report


def select_recordings(source, maximum):
    if not 1 <= maximum <= 8:
        raise ValueError('--max-per-action must be between 1 and 8')
    first_takes = {}
    for path in sorted(source.iterdir()):
        if not path.is_dir():
            continue
        match = RECORDING.fullmatch(path.name)
        if not match:
            raise ValueError(f'Invalid recording folder: {path}')
        group, session, action, take = match.groups()
        if int(action[1:]) >= 40:
            raise ValueError(f'Unknown action: {action}')
        key = (group, session, action)
        previous = first_takes.get(key)
        if previous is None or take < previous[0]:
            first_takes[key] = (take, path.name)
    representatives = {}
    for (group, session, action), (_, recording) in sorted(first_takes.items()):
        representatives.setdefault((action, session), recording)
    selected = []
    for action in actions():
        candidates = sorted((session, recording) for (code, session), recording in representatives.items() if code == action['code'])
        if not candidates:
            raise ValueError(f"No source recordings for {action['code']}")
        selected.extend(recording for _, recording in candidates[:maximum])
    return selected


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=DEFAULT_SOURCE)
    parser.add_argument('--max-per-action', type=int, default=8)
    parser.add_argument('--output', type=Path, default=ROOT / 'scripts/interx_selection.json')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    model = estimate_model()
    selected = select_recordings(args.source, args.max_per_action)
    selection = {'schemaVersion': 1, 'dataset': 'inter-x', 'conversion': CONVERSION,
                 'policy': {'take': 'first-available', 'representative': 'lowest-group-per-action-session', 'maxPerAction': args.max_per_action},
                 'sizeEstimate': model, 'actions': actions(),
                 'duos': [entry_for(args.source, recording, model) for recording in selected]}
    report(selection)
    if not args.dry_run:
        atomic_json(args.output, selection)


if __name__ == '__main__':
    main()
