/** How much falling snow a shot gets: none indoors (03 shows its snow inside the window instead), heavy over the
 *  tower shots, light elsewhere outdoors. */
export const snowDensity = (shot: {indoor?: boolean; towerStage?: number | null}) => shot.indoor ? 0 : shot.towerStage != null ? 1 : 0.25;
