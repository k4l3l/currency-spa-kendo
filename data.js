(async function test(){
        const currs = ["USD", "EUR", "AUD", "CAD", "CHF", "NZD", "BGN"];
        const transformedArr = [];
        const arr = []; 
        // create a set with every possible combination
        currs.forEach((c,i) => {
            currs.forEach((c2,j) => {
                if(i !== j) {          
                    transformedArr.push(`${c.toLowerCase()}/${c2.toLowerCase()}.json`);
                    arr.push({name: `${c.toLowerCase()}-${c2.toLowerCase()}`});
                }
            });
        });

        async function getAllRates(currStringArr) {
            console.log('fetching data');
            const ax = axios.create({
                baseURL: "https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/",            
                timeout: 1000
            });
            const reqArr = currStringArr.map(c => {
                return ax.get(c);
            });        
            return await axios.all(reqArr);
        };
       
        const localItem = JSON.parse(localStorage.getItem("currencies"));
        const date = Number(localStorage.getItem("date"));
        const currencyTemplate = kendo.template($("#currencyTemplate").html());
        let stateArr;

        // loading the data
        if (!localItem || !date || (Date.now() - date) > (1000 * 60 * 60 * 24)){
            let result = await getAllRates(transformedArr);
            result = result.map(r => r.data);
            stateArr = arr.map((r,i) => {
                // state will be [{name:"usd-eur", value: 0.84}, {...},...]
                return {...r, value: result[i][r.name.slice(-3)]};
            }).sort((a,b) => a.value - b.value);
            localStorage.setItem("currencies", JSON.stringify(stateArr));
            localStorage.setItem("date", Date.now());
        } else {
            console.log("loading from cache");
            stateArr = JSON.parse(localStorage.getItem("currencies"));
        }

        var viewModel = kendo.observable({
            currency: null,
            currencies: currs.map((c, i) => { return { name: c, value: i } } ),
            rates: stateArr,
            grpOne: function() {
                return this.get("rates").filter(c => c.value < 1);
            },
            grpTwo: function() {
                return this.get("rates").filter(c => c.value >= 1 && c.value < 1.5);
            },
            grpThree: function() {
                return this.get("rates").filter(c => c.value >= 1.5);
            },
            filterCurrencies: function() {
                var filtered = stateArr.filter(r => r.name.includes(this.get("currency").name.toLowerCase()))
                this.set("rates", filtered);
                const groups = [this.get("grpOne()"),this.get("grpTwo()"), this.get("grpThree()")];
                var result = currencyTemplate(groups);
                $("#groups").html(result);
            },
            longestCount: function() {
                var rates = this.get("rates");
                if (this.get("currency")) {
                    let max = 1;
                    let count = 1;
                    let startIdx = 0;
                    let idx = 1;
                    for (let i = 0; i < rates.length-1; i++) {
                        if ((Math.abs(rates[i].value - rates[i+1].value) <= 0.5) && (Math.abs(rates[startIdx].value - rates[i+1].value) <= 0.5)) {        
                            count++;      
                        } else {
                            if (max < count) {
                                max = count;            
                            } 
                            count = 1;
                            startIdx = idx;
                            i = idx++;
                        }
                        if (max < count) {
                            max = count;
                        }
                    }
                    return max;
                } else {
                    return 0;
                }                
            }
        });

        kendo.bind($(".App"), viewModel);

})()

//Template
// Use a custom function inside the template. Must be defined in the global JavaScript scope.
function renderGroups (grps) {
    return kendo.Template.compile($("#grps-template").html())(grps);
}

// All currencies, on change in select display filtered currencies in the template
// the template should have 3 groups from filtered currencies < 1, >= 1 && < 1.5 and >= 1.5


