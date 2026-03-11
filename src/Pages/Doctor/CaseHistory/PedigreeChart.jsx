import React, { useMemo, useEffect } from "react";
import ReactFlow, { Background, Controls, Handle, Position, useNodesState, useEdgesState } from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";

const nodeWidth = 70;
const nodeHeight = 90;

const PedigreeNode = ({ data }) => {
  const { label, gender, affected, alive, isMarriage, isAnchor, type } = data;
  
  if (isMarriage) {
    return (
      <div className="w-2 h-2 rounded-full bg-gray-500 relative mt-4">
        <Handle type="target" position={Position.Top} id="top" style={{ opacity: 0 }} />
        <Handle type="target" position={Position.Left} id="left" style={{ opacity: 0 }} />
        <Handle type="target" position={Position.Right} id="right" style={{ opacity: 0 }} />
        <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: 0 }} />
      </div>
    );
  }

  if (isAnchor) {
    return (
      <div className="w-1 h-1 relative">
        <Handle type="target" position={Position.Top} id="top" style={{ opacity: 0 }} />
        <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: 0 }} />
      </div>
    );
  }

  if (type === "miscarriage") {
    return (
      <div className="flex flex-col items-center w-[70px]">
        <Handle type="target" position={Position.Top} id="top" style={{ opacity: 0 }} />
        <div className="flex justify-center w-full relative z-10 my-2">
          <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[20px] border-b-slate-700"></div>
          {!alive && (
            <div className="absolute w-[2px] h-[30px] bg-slate-800 -rotate-45" style={{ top: -5 }} />
          )}
        </div>
        <div className="text-[10px] mt-2 font-medium text-center leading-tight truncate w-full text-slate-600 bg-white/80 p-0.5 rounded">
          {label}
        </div>
        <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: 0 }} />
        <Handle type="source" position={Position.Left} id="left" style={{ top: 24, opacity: 0 }} />
        <Handle type="source" position={Position.Right} id="right" style={{ top: 24, opacity: 0 }} />
      </div>
    );
  }

  const isStillbirth = type === "stillbirth";
  const isPregnancy = type === "pregnancy";

  const sizeClass = isStillbirth ? "w-6 h-6 border" : "w-12 h-12 border-2";
  const baseClasses = `flex items-center justify-center border-slate-700 ${sizeClass} relative overflow-hidden shrink-0`;
  const affectedClasses = affected ? "bg-slate-700 text-white" : "bg-white text-slate-700";
  
  let shapeClasses = "";
  if (gender === "male") shapeClasses = "";
  else if (gender === "female") shapeClasses = "rounded-full";
  else shapeClasses = "transform rotate-45"; // Diamond

  return (
    <div className="flex flex-col items-center w-[70px]">
      <Handle type="target" position={Position.Top} id="top" style={{ opacity: 0 }} />
      <div className="flex justify-center w-full relative z-10">
        <div className={`${baseClasses} ${shapeClasses} ${affectedClasses}`}>
          {isPregnancy && <span className={gender === "unknown" ? "-rotate-45 text-xs font-bold" : "text-xs font-bold"}>P</span>}
          {isStillbirth && <span className={gender === "unknown" ? "-rotate-45 text-[10px]" : "text-[10px]"}>SB</span>}
          {!alive && (
            <div className="absolute w-[150%] h-[2px] bg-slate-800 -rotate-45" style={{ top: '50%', left: '-25%' }} />
          )}
        </div>
      </div>
      <div className="text-[10px] mt-2 font-medium text-center leading-tight truncate w-full text-slate-600 bg-white/80 p-0.5 rounded">
        {label}
      </div>
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Left} id="left" style={{ top: 24, opacity: 0 }} />
      <Handle type="source" position={Position.Right} id="right" style={{ top: 24, opacity: 0 }} />
    </div>
  );
};

const nodeTypes = { pedigree: PedigreeNode };

