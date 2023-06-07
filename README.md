#  <img src="https://raw.githubusercontent.com/AntheSevenants/Rekker/main/img/rubber-bands.png" style="height: 1em; width: auto;"> Rekker

[![DOI](https://zenodo.org/badge/558759691.svg)](https://zenodo.org/badge/latestdoi/558759691)

Finally, a natural way to explore Elastic Net coefficients. *Amai mijne rekker*.

[Live demo](https://anthesevenants.github.io/Rekker/)

## What is Rekker?

Elastic Net regression is a fantastic technique for assessing the influence of a plethora of predictors on a specific response variable. By looking at the coefficients for each predictor in an Elastic Net regression (or its siblings Ridge and Lasso regression), we can investigate the "pull" of a particular predictor on the modelled phenomenon.

Because we tend to use many predictors at once with Elastic Net-like regression, it becomes a challenge to investigate the results. It is very difficult, for example, to fit 500 data points on a normal sized plot (if we were to have 500 predictors). To combat this issue, I wrote Rekker, an interactive visualisation tool for Elastic Net coefficients.

**Features:**

* display all coefficients in a scrollable plot
* colour-coded data points
* zero coefficient baseline
* tooltip with exact values
* compare coefficients against other values
* compare coefficients against distributional semantics
	* draw distributional clusters

## Using Rekker

Rekker supports loading files from your local hard disk. **Unless you want to make changes to the code, you can simply use the [live demo](https://anthesevenants.github.io/Rekker/) and load your dataset.**

To host Rekker yourself, follow these steps:

1. Clone this repository
2. Serve the repository's directory using an HTTP server, for example by using the built-in Python webserver:

	```
	> python -m http.server
	Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
	```

See the bottom of this README if you wish to run Rekker in Docker.

## Dataset specifications

### Minimum requirements

The demo dataset is `coefficients.csv` in the repository's directory. A Rekker dataset should have the following structure at minimum:

```csv
coefficient,feature
-2.7109007348534733,I
-2.5738031394173366,Monday
-1.970461593962809,not
-1.864356619676603,like
```

This means your dataset should have a numeric "coefficient" column, and a character "feature" column.

The coefficient values will be rendered in a [dot plot](https://user-images.githubusercontent.com/84721952/204799949-2cfc2ed4-ed30-4ca3-a070-6721dfbc2979.png).

If your regression model contains features which represent simple binary or numeric values (i.e. for multifactorial control), prefix them with `"_"` so they show up in the "Regression set-up" pane. You can toggle these additional features to see what effect they have on the other features in your model.

### External numeric information

You can extend Rekker's functionality by adding extra information for each feature-coefficient pairing. If you wish to offset each coefficient against a specific numeric variable, simply add an extra numeric column. The following example shows the above example, complemented with a numeric "frequency" column.

```csv
coefficient,feature,frequency
-2.7109007348534733,I,946
-2.5738031394173366,Monday,248
-1.970461593962809,not,42
-1.864356619676603,like,147
```
You can add multiple numeric columns and switch between them in the Rekker interface. The columns will show up under "Coefficients + external data".

These numeric columns can also be used for colour coding by selecting the "Numeric" option under "Colour coding" and choosing a column.

The coefficient values and external data will be rendered in a [scatter plot](https://user-images.githubusercontent.com/84721952/204800161-0ed4ab65-84ae-4bd6-8279-cb2373fbd193.png).

#### Bidimensional numeric information

You can also define bidimensional numeric information for use with Rekker. To include this kind of information, use the "column.x" and "column.y" naming scheme:

```csv
coefficient,feature,mds.x,mds.y
-2.7109007348534733,I,0.1,0.3
-2.5738031394173366,Monday,0.8,-0.4
-1.970461593962809,not,0,0
-1.864356619676603,like,-0.5,0.3
```

Corresponding column pairs will be combined automatically in the Rekker interface. Because two dimensions now need to be visualised, the coefficient axis is lost. You can still consult the coefficient values by hovering over a data point, or by setting "positive/negative" as the group coding. You can add multiple bidimensional numeric columns and switch between them in the Rekker interface.  The columns will show up under "External data only".

The external data will be rendered in a [scatter plot](https://user-images.githubusercontent.com/84721952/204800617-8e155904-f882-4272-8901-0bb9ceea81e3.png).

You can also add clustering information to this bidimensional plot. To add clustering information, specify for each data point to which cluster it belongs. The clustering column should follow this naming convention:

- prefixed with `cluster.`
- contains the name of the coordinate system it is based on

In the example below, our clustering is based on the `mds.x` and `mds.y` columns, hence why `mds` is included in the clustering column name. If you do not add this name, the clustering column will not show up in the interface.

```csv
coefficient,feature,mds.x,mds.y,cluster.mds.kmeans
-2.7109007348534733,I,0.1,0.3,cluster 1
-2.5738031394173366,Monday,0.8,-0.4,cluster 2
-1.970461593962809,not,0,0,cluster 2
-1.864356619676603,like,-0.5,0.3,cluster 1
```

If formatted correctly, the available clusterings will be recognised automatically in the Rekker interface. The clusters will be drawn as polygons under your bidimensional data points.

### External group information

You can also extend Rekker's functionality by adding group information information for each feature-coefficient pairing. You can stipulate for each feature to what group it belongs. The following example shows the above example, complemented with a "part of speech" column:
```csv
coefficient,feature,frequency,pos
-2.7109007348534733,I,946,pronoun
-2.5738031394173366,Monday,248,noun
-1.970461593962809,not,42,adverb
-1.864356619676603,like,147,verb
```
Each unique group will receive its own colour coding. You can add multiple group columns and switch between them in the Rekker interface. The columns will show up under "Colour coding" > "Categorical".

## Metadata specifications

You can also load an additional dataset into Rekker which contains a model's *metadata*. The metadata file is based on triples of `subject`, `predicate` and `object`:

```
subject,predicate,object
"model","alpha",0.4
"model","loss",0.709548657049239
"model","intercept",-0.554293130725607
"model","dev.ratio",0.464360010202276
"model","nzero",998
"model","lambda",0.00217932833240788
```

All model data should have `"model"` as its subject value. Then, you can define *what* exact metadata about the model that line contains in `predicate`. `object` contains the actual value, as is clear from the above example. 

If you add a line with `"model"` as a `subject` and `"intercept"` as a `predicate`, Rekker will allow you to display your model's intercept value and adjust for it in the interface. Other values are purely descriptive and appear in the model info pane.

## Heatmap dataset specifications

You can put GAM predictions as a backdrop for the scatterplot as a heatmap. This shows you a spatial overview of semantic areas in distributional semantics. The dataset structure for a GAM heatmap is simple:

```
mds.x,mds.y,mds
0.25,-0.13,0.6
```

Your entire dataset should be composed of individual coordinates with predictions for that specific location in distributional space. Heatmaps are linked to bidimensional columns in your coefficients dataset, so the column names for these coordinates should be the same as the dimension-reduced distributional coordinates of your features (`mds.x` and `mds.y` in the example). The predicted *value* for that coordinate is the coordinate name itself (`mds` in the example).

## Colour palette

You can define your own colour palette for use in Rekker. Create a JSON file with a list of at least five hex colours:

```json
[
	"#96E637", 
	"#DE193E", 
	"#394E62", 
	"#FFE4E1", 
	"#FFFFFF"
]
```

The order is as follows:

1. Used for negative coefficients
2. Used for positive coefficients
3. Used for removed coefficients
4. Used for filtered coefficients
5. Used as the transition colour in the heatmap

## Docker container

You can run Rekker in a [Docker container](https://www.docker.com/). This will spin up an [nginx](https://www.nginx.com/) webserver on your machine. There are two ways to do this:

1. Development version: if you wish to make live changes to Rekker, use the development compose file. You can change the source code while the container is running:

	```
	docker compose up
	```

	Rekker will be available at `127.0.0.1:8080`.

2. Production version: if you want to host Rekker in a production environment, use the production compose file. The source code will be frozen inside the container, so live code changes are not supported.

	```
	docker compose -f "docker-compose-prod.yml" up
	```

	Rekker will be available at `127.0.0.1:80`.

## Automatic dataset loading

You can automatically load different datasets by specifying their locations in the URL. This is especially useful if you want to share a direct link to a specific constellation of files.

Supply the locations of the different datasets as GET query parameters:

- `coefficients=data.csv`
- `meta=model_info.csv`
- `palette=colours.json`
- `heatmap=gam.csv`

e.g. `my-rekker-instance.local/?coefficients=data.csv&meta=model_info.csv&palette=colours.json&heatmap=gam.csv`

This assumes these datasets are stored in your Rekker directory. You can also load *external* datasets, as long as the server they're stored on allows shared resources under [CORS](https://developer.mozilla.org/en-US/docs/Glossary/CORS).

## Future work

* dynamic resizing
* more interactivity