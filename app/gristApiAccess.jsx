"use server";

import Grist from "./grist";

async function example() {
  "use server";
  console.log("this is an example of a server function.");
}

const apiFeatures = {
  example,
};

export default async function GristApiAccess({
  children,
}) {
  return <Grist apiFeatures={apiFeatures}>{children}</Grist>;
}
