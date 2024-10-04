//https://deck.gl/docs/get-started/using-with-typescript: v9 and v8 syntax differences
/*
import { type TileLayerProps, MVTLayer } from "@deck.gl/geo-layers/typed";
import { type DefaultProps } from "@deck.gl/core/typed";
import { GeoJsonLayer, type GeoJsonLayerProps } from "@deck.gl/layers/typed";
*/
import { type TileLayerProps, MVTLayer } from "@deck.gl/geo-layers";
import { type DefaultProps } from "@deck.gl/core";
import { GeoJsonLayer, type GeoJsonLayerProps } from "@deck.gl/layers";

import { findTile, PMTiles, zxyToTileId } from "pmtiles";
import { Header } from "pmtiles";

// see https://unpkg.com/browse/@deck.gl/geo-layers@9.0.27/dist/mvt-layer/mvt-layer.d.ts
//import type { BinaryFeatures } from "@loaders.gl/schema";
import type { BinaryFeatureCollection } from "@loaders.gl/schema";
import type { Feature } from "geojson";

import type { Loader } from "@loaders.gl/loader-utils";

import { PMTWorkerLoader, PMTLoader } from "../pmt-loader";

// from @deck.gl/geo-layers/src/mvt-layer/mvt-layer

export type TileJson = {
  tilejson: string;
  tiles: string[];
  // eslint-disable-next-line camelcase
  vector_layers: any[];
  attribution?: string;
  scheme?: string;
  maxzoom?: number;
  minzoom?: number;
  version?: string;
};
/** Props added by the MVTLayer  */
export type _MVTLayerProps = {
  /** Called if `data` is a TileJSON URL when it is successfully fetched. */
  onDataLoad?: ((tilejson: TileJson | null) => void) | null;

  /** Needed for highlighting a feature split across two or more tiles. */
  uniqueIdProperty?: string;

  /** A feature with ID corresponding to the supplied value will be highlighted. */
  highlightedFeatureId?: string | null;

  /**
   * Use tile data in binary format.
   *
   * @default true
   */
  binary?: boolean;

  /**
   * Loaders used to transform tiles into `data` property passed to `renderSubLayers`.
   *
   * @default [MVTWorkerLoader] from `@loaders.gl/mvt`
   */
  loaders?: Loader[];
};

// From @deck.gl/geo-layers/typed/tile-layer/types
export type GeoBoundingBox = {
  west: number;
  north: number;
  east: number;
  south: number;
};
export type NonGeoBoundingBox = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type TileBoundingBox = NonGeoBoundingBox | GeoBoundingBox;

export type TileIndex = { x: number; y: number; z: number };

export type TileLoadProps = {
  index: TileIndex;
  id: string;
  bbox: TileBoundingBox;
  url?: string | null;
  signal?: AbortSignal;
  userData?: Record<string, any>;
  zoom?: number;
};

//export type ParsedPmTile = Feature[] | BinaryFeatures;
export type ParsedPmTile = Feature[] | BinaryFeatureCollection;

export type ExtraProps = {
  raster?: boolean;
  workerUrl?: string;
};

//https://www.typescriptlang.org/docs/handbook/2/objects.html#intersection-types
export type _PMTLayerProps = _MVTLayerProps & ExtraProps;

export type PmtLayerProps = _PMTLayerProps & TileLayerProps<ParsedPmTile>;

// @ts-ignore
const defaultProps: DefaultProps<PmtLayerProps> = {
  ...GeoJsonLayer.defaultProps,
  onDataLoad: { type: "function", value: null, optional: true, compare: false },
  uniqueIdProperty: "",
  highlightedFeatureId: null,
  binary: true,
  raster: false,
  loaders: undefined,
  //loaders: [PMTWorkerLoader],
};

type ZxyOffset = { offset: number; length: number };
export class DeckglPmtiles extends PMTiles {
  async getZxyOffset(
    z: number,
    x: number,
    y: number,
    signal?: AbortSignal
  ): Promise<ZxyOffset | undefined> {
    const tile_id = zxyToTileId(z, x, y);
    const header = await this.cache.getHeader(this.source);
    // V2 COMPATIBILITY
    // if (header.specVersion < 3) {
    //  return v2.getZxy(header, this.source, this.cache, z, x, y, signal);
    // }

    if (z < header.minZoom || z > header.maxZoom) {
      return undefined;
    }

    let d_o = header.rootDirectoryOffset;
    let d_l = header.rootDirectoryLength;
    for (let depth = 0; depth <= 3; depth++) {
      const directory = await this.cache.getDirectory(
        this.source,
        d_o,
        d_l,
        header
      );
      const entry = findTile(directory, tile_id);
      if (entry) {
        if (entry.runLength > 0) {
          return {
            offset: entry.offset,
            length: entry.length,
          };
        } else {
          d_o = header.leafDirectoryOffset + entry.offset;
          d_l = entry.length;
        }
      } else {
        return undefined;
      }
    }
    throw Error("Maximum directory depth exceeded");
  }
}
// @ts-ignore
export class PMTLayer<
  DataT extends Feature = Feature,
  ExtraProps = {}
