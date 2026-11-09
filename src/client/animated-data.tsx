import { useEffect, useRef, useState } from 'preact/hooks';
/** Observe actual visibility so below-fold charts animate when the user reaches them. */
function useAnimatedValue(target:number){
 const ref=useRef<HTMLSpanElement>(null);const [value,setValue]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches?target:0);
 useEffect(()=>{const node=ref.current;if(!node)return;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');let frame=0,cancelled=false,started=false;let began:number|undefined;const finish=()=>{cancelAnimationFrame(frame);setValue(target);};const preference=()=>{if(reduced.matches)finish();};reduced.addEventListener('change',preference);if(reduced.matches){setValue(target);return()=>reduced.removeEventListener('change',preference);}
 setValue(0);
 const animate=(time:number)=>{if(cancelled)return;if(reduced.matches){finish();return;}if(document.querySelector('.startup-veil')){frame=requestAnimationFrame(animate);return;}began??=time;const progress=Math.min(1,(time-began)/1500);const ease=1-Math.pow(1-progress,3);setValue(target*ease);if(progress<1)frame=requestAnimationFrame(animate);};
 const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&!started){started=true;observer.disconnect();frame=requestAnimationFrame(animate);}},{threshold:.15});observer.observe(node);
 return()=>{cancelled=true;cancelAnimationFrame(frame);observer.disconnect();reduced.removeEventListener('change',preference);};
 },[target]);return {ref,value};
}
export function CountUp({value,suffix='',format}:{value:number;suffix?:string;format?:(n:number)=>string}){const motion=useAnimatedValue(value);const final=format?format(value):Math.round(value)+suffix;return <span ref={motion.ref} class="animated-number" aria-label={final}><span aria-hidden="true">{format?format(motion.value):Math.round(motion.value)+suffix}</span></span>;}
export function GrowingBar({percent,color,vertical=false}:{percent:number;color?:string;vertical?:boolean}){const motion=useAnimatedValue(Math.max(0,Math.min(100,percent)));return <span ref={motion.ref} class={vertical?'animated-chart-bar':'animated-progress-bar'} aria-hidden="true" style={{[vertical?'height':'width']:`${motion.value}%`,background:color}}/>;}
export function CompletionRing({percent}:{percent:number}){const motion=useAnimatedValue(percent);return <span ref={motion.ref} class="momentum-ring animated-ring" style={{'--progress':`${motion.value*3.6}deg`}} role="img" aria-label={`${Math.round(percent)}% of visits completed`}><span class="ring-center"><strong>{Math.round(motion.value)}<small>%</small></strong><span>visits complete</span></span></span>;}
