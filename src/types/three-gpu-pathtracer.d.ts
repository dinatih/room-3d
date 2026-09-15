declare module 'three-gpu-pathtracer' {
  import {
    WebGLRenderer,
    Scene,
    Camera,
    PerspectiveCamera,
    Vector2,
    WebGLRenderTarget,
    Texture,
    Material,
    BufferGeometry,
    Object3D,
    Color,
  } from 'three';

  export class PhysicalCamera extends PerspectiveCamera {
    fStop: number;
    apertureBlades: number;
    apertureRotation: number;
    focusDistance: number;
    anamorphicRatio: number;
    bokehSize: number;
    getFocalLength(): number;
  }

  export class EquirectCamera extends Camera {}

  export class WebGLPathTracer {
    constructor(renderer: WebGLRenderer);
    scene: Scene;
    camera: Camera;
    bounces: number;
    transmissiveBounces: number;
    filterGlossyFactor: number;
    tiles: Vector2;
    renderDelay: number;
    fadeDuration: number;
    minSamples: number;
    dynamicLowRes: boolean;
    lowResScale: number;
    synchronizeRenderSize: boolean;
    renderScale: number;
    renderToCanvas: boolean;
    rasterizeScene: boolean;
    textureSize: Vector2;
    samples: number;
    target: WebGLRenderTarget;
    enablePathTracing: boolean;
    pausePathTracing: boolean;
    multipleImportanceSampling: boolean;

    setScene(scene: Scene, camera: Camera, options?: { onProgress?: (progress: number) => void }): void;
    setSceneAsync(scene: Scene, camera: Camera, options?: { onProgress?: (progress: number) => void }): Promise<any>;
    setCamera(camera: Camera): void;
    updateCamera(): void;
    updateMaterials(): void;
    updateLights(): void;
    updateEnvironment(): void;
    renderSample(): void;
    reset(): void;
    dispose(): void;
  }

  export class PathTracingSceneGenerator {
    constructor();
    setObjects(objects: Object3D | Object3D[]): void;
    generate(targetGeometry?: BufferGeometry): any;
    generateAsync(onProgress?: (progress: number) => void): Promise<any>;
  }

  export class BlurredEnvMapGenerator {
    constructor(renderer: WebGLRenderer);
    generate(texture: Texture, blur: number): Texture;
    dispose(): void;
  }

  export class GradientEquirectTexture {
    constructor(resolution?: number);
    exponent: number;
    topColor: Color;
    bottomColor: Color;
    update(): void;
  }
}