> extends MVTLayer<DataT & ExtraProps> {
  static layerName = "PMTilesLayer";
  static defaultProps = defaultProps;


  state!: MVTLayer<ParsedPmTile>['state'] & {
    raster: boolean;
    pmtiles: DeckglPmtiles; // | null;
    header: Header; // | null;
    workerUrl: string | null;
    loaders?: Loader[];
    //data: URLTemplate;
    //tileJSON: TileJson | null;
    //highlightColor?: number[];
    //hoveredFeatureId: number | string | null;
    //hoveredFeatureLayerName: string | null;
  };

  //state!: defaultProps;
  /*
  let typeError1 =  `Property 'raster' does not exist on
    type {
      tileset: Tileset2D | null;
      isLoaded: boolean;
      frameNumber?: number | undefined;
    } & {
      binary: boolean;
      data: URLTemplate;
      tileJSON: TileJson | null;
      highlightColor?: number[] | undefined;
      hoveredFeatureId: string | ... 1 more ... | null;
      hoveredFeatureLayerName: string | null;
    }
  `;
  */

  initializeState(): void {
    super.initializeState();
    // GlobeView doesn't work well with binary data
    const binary =
      this.context.viewport.resolution !== undefined
        ? false
        : this.props.binary;

    // @ts-ignore
    const raster = this.props.raster;
    // @ts-ignore
    const workerUrl = this.props.workerUrl;

    console.log("setting default loaders according to worker flag (if not passed in as props)");
    const useWorker = !(this.props.loadOptions && this.props.loadOptions.worker == false);
    const loaders = this.props.loaders || (useWorker ? [PMTWorkerLoader] : [PMTLoader]);
    console.log("useWorker?", useWorker, "loaders used:", loaders);

    (this as any)._updateTileData = async (): Promise<void> => {
      const data = this.props.data;
      // @ts-ignore
      const raster = this.props.raster;
      const pmtiles = new DeckglPmtiles(data as string);
      const header = await pmtiles.getHeader();
      this.setState({ data, pmtiles, raster, header, workerUrl });
    };

    this.setState({
      binary,
      raster,
      workerUrl,
      data: null,
      loaders: loaders,
      // newly added below:
      tileJSON: null,
      hoveredFeatureId: null,
      hoveredFeatureLayerName: null
    });
  }

//https://unpkg.com/browse/@deck.gl/geo-layers@9.0.27/src/mvt-layer/mvt-layer.ts
//https://unpkg.com/browse/@deck.gl/geo-layers@8.8.9/src/mvt-layer/mvt-layer.ts
  getTileData(loadProps: TileLoadProps, iter?: number): Promise<ParsedPmTile> {
    const { index, signal } = loadProps;
    const { data, binary, raster, pmtiles, header, workerUrl, loaders } = this.state;
    /*
    console.log("this.state", this.state);
    console.log("this.props", this.props);
    console.log("loadProps", loadProps);
    */
    const { x, y, z } = index;
    let loadOptions = this.getLoadOptions();
    const { fetch } = this.props;

    return pmtiles
      .getZxyOffset(z, x, y, signal)
      .then((entry: Awaited<ZxyOffset | undefined>) => {

        if (!entry) {
          //return new Promise((resolve) => resolve(null));
          return null;
        }

        const tileOffset = entry.offset + header.tileDataOffset;
        const tileLength = entry.length;

        loadOptions = {
          ...loadOptions,
          mimeType: "application/x-protobuf",
          pmt: {
            workerUrl: workerUrl ? workerUrl :
              "https://unpkg.com/@maticoapp/deck.gl-pmtiles@latest/dist/pmt-worker.js",
            coordinates: this.context.viewport.resolution ? "wgs84" : "local",
            tileIndex: index,
            raster: raster,
            tileCompression: header.tileCompression,
            ...loadOptions?.pmt,
          },
          gis: binary ? { format: "binary" } : {},
          fetch: {
            headers: {
              Range: `bytes=${tileOffset}-${tileOffset + tileLength - 1}`,
            },
          },
        };

        return fetch(data as string, {
          propName: "data",
          layer: this,
          loaders,
          loadOptions,
          signal,
        });
      });
  }
}
export default PMTLayer;

// code adapted from
// Deckgl MVT Layer (MIT) https://github.com/visgl/deck.gl/blob/master/modules/geo-layers/src/mvt-layer/mvt-layer.ts
// @jtmiclat/deck.gl-pmtiles (MIT) https://github.com/jtmiclat/deck.gl-pmtiles
