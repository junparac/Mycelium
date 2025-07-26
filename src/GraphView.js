import React, { useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

function GraphView({ nodes, links }) {
  const fgRef = useRef();

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400);
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
