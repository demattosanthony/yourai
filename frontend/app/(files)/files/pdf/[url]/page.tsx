"use client";

import { Viewer } from "@react-pdf-viewer/core";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { useParams } from "next/navigation";
import { useAtom } from "jotai";
import { pageNavigationPluginAtom, zoomPluginAtom } from "@/atoms/viewer";
import { useEffect } from "react";

import "@react-pdf-viewer/zoom/lib/styles/index.css";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";

export default function PdfViewer() {
  const params = useParams<{ url: string }>();
  const { url } = params;

  const zoomPluginInstance = zoomPlugin({ enableShortcuts: true });
  const pageNavigationPluginInstance = pageNavigationPlugin();

  const [, setZoomPlugin] = useAtom(zoomPluginAtom);
  const [, setNavPlugin] = useAtom(pageNavigationPluginAtom);

  useEffect(() => {
    setZoomPlugin(zoomPluginInstance);
    setNavPlugin(pageNavigationPluginInstance);

    return () => {
      setZoomPlugin(null);
      setNavPlugin(null);
    };
  }, []);

  return (
    <Viewer
      fileUrl={decodeURIComponent(url)}
      plugins={[zoomPluginInstance, pageNavigationPluginInstance]}
      //   renderLoader={(_: number) => <MyRingLoader />}
    />
  );
}
