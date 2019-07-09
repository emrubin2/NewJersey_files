//EVAN.M.RUBIN GEOG 575 INTERACTIVE GEOGRAPHY LAB 2 
//wrap everything in a self-executing anonymous function to move to local scope
(function(){

//global variables for Ancestery Map
var attrArray = ["Italian", "Irish", "German", "Polish", "Russian"]; //list of attributes
var expressed = attrArray[0]; //initial attribute

//chart frame dimensions
var chartWidth = window.innerWidth * 0.425,
    chartHeight = 473,
    leftPadding = 25,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";   
    
//create a scale specifically to encompass largest attributes
var yScale = d3.scale.linear()
    .range([463, 0])
    .domain([0, 30]);   
            
//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    //Since New Jersey is narrow, make the height number larger
    var width = window.innerWidth * 0.45,
        height = 800;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);
    
    //Utilize Albers projection centered on New Jersey. 
    var projection = d3.geoAlbers()
        .center([0, 40.2])
        .rotate([74.5, 0, 0])
        .parallels([39,41.3])
        .scale(13000)
        .translate([width / 2, height / 2]);
    
    //remember you are using D3 Version 3. Change to geoPath() refer to API for details 
    var path = d3.geoPath()
        .projection(projection);

    //use d3.queue to parallelize asynchronous data loading. Once again remember which version of queue you are using
    d3.queue()
        .defer(d3.csv, "data/unitsData.csv") //load new jersey csv
        .defer(d3.json, "data/unitedstates.topojson") //load united states topojson background
        .defer(d3.json, "data/NewJerseyCounties2.topojson")//load choropleth spatial data 
        .await(callback);
        
     function callback(error, csvData,us,nj){
         
         //place graticule on the map
         //create graticule generator
        var graticule = d3.geoGraticule()
            .step([2, 2]); //place graticule lines every 2 degrees of lat/long

        //create graticule background
        var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule

        //create graticule lines
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines
         
        //translate unitedstates and jersey TopoJSON  
        var unitedstates = topojson.feature(us,us.objects.UnitedStates), 
            jerseycounties = topojson.feature(nj, nj.objects.NewJerseyCounties2).features; //input original NewJerseyCounties2 geojsonfile
            console.log(jerseycounties);
            
        //note: name of original shapefile is NewJerseyCounties2 IMPORTANT!!!!
        var country = map.append("path")
            .datum(unitedstates)
            .attr("class","countries")
            .attr("d",path);
         
        //join csv data to GEOJSON enumeration units 
        jerseycounties = joinData(jerseycounties,csvData);
         
        //create the color scale
        var colorScale = makeColorScale(csvData);
        
        //add enumeration units to the map
        setEnumerationUnits(jerseycounties,map,path,colorScale);
         
        //add coordinated visualization to the map
        setChart(csvData, colorScale);
         
    createDropdown(csvData);
         
    };
}; //end of setMap()

    
function setGraticule(map,path){
     //Example 2.5 line 3...create graticule generator    
};
    
function joinData(jerseycounties, csvData){
    //variables for data join
        var attrArray = ["Italian", "Irish", "German", "Polish", "Russian"];
         
         //loop through csv to assign each set of csv attribute values to geojson region
        for (var i=0; i<csvData.length; i++){
            var csvRegion = csvData[i]; //the current New Jersey Counties
            var csvKey = csvRegion.FIPSSTCO; //Primary Key is the FIPSSTCO IMPORTANT!!!!!!
         //loop through New Jersey counties
        for (var a=0; a<jerseycounties.length; a++){

            var geojsonProps = jerseycounties[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.FIPSSTCO; //the geojson primary key

            //where primary keys match, transfer csv data to geojson properties object
            if (geojsonKey == csvKey){

                //assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
            };
        };
        };
    return jerseycounties;
};
    
function setEnumerationUnits(jerseycounties, map, path,colorScale){
    
     //add jersey counties to map
        var counties = map.selectAll(".counties")
            .data(jerseycounties)
            .enter()
            .append("path")
            .attr("class",function(d){
                return "counties " + d.properties.FIPSSTCO; //remember to use FIPSSTCO
            })
            .attr("d", path)
            .style("fill", function(d){
                return choropleth(d.properties, colorScale);
            })
        
            .on("mouseover", function(d){
                highlight(d.properties);
            })
            .on("mouseout", function(d){
                dehighlight(d.properties);
            })
            .on("mousemove", moveLabel);
    
     //below Example 2.2 line 16...add style descriptor to each path
        var desc = counties.append("desc")
            .text('{"stroke": "#000", "stroke-width": "0.5px"}');
};

//function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#ffffb2",
        "#fecc5c",
        "#fd8d3c",
        "#f03b20",
        "#bd0026"
    ];

    //create color scale generator
    var colorScale = d3.scale.quantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;
};

//function to test for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};
    
//function to create coordinated bar chart
function setChart(csvData, colorScale){
    
    //create a second svg box for New Jersey chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //rectangle for bar chart
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //set bars for each New Jersey County 
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.FIPSSTCO;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);
    
    //put in style descripter for each rectable on bar chart
    var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');

    //create a text for each bar chart title
    var chartTitle = chart.append("text")
        .attr("x", 230)
        .attr("y", 40)
        .attr("class", "chartTitle")
        

    //create vertical axis generator
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //simple frame for bar chart 
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
    
    //set bar positions, heights, and colors
    updateChart(bars, csvData.length, colorScale);  
}; //end of setChart//()

function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });
		
    //add initial option for the dropdown menu. This option will be visible when you initially load the map
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute names for all options 
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};
    
    //dropdown change listener handler
function changeAttribute(attribute, csvData){
    //change the expressed attribute
    expressed = attribute;
    //recreate the color scale
    var colorScale = makeColorScale(csvData);
    //recolor enumeration units
    var counties = d3.selectAll(".counties")
        .transition()
        .duration(1000)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
    });
    
    //re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
        //re-sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
        .transition() //add simple animation
        .delay(function(d, i){
            return i * 20
        })
        .duration(500);
    
    updateChart(bars, csvData.length, colorScale);   
}; //end of changeAttributes()
    
function updateChart(bars, n, colorScale){
    //position bars
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //resize bars
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
    var chartTitle = d3.select(".chartTitle")
        .text("Ancestry (%) per county");
   }; 
    
 //function to highlight enumeration units and bars
function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.FIPSSTCO)
        .style("stroke", "blue")
        .style("stroke-width", "2");
    setLabel(props);
};
//function to reset the element style on mouseout
    
function dehighlight(props){
    var selected = d3.selectAll("." + props.FIPSSTCO)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
         //remove info label      
    };
    d3.select(".infolabel")
        .remove();
};
//function to create dynamic label
function setLabel(props){
    //label content
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed + "</b>";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.FIPSSTCO + "_label")
        .html(labelAttribute);

    var countyName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.name);
};  
    
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};



})(); //last line of main.js