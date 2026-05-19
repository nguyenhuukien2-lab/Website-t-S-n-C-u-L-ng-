import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../context/ThemeContext';
import styled from 'styled-components';

const HeroContainer = styled.div`
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: ${props => props.theme.darker};
`;

const Canvas = styled.canvas`
  width: 100%;
  height: 100%;
  display: block;
`;

const Content = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 10;
`;

const Title = styled.h1`
  font-size: 4rem;
  font-weight: 900;
  background: linear-gradient(135deg, ${props => props.theme.primary}, ${props => props.theme.secondary});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  text-shadow: 0 0 30px ${props => props.theme.glow};
  animation: slideDown 0.8s ease-out;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const Subtitle = styled.p`
  font-size: 1.3rem;
  color: ${props => props.theme.textSecondary};
  margin-top: 1rem;
  animation: slideUp 0.8s ease-out 0.2s both;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const CTAButton = styled.button`
  margin-top: 2rem;
  padding: 12px 40px;
  font-size: 1.1rem;
  background: ${props => props.theme.primary};
  color: ${props => props.theme.darker};
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px ${props => props.theme.glow};
  animation: slideUp 0.8s ease-out 0.4s both;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 0 40px ${props => props.theme.glow};
    background: ${props => props.theme.secondary};
  }
`;

export const Hero3D = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const courtRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(theme.darker);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(theme.primary, 2);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Create court geometry
    const courtGeometry = new THREE.BoxGeometry(8, 0.2, 16);
    const courtMaterial = new THREE.MeshStandardMaterial({
      color: 0x222233,
      metalness: 0.3,
      roughness: 0.7,
    });
    const court = new THREE.Mesh(courtGeometry, courtMaterial);
    scene.add(court);
    courtRef.current = court;

    // Add grid lines
    const canvas2D = document.createElement('canvas');
    canvas2D.width = 512;
    canvas2D.height = 1024;
    const ctx = canvas2D.getContext('2d');
    ctx.fillStyle = '#222233';
    ctx.fillRect(0, 0, 512, 1024);
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 2;
    
    // Court lines
    ctx.beginPath();
    ctx.moveTo(0, 512);
    ctx.lineTo(512, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 1024);
    ctx.stroke();

    // Corner markings
    for (let i = 0; i < 1024; i += 128) {
      for (let j = 0; j < 512; j += 256) {
        ctx.fillStyle = theme.primary;
        ctx.fillRect(j - 5, i - 5, 10, 10);
      }
    }

    const texture = new THREE.CanvasTexture(canvas2D);
    const courtTopMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      metalness: 0.1,
      roughness: 0.6,
      emissive: new THREE.Color(theme.primary),
      emissiveIntensity: 0.2,
    });

    court.material = courtTopMaterial;

    // Add net
    const netGeometry = new THREE.PlaneGeometry(8, 2);
    const netMaterial = new THREE.MeshStandardMaterial({
      color: theme.accent,
      metalness: 0.5,
      roughness: 0.3,
      emissive: new THREE.Color(theme.accent),
      emissiveIntensity: 0.5,
    });
    const net = new THREE.Mesh(netGeometry, netMaterial);
    net.position.y = 0.5;
    net.position.z = 0;
    scene.add(net);

    // Add shuttlecock
    const shuttlecockGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const shuttlecockMaterial = new THREE.MeshStandardMaterial({
      color: 0xff1111,
      metalness: 0.6,
      roughness: 0.2,
      emissive: 0xff1111,
      emissiveIntensity: 0.4,
    });
    const shuttlecock = new THREE.Mesh(shuttlecockGeometry, shuttlecockMaterial);
    shuttlecock.position.set(2, 2, 3);
    scene.add(shuttlecock);

    // Animation variables
    let time = 0;
    const shuttlecockTrajectory = (t) => {
      return {
        x: Math.sin(t * 0.5) * 3,
        y: 2 + Math.cos(t * 0.8) * 1.5,
        z: 3 + Math.sin(t * 0.3) * 2,
      };
    };

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    const animate = () => {
      requestAnimationFrame(animate);

      time += 0.01;

      // Rotate court
      if (court) {
        court.rotation.x += 0.0003;
        court.rotation.y += 0.0005;
      }

      if (net) {
        net.rotation.x += 0.0003;
      }

      // Animate shuttlecock
      const pos = shuttlecockTrajectory(time);
      shuttlecock.position.set(pos.x, pos.y, pos.z);
      shuttlecock.rotation.x += 0.05;
      shuttlecock.rotation.y += 0.03;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [theme]);

  return (
    <HeroContainer theme={theme}>
      <Canvas ref={canvasRef} />
      <Content>
        <Title theme={theme}>Đặt Sân Online</Title>
        <Subtitle theme={theme}>Cầu lông chuyên nghiệp, giá hợp lý</Subtitle>
        <CTAButton theme={theme}>Đặt Lịch Ngay</CTAButton>
      </Content>
    </HeroContainer>
  );
};
