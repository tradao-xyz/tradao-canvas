const express = require("express");
const { JSDOM } = require("jsdom");
const { Canvas, Image } = require("canvas");
const echarts = require("echarts");
const app = express();
const { createCanvas, registerFont } = require("canvas");
const bodyParser = require("body-parser");
const dayjs = require("dayjs");
app.use(bodyParser());

const port = process.env.PORT || 3001;
app.post("/image", (req, res) => {
  const dom = new JSDOM(
    `<!DOCTYPE html><body><div id="#main"></div></body></html>`,
    {
      pretendToBeVisual: true,
    }
  );
  global.window = dom.window;
  global.document = window.document;
  global.Image = Image;
  const width = 920;
  const height = 460;
  const canvas = createCanvas(width, height);
  registerFont('./Poppins-Medium.ttf', { family: 'Poppins' })
  const context = canvas.getContext("2d");
  context.font = "Poppins"

  echarts.setCanvasCreator(() => canvas);
  const chart = echarts.init(canvas);
  let data = req.body.data;
  const time = req.body.time;
  const type = req.body.type;
  if (!data) return;

  let dateFormatter = "YYYY-MM-DD";
  if (time === "1D") {
    dateFormatter = "HH";
  } else if (time === "7D") {
    dateFormatter = "MM-DD";
  }
  data = data
    .map((i) => {
      return i.value != null
        ? {
          category: dayjs(i.time * 1000).format(dateFormatter),
          value: parseFloat(i.value.toFixed(2)),
        }
        : false;
    })
    .filter(Boolean);

  const option = {
    xAxis: {
      type: "category",
      data: data.map((i) => i.category),
      axisTick: {
        show: false,
      },
      splitLine: {
        show: false,
      },
      axisLine: {
        lineStyle: {
          type: "dashed",
          color: "#7F7F7F",
        },
      },
    },
    yAxis: {
      type: "value",
      splitLine: {
        show: false,
      },
      axisLabel: {
        formatter: type === "ROI" ? "{value}%" : "${value}",
      },
      axisLine: {
        lineStyle: {
          type: "dashed",
          color: "#7F7F7F",
        },
      },
    },
    series: [
      {
        data: data.map((item) => item.value),
        lineStyle: {
          color: "#03030400",
          width: 20,
        },
        type: "line",
        itemStyle: { normal: { opacity: 0 } },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 1, color: "#030304" },
            { offset: 0, color: "#7F50EB" },
          ]),
        },
      },
    ],
  };
  chart.setOption(option);
  const buffer = canvas.toDataURL();
  res.set("Content-Type", "application/json");
  res.send({ data: buffer });
});

app.listen(port, () => console.log(`Listening at http://localhost:${port}`));
module.exports = app;
