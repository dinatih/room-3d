# Reprise des animations NPZ

Restauration des GLB existants depuis `c14e25c6`, après rognage du calibrage et avant les corrections de hauteur Y et verrouillage X/Z. Les variantes déjà supprimées ne sont pas réintroduites. Les fichiers ajoutés après cette version sont conservés.

## Mesure

Premier clip uniquement (celui lu par `useCharacterAnimations`). Quaternions normalisés, distance `2 acos(abs(q₁·q₂))`, échantillonnage à 30 Hz avec interpolation du sampler. Un événement signifie un saut >25° sur un os en 1/30 s. Plusieurs os sur une même frame comptent séparément. Ce score repère des mouvements suspects ; il ne prouve pas une perte de marqueurs. Une inversion q→−q seule représente la même orientation et ne compte pas comme saut.

## Adoucissement

Pour les clips à moins de 150 événements : remplacement des pics isolés (aller-retour angulaire, voisins cohérents) par SLERP entre leurs voisins à la même date, puis une seule moyenne géodésique pondérée [1,2,1] autour des sauts restants. Pas de clamp global. Les extrémités des pistes restent intactes. Les rotations STEP/CUBICSPLINE restent intactes. La liste exhaustive des clés, os et secondes modifiés est dans `scripts/npz_resume_smoothing.json`. Le script vérifie que les translations XYZ, échelles, dates et tous les autres octets restent identiques pendant le lissage. Le score final ne remplace pas la validation visuelle.

## Catalogue complet

