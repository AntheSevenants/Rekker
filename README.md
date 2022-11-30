#  <img src="https://raw.githubusercontent.com/AntheSevenants/Rekker/main/img/rubber-bands.png" style="height: 1em; width: auto;"> Rekker
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

## Using Rekker

Rekker supports loading files from your local hard disk. **Unless you want to make changes to the code, you can simply use the [live demo](https://anthesevenants.github.io/Rekker/) and load your dataset.**

To host Rekker yourself, follow these steps:

1. Clone this repository
2. Serve the repository's directory using an HTTP server, for example by using the built-in Python webserver:

	```
	> python -m http.server
	Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
	```

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

#### Bidimensional numeric information

You can also define bidimensional numeric information for use with Rekker. To include this kind of information, use the "column.x" and "column.y" naming scheme:

```csv
coefficient,feature,coord.x, coord.y
-2.7109007348534733,I,0.1,0.3
-2.5738031394173366,Monday,0.8,-0.4
-1.970461593962809,not,0,0
-1.864356619676603,like,-0.5,0.3
```

Corresponding column pairs will be combined automatically in the Rekker interface. Because two dimensions now need to be visualised, the coefficient axis is lost. You can still consult the coefficient values by hovering over a data point, or by setting "positive/negative" as the group coding. You can add multiple bidimensional numeric columns and switch between them in the Rekker interface.  The columns will show up under "External data only".

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

## Future work

* dynamic resizing
* display model info
* more interactivity