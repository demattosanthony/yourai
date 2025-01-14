import { PageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { ZoomPlugin } from "@react-pdf-viewer/zoom";
import { atom } from "jotai";

export const pageNavigationPluginAtom = atom<PageNavigationPlugin | null>(null);
export const zoomPluginAtom = atom<ZoomPlugin | null>(null);
