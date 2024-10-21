import { webSearchTool } from "../tools";

const result = await webSearchTool.execute(
  {
    query: "How to make a cake",
  },
  {}
);

console.log(result);
