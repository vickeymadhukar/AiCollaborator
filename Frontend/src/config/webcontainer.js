import { WebContainer } from "@webcontainer/api";

// Call only once

let webcontainerInstance = null;

export async function getWebContainerInstance() {
  if (!webcontainerInstance) {
    webcontainerInstance = await WebContainer.boot();
  }
  return webcontainerInstance;
}
