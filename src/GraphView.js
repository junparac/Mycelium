import React, { useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

// 🔁 Shared time counter for animation
let time = 0;
setInterval(() => {
  time += 0.02; // Lower = slower wiggle
}, 30); // Adjust frequency (ms)

function GraphView({ nodes, links, onNoteSelect, selectedNote }) {
  const fgRef = useRef();
  
  // Track window dimensions dynamically
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth - 280, // Subtract the 280px sidebar width
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth - 280,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // When links/nodes change OR a note is selected from the list, center on it
  useEffect(() => {
    if (fgRef.current) {
      if (selectedNote) {
        // Find the node object that matches the selected file path/name
        const targetNode = nodes.find(n => n.id === selectedNote);
        if (targetNode) {
          // Smoothly pan/zoom directly to the selected node
          fgRef.current.centerAt(targetNode.x, targetNode.y, 800);
          fgRef.current.zoom(2.5, 800); // Zoom in closer to find it easily
        }
      } else {
        setTimeout(() => {
          fgRef.current.zoomToFit(400, 40);
        }, 500);
      }
    }
  }, [nodes, links, selectedNote]);

  const onNodeClick = (node) => {
    if (!node?.id || typeof node.id !== 'string') {
      console.warn('⚠️ Skipping node click: missing or invalid ID', node);
      return;
    }
    onNoteSelect(node.id);
  };

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={{ nodes, links }}
      width={dimensions.width}
      height={dimensions.height}
      backgroundColor="#001f1f" // Dark green forest floor
      onNodeClick={onNodeClick}
      linkDirectionalArrowLength={4}
      linkDirectionalArrowRelPos={1}
      linkCurvature={0.2}
      
      linkCanvasObject={(link, ctx) => {
        const source = link.source;
        const target = link.target;

        if (!source || !target || !source.x || !target.x) return;

        const sx = source.x;
        const sy = source.y;
        const tx = target.x;
        const ty = target.y;

        const phase = (source.id?.length || 0) + (target.id?.length || 0);
        const amplitude = 6;
        const frequency = 1.5;

        const mx = (sx + tx) / 2 + Math.sin(time + phase) * amplitude;
        const my = (sy + ty) / 2 + Math.cos(time + phase) * amplitude;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(mx, my, tx, ty);
        
        // If either connected node is active, make the link line brighter
        if (source.id === selectedNote || target.id === selectedNote) {
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 0.8;
        } else {
          ctx.strokeStyle = '#888';
          ctx.lineWidth = 0.3;
        }
        
        ctx.stroke();
      }}

      nodeCanvasObject={(node, ctx, globalScale) => {
        const label = node.id.split('/').pop(); // Just filename if path
        const fontSize = 14 / globalScale;
        
        // 🎯 Check if this specific node is selected
        const isSelected = node.id === selectedNote;

        ctx.save(); 

        // Glowing node customization
        ctx.beginPath();
        
        if (isSelected) {
          // Make selected node larger and color it neon orange/yellow so it pops out
          ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI); 
          ctx.fillStyle = '#ffaa00'; 
          ctx.shadowColor = '#ffaa00';
          ctx.shadowBlur = 25;
        } else {
          // Standard node layout
          ctx.arc(node.x, node.y, 2, 0, 2 * Math.PI);
          ctx.fillStyle = '#00ffff';
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 15;
        }
        ctx.fill();

        // Node label text
        if (isSelected) {
          ctx.font = `bold ${fontSize * 1.2}px monospace`;
          ctx.fillStyle = '#ffaa00';
        } else {
          ctx.font = `${fontSize}px monospace`;
          ctx.fillStyle = '#ddd';
        }
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.shadowBlur = 0; // turn off glow for text clarity
        ctx.fillText(label, node.x, node.y + (isSelected ? 7 : 4));
        ctx.restore();
      }}
    />
  );
}

export default GraphView;