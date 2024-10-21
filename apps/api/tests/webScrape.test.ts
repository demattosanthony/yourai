import { getWebPageContentsTool } from "../tools";

const contents = await getWebPageContentsTool.execute(
  {
    url: "https://cnbc.com",
  },
  {}
);

console.log(contents);
