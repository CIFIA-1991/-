import { WeatherPreset } from '../types';

export const WEATHER_PRESETS: WeatherPreset[] = [
  {
    id: 'typhoon',
    name: '🌀 強烈颱風生成 (Typhoon Spawning)',
    description: '熱帶西太平洋高水溫暖池 (30.5°C) 搭配中心強烈低氣壓 (938 hPa) 與科氏力，引發氣旋輻合升級為強烈颱風。',
    iconName: 'Wind',
    basePressure: 1012,
    baseSST: 29.5,
    centerLatitude: 20.5,
    centerLongitude: 135.0,
    systems: [
      {
        type: 'radial',
        val: 938,
        cx: 0.5,
        cy: 0.5,
        radius: 0.22,
        label: '強烈颱風中心 938hPa'
      },
      {
        type: 'radial',
        val: 1024,
        cx: 0.88,
        cy: 0.2,
        radius: 0.28,
        label: '太平洋高壓 1024hPa'
      },
      {
        type: 'radial',
        val: 1020,
        cx: 0.12,
        cy: 0.8,
        radius: 0.25,
        label: '外圍高壓 1020hPa'
      }
    ],
    tempSystems: [
      {
        type: 'radial',
        val: 31.5,
        cx: 0.5,
        cy: 0.5,
        radius: 0.3,
        label: '熱帶高溫暖池 31.5°C'
      }
    ]
  },
  {
    id: 'meiyu-front',
    name: '🌦️ 梅雨滯留鋒面 (Meiyu Frontal System)',
    description: '北方乾冷氣團 (18°C) 與南方南海暖濕海氣 (29°C) 交會，於台灣至琉球海域形成顯著對流鋒面帶。',
    iconName: 'CloudRain',
    basePressure: 1012,
    baseSST: 24.0,
    centerLatitude: 24.5,
    centerLongitude: 122.0,
    systems: [
      {
        type: 'radial',
        val: 1026,
        cx: 0.3,
        cy: 0.2,
        radius: 0.28,
        label: '北方冷高壓 1026hPa'
      },
      {
        type: 'radial',
        val: 1022,
        cx: 0.7,
        cy: 0.8,
        radius: 0.28,
        label: '太平洋高壓 1022hPa'
      },
      {
        type: 'radial',
        val: 996,
        cx: 0.5,
        cy: 0.48,
        radius: 0.2,
        label: '鋒面低壓 996hPa'
      }
    ],
    tempSystems: [
      {
        type: 'radial',
        val: 17.5,
        cx: 0.25,
        cy: 0.18,
        radius: 0.35,
        label: '北方冷水氣團 17.5°C'
      },
      {
        type: 'radial',
        val: 29.5,
        cx: 0.75,
        cy: 0.82,
        radius: 0.35,
        label: '南海暖濕水體 29.5°C'
      }
    ]
  },
  {
    id: 'equatorial-doldrums',
    name: '🌴 赤道無風帶與熱帶低壓 (Equatorial Doldrums)',
    description: '位於赤道 (0°N) 附近，科氏力 f ≈ 0，風向直接順應壓力梯度吹送，高海水溫度 (30°C) 促使旺盛熱對流。',
    iconName: 'Sun',
    basePressure: 1008,
    baseSST: 30.0,
    centerLatitude: 0.0,
    centerLongitude: 140.0,
    systems: [
      {
        type: 'radial',
        val: 996,
        cx: 0.5,
        cy: 0.5,
        radius: 0.3,
        label: '赤道對流低壓 996hPa'
      }
    ],
    tempSystems: [
      {
        type: 'radial',
        val: 31.0,
        cx: 0.5,
        cy: 0.5,
        radius: 0.4,
        label: '赤道熱帶水體 31°C'
      }
    ]
  },
  {
    id: 'siberian-high',
    name: '❄️ 大陸冷高壓與寒潮 (Cold Surge High)',
    description: '中高緯度 (45°N) 強烈冷高壓 (1042 hPa) 與東亞低溫海水 (12°C)，強大科氏偏轉力導引強烈東北季風吹襲。',
    iconName: 'Snowflake',
    basePressure: 1010,
    baseSST: 14.0,
    centerLatitude: 42.0,
    centerLongitude: 130.0,
    systems: [
      {
        type: 'radial',
        val: 1042,
        cx: 0.3,
        cy: 0.3,
        radius: 0.38,
        label: '蒙古冷高壓 1042hPa'
      },
      {
        type: 'radial',
        val: 998,
        cx: 0.78,
        cy: 0.7,
        radius: 0.25,
        label: '阿留申低壓 998hPa'
      }
    ],
    tempSystems: [
      {
        type: 'radial',
        val: 8.0,
        cx: 0.25,
        cy: 0.25,
        radius: 0.4,
        label: '千島/親潮寒流 8°C'
      }
    ]
  },
  {
    id: 'southern-cyclone',
    name: '🌏 南半球氣旋與副高 (Southern Hemisphere)',
    description: '南緯 25°S 區域，科氏力向左偏轉。低氣壓順時針輻合吹入、高氣壓逆時針輻散吹出。',
    iconName: 'Compass',
    basePressure: 1012,
    baseSST: 26.0,
    centerLatitude: -25.0,
    centerLongitude: 150.0,
    systems: [
      {
        type: 'radial',
        val: 980,
        cx: 0.4,
        cy: 0.6,
        radius: 0.25,
        label: '南半球氣旋 980hPa'
      },
      {
        type: 'radial',
        val: 1028,
        cx: 0.75,
        cy: 0.3,
        radius: 0.3,
        label: '南太平洋高壓 1028hPa'
      }
    ],
    tempSystems: [
      {
        type: 'radial',
        val: 28.0,
        cx: 0.35,
        cy: 0.65,
        radius: 0.3,
        label: '珊瑚海暖流 28°C'
      }
    ]
  },
  {
    id: 'blank',
    name: '🌊 自訂完全空白海域 (Blank Sea Map)',
    description: '標準大氣壓 (1013 hPa) 與標準水溫 (26°C)，可自由繪製氣壓多邊形與海水溫度多邊形。',
    iconName: 'Sparkles',
    basePressure: 1013,
    baseSST: 26.0,
    centerLatitude: 23.5,
    centerLongitude: 121.5,
    systems: [],
    tempSystems: []
  }
];

