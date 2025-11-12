
class FinanceTracker extends HTMLElement {
 
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

        /**
         * Called when the element is inserted into the DOM.
         * - Renders the component template into shadow DOM
         * - Hooks up the file input change handler
         * - Initializes the echarts instance and window resize handler
         * @returns {void}
         */
     connectedCallback() {
         this.render();

         this.inputFile = this.shadowRoot.querySelector('#csvFile');
         this.debugOut  = this.shadowRoot.querySelector('#debug');
         this.chart = echarts.init(this.shadowRoot.querySelector('#chart'));
     
         this.inputFile.addEventListener('change', (e) => this.parseFile(e));

         this._onResize = () => this.chart && this.chart.resize();
         window.addEventListener('resize', this._onResize);
     }


    /**
     * Handle file input change events, parse the selected CSV file,
     * aggregate spending by category, and update the chart.
     * @param {Event} event - The change event from the file input.
     * @returns {void}
     */
    parseFile(event) {
        const file = event.target.files[0];
        if(!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: ({ data }) => {
                const totals = {};
                for (const row of data ) {
                    const category = (row.category || row.Category || "Uncategorized").trim();
                    const amount = parseFloat(row.amount || row.Amount || 0) || 0;
                    totals[category] = (totals[category] || 0) + amount;
                };

                for (const key in totals) {
                    totals[key] = parseFloat(totals[key].toFixed(2));
                }
                
                this.debugOut.hidden = true; //Set to false to see data formatting
                this.debugOut.textContent = JSON.stringify(totals, null, 2)

                this.buildPieChart(totals);
            }
        })
    };

    /**
     * Render a pie chart from the aggregated totals.
     * @param {{[category: string]: number}} totals - Mapping of category name to total amount.
     * @returns {void}
     */
    buildPieChart(totals) {
        const entries = Object.entries(totals);
        if (entries.length === 0) {
            this.chart.clear();
            return;
        }

        const pieData = entries.map(([name, value]) => ({ name, value }));

        const option = {
            title: { text: 'Spending by Category', left: 'center' },
            tooltip: { trigger: 'item' },
            legend: { orient: 'vertical', left: 'left' },
            series: [
            {
                name: 'Spending',
                type: 'pie',
                radius: '60%',      
                data: pieData,
                emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0,0,0,0.5)'
                }}
            }]
        };

        this.chart.setOption(option, true);

    }


    /**
     * Populate the shadow DOM with the component template.
     * @returns {void}
     */
    render() {
        this.shadowRoot.innerHTML = `
        <style>
            :host { display: block; font-family: system-ui, sans-serif; }
            #chart { width: 100%; height: 480px; margin-top: 1rem; }
        </style>
        <h2>Finance Tracker</h2>
        <input type="file" id="csvFile" accept=".csv" />
        <pre id="debug" hidden></pre>
        <div id="chart"></div>
        `;
    }

    /**
     * Cleanup when the element is removed from the document.
     * - Removes window resize listener
     * - Disposes of the echarts instance
     * @returns {void}
     */
    disconnectedCallback() {
        window.removeEventListener('resize', this._onResize);
        if (this.chart) {
            this.chart.dispose();
            this.chart = null;
        }
    }
}

customElements.define('finance-tracker', FinanceTracker)










