// The lab accepts a narrow PCM format, never arbitrary URLs or codec containers.
export function encodeSpeechWav(samples:Float32Array) {
 const buffer=new ArrayBuffer(44+samples.length*2),view=new DataView(buffer);
 const text=(offset:number,value:string)=>{for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i));};
 text(0,"RIFF");view.setUint32(4,buffer.byteLength-8,true);text(8,"WAVE");text(12,"fmt ");view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,16000,true);view.setUint32(28,32000,true);view.setUint16(32,2,true);view.setUint16(34,16,true);text(36,"data");view.setUint32(40,samples.length*2,true);
 for(let i=0;i<samples.length;i++)view.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,samples[i]))*32767),true);
 return buffer;
}
export function decodeSpeechWav(buffer:ArrayBuffer):Float32Array|null {
 if(buffer.byteLength<8044||buffer.byteLength>3840044||(buffer.byteLength-44)%2)return null;
 const view=new DataView(buffer),text=(offset:number,n:number)=>String.fromCharCode(...new Uint8Array(buffer,offset,n));
 if(text(0,4)!=="RIFF"||text(8,4)!=="WAVE"||text(12,4)!=="fmt "||text(36,4)!=="data"||view.getUint32(4,true)!==buffer.byteLength-8||view.getUint32(16,true)!==16||view.getUint16(20,true)!==1||view.getUint16(22,true)!==1||view.getUint32(24,true)!==16000||view.getUint32(28,true)!==32000||view.getUint16(32,true)!==2||view.getUint16(34,true)!==16||view.getUint32(40,true)!==buffer.byteLength-44)return null;
 const samples=new Float32Array((buffer.byteLength-44)/2);for(let i=0;i<samples.length;i++)samples[i]=view.getInt16(44+i*2,true)/32768;return samples;
}
