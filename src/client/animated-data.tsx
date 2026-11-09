import { useEffect, useRef, useState } from 'preact/hooks';

/** Numbers may update without spatial movement; charts honour reduced motion. */
function useAnimatedValue(target:number, numeric=false){
 const ref=useRef<HTMLSpanElement>(null);
 const [value,setValue]=useState(0);
 useEffect(()=>{
  const node=ref.current;if(!node)return;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,stopped=false,started=false,began:number|undefined;
  const stop=()=>{cancelAnimationFrame(frame);frame=0;};
  const tick=(time:number)=>{
   if(stopped)return;
   if(document.visibilityState==='hidden'||document.querySelector('.startup-veil')){began=undefined;frame=requestAnimationFrame(tick);return;}
   if(preference.matches&&!numeric){setValue(target);return;}
   began??=time;
   const progress=Math.min(1,(time-began)/(preference.matches?900:2400));
   const eased=progress<.5?2*progress*progress:1-Math.pow(-2*progress+2,2)/2;
   setValue(target*eased);
   if(progress<1)frame=requestAnimationFrame(tick);
  };
  const start=()=>{if(stopped)return;stop();began=undefined;setValue(0);started=true;frame=requestAnimationFrame(tick);};
  const visible=()=>{if(document.visibilityState==='visible'&&started)start();};
  const restored=(event:PageTransitionEvent)=>{if(event.persisted)start();};
  const changed=()=>{if(started)start();};
  setValue(0);
  const observed=node.closest('.bar-pair,.garden-progress')||node;
  const observer=typeof IntersectionObserver!=='undefined'?new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&!started){observer?.disconnect();start();}},{threshold:0,rootMargin:'0px 0px -8px 0px'}):null;
  if(observer)observer.observe(observed);else start();
  document.addEventListener('visibilitychange',visible);
  window.addEventListener('pageshow',restored);
  preference.addEventListener('change',changed);
  return()=>{stopped=true;stop();observer?.disconnect();document.removeEventListener('visibilitychange',visible);window.removeEventListener('pageshow',restored);preference.removeEventListener('change',changed);};
 },[target,numeric]);
 return {ref,value};
}
export function CountUp({value,suffix='',format}:{value:number;suffix?:string;format?:(n:number)=>string}){
 const motion=useAnimatedValue(value,true);const final=format?format(value):Math.round(value)+suffix;
 return <span ref={motion.ref} class="animated-number" aria-label={final}><span aria-hidden="true">{format?format(motion.value):Math.round(motion.value)+suffix}</span></span>;
}
export function GrowingBar({percent,color,vertical=false}:{percent:number;color?:string;vertical?:boolean}){
 const motion=useAnimatedValue(Math.max(0,Math.min(100,percent)));
 return <span ref={motion.ref} class={vertical?'animated-chart-bar':'animated-progress-bar'} aria-hidden="true" style={{[vertical?'height':'width']:`${motion.value}%`,background:color}}/>;
}
export function CompletionRing({percent}:{percent:number}){
 const motion=useAnimatedValue(percent,true);
 return <span ref={motion.ref} class="momentum-ring animated-ring" style={{'--progress':`${(window.matchMedia('(prefers-reduced-motion: reduce)').matches?percent:motion.value)*3.6}deg`}} role="img" aria-label={`${Math.round(percent)}% of visits completed`}><span class="ring-center"><strong>{Math.round(motion.value)}<small>%</small></strong><span>visits complete</span></span></span>;
}
