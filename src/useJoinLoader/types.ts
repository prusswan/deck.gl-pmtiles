
import { LoaderWithParser } from "@loaders.gl/loader-utils";
// see https://unpkg.com/browse/@deck.gl/geo-layers@9.0.27/dist/mvt-layer/mvt-layer.d.ts
//import type { BinaryFeatures } from "@loaders.gl/schema";
import type { BinaryFeatureCollection } from "@loaders.gl/schema";

export type DataShapeNames = keyof DataShapes;
export type DataShapes = {
  "binary": BinaryFeatureCollection,
  "binary-geometry": BinaryFeatureCollection
  "columnar-table": {'shape': "columnar-table", 'data': BinaryFeatureCollection},
  "geojson": GeoJSON.FeatureCollection,
  "geojson-row-table": {'shape': "geojson-row-table", 'data': GeoJSON.FeatureCollection},

}
export type BinaryEntries = [keyof BinaryFeatureCollection, any];
export type JoinLoaderProps = {
    loader: LoaderWithParser;
    shape: "binary";
    leftId: string;
    rightId: string;
    tableData?: {[key: string]: any}[];
    dataDict?: {[key: string]: object};
    dataMap?: Map<string, object>;
    updateTriggers?: any[];
  }
export  type JoinLoader = (props: JoinLoaderProps) => LoaderWithParser;
