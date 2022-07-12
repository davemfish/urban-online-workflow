import GeoTIFF from 'ol/source/GeoTIFF';
import TileLayer from 'ol/layer/WebGLTile';

import lulcColors from './lulcColors';

export default function getLULCLayer(url, title, type) {
  const source = new GeoTIFF({
    sources: [{
      url: url,
      projection: 'EPSG:3857',
    }],
    interpolate: false,
  });

  return new TileLayer({
    source: source,
    title: title,
    type: type,
    visible: false,
    style: {
      // https://openlayers.org/en/latest/apidoc/module-ol_style_expressions.html#~ExpressionValue
      // https://github.com/openlayers/openlayers/blob/main/test/rendering/cases/webgl-palette/main.js
      color: [
        'palette',
        ['*', ['band', 1], 255],
        lulcColors,
      ],
      saturation: -0.3,
      contrast: -0.4,
    },
  });
}