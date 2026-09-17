'use client';
import { useEffect, useRef } from 'react';

export default function Shader() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' });
    if (!gl) return;
    const vert = `attribute vec2 p; void main(){gl_Position=vec4(p,0.,1.);}`;
    const frag = `precision mediump float; uniform vec2 r; uniform float t; void main(){vec2 u=gl_FragCoord.xy/r.xy; u.x*=r.x/r.y; vec2 a=vec2(.66+sin(t*.17)*.10,.68+cos(t*.13)*.09); vec2 b=vec2(1.15+cos(t*.12)*.12,.27+sin(t*.16)*.08); float w=exp(-dot(u-a,u-a)*3.3); float v=exp(-dot(u-b,u-b)*5.2); float n=sin(u.x*9.+t*.32)*sin(u.y*7.-t*.24)*.035; vec3 c=vec3(.965,.985,.978); c=mix(c,vec3(.75,.95,.83),clamp(w*.72+n,0.,1.)); c=mix(c,vec3(.78,.88,.99),clamp(v*.42,0.,1.)); gl_FragColor=vec4(c,1.);}`;
    const shader = (type: number, source: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, source); gl.compileShader(s); return s; };
    const program = gl.createProgram()!;
    gl.attachShader(program, shader(gl.VERTEX_SHADER, vert)); gl.attachShader(program, shader(gl.FRAGMENT_SHADER, frag)); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program,'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    const resolution = gl.getUniformLocation(program,'r'); const time = gl.getUniformLocation(program,'t');
    let frame = 0; let last = 0;
    const draw = (now: number) => { frame=requestAnimationFrame(draw); if(now-last<32)return; last=now; const d=Math.min(devicePixelRatio,1.5); const w=Math.round(canvas.clientWidth*d), h=Math.round(canvas.clientHeight*d); if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);} gl.uniform2f(resolution,w,h);gl.uniform1f(time,now*.001);gl.drawArrays(gl.TRIANGLE_STRIP,0,4); };
    frame=requestAnimationFrame(draw);
    const visibility = () => { if(document.hidden) cancelAnimationFrame(frame); else frame=requestAnimationFrame(draw); };
    document.addEventListener('visibilitychange',visibility);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange',visibility); gl.deleteBuffer(buffer); gl.deleteProgram(program); };
  }, []);
  return <canvas ref={ref} className="shader" aria-hidden="true" />;
}
