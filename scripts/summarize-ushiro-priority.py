"""Summarize the synchronized surface and foot-placement measurements."""
from pathlib import Path
import argparse,collections,json,statistics
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser()
for label in ['before','donor','final']:p.add_argument('--'+label,type=Path,required=True)
a=p.parse_args();measurements={label:json.loads(getattr(a,label).read_text()) for label in ['before','donor','final']}
summary={'notes':['Surface regions use dominant skin groups, which differ between rigs.','Edge strain is not an exact volume measurement.','Foot placement is normalized by each rig’s bind pelvis-to-chest span.'],'models':{},'projectedGapDifferences':{}}
for model,clips in measurements.items():
 result={}
 for clip,rows in clips.items():
  result[clip]={'meanP95LogStrain':{region:statistics.mean(r['regions'][region]['p95LogStrain'] for r in rows) for region in ['shoulders','hips','trunk']},'meanProjectedGap':statistics.mean(r['projectedForeHindPawGapOverTrunk'] for r in rows),'meanHorizontalGap':statistics.mean(r['horizontalForeHindPawGapOverTrunk'] for r in rows)}
 summary['models'][model]=result
for clip,rows in measurements['final'].items():
 donor=measurements['donor'][clip]
 if [r['phase'] for r in rows]!=[r['phase'] for r in donor]:raise ValueError('Unsynchronized phases')
 differences=[abs(r['projectedForeHindPawGapOverTrunk']-d['projectedForeHindPawGapOverTrunk']) for r,d in zip(rows,donor)]
 summary['projectedGapDifferences'][clip]={'mean':statistics.mean(differences),'maximum':max(differences)}
contacts=json.loads((ROOT/'artifacts/ushiro/rebuild/contact-report.json').read_text())
summary['constrainedFootFits']={clip:{'frames':len(selected),'maximumGoalErrorNative':max(r['pawError'] for r in selected)} for clip,rows in contacts.items() if (selected:=[r for r in rows if r.get('contactFit')=='constrained'])}
summary['floorConstraintDrivers']=dict(collections.Counter(r['floorConstraint']['driver'] for rows in contacts.values() for r in rows if r.get('floorConstraint')))
( ROOT/'artifacts/ushiro/priority-review/surface-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print('Summarized',len(contacts),'clips and',len(measurements['final']),'visual references.')
