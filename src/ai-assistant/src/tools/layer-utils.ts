import {ColorMap, ColorRange, ColorLegends, COLOR_RANGES} from '@kepler.gl/constants';
import {Layer} from '@kepler.gl/layers';
import {KeplerTable} from '@kepler.gl/table';
import {Field} from '@kepler.gl/types';
import {formatNumber} from '@kepler.gl/utils';

type CreateGeojsonLayerConfigParams = {
  layer: Layer;
  dataset: KeplerTable;
  field: Field;
  colorScale: string;
  colorRange?: ColorRange;
  customColorScale?: number[];
};

export function createGeojsonLayerConfig({
  layer,
  dataset,
  field,
  colorScale,
  colorRange,
  customColorScale
}: CreateGeojsonLayerConfigParams) {
  if (customColorScale && colorRange) {
    return createCustomGeojsonLayerConfig({
      layer,
      dataset,
      field,
      colorScale,
      colorRange,
      customColorScale
    });
  }
  return createDefaultGeojsonLayerConfig({layer, dataset, field, colorScale});
}
export function createDefaultGeojsonLayerConfig({
  layer,
  dataset,
  field,
  colorScale
}: CreateGeojsonLayerConfigParams) {
  return {
    id: layer.id,
    type: 'geojson',
    config: {
      dataId: dataset.id,
      label: layer.config.label,
      columns: {
        geojson: layer.config.columns.geojson.value
      },
      colorScale,
      colorField: {
        name: field.name,
        type: field.type
      },
      visConfig: {
        ...layer.config.visConfig,
        filled: true
      },
      isVisible: true
    }
  };
}

export function createCustomGeojsonLayerConfig({
  layer,
  dataset,
  field,
  colorScale,
  colorRange,
  customColorScale
}: CreateGeojsonLayerConfigParams & {
  colorRange: ColorRange;
  customColorScale: number[];
}) {
  const customColorRange = createCustomColorRange(colorRange, customColorScale);
  return {
    id: layer.id,
    type: 'geojson',
    config: {
      dataId: dataset.id,
      label: layer.config.label,
      columns: {
        geojson: layer.config.columns.geojson.value
      },
      colorScale,
      colorField: {
        name: field.name,
        type: field.type
      },
      visConfig: {
        ...layer.config.visConfig,
        colorRange: customColorRange,
        colorDomain: customColorScale,
        filled: true
      },
      isVisible: true
    }
  };
}

function findColorRange(currentColorRange: ColorRange, numberOfColors: number): ColorRange {
  if (currentColorRange.colors.length === numberOfColors) {
    return currentColorRange;
  }

  const newColorRangeName = `${currentColorRange.name?.replace(/\s*\d+$/, '')} ${numberOfColors}`;

  let colorRange = COLOR_RANGES.find(({name}) => name === newColorRangeName);
  if (!colorRange) {
    // find a color range under the same category with the same number of colors
    colorRange = COLOR_RANGES.find(
      ({category, colors}) =>
        category === currentColorRange.category && colors.length === numberOfColors
    );
  }
  if (!colorRange) {
    // then just find a color range with the same number of colors
    colorRange = COLOR_RANGES.find(({colors}) => colors.length === numberOfColors);
  }
  return colorRange ?? currentColorRange;
}

export function createCustomColorRange(colorRange: ColorRange, customColorScale: number[]) {
  const numberOfColors = customColorScale.length + 1;
  const newColorRange = findColorRange(colorRange, numberOfColors);

  // create colorMap and colorLegends
  const colorMap: ColorMap = newColorRange.colors?.map((color, index) => {
    return [customColorScale[index], color];
  });

  const colorLegends = newColorRange.colors?.reduce((prev, color, i) => {
    const label =
      i < customColorScale.length
        ? formatNumber(customColorScale[i])
        : `>= ${formatNumber(customColorScale[i - 1])}`;
    prev[color] = label;
    return prev;
  }, {} as ColorLegends);

  const customColorRange: ColorRange = {
    ...newColorRange,
    colorMap,
    colorLegends
  };

  return customColorRange;
}