const getLayoutedElements = (nodes, edges, direction = "TB") => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 40, ranksep: 60 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: "top",
      sourcePosition: "bottom",
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
      style: { opacity: 1 },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export default function PedigreeChart({ members, hierarchy, consanguineous }) {
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes = [];
    const edges = [];
    
    // Build explicit nodes
    members.forEach((m) => {
      nodes.push({
        id: m.id,
        type: "pedigree",
        data: {
          label: m.name || m.relation_to_patient || "Unknown",
          gender: m.gender,
          affected: m.affected,
          alive: m.alive,
          type: m.type,
          twin_status: m.twin_status,
        },
        position: { x: 0, y: 0 },
        style: { opacity: 0 },
      });
    });

    const parents = hierarchy["Parents"] || [];
    const patientAndSiblings = [...(hierarchy["Patient"] || []), ...(hierarchy["Siblings"] || [])];
    
    if (parents.length > 0 && patientAndSiblings.length > 0) {
      const marriageId = "marriage_parents";
      nodes.push({
        id: marriageId,
        type: "pedigree",
        data: { isMarriage: true },
        position: { x: 0, y: 0 },
        style: { opacity: 0 },
      });
      
      const isConsang = consanguineous === "Yes";
      const edgeStyle = isConsang ? { strokeWidth: 3, stroke: "#333" } : { strokeWidth: 1.5, stroke: "#555" };

      // Parent to Marriage
      parents.forEach(p => {
        edges.push({
          id: `edge_${p.id}_${marriageId}`,
          source: p.id,
          target: marriageId,
          type: "step",
          style: edgeStyle,
          sourceHandle: p.gender === "male" ? "right" : "left", 
          targetHandle: p.gender === "male" ? "left" : "right",
        });
      });

      // Filter twins vs non-twins
      const twins = patientAndSiblings.filter(c => c.twin_status && c.twin_status !== "none");
      const nonTwins = patientAndSiblings.filter(c => !c.twin_status || c.twin_status === "none");

      if (twins.length > 0) {
        const twinAnchorId = `twin_anchor_${marriageId}`;
        nodes.push({
          id: twinAnchorId,
          type: "pedigree",
          data: { isAnchor: true },
          position: { x: 0, y: 0 },
          style: { opacity: 0 }
        });

        // Drop short line from marriage to twin anchor
        edges.push({
          id: `edge_${marriageId}_${twinAnchorId}`,
          source: marriageId,
          target: twinAnchorId,
          type: "straight",
          style: { strokeWidth: 1.5, stroke: "#555" },
          sourceHandle: "bottom",
          targetHandle: "top"
        });

        twins.forEach((t) => {
          edges.push({
            id: `edge_${twinAnchorId}_${t.id}`,
            source: twinAnchorId,
            target: t.id,
            type: "straight", // slants to form ^ shape naturally
            style: { strokeWidth: 1.5, stroke: "#555" },
            sourceHandle: "bottom",
            targetHandle: "top"
          });
        });

        // Horizontal connecting line for identical twins
        const identicals = twins.filter(t => t.twin_status === "identical");
        if (identicals.length >= 2) {
          edges.push({
            id: `edge_ident_${identicals[0].id}_${identicals[1].id}`,
            source: identicals[0].id,
            target: identicals[1].id,
            type: "straight",
            style: { strokeWidth: 1.5, stroke: "#555" },
            sourceHandle: "right",
            targetHandle: "left"
          });
        }
      }

      nonTwins.forEach(c => {
        edges.push({
          id: `edge_${marriageId}_${c.id}`,
          source: marriageId,
          target: c.id,
          type: "step",
          style: { strokeWidth: 1.5, stroke: "#555" },
          sourceHandle: "bottom",
          targetHandle: "top",
        });
      });
    }

    const gens = [
      hierarchy["Great grandparents"] || [],
      hierarchy["Grandparents"] || [],
      hierarchy["Parents"] || [],
      [...(hierarchy["Patient"] || []), ...(hierarchy["Siblings"] || []), ...(hierarchy["Cousins"] || [])],
    ];

    for (let i = 0; i < gens.length - 1; i++) {
        if (gens[i].length > 0 && gens[i+1].length > 0) {
           const gp = gens[i][0];
           const p = gens[i+1][0];
           if (!edges.some(e => e.source === gp.id || e.target === p.id)) {
               edges.push({
                   id: `inv_${gp.id}_${p.id}`,
                   source: gp.id,
                   target: p.id,
                   style: { strokeOpacity: 0 },
                   type: 'straight'
               });
           }
        }
    }

    return getLayoutedElements(nodes, edges);
  }, [members, hierarchy, consanguineous]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  if (members.length === 0) {
    return (
      <div className="h-[300px] w-full bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
        <p className="text-slate-400 font-medium">Add family members to see pedigree tree</p>
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full border border-slate-200 rounded-lg bg-slate-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-right"
      >
        <Background color="#ccc" gap={16} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
