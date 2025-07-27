// GraphView.js

import React, { useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

function GraphView({ nodes, links }) {
  const fgRef = useRef();

  useEffect(() => {
    if (fgRef.current) {
      setTimeout(() => {
        fgRef.current.zoomToFit(400, 40); // Smooth zoom after layout
      }, 500); // Let layout settle a bit
    }
  }, [nodes, links]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
       <ForceGraph2D
        ref={fgRef}
        graphData={{ nodes, links }}
        nodeAutoColorBy="id"
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        onNodeClick={(node) => {
          console.log('Clicked node:', node); // 👈 Replace this with your logic

          // Example: alert or open note
          alert(`You clicked: ${node.id}`);
          // You can also call a prop function here to open the note in your main editor
          // e.g., onNoteSelect(node.id)
        }}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.id;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.fillStyle = 'black';
          ctx.fillText(label, node.x + 6, node.y + 6);
        }}
      />
    </div>
  );
}

export default GraphView;
