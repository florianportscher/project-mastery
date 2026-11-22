"use client";

import "@xyflow/react/dist/style.css";
import {
  Background,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeTypes,
  type ReactFlowProps,
} from "@xyflow/react";
import { Skeleton } from "@/components/ui/skeleton";
import { ZoomControls } from "./zoom-controls";

/** The invisible ends edges attach to. */
export function Handles({ source = true }: { source?: boolean }) {
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={false}
        className="opacity-0"
      />
      {source && (
        <Handle
          type="source"
          position={Position.Right}
          isConnectable={false}
          className="opacity-0"
        />
      )}
    </>
  );
}

/**
 * The React Flow canvas of a map graph: a message when the layout failed, a
 * skeleton until the first layout, then a read-only graph with zoom
 * controls. `flow` adds the graph's own props, such as click handlers.
 */
export function FlowCanvas({
  label,
  laidOut,
  failed,
  nodes,
  edges,
  nodeTypes,
  flow,
}: {
  label: string;
  laidOut: boolean;
  failed: boolean;
  nodes: Node[];
  edges: Edge[];
  nodeTypes: NodeTypes;
  flow?: Pick<ReactFlowProps, "onNodeClick" | "onPaneClick">;
}) {
  if (failed) {
    return (
      <p
        role="alert"
        className="flex size-full min-h-96 items-center justify-center rounded-xl border p-4 text-center text-sm text-muted-foreground"
      >
        The map could not be laid out. Reload the page to try again.
      </p>
    );
  }
  if (!laidOut) {
    return (
      <Skeleton
        aria-label="Laying out the map"
        className="size-full min-h-96 rounded-xl"
      />
    );
  }
  return (
    <ReactFlow
      aria-label={label}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      fitView
      minZoom={0.1}
      proOptions={{ hideAttribution: true }}
      className="rounded-xl border"
      {...flow}
    >
      <Background />
      <ZoomControls />
    </ReactFlow>
  );
}
