//import { PMTLayer } from "./pmt-layer/pmt-layer";
import { PMTLayer } from "../dist/index.js";

const _global = typeof window === 'undefined' ? global : window;
_global.PMTLayerLibrary = {PMTLayer};