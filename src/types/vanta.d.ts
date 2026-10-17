declare module "vanta/dist/vanta.net.min" {
  type VantaNetOptions = {
    el: HTMLElement;
    THREE: unknown;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    scaleMobile?: number;
    color?: number;
    backgroundColor?: number;
    backgroundAlpha?: number;
    points?: number;
    maxDistance?: number;
    spacing?: number;
    showDots?: boolean;
  };
  const NET: (options: VantaNetOptions) => {
    destroy: () => void;
    setOptions?: (o: Record<string, unknown>) => void;
  };
  export default NET;
}
