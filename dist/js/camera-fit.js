// A bounding sphere fits in the smaller of the horizontal/vertical view cones.
export function fitDistance(size,aspect,verticalFov=40,padding=1.15){
  const vertical=verticalFov*Math.PI/360;
  const horizontal=Math.atan(Math.tan(vertical)*Math.max(aspect,.1));
  const radius=Math.max(Math.hypot(...size)/2,.18);
  return Math.max(1.8,radius/Math.sin(Math.min(vertical,horizontal))*padding);
}
