# team-devhex-testproject


# Demo

### Overview

A minimal CSV-to-Visualization web demo that lets users upload a spending log and view category totals as a pie chart.
This project showcases client-side parsing with PapaParse and dynamic chart rendering using Apache ECharts, all wrapped inside a custom Web Component (`<finance-tracker>`).

The demo functions entirely on the front end, no backend no storage servcie and no dependencies

## PapaParse
PapaParse
is a lightweight JavaScript library that efficiently converts CSV data into structured JavaScript objects.
It was chosen because:

It runs entirely in the browser, requiring no server-side parsing.

It’s fast and reliable, handling edge cases like quoted strings and blank lines.

It’s easy to integrate for small demos—only a single 30 KB minified file.

For a simple, educational demo, adding the full npm toolchain wasn’t necessary, so we used the standalone minified build inside /lib/.
This keeps the project self-contained and fully functional offline.

### How it Works (theory)

PapaParse reads the CSV file as text through the browser’s FileReader API, then tokenizes it based on delimiters (commas by default).
It constructs an internal two-dimensional array (rows × columns), automatically recognizing the first row as headers when header: true.
Each subsequent row becomes a JavaScript object where keys are header names and values are cell contents.
Internally, the parser uses streaming and chunking to efficiently process even large files.

### How it’s Used Here

When the user selects a file:

- `Papa.parse(file, { header: true, skipEmptyLines: true, complete: callback })` reads and parses the CSV.

- The callback receives an array of row objects (results.data).

- We iterate through each row, summing the amount field by category.

- Totals are rounded to two decimal places and passed to the chart builder.

[click here to learn more](https://www.npmjs.com/package/papaparse)

## Apache ECharts

### What & Why

Apache ECharts
 is an open-source, high-performance charting and visualization library maintained by the Apache Software Foundation.
It was chosen because:

It can produce interactive, publication-quality charts with minimal configuration.

It supports responsive scaling and smooth animations out of the box.

It’s also a standalone UMD library, ideal for local demos without build tools.

Again, the minified standalone version (echarts.min.js) was used to keep the demo portable and easily hosted on static servers like Live Server or GitHub Pages.

### How it Works (theory)

ECharts uses either Canvas or SVG rendering to draw graphics.
When echarts.init(domNode) is called, it:

Creates a rendering context on the target HTML element.

Waits for configuration via setOption(option).

The option object describes the chart type, data, legend, tooltip, and style.

ECharts builds an internal data model and translates it into drawing commands executed by a rendering engine.

For a pie chart, ECharts:

Maps each `{ name, value }` pair to an angular slice.

Calculates start and end angles proportional to each category’s value.

Renders the slices and adds labels, tooltips, and interactivity.

#### How it’s Used Here

After parsing:

- The totals object `{ "Grocery": 120.50, "Fuel": 45.10, … }` is transformed into an array of `{ name, value } `pairs.

- A configuration object (option) is built specifying a pie chart with title, legend, tooltip, and data.

- The component calls this.chart.setOption(option, true) to render or update the chart.

- A window resize listener calls this.chart.resize() for responsiveness.

[click here to learn more](https://echarts.apache.org/examples/en/editor.html?c=pie-simple) [link goes straight to pie chart example]

