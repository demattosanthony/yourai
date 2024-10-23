// Convert a PDF to a rdf graph.

import { generateText } from "ai";
import { getDocument } from "pdfjs-dist";
import { MODELS } from "./models";
import neo4j from "neo4j-driver";

export const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic("neo4j", process.env.NEO4J_PASSWORD || "neo4j-password")
);

export async function readPdf(filePath: Uint8Array): Promise<string> {
  // Load the PDF document
  const loadingTask = getDocument(filePath);
  const pdf = await loadingTask.promise;

  let textContent = "";

  // Iterate through each page
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const textContentObj = await page.getTextContent();

    // Extract text from the page
    const pageText = textContentObj.items
      .map((item) => (item as any).str || "")
      .join(" ");
    textContent += `Page ${pageNumber}:\n${pageText}\n\n`;
  }

  return textContent;
}

export async function convertContentToTurtle(content: string): Promise<string> {
  console.log("Length of pdfContents:", content.length);

  // Generate graph from the contents:

  const { text } = await generateText({
    model: MODELS["claude-3.5-sonnet"].model,
    messages: [
      {
        role: "user",
        content: `You are an AI assistant specialized in analyzing building information and generating RDF graphs using the COBie (Construction Operations Building Information Exchange) ontology. Your task is to process the contents of a PDF file and create an RDF graph in Turtle (.ttl) format.

Here are the contents of the PDF file you need to analyze:

<pdf_contents>
${content.slice(0, 150000)}
</pdf_contents>

Please follow these steps to complete the task:

1. Analyze the PDF contents thoroughly, identifying information relevant to the COBie ontology. This may include data about building components, systems, spaces, and related attributes.

2. Extract and correlate the relevant information to build a comprehensive knowledge graph.

3. Generate RDF triples using the COBie ontology to represent the extracted information.

4. Format the RDF triples in Turtle (.ttl) syntax.

Before providing the final output, wrap your thought process in <cobie_analysis> tags. In your analysis:
- List key building components, systems, and spaces identified in the PDF.
- Match these elements with relevant COBie ontology classes and properties.
- Outline a basic structure for the RDF graph, including main nodes and their relationships.

After your analysis, provide the RDF graph in Turtle (.ttl) format. Wrap the output in <rdf_graph> tags. 

Here's a brief example of the expected Turtle format (only put the actual RDF graph in this section):

@prefix cob: <http://cobie.org/ontology#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

cob:Building_01 a cob:Facility ;
    cob:name "Example Facility" ;
    cob:hasFloor cob:Floor_01 .

cob:Floor_01 a cob:Floor ;
    cob:name "Ground Floor" ;
    cob:hasRoom cob:Room_101 .

cob:Room_101 a cob:Space ;
    cob:name "Conference Space" ;
    cob:area "50"^^xsd:decimal .

Remember to use appropriate COBie ontology terms and create a well-structured RDF graph that accurately represents the information from the PDF contents.`,
      },
    ],
    temperature: 0,
  });

  console.log(text);

  // Extract the RDF graph from the response:

  const rdfGraphMatch = text.match(/<rdf_graph>([\s\S]*?)<\/rdf_graph>/);

  return rdfGraphMatch && rdfGraphMatch[1] ? rdfGraphMatch[1] : "";
}

// // Import into Neo4j:

// const session = driver.session();

// if (rdfGraphMatch && rdfGraphMatch[1]) {
//   console.log("RDF Graph Match:", rdfGraphMatch[1]);

//   const result = await session.run(
//     `CALL n10s.rdf.import.inline('${rdfGraphMatch[1]}', 'Turtle')`
//   );

//   console.log("Imported RDF graph into Neo4j:", result.records);
// } else {
//   console.error("RDF graph not found in the response.");
// }

// driver.close();
