import re

files = [
    "Agreeing",
    "Back Flip To Uppercut",
    "Bartending",
    "Being Carried",
    "Belly Dance",
    "Bellydancing",
    "Bencao",
    "Bicep Curl",
    "Blow A Kiss",
    "Body Jab Cross",
    "Booty Hip Hop Dance",
    "Boxing",
    "Braced Hang",
    "Burpee",
    "Button Pushing",
    "Catwalk Sequence 05",
    "Dancing Twerk",
    "Double Leg Takedown - Attacker",
    "Double Leg Takedown - Victim",
    "Drinking Fountain",
    "Female Laying Pose",
    "Female Walk",
    "Flip Kick",
    "Happy Idle",
    "Happy Walk",
    "Header Soccerball (1)",
    "Hook",
    "idle",
    "Jump",
    "Kiss",
    "Kiss from man",
    "Kiss from woman",
    "Knee Kick Lead",
    "Laughing",
    "No",
    "Pistol Idle",
    "Release Hostage - Villain",
    "Skinning Test",
    "Stall Soccerball (1)",
    "Taken Hostage - Victim",
    "Taken Hostage - Villain",
    "T-Pose",
    "Walking",
]

lines = []
for f in files:
    clean = re.sub(r'[^a-z0-9]', '_', f.lower())
    clean = re.sub(r'_+', '_', clean)
    clean = clean.strip('_')
    glb_name = f"anim_{clean}.glb"
    lines.append(f'  {{ value: "media/sandbox/{glb_name}", label: "{f}" }},')

print("\n".join(lines))
