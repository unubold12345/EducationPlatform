"use client";
import {useEffect,useRef,useState} from "react";
import type {Object3D,Mesh,AnimationMixer,WebGLRenderer,AnimationAction,AnimationClip} from "three";
import type {EnergyRef} from "./audio";

export type AvatarMood="idle"|"listening"|"thinking"|"speaking";
export type AvatarGesture={name:"Wave"|"Yes"|"No"|"ThumbsUp";id:number}|null;

export function SpeakingAvatar({level,mood,gesture}:{level:EnergyRef;mood:AvatarMood;gesture:AvatarGesture}) {
 const host=useRef<HTMLDivElement>(null),moodRef=useRef<AvatarMood>("idle"),gestureRef=useRef<((name:string)=>void)|null>(null);
 const [status,setStatus]=useState("Loading Milo…");
 useEffect(()=>{moodRef.current=mood;},[mood]);
 useEffect(()=>{if(gesture)gestureRef.current?.(gesture.name);},[gesture]);
 useEffect(()=>{
  if(!host.current)return;const element:HTMLDivElement=host.current;
  let disposed=false,frame=0,renderer:WebGLRenderer|undefined,mixer:AnimationMixer|undefined,model:Object3D|undefined,observer:ResizeObserver|undefined;
  const meshes:Mesh[]=[];
  async function setup(){
   try {
    const [THREE,{GLTFLoader}]=await Promise.all([import("three"),import("three/addons/loaders/GLTFLoader.js")]);
    if(disposed)return;
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
    renderer.domElement.setAttribute("aria-label","Milo, an animated 3D AI speaking partner");renderer.domElement.setAttribute("role","img");element.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(30,1,.1,100);camera.position.set(0,2.05,6.4);camera.lookAt(0,1.55,0);
    scene.add(new THREE.HemisphereLight(0xe8e6ff,0x2a2650,2.6));
    const key=new THREE.DirectionalLight(0xffffff,3.6);key.position.set(3,5,4);scene.add(key);
    const rim=new THREE.DirectionalLight(0x8f7dff,5.5);rim.position.set(-3,3,-2);scene.add(rim);
    const warm=new THREE.PointLight(0xffb37a,0,6);warm.position.set(1.4,2.4,2.2);scene.add(warm);
    const floor=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.05,.06,64),new THREE.MeshStandardMaterial({color:0x2a2550,metalness:.5,roughness:.3}));floor.position.y=-.05;scene.add(floor);meshes.push(floor);
    const gltf=await new GLTFLoader().loadAsync("/characters/milo/RobotExpressive.glb");
    if(disposed){gltf.scene.traverse(object=>{if((object as Mesh).isMesh){const mesh=object as Mesh;mesh.geometry.dispose();for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])material.dispose();}});return;}
    model=gltf.scene;
    const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
    const scale=2.65/size.y;model.scale.setScalar(scale);model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);scene.add(model);
    model.traverse(object=>{if((object as Mesh).isMesh)meshes.push(object as Mesh);});
    const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
    const activeMixer=new THREE.AnimationMixer(model);mixer=activeMixer;
    const clip=(name:string)=>gltf.animations.find((c:AnimationClip)=>c.name===name);
    const idleClip=clip("Idle"),idle:AnimationAction|undefined=idleClip?activeMixer.clipAction(idleClip):undefined;idle?.play();
    let current:AnimationAction|undefined;
    gestureRef.current=(name:string)=>{
     const found=clip(name);if(!found||reduced)return;
     const action=activeMixer.clipAction(found);
     if(current&&current!==action)current.fadeOut(.2);
     action.reset();action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.setEffectiveWeight(1);action.fadeIn(.25).play();
     idle?.fadeOut(.25);current=action;
    };
    activeMixer.addEventListener("finished",event=>{if(event.action===current){current.fadeOut(.35);idle?.reset().fadeIn(.35).play();current=undefined;}});
    gestureRef.current("Wave");
    const resize=()=>{if(!renderer)return;const w=element.clientWidth,h=element.clientHeight;renderer.setSize(w,h);camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix();};
    observer=new ResizeObserver(resize);observer.observe(element);resize();
    const clock=new THREE.Clock();setStatus("");element.dataset.ready="true";
    let mouth=0,lean=0,turn=0;
    function animate(){
     if(disposed||!renderer)return;frame=requestAnimationFrame(animate);
     const delta=Math.min(clock.getDelta(),.05);if(document.hidden)return;
     const mood=moodRef.current,t=clock.elapsedTime;
     if(!reduced)mixer?.update(delta);
     const targetMouth=mood==="speaking"?Math.min(1,level.current*5):0;mouth+=(targetMouth-mouth)*Math.min(1,delta*18);
     for(const mesh of meshes){const index=mesh.morphTargetDictionary?.Surprised;if(index!==undefined&&mesh.morphTargetInfluences)mesh.morphTargetInfluences[index]=mouth*.75;}
     const targetLean=mood==="listening"?.06:mood==="thinking"?-.03:0;lean+=(targetLean-lean)*Math.min(1,delta*4);
     const targetTurn=mood==="thinking"?Math.sin(t*.9)*.18:mood==="listening"?-.08:Math.sin(t*.45)*.07;turn+=(targetTurn-turn)*Math.min(1,delta*3);
     warm.intensity+=((mood==="listening"?6:mood==="speaking"?3:0)-warm.intensity)*Math.min(1,delta*4);
     if(model&&!reduced){model.rotation.y=turn;model.rotation.x=lean;model.rotation.z=mood==="listening"?-.03:0;}
     renderer.render(scene,camera);
    }
    animate();
   }catch{if(!disposed)setStatus("3D preview is unavailable on this device. Voice and text still work.");}
  }
  void setup();
  return()=>{disposed=true;gestureRef.current=null;cancelAnimationFrame(frame);observer?.disconnect();mixer?.stopAllAction();for(const mesh of meshes){mesh.geometry.dispose();for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])material.dispose();}renderer?.dispose();renderer?.domElement.remove();};
 },[level]);
 return <div className="sl-avatar-shell"><div className="speaking-avatar" ref={host}/>{status&&<p className="sl-avatar-status" role="status">{status}</p>}</div>;
}
