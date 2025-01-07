// types/graph.ts
export interface NodeData {
  id: string;
  label: string;
  properties: {
    ns0__name?: string;
    [key: string]: any;
  };
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  type: string;
  properties: Record<string, any>;
}

export interface GraphData {
  nodes: NodeData[];
  edges: EdgeData[];
}

import React, { useEffect, useRef, useState } from "react";
import cytoscape, {
  Core,
  Stylesheet,
  ElementDefinition,
  LayoutOptions,
} from "cytoscape";

interface GraphVisualizationProps {
  data: GraphData;
}

const GraphVisualization: React.FC<GraphVisualizationProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Color mapping for different node types
  const nodeColors: { [key: string]: string } = {
    Resource: "#4a90e2",
    _GraphConfig: "#ff7675",
    _NsPrefDef: "#74b9ff",
  };

  // Get unique node labels for color assignment
  const getUniqueLabels = (nodes: any[]): string[] => {
    return Array.from(new Set(nodes.map((node) => node.label)));
  };

  // Dynamically generate colors for any new node types
  const generateColorMap = (labels: string[]) => {
    const colors = [
      "#4a90e2", // blue
      "#ff7675", // red
      "#74b9ff", // light blue
      "#55efc4", // mint
      "#a8e6cf", // light green
      "#ffd3b6", // peach
      "#fdcb6e", // yellow
      "#d3b6ff", // purple
      "#ff9ff3", // pink
      "#6c5ce7", // indigo
    ];

    const colorMap: { [key: string]: string } = {};
    labels.forEach((label, index) => {
      colorMap[label] = colors[index % colors.length];
    });
    return colorMap;
  };

  useEffect(() => {
    if (!containerRef.current || !data) return;

    const uniqueLabels = getUniqueLabels(data.nodes);
    const colorMap = generateColorMap(uniqueLabels);

    const elements: ElementDefinition[] = [
      ...data.nodes.map(
        (node): ElementDefinition => ({
          data: {
            id: node.id,
            label: node.label,
            name: node.properties.ns0__name || node.label,
            properties: node.properties,
            nodeType: node.label, // Add nodeType for styling
          },
          group: "nodes",
        })
      ),
      ...data.edges.map(
        (edge): ElementDefinition => ({
          data: {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: edge.type.replace("ns0__", ""),
            properties: edge.properties,
          },
          group: "edges",
        })
      ),
    ];

    const stylesheet: Stylesheet[] = [
      // Base node style
      {
        selector: "node",
        style: {
          label: "data(name)",
          "text-wrap": "wrap",
          "text-max-width": "80px",
          width: 40,
          height: 40,
          "font-size": "8px",
          "text-valign": "center",
          "text-halign": "center",
          "border-width": 1,
          "border-color": "#000",
          "text-outline-width": 2,
          "text-outline-color": "#fff",
          color: "#000",
          "font-weight": "bold",
          // padding: "10px",
          shape: "round-rectangle",
        },
      },
      // Add a style for each node type
      ...Object.entries(colorMap).map(([label, color]) => ({
        selector: `node[nodeType = "${label}"]`,
        style: {
          "background-color": color,
          "border-color": "#000",
        },
      })),
      // Edge style
      {
        selector: "edge",
        style: {
          width: 1,
          "line-color": "#000",
          "target-arrow-color": "#000",
          "target-arrow-shape": "triangle",
          "curve-style": "bezier",
          label: "data(label)",
          "font-size": "8px",
          "text-rotation": "autorotate",
          "text-background-color": "#fff",
          "text-background-opacity": 1,
          "text-background-padding": "3px",
          "text-background-shape": "roundrectangle",
          "min-zoomed-font-size": 6,
          "text-border-opacity": 1,
          "text-border-width": 1,
          "text-border-color": "#000",
          color: "#000",
        },
      },
      // Hover states
      {
        selector: "node:hover",
        style: {
          "border-width": 2,
          "border-color": "#000",
          "font-size": "10px",
        },
      },
      {
        selector: "edge:hover",
        style: {
          width: 2,
          "font-size": "10px",
          "text-background-opacity": 1,
        },
      },
    ];

    const layoutOptions: LayoutOptions = {
      name: "cose",
      animate: true,
      refresh: 20,
      fit: true,
      padding: 30,
      boundingBox: undefined,
      randomize: true,
      componentSpacing: 100,
      nodeRepulsion: () => 400000,
      nodeOverlap: 20,
      idealEdgeLength: () => 100,
      edgeElasticity: () => 100,
      nestingFactor: 1.2,
      gravity: 80,
      numIter: 1000,
      initialTemp: 200,
      coolingFactor: 0.95,
      minTemp: 1.0,
      weaver: false,
      ready: undefined,
      stop: undefined,
      nodeDimensionsIncludeLabels: true,
    };

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: stylesheet,
      layout: layoutOptions,
      wheelSensitivity: 0.2,
      minZoom: 0.1,
      maxZoom: 3,
      boxSelectionEnabled: true,
    });

    // Set white background
    containerRef.current.style.backgroundColor = "#ffffff";

    cyRef.current.on("layoutstop", () => {
      setIsLoading(false);
    });

    // Add tooltips on hover
    cyRef.current.on("mouseover", "node", (event) => {
      const node = event.target;
      const properties = node.data("properties");
      console.log("Node properties:", properties);
    });

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className="relative w-full h-screen">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
          <div className="text-lg font-semibold text-gray-700">
            Loading graph...
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full h-full border border-gray-200 rounded-lg shadow-inner bg-white"
      />
      <div className="absolute bottom-4 right-4 space-x-2">
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          onClick={() => cyRef.current?.fit()}
        >
          Fit
        </button>
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          onClick={() => cyRef.current?.center()}
        >
          Center
        </button>
      </div>
    </div>
  );
};

export default GraphVisualization;
