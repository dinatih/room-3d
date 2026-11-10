import { useGLTFClone } from '../useGLTFClone';
import { getObjectActionIds } from '../objectActions';
import { useSceneGlass } from '../utils/useSceneGlass';

export function AirPerformerRemote() {
  const { scene } = useGLTFClone('items/philips-amf870/philips-amf870-remote.glb');
  useSceneGlass(scene);
  return (
    <group userData={{ sceneItemRoot: true, skipMerge: true, itemName: 'Télécommande Air Performer', hoverAction: { label: 'Télécommande Air Performer', actions: getObjectActionIds('air-performer-remote') } }}>
      <primitive object={scene} scale={100} />
    </group>
  );
}