| Animation | Sauts avant | Après | Action | Durée (s) | Amplitude X/Z (m) |
|---|---:|---:|---|---:|---|
| yoga-dolphin-pose-or-ardha-pincha-mayurasana-a | 1048 | 1048 | Au-dessus du seuil | 16.200 | 0.965 / 0.686 |
| randb-anna-cortesi-c3d | 673 | 673 | Au-dessus du seuil | 138.067 | 1.226 / 1.240 |
| happy-dance-olivia | 585 | 585 | Au-dessus du seuil | 87.433 | 2.235 / 2.277 |
| musical-theater-fanie-c3d | 556 | 556 | Au-dessus du seuil | 127.433 | 2.475 / 2.823 |
| excited-dance-olivia | 499 | 499 | Au-dessus du seuil | 93.200 | 2.431 / 1.842 |
| zumba-fanie-c3d | 483 | 483 | Au-dessus du seuil | 225.000 | 1.603 / 1.362 |
| bellydance2-anna-cortesi-c3d | 434 | 434 | Au-dessus du seuil | 280.767 | 0.967 / 1.024 |
| hiphop-fanie-c3d | 429 | 429 | Au-dessus du seuil | 129.900 | 2.011 / 1.723 |
| pleased-dance-olivia | 422 | 422 | Au-dessus du seuil | 96.833 | 3.001 / 2.455 |
| reggaeton-vaso-01 | 257 | 257 | Au-dessus du seuil | 128.300 | 1.218 / 1.434 |
| salsa-stefanos-c3d | 189 | 189 | Au-dessus du seuil | 196.467 | 1.246 / 1.304 |
| bachata-vaso-01 | 178 | 178 | Au-dessus du seuil | 133.600 | 1.923 / 1.528 |
| salsa-shines-vaso-01 | 127 | 26 | Adoucie | 127.533 | 1.558 / 1.470 |
| relaxed-groove-olivia | 120 | 11 | Adoucie | 99.933 | 1.840 / 2.146 |
| hasaposerviko-duo | 109 | 14 | Adoucie | 126.267 | 2.481 / 2.261 |
| yoga-pigeon-pose-or-kapotasana-a | 102 | 0 | Adoucie | 65.800 | 1.075 / 1.461 |
| zorbas-dance | 68 | 7 | Adoucie | 225.367 | 2.028 / 2.455 |
| yoga-yogic-sleep-pose-a | 66 | 10 | Adoucie | 58.467 | 0.218 / 0.490 |
| yoga-rajakapotasana-a | 60 | 2 | Adoucie | 43.233 | 1.008 / 0.985 |
| yoga-tortoise-pose-a | 57 | 3 | Adoucie | 61.000 | 0.118 / 0.482 |
| bachata-stefanos-v2-c3d | 55 | 0 | Adoucie | 123.700 | 1.570 / 1.294 |
| reggaeton-stefanos-c3d | 55 | 7 | Adoucie | 163.333 | 0.809 / 1.000 |
| bachata-stefanos-c3d | 34 | 3 | Adoucie | 144.200 | 1.116 / 1.195 |
| yoga-noose-pose-or-pasasana-a | 20 | 0 | Adoucie | 33.400 | 0.921 / 0.267 |
| yoga-upward-facing-two-foot-staff-pose-or-dwi-pada-viparita-dandasana-a | 10 | 0 | Adoucie | 37.267 | 0.825 / 1.218 |
| yoga-bound-angle-pose-or-baddha-konasana-d | 8 | 0 | Adoucie | 25.667 | 0.717 / 0.630 |
| basketball-shoot | 5 | 3 | Adoucie | 3.833 | 0.156 / 0.174 |
| duo-martial-arts-combat | 5 | 0 | Adoucie | 37.333 | 1.294 / 2.455 |
| yoga-side-reclining-leg-lift-pose-or-anantasana-a | 4 | 0 | Adoucie | 26.933 | 0.946 / 0.700 |
| yoga-bound-angle-pose-or-baddha-konasana-e | 3 | 0 | Adoucie | 22.600 | 0.741 / 0.542 |
| cleaning-windows | 3 | 0 | Adoucie | 47.667 | 0.590 / 0.575 |
| soccer-dribble-kick | 3 | 1 | Adoucie | 5.833 | 0.476 / 0.840 |
| duo-martial-arts-combat-b | 3 | 5 | Adoucie | 37.367 | 1.301 / 2.474 |
| yoga-random-movements-squats | 2 | 0 | Adoucie | 24.000 | 2.589 / 3.581 |
| yoga-bound-angle-pose-or-baddha-konasana-a | 2 | 0 | Adoucie | 22.833 | 0.840 / 0.688 |
| yoga-cockerel-pose-b | 2 | 0 | Adoucie | 60.733 | 0.982 / 0.874 |
| yoga-cow-face-pose-or-gomukhasana-a | 2 | 0 | Adoucie | 30.600 | 1.044 / 0.774 |
| yoga-heron-pose-or-krounchasana-a | 2 | 0 | Adoucie | 25.200 | 1.039 / 0.592 |
| yoga-side-crane-crow-pose-or-parsva-bakasana-a | 2 | 0 | Adoucie | 22.900 | 0.846 / 0.661 |
| conversation-gestures | 2 | 0 | Adoucie | 50.700 | 0.422 / 0.795 |
| yoga-eagle-pose-or-garudasana-a | 1 | 0 | Adoucie | 25.267 | 0.891 / 0.264 |
| yoga-extended-revolved-side-angle-pose-or-utthita-parsvakonasana-a | 1 | 0 | Adoucie | 18.167 | 0.837 / 0.980 |
| lie-down-bed | 1 | 0 | Adoucie | 7.867 | 0.117 / 0.419 |
| clap-sync-duo | 1 | 0 | Adoucie | 1.333 | 0.008 / 0.043 |
| dance-sync | 0 | 0 | Conservée | 5.033 | 0.271 / 0.146 |
| yoga-front-back-walking | 0 | 0 | Conservée | 14.333 | 0.875 / 1.213 |
| yoga-circle-around | 0 | 0 | Conservée | 14.433 | 2.573 / 3.924 |
| yoga-random-movements-jumps | 0 | 0 | Conservée | 13.633 | 0.748 / 3.481 |
| yoga-akarna-dhanurasana-a | 0 | 0 | Conservée | 20.733 | 0.890 / 0.529 |
| yoga-akarna-dhanurasana-b | 0 | 0 | Conservée | 19.767 | 0.865 / 0.483 |
| yoga-akarna-dhanurasana-c | 0 | 0 | Conservée | 19.800 | 0.852 / 0.595 |
| yoga-bharadvajas-twist-pose-or-bharadvajasana-i-a | 0 | 0 | Conservée | 36.567 | 1.031 / 0.465 |
| yoga-bharadvajas-twist-pose-or-bharadvajasana-i-b | 0 | 0 | Conservée | 24.733 | 1.158 / 0.563 |
| yoga-bharadvajas-twist-pose-or-bharadvajasana-i-c | 0 | 0 | Conservée | 24.333 | 0.773 / 0.845 |
| yoga-boat-pose-or-paripurna-navasana-a | 0 | 0 | Conservée | 12.200 | 0.858 / 0.777 |
| yoga-boat-pose-or-paripurna-navasana-b | 0 | 0 | Conservée | 14.067 | 0.675 / 0.848 |
| yoga-boat-pose-or-paripurna-navasana-c | 0 | 0 | Conservée | 14.000 | 0.794 / 0.745 |
| yoga-boat-pose-or-paripurna-navasana-d | 0 | 0 | Conservée | 11.667 | 0.834 / 0.765 |
| yoga-boat-pose-or-paripurna-navasana-e | 0 | 0 | Conservée | 15.900 | 0.783 / 0.751 |
| yoga-boat-pose-or-paripurna-navasana-f | 0 | 0 | Conservée | 13.433 | 0.714 / 0.663 |
| yoga-bound-angle-pose-or-baddha-konasana-b | 0 | 0 | Conservée | 25.467 | 0.774 / 0.579 |
| yoga-bound-angle-pose-or-baddha-konasana-c | 0 | 0 | Conservée | 20.200 | 0.804 / 0.667 |
| yoga-bound-angle-pose-or-baddha-konasana-f | 0 | 0 | Conservée | 13.933 | 0.836 / 0.546 |
| yoga-bound-angle-pose-or-baddha-konasana-g | 0 | 0 | Conservée | 15.900 | 0.886 / 0.359 |
| yoga-bow-pose-or-dhanurasana-a | 0 | 0 | Conservée | 20.600 | 0.915 / 0.734 |
| yoga-bow-pose-or-dhanurasana-b | 0 | 0 | Conservée | 20.167 | 0.884 / 0.808 |
| yoga-bridge-pose-or-setu-bandha-sarvangasana-a | 0 | 0 | Conservée | 27.233 | 0.937 / 0.923 |
| yoga-bridge-pose-or-setu-bandha-sarvangasana-b | 0 | 0 | Conservée | 26.200 | 0.934 / 0.986 |
| yoga-bridge-pose-or-setu-bandha-sarvangasana-c | 0 | 0 | Conservée | 23.600 | 0.857 / 0.960 |
| yoga-bridge-pose-or-setu-bandha-sarvangasana-d | 0 | 0 | Conservée | 29.867 | 1.008 / 1.025 |
| yoga-bridge-pose-or-setu-bandha-sarvangasana-e | 0 | 0 | Conservée | 33.733 | 1.011 / 0.829 |
| yoga-camel-pose-or-ustrasana-a | 0 | 0 | Conservée | 25.467 | 0.982 / 1.105 |
| yoga-camel-pose-or-ustrasana-b | 0 | 0 | Conservée | 22.667 | 0.926 / 1.097 |
| yoga-camel-pose-or-ustrasana-c | 0 | 0 | Conservée | 22.733 | 0.839 / 1.142 |
| yoga-camel-pose-or-ustrasana-d | 0 | 0 | Conservée | 27.200 | 0.971 / 1.012 |
| yoga-cat-cow-pose-or-marjaryasana-a | 0 | 0 | Conservée | 15.900 | 0.818 / 0.752 |
| yoga-cat-cow-pose-or-marjaryasana-b | 0 | 0 | Conservée | 16.067 | 0.856 / 0.803 |
| yoga-cat-cow-pose-or-marjaryasana-c | 0 | 0 | Conservée | 21.833 | 0.788 / 0.823 |
| yoga-chair-pose-or-utkatasana-a | 0 | 0 | Conservée | 14.400 | 0.845 / 0.280 |
| yoga-chair-pose-or-utkatasana-b | 0 | 0 | Conservée | 18.800 | 0.839 / 0.492 |
| yoga-chair-pose-or-utkatasana-c | 0 | 0 | Conservée | 18.133 | 0.838 / 0.363 |
| yoga-child-pose-or-balasana-a | 0 | 0 | Conservée | 21.600 | 0.834 / 0.688 |
| yoga-child-pose-or-balasana-b | 0 | 0 | Conservée | 16.633 | 0.867 / 0.747 |
| yoga-cobra-pose-or-bhujangasana-a | 0 | 0 | Conservée | 21.533 | 0.892 / 0.966 |
| yoga-cobra-pose-or-bhujangasana-b | 0 | 0 | Conservée | 21.433 | 0.925 / 0.985 |
| yoga-cobra-pose-or-bhujangasana-c | 0 | 0 | Conservée | 18.333 | 0.873 / 0.716 |
| yoga-cobra-pose-or-bhujangasana-d | 0 | 0 | Conservée | 16.133 | 0.755 / 1.047 |
| yoga-corpse-pose-or-savasana-a | 0 | 0 | Conservée | 21.233 | 0.851 / 0.761 |
| yoga-cow-face-pose-or-gomukhasana-b | 0 | 0 | Conservée | 20.067 | 0.975 / 0.905 |
| yoga-cow-face-pose-or-gomukhasana-c | 0 | 0 | Conservée | 26.600 | 0.970 / 0.711 |
| yoga-crane-crow-pose-or-bakasana-a | 0 | 0 | Conservée | 25.400 | 0.809 / 0.618 |
| yoga-crane-crow-pose-or-bakasana-b | 0 | 0 | Conservée | 17.333 | 0.879 / 0.624 |
| yoga-dolphin-plank-pose-or-makara-adho-mukha-svanasana-a | 0 | 0 | Conservée | 17.900 | 0.935 / 0.923 |
| yoga-downward-facing-dog-pose-or-adho-mukha-svanasana-c | 0 | 0 | Conservée | 18.333 | 0.867 / 0.716 |
| yoga-eight-angle-pose-or-astavakrasana-a | 0 | 0 | Conservée | 15.667 | 0.766 / 0.798 |
| yoga-extended-puppy-pose-or-uttana-shishosana-a | 0 | 0 | Conservée | 23.733 | 0.863 / 0.694 |
| yoga-extended-revolved-side-angle-pose-or-utthita-parsvakonasana-b | 0 | 0 | Conservée | 20.433 | 0.836 / 0.963 |
| yoga-extended-revolved-side-angle-pose-or-utthita-parsvakonasana-c | 0 | 0 | Conservée | 17.533 | 0.931 / 0.780 |
| yoga-extended-revolved-side-angle-pose-or-utthita-parsvakonasana-d | 0 | 0 | Conservée | 31.267 | 0.898 / 0.930 |
| yoga-extended-revolved-side-angle-pose-or-utthita-parsvakonasana-e | 0 | 0 | Conservée | 23.633 | 0.908 / 0.983 |
| yoga-extended-revolved-triangle-pose-or-utthita-trikonasana-a | 0 | 0 | Conservée | 25.700 | 0.886 / 0.729 |
| yoga-extended-revolved-triangle-pose-or-utthita-trikonasana-b | 0 | 0 | Conservée | 22.100 | 0.865 / 0.625 |
| yoga-feathered-peacock-pose-or-pincha-mayurasana-a | 0 | 0 | Conservée | 35.133 | 0.956 / 0.654 |
| yoga-feathered-peacock-pose-or-pincha-mayurasana-b | 0 | 0 | Conservée | 34.500 | 0.876 / 0.689 |
| yoga-firefly-pose-or-tittibhasana-a | 0 | 0 | Conservée | 18.900 | 0.897 / 0.432 |
| yoga-fish-pose-or-matsyasana-a | 0 | 0 | Conservée | 38.500 | 1.035 / 1.187 |
| yoga-four-limbed-staff-pose-or-chaturanga-dandasana-a | 0 | 0 | Conservée | 16.400 | 0.979 / 0.858 |
| yoga-frog-pose-or-bhekasana-a | 0 | 0 | Conservée | 24.533 | 0.927 / 0.823 |
| yoga-garland-pose-or-malasana-a | 0 | 0 | Conservée | 12.167 | 1.085 / 0.663 |
| yoga-gate-pose-or-parighasana-a | 0 | 0 | Conservée | 19.867 | 0.959 / 0.382 |
| yoga-half-lord-of-the-fishes-pose-or-ardha-matsyendrasana-a | 0 | 0 | Conservée | 20.767 | 0.896 / 0.701 |
| yoga-half-moon-pose-or-ardha-chandrasana-a | 0 | 0 | Conservée | 22.133 | 0.832 / 0.421 |
| yoga-handstand-pose-or-adho-mukha-vrksasana-a | 0 | 0 | Conservée | 48.200 | 0.163 / 1.041 |
| yoga-happy-baby-pose-or-ananda-balasana-a | 0 | 0 | Conservée | 19.133 | 0.919 / 1.126 |
| yoga-head-to-knee-forward-bend-pose-or-janu-sirsasana-a | 0 | 0 | Conservée | 22.200 | 0.767 / 0.324 |
| yoga-intense-side-stretch-pose-or-parsvottanasana-a | 0 | 0 | Conservée | 17.533 | 0.838 / 0.409 |
| yoga-legs-up-the-wall-pose-or-viparita-karani-a | 0 | 0 | Conservée | 20.133 | 0.967 / 0.882 |
| yoga-locust-pose-or-salabhasana-a | 0 | 0 | Conservée | 15.733 | 0.952 / 0.732 |
| yoga-lord-of-the-dance-pose-or-natarajasana-a | 0 | 0 | Conservée | 24.667 | 0.882 / 0.585 |
| yoga-low-lunge-pose-or-anjaneyasana-a | 0 | 0 | Conservée | 21.867 | 0.940 / 0.983 |
| yoga-peacock-pose-or-mayurasana-a | 0 | 0 | Conservée | 33.000 | 0.871 / 0.806 |
| yoga-plank-pose-or-kumbhakasana-a | 0 | 0 | Conservée | 14.300 | 0.967 / 0.737 |
| yoga-plow-pose-or-halasana-a | 0 | 0 | Conservée | 27.933 | 1.135 / 1.950 |
| yoga-pose-dedicated-to-the-sage-koundinya-or-eka-pada-koundinyanasana-i-and-ii-a | 0 | 0 | Conservée | 32.133 | 0.930 / 1.278 |
| yoga-reclining-hand-to-big-toe-pose-or-supta-padangusthasana-a | 0 | 0 | Conservée | 23.400 | 0.993 / 0.941 |
| yoga-revolved-head-to-knee-pose-or-parivrtta-janu-sirsasana-a | 0 | 0 | Conservée | 24.933 | 0.711 / 0.421 |
| yoga-scale-pose-or-tolasana-a | 0 | 0 | Conservée | 28.933 | 0.805 / 0.394 |
| yoga-scorpion-pose-or-vrischikasana-a | 0 | 0 | Conservée | 43.267 | 0.844 / 0.647 |
| yoga-seated-forward-bend-pose-or-paschimottanasana-a | 0 | 0 | Conservée | 18.800 | 0.902 / 0.536 |
| yoga-shoulder-pressing-pose-or-bhujapidasana-a | 0 | 0 | Conservée | 18.333 | 0.938 / 0.587 |
| yoga-side-plank-pose-or-vasisthasana-a | 0 | 0 | Conservée | 19.133 | 0.982 / 0.885 |
| yoga-sitting-pose-1-normal-a | 0 | 0 | Conservée | 15.200 | 0.781 / 0.450 |
| yoga-split-pose-a | 0 | 0 | Conservée | 39.433 | 1.040 / 1.014 |
| yoga-staff-pose-or-dandasana-a | 0 | 0 | Conservée | 21.033 | 0.778 / 0.478 |
| yoga-standing-big-toe-hold-pose-or-utthita-padangusthasana-a | 0 | 0 | Conservée | 27.333 | 0.891 / 0.399 |
| yoga-standing-forward-bend-pose-or-uttanasana-a | 0 | 0 | Conservée | 16.433 | 0.794 / 0.518 |
| yoga-standing-split-pose-or-urdhva-prasarita-eka-padasana-a | 0 | 0 | Conservée | 15.667 | 0.822 / 0.682 |
| yoga-supported-headstand-pose-or-salamba-sirsasana-a | 0 | 0 | Conservée | 26.733 | 1.080 / 1.323 |
| yoga-supported-shoulderstand-pose-or-salamba-sarvangasana-a | 0 | 0 | Conservée | 25.000 | 0.962 / 1.171 |
| yoga-supta-baddha-konasana-a | 0 | 0 | Conservée | 24.400 | 1.064 / 1.008 |
| yoga-supta-virasana-vajrasana-a | 0 | 0 | Conservée | 28.000 | 1.094 / 1.077 |
| yoga-tree-pose-or-vrksasana-a | 0 | 0 | Conservée | 19.133 | 0.849 / 0.556 |
| yoga-upward-bow-wheel-pose-or-urdhva-dhanurasana-a | 0 | 0 | Conservée | 27.100 | 0.930 / 1.108 |
| yoga-upward-plank-pose-or-purvottanasana-a | 0 | 0 | Conservée | 23.767 | 0.785 / 0.687 |
| yoga-viparita-virabhadrasana-or-reverse-warrior-pose-a | 0 | 0 | Conservée | 22.267 | 0.863 / 1.041 |
| yoga-virasana-or-vajrasana-a | 0 | 0 | Conservée | 18.833 | 0.835 / 0.974 |
| yoga-warrior-i-pose-or-virabhadrasana-i-a | 0 | 0 | Conservée | 20.267 | 0.919 / 0.891 |
| yoga-warrior-ii-pose-or-virabhadrasana-ii-a | 0 | 0 | Conservée | 19.133 | 0.856 / 0.828 |
| yoga-warrior-iii-pose-or-virabhadrasana-iii-a | 0 | 0 | Conservée | 19.067 | 0.777 / 0.454 |
| yoga-wide-angle-seated-forward-bend-pose-or-upavistha-konasana-a | 0 | 0 | Conservée | 32.000 | 0.916 / 0.725 |
| yoga-wide-legged-forward-bend-pose-or-prasarita-padottanasana-a | 0 | 0 | Conservée | 26.833 | 1.155 / 0.713 |
| yoga-wild-thing-pose-or-camatkarasana-a | 0 | 0 | Conservée | 25.467 | 1.123 / 0.798 |
| yoga-wind-relieving-pose-or-pawanmuktasana-a | 0 | 0 | Conservée | 18.167 | 0.922 / 1.192 |
| vacuuming | 0 | 0 | Conservée | 17.800 | 0.250 / 0.275 |
| vacuuming-alt | 0 | 0 | Conservée | 24.800 | 0.096 / 0.087 |
| wiping-table | 0 | 0 | Conservée | 6.667 | 0.057 / 0.031 |
| wiping-table-small-circles | 0 | 0 | Conservée | 8.267 | 0.007 / 0.007 |
| taking-shower | 0 | 0 | Conservée | 4.800 | 0.103 / 0.254 |
| washing-body | 0 | 0 | Conservée | 79.300 | 1.166 / 1.843 |
| pickup-box-floor-male | 0 | 0 | Conservée | 4.467 | 0.045 / 0.212 |
| pickup-box-floor-female | 0 | 0 | Conservée | 5.967 | 0.048 / 0.217 |
| lift-box-male | 0 | 0 | Conservée | 4.400 | 0.007 / 0.049 |
| lift-box-female | 0 | 0 | Conservée | 8.367 | 0.053 / 0.258 |
| putdown-box-floor | 0 | 0 | Conservée | 2.400 | 0.021 / 0.203 |
| sweeping-floor | 0 | 0 | Conservée | 33.467 | 0.671 / 1.510 |
| drinking-glass | 0 | 0 | Conservée | 8.733 | 0.060 / 0.226 |
| holding-cup | 0 | 0 | Conservée | 2.900 | 0.141 / 0.307 |
| cooking-stir-pan | 0 | 0 | Conservée | 9.300 | 0.079 / 0.223 |
| cutting-knife | 0 | 0 | Conservée | 8.267 | 0.256 / 0.230 |
| pouring-bottle | 0 | 0 | Conservée | 9.000 | 0.031 / 0.057 |
| stirring-bowl | 0 | 0 | Conservée | 7.400 | 0.063 / 0.097 |
| washing-dishes-sink | 0 | 0 | Conservée | 1.800 | 0.112 / 0.406 |
| take-book-shelf | 0 | 0 | Conservée | 3.167 | 0.017 / 0.022 |
| playing-guitar | 0 | 0 | Conservée | 5.633 | 0.016 / 0.012 |
| dry-head-towel | 0 | 0 | Conservée | 10.900 | 0.450 / 0.237 |
| groom-hair-mirror | 0 | 0 | Conservée | 2.967 | 0.011 / 0.021 |
| take-off-tshirt | 0 | 0 | Conservée | 4.133 | 0.010 / 0.013 |
| get-up-bed | 0 | 0 | Conservée | 5.633 | 0.198 / 1.192 |
| basketball-cmu | 0 | 0 | Conservée | 8.233 | 0.275 / 4.966 |
| soccer-kick | 0 | 0 | Conservée | 13.333 | 0.611 / 1.929 |
| yoga-cow-face-pose-or-gomukhasana-e | 0 | 0 | Conservée | 21.933 | 1.109 / 0.697 |

