'use client';
import {useEffect,useRef} from 'react';
export function Reveal(){const ref=useRef(false);useEffect(()=>{if(ref.current)return;ref.current=true;if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const elements=document.querySelectorAll('[data-reveal]');const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('revealed');observer.unobserve(entry.target)}}),{threshold:0.08});elements.forEach(el=>{el.classList.add('reveal-ready');observer.observe(el)});return()=>observer.disconnect()},[]);return null}
