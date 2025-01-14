"use client";

import { Button } from "@/components/ui/button";
import { ZoomInIcon, ZoomOutIcon } from "lucide-react";
import { RenderZoomInProps, RenderZoomOutProps } from "@react-pdf-viewer/zoom";
import { useAtom } from "jotai";
import { zoomPluginAtom } from "@/atoms/viewer";

export default function FileViewerHeader() {
  //   const [fileName, setFileName] = useState("arch_set_setty-office.pdf");

  //   const [pageNavigationPluginInstance] = useAtom(pageNavigationPluginAtom);
  const [zoomPluginInstance] = useAtom(zoomPluginAtom);

  return (
    <div className="absolute top-0 left-0 right-0 h-[65px] z-40 flex items-center backdrop-blur-md dark:backdrop-blur-none">
      {/* <Button
        className="m-4 w-10 rounded-full p-0"
        variant={"ghost"}
        onClick={() => {
          router.back();
        }}
      >
        <ArrowLeft />
      </Button> */}

      <div className="flex flex-col justify-center flex-auto">
        {/* <div className="max-w-[calc(100vw-40vw)] ">
          <div className="text-lg font-semibold truncate h-ful">{fileName}</div>
        </div> */}
        {/* 
        {pageNavigationPluginInstance && (
          <pageNavigationPluginInstance.CurrentPageLabel>
            {(props: RenderCurrentPageLabelProps) => (
              <p className="text-sm text-muted-foreground ml-1">
                {props.numberOfPages} Pages
              </p>
            )}
          </pageNavigationPluginInstance.CurrentPageLabel>
        )} */}
      </div>

      <div className="flex items-center gap-2 mr-4">
        {zoomPluginInstance && (
          <div className="flex gap-1">
            <zoomPluginInstance.ZoomOut>
              {(props: RenderZoomOutProps) => (
                <Button
                  onClick={props.onClick}
                  variant={"ghost"}
                  className="rounded-full p-3"
                >
                  <ZoomOutIcon />
                </Button>
              )}
            </zoomPluginInstance.ZoomOut>
            <zoomPluginInstance.ZoomIn>
              {(props: RenderZoomInProps) => (
                <Button
                  onClick={props.onClick}
                  variant={"ghost"}
                  className="rounded-full p-3"
                >
                  <ZoomInIcon />
                </Button>
              )}
            </zoomPluginInstance.ZoomIn>
          </div>
        )}

        {/* <Button
          size={"icon"}
          variant={"ghost"}
          onClick={() => {
            // if (!file) return;
            // downloadFile(file.blob, file.data.name);
          }}
          className="h-9 w-9 rounded-full"
        >
          <Download className="h-4 w-4 text-ine" />
        </Button> */}

        {/* <ShareButtonPopover /> */}
      </div>
    </div>
  );
}
