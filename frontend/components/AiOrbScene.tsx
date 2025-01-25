import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Environment, OrbitControls } from "@react-three/drei";

export default function AIOrbScene() {
  return (
    <div className="w-full h-[200px] md:h-[250px]">
      <Canvas camera={{ position: [0, 0, 2] }}>
        <ambientLight intensity={0.1} />
        <directionalLight position={[3, 3, 5]} intensity={0.3} />
        <pointLight position={[-5, -5, -5]} intensity={0.1} color="#ffffff" />
        <AIOrbMesh />
        <Environment preset="studio" />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />
      </Canvas>
    </div>
  );
}

function AIOrbMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Custom shader material for the morphing effect
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: {
          value: new THREE.Color(
            0x4a9eff // Bright blue for dark mode
          ),
        },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float time;
        
        //	Simplex 3D Noise by Ian McEwan
        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
        
        float snoise(vec3 v){ 
          const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
          
          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 =   v - i + dot(i, C.xxx) ;
          
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );
          
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          
          i = mod(i, 289.0 );
          vec4 p = permute( permute( permute( 
                    i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                  + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                  + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                  
          float n_ = 1.0/7.0;
          vec3  ns = n_ * D.wyz - D.xzx;
          
          vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
          
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_ );
          
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          
          vec4 b0 = vec4( x.xy, y.xy );
          vec4 b1 = vec4( x.zw, y.zw );
          
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
          
          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);
          
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
        }
        
          void main() {
          // Reduced noise amplitude for smoother surface
          float noise = snoise(position * 1.5 + time * 0.15) * 0.2;  
          
          // Gentler layered noise
          noise += snoise(position * 2.0 - time * 0.1) * 0.1;    
          noise += snoise(position * 3.0 + time * 0.05) * 0.05;   
          
          vec3 newPosition = position * (1.0 + noise);
          vNormal = normalize(normalMatrix * normal);
          vPosition = newPosition;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform vec3 color;
        
        void main() {
          vec3 viewDirection = normalize(-vPosition);
          
          // Softer fresnel effect
          float fresnelTerm = 1.0 - max(dot(viewDirection, vNormal), 0.0);
          fresnelTerm = pow(fresnelTerm, 3.0);  // Even softer fresnel falloff
          
          // Softer lighting
          vec3 lightDir1 = normalize(vec3(1.0, 1.0, 1.0));
          vec3 lightDir2 = normalize(vec3(-1.0, -0.5, -0.5));
          
          float diffuse1 = max(dot(vNormal, lightDir1), 0.0);
          float diffuse2 = max(dot(vNormal, lightDir2), 0.0) * 0.5;
          
          // Increased ambient for more glow
          float ao = max(0.7 + dot(vNormal, vec3(0.0, 1.0, 0.0)), 0.0);
          
          // Combine lighting effects with more ambient glow
          vec3 finalColor = color * (
            0.4 +                    // increased ambient base
            0.4 * diffuse1 +        // softer primary light
            0.2 * diffuse2 +        // softer secondary light
            0.5 * fresnelTerm +     // softer edge highlight
            0.3 * ao                // increased ambient occlusion
          );
          
          // Softer depth falloff
          float depth = length(vPosition) * 0.1;
          finalColor *= 1.0 - depth;
          
          // Add subtle glow
          finalColor += color * 0.1;
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      material.uniforms.time.value = state.clock.elapsedTime;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1; // 0.2 -> 0.1 (slower rotation)
    }
  });

  return (
    <mesh ref={meshRef} material={material}>
      <sphereGeometry args={[1, 64, 64]} />{" "}
    </mesh>
  );
}