## Cadence de la prise combat B

La prise B, ajoutée après la baseline, utilisait `playback_fps = fps / 2` dans `temp_convert_61.py`. Ses temps sont divisés par deux pour rétablir le tempo natif (environ 37,37 s au lieu de 74,73 s), sans modifier ses valeurs de mouvement. L’exporteur utilise désormais `fps` directement.

## Autres prises Olivia locales (sources NPZ)

Les sources sont évaluées sur les 22 articulations SMPL, à 30 Hz depuis leur cadence native. Ce scan ne garantit pas le rendu du retargeting ; les prises non intégrées ne sont pas ajoutées automatiquement.

| Source | Sauts | Durée (s) |
|---|---:|---:|
| Olivia_Annoyed_C3D_poses.npz | 777 | 94.458 |
| Olivia_Bored_C3D_poses.npz | 58 | 95.958 |
| Olivia_Excited_C3D_poses.npz | 499 | 93.192 |
| Olivia_Happy_C3D_poses.npz | 583 | 90.692 |
| Olivia_Miserable_C3D_poses.npz | 270 | 91.992 |
| Olivia_Mix_C3D_poses.npz | 0 | 0.617 |
| Olivia_Pleased_C3D_poses.npz | 422 | 96.825 |
| Olivia_Relaxed_C3D_poses.npz | 120 | 99.933 |
| Olivia_Sad_C3D_poses.npz | 484 | 95.592 |
| Olivia_Satisfied_C3D_poses.npz | 308 | 102.508 |
| Olivia_Tired_C3D_poses.npz | 95 | 95.392 |
