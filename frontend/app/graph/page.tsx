"use client";

import GraphVisualization, { GraphData } from "@/components/GraphViewer";
import { useEffect, useState } from "react";

const GraphPage: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/graph`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch graph data");
        }
        const data = await response.json();
        console.log("Fetched graph data:", data);
        setGraphData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching graph data:", err);
      }
    };

    fetchData();
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!graphData) {
    return <div>Loading...</div>;
  }

  return <GraphVisualization data={graphData} />;
};

export default GraphPage;
