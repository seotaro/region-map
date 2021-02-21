"use strict";

(function () {

  const regionsets = {
    "N03": { name: "全国地方公共団体コード", isFill: true, isLine: true, isPoint: false }, // 全国地方公共団体コード
    "AreaForecast": { name: "JMA 全国・地方予報区", isFill: true, isLine: true, isPoint: false }, // 全国・地方予報区
    "AreaForecastLocalM_prefecture": { name: "JMA 府県予報区等", isFill: true, isLine: true, isPoint: false }, // 府県予報区等
    "AreaForecastLocalM_1saibun": { name: "JMA 一次細分区域等", isFill: true, isLine: true, isPoint: false }, // 一次細分区域等
    "AreaForecastLocalM_matome": { name: "JMA 市町村等をまとめた地域等", isFill: true, isLine: true, isPoint: false }, // 市町村等をまとめた地域等
    "AreaInformationCity_weather": { name: "JMA 市町村等（気象警報等）", isFill: true, isLine: true, isPoint: false }, // 市町村等（気象警報等）
    "AreaInformationCity_landslide": { name: "JMA 市町村等（土砂災害警戒情報）", isFill: true, isLine: true, isPoint: false }, // 市町村等（土砂災害警戒情報）
    "AreaInformationCity_river": { name: "JMA 市町村等（指定河川洪水予報）", isFill: true, isLine: true, isPoint: false }, // 市町村等（指定河川洪水予報）
    "AreaInformationCity_quake": { name: "JMA 市町村等（地震津波関係）", isFill: true, isLine: true, isPoint: false }, // 市町村等（地震津波関係）
    "AreaInformationCity_volcano": { name: "JMA 市町村等（火山関係）", isFill: true, isLine: true, isPoint: false }, // 市町村等（火山関係）
    "AreaMarineAJ": { name: "JMA 地方海上予報区", isFill: true, isLine: true, isPoint: false }, // 地方海上予報区
    "AreaForecastEEW": { name: "JMA 緊急地震速報／地方予報区", isFill: true, isLine: true, isPoint: false }, // 緊急地震速報／地方予報区
    "AreaForecastLocalEEW": { name: "JMA 緊急地震速報／府県予報区", isFill: true, isLine: true, isPoint: false }, // 緊急地震速報／府県予報区
    "AreaInformationPrefectureEarthquake": { name: "JMA 地震情報／都道府県等", isFill: true, isLine: true, isPoint: false }, // 地震情報／都道府県等
    "AreaForecastLocalE": { name: "JMA 地震情報／細分区域", isFill: true, isLine: true, isPoint: false }, // 地震情報／細分区域
    "AreaTsunami": { name: "JMA 津波予報区", isFill: false, isLine: true, isPoint: false }, // 津波予報区
    "flood_risk_map_all": { name: "JMA 流域雨量指数計算河川及び洪水予報河川の予報区間", isFill: false, isLine: true, isPoint: false }, // 流域雨量指数計算河川及び洪水予報河川の予報区間
    "amedas": { name: "JMA アメダス観測所", isFill: false, isLine: false, isPoint: true }, // アメダス観測所
  };

  initializeController();

  mapboxgl.accessToken =
    "pk.eyJ1Ijoic2VvdGFybyIsImEiOiJjazA2ZjV2ODkzbmhnM2JwMGYycmc5OTVjIn0.5k-2FWYVmr5FH7E4Uk6V0g";

  var map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/seotaro/ckccx2ir32ft21ilprmbedyud",
    center: [139.5, 36.0],
    zoom: 8,
    antialias: true,
  });

  map.on("load", function () {

    // ソース追加
    for (let regionset in regionsets) {
      const source = toSourceId(regionset);
      const url = `https://storage.googleapis.com/region-123456/tiles/${regionset}/{z}/{x}/{y}.pbf`

      map.addSource(source, {
        type: "vector",
        tiles: [url],
      });
    }


    // レイヤー追加。先にfill、後からline。
    const fillLayers = [];
    const lineLayers = [];
    const pointLayers = [];
    const regionsetsCount = Object.keys(regionsets).length;
    let regionsetIndex = 0;
    for (let regionset in regionsets) {
      const source = toSourceId(regionset);

      // レイヤーの色は色相を均等に割り当てる。
      const rgb = hsvToRgb(360 * regionsetIndex / regionsetsCount, 0.8, 1);
      const color = `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`;

      if (regionsets[regionset].isFill) {
        fillLayers.push({
          "id": toFillLayerId(regionset),
          "type": "fill",
          "source": source,
          "source-layer": regionset,
          layout: {
            'visibility': 'none',
          },
          paint: {
            "fill-antialias": true,
            "fill-color": `rgba(${color}, 0.2)`,
            "fill-outline-color": `rgba(${color}, 0.3)`,
          },
        });
      }

      if (regionsets[regionset].isLine) {
        lineLayers.push({
          "id": toLineLayerId(regionset),
          "type": "line",
          "source": source,
          "source-layer": regionset,
          layout: {
            'visibility': 'none',
          },
          paint: {
            "line-width": 1.0,
            "line-color": `rgb(${color})`,
          },
        });
      }

      if (regionsets[regionset].isPoint) {
        pointLayers.push({
          "id": toPointLayerId(regionset),
          "type": "circle",
          "source": source,
          "source-layer": regionset,
          layout: {
            'visibility': 'none',
          },
          paint: {
            'circle-radius': 5.0,
            'circle-color': `rgb(${color})`,
          }
        });
      }

      regionsetIndex++;
    }
    for (let layer of fillLayers) {
      map.addLayer(layer);
    }
    for (let layer of lineLayers) {
      map.addLayer(layer);
    }
    for (let layer of pointLayers) {
      map.addLayer(layer);
    }


    // 初期表示するレイヤー
    {
      const defaultLayer = toFillLayerId("N03");
      map.setLayoutProperty(defaultLayer, "visibility", "visible");

      let el = document.getElementById(defaultLayer);
      el.checked = true;
    }
  });


  for (let regionset in regionsets) {
    let setEventListner = function (toLayerId) {
      map.on('click', toLayerId(regionset), function (e) {
        let html = '<ul>';
        html += '<li>';
        for (let feature of e.features) {
          const properties = feature.properties;
          html += '<ul>';
          for (const [key, value] of Object.entries(properties)) {
            html += `<li>${key}: ${value}</li>`;
          }
          html += '</ul>';
          html += '</li>';
        }
        html += '</ul>';

        new mapboxgl.Popup({ closeOnClick: true })
          .setLngLat(e.lngLat)
          .setHTML(html)
          .addTo(map);
      });

      map.on('mouseenter', toLayerId(regionset), function () {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', toLayerId(regionset), function () {
        map.getCanvas().style.cursor = '';
      });
    }

    if (regionsets[regionset].isFill) {
      setEventListner(toFillLayerId);
    }
    if (regionsets[regionset].isLine) {
      setEventListner(toLineLayerId);
    }
    if (regionsets[regionset].isPoint) {
      setEventListner(toPointLayerId);
    }
  }

  // map.on('zoom', function () {
  //   console.log('zoom level = ', this.getZoom());
  // });

  function initializeController() {
    const parent = document.getElementById("controller");
    for (let regionset in regionsets) {
      let div = document.createElement('div');
      parent.appendChild(div)

      let initializeCheckboxes = function (parent, toLayerId, isEnable) {
        let el = document.createElement('input');
        parent.appendChild(el)
        el.setAttribute('type', 'checkbox');
        el.setAttribute('id', toLayerId(regionset));
        el.disabled = !isEnable;

        el.addEventListener("change", (ev) => {
          map.setLayoutProperty(ev.currentTarget.id, "visibility", ev.currentTarget.checked ? "visible" : "none");
        });
      }

      {
        let span = document.createElement('span');
        span.className = 'header-fill';
        div.appendChild(span)

        initializeCheckboxes(span, toFillLayerId, regionsets[regionset].isFill);
      }

      {
        let span = document.createElement('span');
        span.className = 'header-line';
        div.appendChild(span)

        initializeCheckboxes(span, toLineLayerId, regionsets[regionset].isLine);
      }

      {
        let span = document.createElement('span');
        span.className = 'header-point';
        div.appendChild(span)

        initializeCheckboxes(span, toPointLayerId, regionsets[regionset].isPoint);
      }

      {
        let span = document.createElement('span');
        span.className = 'header-layer';
        span.innerText = regionsets[regionset].name;
        div.appendChild(span)
      }
    }
  }

  function toSourceId(regionsetName) {
    return `${regionsetName}-source`;
  }

  function toFillLayerId(regionsetName) {
    return `${regionsetName}-fill`;
  }

  function toLineLayerId(regionsetName) {
    return `${regionsetName}-line`;
  }

  function toPointLayerId(regionsetName) {
    return `${regionsetName}-point`;
  }

  function hsvToRgb(H, S, V) {
    var C = V * S;
    var Hp = H / 60;
    var X = C * (1 - Math.abs(Hp % 2 - 1));

    var R, G, B;
    if (0 <= Hp && Hp < 1) { [R, G, B] = [C, X, 0] };
    if (1 <= Hp && Hp < 2) { [R, G, B] = [X, C, 0] };
    if (2 <= Hp && Hp < 3) { [R, G, B] = [0, C, X] };
    if (3 <= Hp && Hp < 4) { [R, G, B] = [0, X, C] };
    if (4 <= Hp && Hp < 5) { [R, G, B] = [X, 0, C] };
    if (5 <= Hp && Hp < 6) { [R, G, B] = [C, 0, X] };

    var m = V - C;
    [R, G, B] = [R + m, G + m, B + m];

    R = Math.floor(R * 255);
    G = Math.floor(G * 255);
    B = Math.floor(B * 255);

    return [R, G, B];
  }

})();










